import asyncio
import logging
import os
import time

import aiohttp

from .models import HijackAlert, OutageEvent, RouteLeak, TrafficAnomalyEvent

logger = logging.getLogger(__name__)

_NTFY_URL = os.environ.get("NTFY_URL", "")
_PUBLIC_TOPIC = os.environ.get("NTFY_PUBLIC_TOPIC", "nettradar-varsler")
_PRIVATE_TOPIC = os.environ.get("NTFY_PRIVATE_TOPIC", "nettradar-privat")
_PRIVATE_TOKEN = os.environ.get("NTFY_PRIVATE_TOKEN", "")
_NOTIFY_PUBLIC = os.environ.get("NTFY_NOTIFY_PUBLIC", "true").lower() == "true"
_NOTIFY_PRIVATE = os.environ.get("NTFY_NOTIFY_PRIVATE", "true").lower() == "true"
_COOLDOWN = int(os.environ.get("NTFY_COOLDOWN_SECONDS", "3600"))

# (topic, event_key) → last notified timestamp
_cooldown_cache: dict[tuple[str, str], float] = {}


def _is_enabled() -> bool:
    return bool(_NTFY_URL) and (_NOTIFY_PUBLIC or _NOTIFY_PRIVATE)


def _on_cooldown(topic: str, key: str) -> bool:
    last = _cooldown_cache.get((topic, key), 0.0)
    return (time.time() - last) < _COOLDOWN


def _mark_sent(topic: str, key: str) -> None:
    _cooldown_cache[(topic, key)] = time.time()
    if len(_cooldown_cache) > 5000:
        _cooldown_cache.clear()


async def _post(topic: str, title: str, body: str, tags: list[str], priority: str, token: str = "") -> None:
    url = f"{_NTFY_URL.rstrip('/')}/{topic}"
    headers: dict[str, str] = {
        "Title": title,
        "Tags": ",".join(tags),
        "Priority": priority,
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
            async with session.post(url, data=body.encode(), headers=headers) as resp:
                if resp.status >= 400:
                    logger.warning("ntfy POST to %s returned %s", topic, resp.status)
    except asyncio.TimeoutError:
        logger.warning("ntfy POST to %s timed out", topic)
    except Exception as exc:
        logger.warning("ntfy POST to %s failed: %s", topic, exc)


async def _dispatch(key: str, title: str, body: str, tags: list[str], priority: str) -> None:
    if not _is_enabled():
        return

    tasks = []
    if _NOTIFY_PUBLIC and not _on_cooldown(_PUBLIC_TOPIC, key):
        _mark_sent(_PUBLIC_TOPIC, key)
        tasks.append(_post(_PUBLIC_TOPIC, title, body, tags, priority))

    if _NOTIFY_PRIVATE and not _on_cooldown(_PRIVATE_TOPIC, key):
        _mark_sent(_PRIVATE_TOPIC, key)
        tasks.append(_post(_PRIVATE_TOPIC, title, body, tags, priority, token=_PRIVATE_TOKEN))

    if tasks:
        await asyncio.gather(*tasks)


async def notify_hijack(h: HijackAlert) -> None:
    key = f"hijack:{h.hijacker_asn}:{h.prefix}"
    title = f"BGP-hijack oppdaget: {h.prefix}"
    body = f"AS{h.hijacker_asn} kaprer prefiks {h.prefix} (offer: AS{h.victim_asn})"
    await _dispatch(key, title, body, tags=["rotating_light", "no_entry"], priority="urgent")


async def notify_route_leak(r: RouteLeak) -> None:
    key = f"leak:{r.leak_asn}:{r.prefix}"
    title = f"BGP-rute-lekkasje: {r.prefix}"
    body = f"AS{r.leak_asn} lekker rute for {r.prefix} (opprinnelse: AS{r.origin_asn})"
    await _dispatch(key, title, body, tags=["warning", "satellite"], priority="high")


async def notify_outage(o: OutageEvent) -> None:
    key = f"outage:{o.id}"
    name = o.asn_name or f"AS{o.asn}" if o.asn else o.location
    title = f"Nettverksavbrudd: {name}"
    body = f"Type: {o.type} — startet {o.start_time}"
    if o.description:
        body += f"\n{o.description}"
    await _dispatch(key, title, body, tags=["electric_plug", "no_entry_sign"], priority="default")


async def notify_anomaly(a: TrafficAnomalyEvent) -> None:
    key = f"anomaly:{a.id}"
    name = a.asn_name or (f"AS{a.asn}" if a.asn else a.location or "NO")
    title = f"Trafikkavvik: {name}"
    score_str = f" (score: {a.score:.1f})" if a.score is not None else ""
    body = f"Type: {a.type} — status: {a.status}{score_str}"
    await _dispatch(key, title, body, tags=["chart_with_downwards_trend"], priority="low")
