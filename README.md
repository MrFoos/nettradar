# nettradar

Sanntids overvåkingsdashboard for norsk internett-infrastruktur. Viser BGP-hendelser, DDoS-aktivitet og sikkerhetsvarsler fra åpne datakilder.

**[nettradar.no](https://nettradar.no)**

---

## Sider

| Side | URL | Beskrivelse |
|---|---|---|
| Dashboard | `/` | Nasjonal status: kombinert DDoS-intensitet (L7 + L3/4) og fire kvadranter for DDoS, Sikkerhet, Tilgjengelighet og Trafikkavvik |
| DDoS | `/ddos` | Detaljert DDoS-analyse med per-lag intensitet (L7 / L3/4), tidsserier og kilde-AS-tabell |
| BGP-aktivitet | `/bgp` | Live BGP-strøm, per-ASN statistikk og flaggede hijacks/rutelekkasjeer |
| Tilgjengelighet | `/tilgjengelighet` | Aktive nettavbrudd, trafikkavvik og historikk siste 30 dager |
| Om | `/om` | Om prosjektet, datakilder og begrepsforklaringer |
| Topologi | `/topologi` | AS-topologi som interaktiv kraft-graf (D3) — ikke i nav |

## Datakilder

- **[RIPE RIS Live](https://ris-live.ripe.net/)** — sanntids BGP-strøm via WebSocket
- **[Cloudflare Radar](https://radar.cloudflare.com/)** — DDoS-tidsserier, BGP-hijacks og route leaks
- **[PeeringDB](https://www.peeringdb.com/)** — norske ASN-er og operatørnavn

## Stack

- **Backend:** Python 3.11, FastAPI, uvicorn, aiohttp, websockets
- **Frontend:** Vanilla HTML/CSS/JS, D3.js v7
- **Design:** Sonar — nordisk minimalistisk design system med mørk/lys modus

## Kjøre lokalt

**Krav:** Python 3.11+, en Cloudflare API-token med `Account.Radar:Read`-tilgang

```bash
# Klon repoet
git clone https://github.com/MrFoos/nettradar.git
cd nettradar

# Opprett virtuelt miljø og installer avhengigheter
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Sett opp miljøvariabler
cp .env.example .env
# Rediger .env og legg inn din Cloudflare API-token

# Start serveren
uvicorn backend.main:app --reload
```

Åpne [http://localhost:8000](http://localhost:8000) i nettleseren.

## Cloudflare API-token

Opprett en token på [dash.cloudflare.com → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens) med følgende tilgang:

- **Permission:** `Account` → `Radar` → `Read`
- **Account Resources:** din konto

## Prosjektstruktur

```
nettradar/
├── backend/
│   ├── main.py          # FastAPI-app, routes, WebSocket-endepunkt
│   ├── state.py         # Delt tilstand og broadcast-logikk
│   ├── models.py        # Pydantic-modeller
│   ├── cloudflare.py    # Cloudflare Radar-poller
│   ├── ripe_client.py   # RIPE RIS Live WebSocket-klient
│   └── peeringdb.py     # PeeringDB ASN-lasting
├── frontend/
│   ├── index.html           # Dashboard
│   ├── ddos.html            # DDoS-analyse
│   ├── bgp.html             # BGP-aktivitet
│   ├── tilgjengelighet.html # Nettavbrudd og trafikkavvik
│   ├── om.html              # Om-side
│   └── topologi.html        # AS-topologi (ikke i nav)
└── requirements.txt
```

## Lisens

MIT
