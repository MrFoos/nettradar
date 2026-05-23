import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

load_dotenv(Path(__file__).parent.parent / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

from . import state
from .cloudflare import run_cloudflare_poller
from .peeringdb import load_no_asns, peeringdb_refresh_loop
from .ripe_client import run_ripe_consumer

FRONTEND = Path(__file__).parent.parent / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Nettradar backend")
    no_asns = await load_no_asns()
    state.no_asn_names.update(no_asns)
    logger.info("Seeded %d Norwegian ASNs", len(state.no_asn_names))

    tasks = [
        asyncio.create_task(run_ripe_consumer(), name="ripe-consumer"),
        asyncio.create_task(run_cloudflare_poller(), name="cloudflare-poller"),
        asyncio.create_task(peeringdb_refresh_loop(state), name="peeringdb-refresh"),
        asyncio.create_task(state.epm_counter_loop(), name="epm-counter"),
    ]
    try:
        yield
    finally:
        for t in tasks:
            t.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        logger.info("Nettradar backend stopped")


app = FastAPI(title="Nettradar", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=str(FRONTEND / "static")), name="static")


@app.get("/")
async def index():
    return FileResponse(FRONTEND / "index.html")

@app.get("/topologi")
async def topologi():
    return FileResponse(FRONTEND / "topologi.html")

@app.get("/bgp")
async def bgp():
    return FileResponse(FRONTEND / "bgp.html")

@app.get("/om")
async def om():
    return FileResponse(FRONTEND / "om.html")

@app.get("/favicon.ico")
async def favicon():
    return Response(status_code=204)

@app.get("/.well-known/{path:path}")
async def well_known(path: str):
    return Response(status_code=204)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    state.clients.add(ws)
    logger.info("Client connected (%d total)", len(state.clients))
    try:
        await ws.send_text(json.dumps(state.build_snapshot()))
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.debug("WebSocket error: %s", exc)
    finally:
        state.clients.discard(ws)
        logger.info("Client disconnected (%d remaining)", len(state.clients))


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "no_asns": len(state.no_asn_names),
        "no_prefixes": len(state.no_prefix_set),
        "buffered_events": len(state.event_buffer),
        "connected_clients": len(state.clients),
    }
