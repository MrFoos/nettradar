import asyncio
import logging
import os
import time
from datetime import datetime

import aiohttp

from . import state
from .models import AttackASOrigin, AttackDataPoint, AttackOrigin, BGPEvent, HijackAlert, OutageEvent, RadarState, RouteLeak, TrafficAnomaly, TrafficAnomalyEvent

_seen_hijack_keys: set[tuple] = set()

logger = logging.getLogger(__name__)

BASE = "https://api.cloudflare.com/client/v4/radar"
POLL_INTERVAL = 60
PREFIX_REFRESH_INTERVAL = 3600

# Major Norwegian ASNs to seed prefix set (PeeringDB may return more)
SEED_NO_ASNS = [2119, 16175, 12929, 8222, 29695, 2116, 39029, 44543, 56655, 43996]


def _headers() -> dict[str, str]:
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "")
    return {"Authorization": f"Bearer {token}"}


async def _get(session: aiohttp.ClientSession, path: str, params: dict | None = None) -> dict | None:
    url = BASE + path
    try:
        async with session.get(url, params=params, headers=_headers()) as resp:
            if resp.status == 429:
                logger.warning("Cloudflare rate limit on %s, skipping", path)
                return None
            if resp.status != 200:
                logger.warning("Cloudflare %s returned %s", path, resp.status)
                return None
            data = await resp.json()
            if not data.get("success"):
                logger.warning("Cloudflare %s: success=false %s", path, data.get("errors"))
                return None
            return data.get("result", {})
    except Exception as exc:
        logger.warning("Cloudflare request failed (%s): %s", path, exc)
        return None


async def _refresh_prefix_set(session: aiohttp.ClientSession) -> None:
    prefixes: set[str] = set()
    for asn in SEED_NO_ASNS:
        result = await _get(session, "/bgp/routes/pfx2as", {"origin": str(asn), "limit": "200"})
        if result:
            for row in result.get("prefix_origins", []):
                pfx = row.get("prefix")
                if pfx:
                    prefixes.add(pfx)
    if prefixes:
        state.no_prefix_set.clear()
        state.no_prefix_set.update(prefixes)
        logger.info("Loaded %d Norwegian prefixes from Cloudflare", len(prefixes))


