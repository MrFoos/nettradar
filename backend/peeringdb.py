import aiohttp
import asyncio
import logging

logger = logging.getLogger(__name__)

FALLBACK_NO_ASNS: dict[int, str] = {
    2119: "Telenor Norge",
    16175: "Lyse Tele",
    12929: "BaneTele",
    8222: "Altibox",
    29695: "Ice.net",
    2116: "UNINETT",
    6667: "Eunet Finland (historical NO)",
    39029: "NextGenTel",
    31027: "GreenHost",
    44543: "Broadnet",
    43996: "Ventelo",
    198144: "Eidsiva Nett",
    56655: "TDC Norge",
    3292: "TDC",
    20834: "Catchcom",
}

PEERINGDB_URL = "https://www.peeringdb.com/api/net?country=NO&depth=0&limit=500"


async def load_no_asns() -> dict[int, str]:
    try:
        async with aiohttp.ClientSession(
            headers={"User-Agent": "nettradar/1.0 (bgp-dashboard)"},
            timeout=aiohttp.ClientTimeout(total=15),
        ) as session:
            async with session.get(PEERINGDB_URL) as resp:
                if resp.status != 200:
                    logger.warning("PeeringDB returned %s, using fallback", resp.status)
                    return FALLBACK_NO_ASNS
                data = await resp.json()
                result: dict[int, str] = {}
                for net in data.get("data", []):
                    asn = net.get("asn")
                    name = net.get("name", "").strip()
                    if asn and name:
                        result[int(asn)] = name
                if not result:
                    logger.warning("PeeringDB returned empty set, using fallback")
                    return FALLBACK_NO_ASNS
                logger.info("Loaded %d Norwegian ASNs from PeeringDB", len(result))
                return result
    except Exception as exc:
        logger.warning("PeeringDB fetch failed (%s), using fallback", exc)
        return FALLBACK_NO_ASNS


async def peeringdb_refresh_loop(state_module) -> None:
    while True:
        await asyncio.sleep(86400)
        logger.info("Refreshing Norwegian ASN list from PeeringDB")
        new_asns = await load_no_asns()
        state_module.no_asn_names.update(new_asns)
        logger.info("ASN list updated: %d entries", len(state_module.no_asn_names))
