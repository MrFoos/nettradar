import aiohttp
import asyncio
import logging

logger = logging.getLogger(__name__)

FALLBACK_NO_ASNS: dict[int, str] = {
    2119:   "Telenor Norge",
    16175:  "Lyse Tele",
    8222:   "Altibox",
    29695:  "Altibox / Lyse Fiber",
    39029:  "NextGenTel",
    31027:  "GreenHost",
    2116:   "GlobalConnect",
    8896:   "GlobalConnect",
    44543:  "GlobalConnect (tidl. Broadnet)",
    43996:  "GlobalConnect (tidl. Ventelo)",
    198144: "GlobalConnect (tidl. Eidsiva Nett)",
    20834:  "GlobalConnect (tidl. Catchcom)",
    25400:  "Telia Norge",
    56655:  "Telia Norge (tidl. TDC Norge)",
    3292:   "Telia (DK)",
    12929:  "Bane NOR (tidl. BaneTele)",
    51829:  "Bane NOR",
    224:    "Sikt (Uninett)",
}

# Overstyrer utdaterte PeeringDB-navn etter oppkjøp — alltid gjeldende.
NAME_OVERRIDES: dict[int, str] = {
    2116:   "GlobalConnect",
    8896:   "GlobalConnect",
    44543:  "GlobalConnect (tidl. Broadnet)",
    43996:  "GlobalConnect (tidl. Ventelo)",
    198144: "GlobalConnect (tidl. Eidsiva Nett)",
    20834:  "GlobalConnect (tidl. Catchcom)",
    25400:  "Telia Norge",
    56655:  "Telia Norge (tidl. TDC Norge)",
    3292:   "Telia (DK)",
    12929:  "Bane NOR (tidl. BaneTele)",
    51829:  "Bane NOR",
    29695:  "Altibox / Lyse Fiber",
    224:    "Sikt (Uninett)",
}

PEERINGDB_URL = "https://www.peeringdb.com/api/net?country=NO&depth=0&limit=500"

# NSP ekskludert: internasjonale transitleverandører (Cogent, Lumen, NTT, etc.) dukker opp
# med country=NO pga. norsk IX-tilstedeværelse, men er ikke norske nettleverandører.
INCLUDED_TYPES = {
    'ISP', 'IXP', 'Educational', 'Non-Profit', 'Government', 'Route Server'
}

# Globale aktører som feilaktig dukker opp i PeeringDB country=NO-søket.
EXCLUDED_ASNS: set[int] = {
    6667,   # Eunet Finland (historisk, finsk)
    1280,   # ISC — Internet Systems Consortium (USA)
    6695,   # DE-CIX Frankfurt Route Servers (tysk)
    7500,   # M-ROOT DNS Server (global)
    20144,  # l.root-servers.net (global)
    20766,  # Association Gitoyen (fransk)
    22548,  # NIC.BR (brasiliansk)
    25309,  # TOP-IX Route Servers (italiensk)
    30141,  # Democratic National Committee (USA)
    31529,  # DENIC Anycast (tysk)
    31800,  # DALnet IRC Network
    35627,  # Phyxia Networks
    35701,  # Barnes & Morgan
    36119,  # imeem, inc. (USA, nedlagt)
    40064,  # AMATEUR-IX
    40528,  # ICANN AS40528
    42476,  # SwissIX Route Servers (sveitsisk)
}


async def load_no_asns() -> dict[int, str]:
    result: dict[int, str] = {k: v for k, v in FALLBACK_NO_ASNS.items() if k not in EXCLUDED_ASNS}
    try:
        async with aiohttp.ClientSession(
            headers={"User-Agent": "nettradar/1.0 (bgp-dashboard)"},
            timeout=aiohttp.ClientTimeout(total=15),
        ) as session:
            async with session.get(PEERINGDB_URL) as resp:
                if resp.status != 200:
                    logger.warning("PeeringDB returned %s, using fallback only", resp.status)
                    return result
                data = await resp.json()
                for net in data.get("data", []):
                    asn = net.get("asn")
                    name = net.get("name", "").strip()
                    if not asn or not name:
                        continue
                    if net.get("info_type", "") not in INCLUDED_TYPES:
                        continue
                    if int(asn) in EXCLUDED_ASNS:
                        continue
                    result[int(asn)] = name
                result.update(NAME_OVERRIDES)
                logger.info("Loaded %d Norwegian ASNs (PeeringDB ISP/IXP/Edu + fallback)", len(result))
                return result
    except Exception as exc:
        logger.warning("PeeringDB fetch failed (%s), using fallback only", exc)
        return result


async def peeringdb_refresh_loop(state_module) -> None:
    while True:
        await asyncio.sleep(86400)
        logger.info("Refreshing Norwegian ASN list from PeeringDB")
        new_asns = await load_no_asns()
        state_module.no_asn_names.update(new_asns)
        logger.info("ASN list updated: %d entries", len(state_module.no_asn_names))