async def _poll_once(session: aiohttp.ClientSession) -> None:
    no_asn_set = set(state.no_asn_names.keys())

    attack_result = await _get(
        session, "/attacks/layer7/timeseries",
        {"location": "NO", "dateRange": "1d", "aggInterval": "1h"}
    )
    layer3_result = await _get(
        session, "/attacks/layer3/timeseries",
        {"location": "NO", "dateRange": "1d", "aggInterval": "1h"}
    )
    hijack_result = await _get(session, "/bgp/hijacks/events", {"per_page": "50", "dateRange": "1d"})
    leak_result = await _get(session, "/bgp/leaks/events", {"per_page": "30", "dateRange": "1d"})
    origins_result = await _get(
        session, "/attacks/layer7/top/locations/origin",
        {"location": "NO", "limit": "10", "dateRange": "1d"}
    )
    as_origins_result = await _get(
        session, "/attacks/layer7/top/ases/origin",
        {"location": "NO", "limit": "15", "dateRange": "1d"}
    )
    outages_result = await _get(
        session, "/outages",
        {"location": "NO", "dateRange": "1d", "limit": "50"}
    )
    traffic_anomalies_result = await _get(
        session, "/traffic-anomalies",
        {"location": "NO", "status": "ANOMALOUS", "limit": "50"}
    )

    timeseries: list[AttackDataPoint] = []
    layer3_timeseries: list[AttackDataPoint] = []
    current_intensity = 0.0
    baseline = 0.0

    if attack_result:
        serie = attack_result.get("serie_0", {})
        timestamps = serie.get("timestamps", [])
        values = serie.get("values", [])
        timeseries = [
            AttackDataPoint(timestamp=t, value=float(v))
            for t, v in zip(timestamps, values)
        ]
        if values:
            current_intensity = float(values[-1])
            baseline = sum(float(v) for v in values) / len(values)

    if layer3_result:
        serie3 = layer3_result.get("serie_0", {})
        ts3 = serie3.get("timestamps", [])
        v3 = serie3.get("values", [])
        layer3_timeseries = [
            AttackDataPoint(timestamp=t, value=float(v))
            for t, v in zip(ts3, v3)
        ]

    hijacks: list[HijackAlert] = []
    if hijack_result:
        all_events = hijack_result.get("events", [])
        logger.info("Cloudflare BGP hijacks: %d total events from API", len(all_events))
        for ev in all_events:
            hijacker = ev.get("hijacker_asn", 0)
            victims = ev.get("victim_asns", [])
            victim = victims[0] if victims else 0
            prefixes_hit = ev.get("prefixes", [])
            no_involved = (
                hijacker in no_asn_set
                or victim in no_asn_set
                or any(p in state.no_prefix_set for p in prefixes_hit)
            )
            if not no_involved:
                continue
            hijacks.append(HijackAlert(
                prefix=prefixes_hit[0] if prefixes_hit else "",
                hijacker_asn=hijacker,
                victim_asn=victim,
                detected_at=ev.get("min_hijack_ts", ""),
            ))
        logger.info("Cloudflare BGP hijacks: %d Norwegian-relevant after filtering", len(hijacks))

    leaks: list[RouteLeak] = []
    if leak_result:
        all_leaks = leak_result.get("leaks", [])
        logger.info("Cloudflare BGP leaks: %d total events from API", len(all_leaks))
        for ev in all_leaks:
            leak_asn = ev.get("leak_asn", 0)
            origin_asn = ev.get("origin_asn", 0)
            peer_asns = ev.get("peer_asns", [])
            peer_asn = peer_asns[0] if peer_asns else 0
            prefixes_hit = ev.get("prefixes", [])
            no_involved = (
                leak_asn in no_asn_set
                or origin_asn in no_asn_set
                or peer_asn in no_asn_set
                or any(p in state.no_prefix_set for p in prefixes_hit)
            )
            if not no_involved:
                continue
            leaks.append(RouteLeak(
                prefix=prefixes_hit[0] if prefixes_hit else "",
                leak_asn=leak_asn,
                origin_asn=origin_asn,
                peer_asn=peer_asn,
                detected_at=ev.get("start_time", ""),
            ))
        logger.info("Cloudflare BGP leaks: %d Norwegian-relevant after filtering", len(leaks))

    anomalies: list[TrafficAnomaly] = []
    if hijacks:
        for h in hijacks:
            anomalies.append(TrafficAnomaly(
                type="bgp_hijack",
                location="NO",
                description=f"Hijack: AS{h.hijacker_asn} → {h.prefix}",
                start_time=h.detected_at,
                status="active",
            ))

    origins: list[AttackOrigin] = []
    if origins_result:
        for row in origins_result.get("top_0", []):
            origins.append(AttackOrigin(
                country_code=row.get("originCountryAlpha2", ""),
                country_name=row.get("originCountryName", ""),
                percentage=float(row.get("value", 0)),
            ))

    as_origins: list[AttackASOrigin] = []
    if as_origins_result:
        for row in as_origins_result.get("top_0", []):
            as_origins.append(AttackASOrigin(
                as_number=int(row.get("originAsn", 0)),
                as_name=row.get("originAsnName", ""),
                percentage=float(row.get("value", 0)),
            ))

    active_outages: list[OutageEvent] = []
    if outages_result:
        raw_outages = outages_result.get("outages", [])
        logger.info("Cloudflare outages: %d events from API", len(raw_outages))
        for i, ev in enumerate(raw_outages):
            asn_info = ev.get("asnDetails", ev.get("asn", {})) or {}
            asn_id = asn_info.get("asn") or ev.get("asnId")
            asn_name = asn_info.get("name") or ev.get("asnName")
            active_outages.append(OutageEvent(
                id=ev.get("id", str(i)),
                location=ev.get("locationAlpha2", ev.get("location", "NO")),
                asn=int(asn_id) if asn_id else None,
                asn_name=asn_name,
                start_time=ev.get("startDate", ev.get("start_time", "")),
                end_time=ev.get("endDate", ev.get("end_time")) or None,
                type=ev.get("type", "unknown"),
                description=ev.get("description"),
            ))

    traffic_anomaly_events: list[TrafficAnomalyEvent] = []
    if traffic_anomalies_result:
        raw_anomalies = traffic_anomalies_result.get("trafficAnomalies", [])
        logger.info("Cloudflare traffic anomalies: %d events from API", len(raw_anomalies))
        for i, ev in enumerate(raw_anomalies):
            asn_details = ev.get("asnDetails", {}) or {}
            asn_obj = asn_details.get("asn", {}) or {}
            asn_id = asn_obj.get("asn") or asn_details.get("asn")
            asn_name = asn_obj.get("name") or asn_details.get("name")
            traffic_anomaly_events.append(TrafficAnomalyEvent(
                id=ev.get("id", str(i)),
                location=ev.get("locationAlpha2", ev.get("location")),
                asn=int(asn_id) if asn_id else None,
                asn_name=asn_name,
                start_time=ev.get("startDate", ev.get("start_time", "")),
                end_time=ev.get("endDate", ev.get("end_time")) or None,
                type=ev.get("type", "unknown"),
                status=ev.get("status", "ANOMALOUS"),
                score=float(ev.get("score", 0)) if ev.get("score") is not None else None,
            ))

    if len(_seen_hijack_keys) > 2000:
        _seen_hijack_keys.clear()

    for h in hijacks:
        key = (h.hijacker_asn, h.prefix, h.detected_at)
        if key in _seen_hijack_keys:
            continue
        _seen_hijack_keys.add(key)
        try:
            ts = datetime.fromisoformat(h.detected_at.replace("Z", "+00:00")).timestamp()
        except Exception:
            ts = time.time()
        event = BGPEvent(
            prefix=h.prefix,
            as_path=[h.hijacker_asn],
            peer_asn=h.hijacker_asn,
            event_type="hijack",
            timestamp=ts,
            asn_name=state.no_asn_names.get(h.victim_asn),
            matched_no_asns=[h.victim_asn] if h.victim_asn else [],
        )
        state.record_event(event)
        await state.broadcast({"type": "bgp_event", "data": event.model_dump()})

    new_state = RadarState(
        attack_timeseries=timeseries,
        layer3_timeseries=layer3_timeseries,
        hijack_alerts=hijacks,
        route_leaks=leaks,
        anomalies=anomalies,
        attack_origins=origins,
        attack_as_origins=as_origins,
        active_outages=active_outages,
        traffic_anomaly_events=traffic_anomaly_events,
        last_updated=time.time(),
        attack_baseline_24h=baseline,
        current_attack_intensity=current_intensity,
    )
    state.radar_state = new_state
    payload = new_state.model_dump()
    payload["no_prefix_count"] = len(state.no_prefix_set)
    await state.broadcast({"type": "radar_update", "data": payload})


async def run_cloudflare_poller() -> None:
    async with aiohttp.ClientSession(
        timeout=aiohttp.ClientTimeout(total=20),
        headers={"User-Agent": "nettradar/1.0"},
    ) as session:
        await _refresh_prefix_set(session)
        prefix_tick = 0
        while True:
            await _poll_once(session)
            await asyncio.sleep(POLL_INTERVAL)
            prefix_tick += POLL_INTERVAL
            if prefix_tick >= PREFIX_REFRESH_INTERVAL:
                await _refresh_prefix_set(session)
                prefix_tick = 0
