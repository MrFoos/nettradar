import asyncio
import json
import logging
import time

import websockets

from . import state
from .models import BGPEvent

logger = logging.getLogger(__name__)

RIPE_WS_URL = "wss://ris-live.ripe.net/v1/ws/"
SUBSCRIBE_MSG = json.dumps({
    "type": "ris_subscribe",
    "data": {
        "type": "UPDATE",
        "require": "announcements",
    }
})


def _parse_event(msg: dict) -> BGPEvent | None:
    try:
        data = msg.get("data", {})
        announcements = data.get("announcements", [])
        withdrawals = data.get("withdrawals", [])
        path = data.get("path", [])
        peer_asn = data.get("peer_asn", 0)
        timestamp = data.get("timestamp", time.time())

        as_path_flat: list[int] = []
        for segment in path:
            if isinstance(segment, int):
                as_path_flat.append(segment)
            elif isinstance(segment, list):
                as_path_flat.extend(segment)

        no_asns = state.no_asn_names.keys()
        matched = [asn for asn in as_path_flat if asn in no_asns]

        prefixes: list[str] = []
        event_type = "announcement"

        if announcements:
            for ann in announcements:
                prefixes.extend(ann.get("prefixes", []))
        elif withdrawals:
            prefixes = withdrawals
            event_type = "withdrawal"
            if not matched:
                for pfx in prefixes:
                    if pfx in state.no_prefix_set:
                        matched = [peer_asn] if peer_asn else []
                        break

        if not matched and not any(p in state.no_prefix_set for p in prefixes):
            return None

        prefix = prefixes[0] if prefixes else "unknown"

        if event_type == "announcement" and prefix in state.no_prefix_set:
            origin_asn = as_path_flat[-1] if as_path_flat else 0
            if origin_asn and origin_asn not in no_asns:
                event_type = "hijack"

        asn_name = None
        if matched:
            asn_name = state.no_asn_names.get(matched[-1])

        return BGPEvent(
            prefix=prefix,
            as_path=as_path_flat,
            peer_asn=int(peer_asn) if peer_asn else 0,
            event_type=event_type,
            timestamp=float(timestamp),
            asn_name=asn_name,
            matched_no_asns=matched,
        )
    except Exception as exc:
        logger.debug("Failed to parse RIPE message: %s", exc)
        return None


async def run_ripe_consumer() -> None:
    backoff = 1.0
    while True:
        try:
            logger.info("Connecting to RIPE RIS Live...")
            async with websockets.connect(
                RIPE_WS_URL,
                ping_interval=30,
                ping_timeout=10,
                close_timeout=5,
            ) as ws:
                await ws.send(SUBSCRIBE_MSG)
                backoff = 1.0
                logger.info("Connected to RIPE RIS Live, consuming BGP stream")
                async for raw in ws:
                    try:
                        msg = json.loads(raw)
                    except json.JSONDecodeError:
                        continue
                    if msg.get("type") != "ris_message":
                        continue
                    event = _parse_event(msg)
                    if event is None:
                        continue
                    state.record_event(event)
                    await state.broadcast({
                        "type": "bgp_event",
                        "data": event.model_dump(),
                    })
        except Exception as exc:
            logger.warning("RIPE RIS connection lost: %s — retrying in %.0fs", exc, backoff)
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, 60.0)
