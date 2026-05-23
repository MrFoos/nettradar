import asyncio
import json
import logging
from collections import deque
from typing import TYPE_CHECKING

from fastapi import WebSocket

from .models import BGPEvent, RadarState

logger = logging.getLogger(__name__)

event_buffer: deque[BGPEvent] = deque(maxlen=500)
no_asn_names: dict[int, str] = {}
no_prefix_set: set[str] = set()
radar_state: RadarState = RadarState()
clients: set[WebSocket] = set()

events_per_minute: int = 0
_event_counter: int = 0
top_asn: tuple[int, str, int] | None = None
_asn_activity: dict[int, int] = {}


def record_event(event: BGPEvent) -> None:
    global _event_counter, top_asn
    event_buffer.append(event)
    _event_counter += 1
    for asn in event.matched_no_asns:
        _asn_activity[asn] = _asn_activity.get(asn, 0) + 1
    if _asn_activity:
        top_asn_id = max(_asn_activity, key=lambda k: _asn_activity[k])
        top_asn = (top_asn_id, no_asn_names.get(top_asn_id, f"AS{top_asn_id}"), _asn_activity[top_asn_id])


async def epm_counter_loop() -> None:
    global events_per_minute, _event_counter, _asn_activity, top_asn
    while True:
        await asyncio.sleep(60)
        events_per_minute = _event_counter
        _event_counter = 0
        _asn_activity = {}
        top_asn = None


async def broadcast(msg: dict) -> None:
    if not clients:
        return
    payload = json.dumps(msg)
    dead = set()
    for ws in clients:
        try:
            await ws.send_text(payload)
        except Exception:
            dead.add(ws)
    clients.difference_update(dead)


def build_snapshot() -> dict:
    return {
        "type": "state_snapshot",
        "data": {
            "events": [e.model_dump() for e in list(event_buffer)[-100:]],
            "radar": radar_state.model_dump(),
            "no_asns": {str(k): v for k, v in no_asn_names.items()},
            "events_per_minute": events_per_minute,
            "top_asn": list(top_asn) if top_asn else None,
            "no_prefix_count": len(no_prefix_set),
        },
    }
