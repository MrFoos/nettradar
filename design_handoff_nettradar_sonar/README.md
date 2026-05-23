# Handoff: Nettradar — Sonar redesign

Modern redesign av nettradar.no (sanntids-radar for norsk internettinfrastruktur). Tre faner — Dashboard, BGP-aktivitet, Topologi — pluss en Om-side, alle i samme designspråk vi har døpt **«Sonar»**.

---

## Skjermbilder

Se `screenshots/` for renders av hver visning ved 1440×900 (skalert til 60% for visning):

| Fil | Visning |
|---|---|
| `01-dashboard-dark.png` | Dashboard, mørk, med 3 sikkerhetsvarsler |
| `02-dashboard-light.png` | Dashboard, lys |
| `03-dashboard-all-clear.png` | Dashboard, alt rolig (empty state) |
| `04-bgp-summary.png` | BGP-aktivitet, sammendrag-tabell |
| `05-bgp-log.png` | BGP-aktivitet, live logg-strøm |
| `06-topologi-dark.png` | Topologi-graf, mørk, med Altibox-tooltip |
| `07-topologi-light.png` | Topologi-graf, lys |
| `08-om-dark.png` | Om-side, mørk |
| `09-om-light.png` | Om-side, lys |

## Om designfilene

Filene i `design_references/` er **designreferanser laget i HTML** (React + inline JSX, kjørt gjennom Babel i nettleseren). De er prototyper som viser intendert utseende og oppførsel — **ikke produksjonskode du skal kopiere direkte**.

Oppgaven er å **gjenskape designene i den eksisterende nettradar-kodebasen** (FastAPI backend + vanilla HTML/CSS/JS frontend med Tailwind og D3) og holde seg til de mønstrene som allerede er etablert der. Backend, datakontrakter og WebSocket-strømmen forblir som de er — kun frontend bytter visuell drakt.

Dataformatene i `data.jsx` speiler de faktiske bakend-modellene (`models.py`, `peeringdb.py`), så feltnavn (`event_type`, `matched_no_asns`, `hijacker_asn` osv.) kan brukes 1:1.

## Fidelity

**Hi-fi.** Eksakte farger, typografi, spacing og interaksjoner er definert. Implementer pixel-perfekt, men respekter kodebasens eksisterende konvensjoner (Tailwind-klasser der det finnes ekvivalenter, vanilla DOM-oppdatering for live data, D3 for force-grafen).

---

## Sider og visninger

### Felles chrome (alle sider)

**Toppnav** (`height: 70px`, `border-bottom: 1px solid var(--border)`):
- Logo-merke (sonar-radarsymbol) + `nettradar` (bold) + `.no` (dim)
- Nav-lenker: `Dashboard` · `BGP-aktivitet` · `Topologi` · `Om` (aktiv har full opasitet og 600 vekt; inaktive er dimmet 500 vekt)
- Høyre: kildestatuser (`RIPE`, `Cloudflare`) som grønne prikker, klokkeslett `nb-NO` HH:MM:SS i JetBrains Mono

Padding `24px 40px 18px`. Logo-symbolet er en SVG-radar med tre konsentriske sirkler og en fylt prikk i midten.

---

### 1) Dashboard (`/`) — `c-sonar.jsx`

**Hero-rad** (padding `40px 40px 28px`, grid `1.4fr 1fr` med gap `60px`):

**Venstre — status:**
- Kicker (uppercase, 12px, dimmed): `Nasjonal status · forhøyet` med pulserende statusprikk (gul ved forhøyet, grønn ved normal). Animasjon: `c-pulse 2.5s ease-in-out infinite` (opacity 1→0.35→1).
- H1 (56px, weight 500, letter-spacing -2px, line-height 1.04, max-width 720px, text-wrap balance):
  - Ved varsler: `Tre aktive sikkerhetsvarsler. DDoS-aktivitet ligger {n}% over snitt.` (siste setning i dim farge)
  - Ved alt-rolig: `Ingen aktive sikkerhetsvarsler. DDoS-aktivitet ligger {n}% under snitt.`
- 4 stats i en flex-rad (gap 40px): BGP-rate · Aktive ASN · Norske prefikser · Uptime. Hver er label (11px dim) + tall (26px weight 500, letter-spacing -0.8, tabular-nums) + valgfri enhet.

**Høyre — hero-kort:**
Background `var(--card-elevated)`, border, border-radius 14px, padding 22px. Inneholder enten:
- **Trussel-kortet:** rødt HIJACK-badge øverst, "X min siden"-timestamp, tittel ("AS199524 annonserer Altibox-prefiks"), prefiks i mono-skrift, footer med Hijacker/Offer mini-stats. Radial gradient i øvre høyre hjørne i `var(--red)` med opasitet ~25.
- **Alt-rolig-kortet:** grønn checkmark-circle (44×44, bg `var(--green)1c`), kicker "Alle systemer normale", beskrivende linje, footer med "Siste hendelse" / "Uptime 30 d". Grønn radial gradient i hjørnet.

**Sikkerhetsvarsler-seksjon** (padding `0 40px`, gap mellom seksjoner 22px):
- Section-tittel-rad: uppercase label (11px dim, weight 600, letter-spacing 1.8), undertekst (11.5 dim), høyre side viser "{n} åpne · siste 24 t." (rød ved >0, grønn ved 0)
- Border-bottom 1px under tittelraden, padding-bottom 8px
- Grid 3 kolonner med `gap: 14px`, `margin-top: 10px`
- **AlertCard** (bg `var(--card)`, border, radius 12px, padding 16px, gap 10px, position relative):
  - 3px farget venstrekant (`background: rød/oransje` absolutt-posisjonert)
  - Header: kategoribadge (`HIJACK`/`ROUTE LEAK` med icon, 9.5px weight 700, fargekodet bakgrunn `${c}1f`, radius 3) + tid (mono 10.5 dim, format `{X} min siden · HH:MM`)
  - Prefiks (mono 13.5, weight 500)
  - Beskrivelse (12.5px, dim, line-height 1.45) med inline-strong for navn
  - Footer (padding-top 8, border-top 1px): To AS-felter side-ved-side, "Hijacker AS199524" / "Offer AS8222" format

- **Empty-state** (ved 0 varsler): Stor pille (bg `var(--card)`, border, radius 12, padding `22px 26px`, flex-row gap 24):
  - Grønn checkmark-circle (44×44, bg `green1c`)
  - "Ingen aktive varsler" (16px weight 500) + beskrivende paragraf (13 dim)
  - Border-left separator, deretter to mini-stats: "Siste hendelse: 3 d 4 t siden" og "Snitt per uke: 2,3"
  - Subtil grønn radial-gradient i øvre venstre

**DDoS-aktivitet-seksjon** (flex: 1, min-height: 0):
- Samme section-tittel-mønster, høyre viser "+X% over snitt" (rød)
- Grid `1.5fr 1fr 1fr` med gap 14, margin-top 10
- 3 kort:
  1. **Intensitet mot Norge** (bg `var(--card)`, border, radius 14, flex-col): CardHeader (`title="Intensitet mot Norge"`, `sub="layer 7 vs. layer 3/4"`), deretter SVG-graf (ResizeObserver-basert), legende-rad nederst med fargestiler for L7/L3
  2. **Kilde-AS** (samme card-mønster): Liste over 7 AS-er med mono ASN-label, navn, mini bar (50×3px), prosent
  3. **Opprinnelse** (samme): Liste over 7 land med flagg-emoji, navn, mini bar, prosent

**SonarChart** (DDoS-graf):
- ResizeObserver for responsiv bredde
- Padding `top: 10, bottom: 20, x: 0`
- Linjer + gradientfylte areal under (definer `<linearGradient>` `g-l7` og `g-l3` med 0%=fargen@0.35, 100%=transparent)
- L3 (rød) tegnes først, L7 (gul) på toppen
- Tidsakse-merker ved indeks 0, 8, 16, 23: viser timetall (`HH`)

---

### 2) BGP-aktivitet (`/bgp`) — `c-sonar-bgp.jsx`

**Hero** (padding `32px 40px 26px`, grid `1fr auto`):

**Venstre:**
- Kicker `BGP-aktivitet`
- H1 (40px weight 500, letter-spacing -1.2): Stort tall `142` i mono med tabular-nums, deretter "hendelser per minutt fra norske nettverk." i dim
- 4 stats: ASN-er observert (11/13), Annonseringer, Tilbaketrekk, Hijacks (rød ved >0)

**Høyre — ViewToggle:**
- Inline-flex pille (bg `var(--card)`, border, radius 10, padding 3, gap 2)
- To knapper: `Sammendrag` | `Logg`. Aktiv: bg `var(--card-elevated)`, border, weight 500. Padding `8px 16px`, radius 7.

**Innhold** (height calc'd, padding `0 40px 32px`):

#### Sammendrag-visning
Stort card (`var(--card)`, border, radius 14, flex-col, overflow hidden):
- Header (padding `14px 22px`, border-bottom): Tittel "Per ASN — siden oppstart" + undertekst "klikk en kolonne for å sortere · oppdateres hvert 30. s" + høyre "neste oppdatering: 00:18" i mono
- Tabell-header (grid `80px 1.6fr 1fr 1fr 1fr 1fr 100px`, padding `10px 22px`, uppercase 10.5 weight 600 letter-spacing 1.1): ASN · Operatør · Update · Withdraw · Hijack · Aktivitet · Sist sett. Sorterbare kolonner har 6×6 fargeprikk + tekst i fargen ved aktiv sort.
- Rader (samme grid, padding `11px 22px`, 13px, border-bottom):
  - ASN i mono dim
  - Operatørnavn (weight 500)
  - Update-tall (mono, blå #7cb6ff, bold ved >1000)
  - Withdraw-tall (mono, gul ved >0)
  - Hijack-tall (mono, rød ved >0, "⚠ N" format)
  - Mini sparkline (80×18 SVG, fargen matcher hovedstatusen)
  - "Sist sett" i mono dim (format `{n}s` eller `{n}m {n}s`)
- Hijack-rader har bakgrunn `red07` (rødtone 7% opacity)

#### Logg-visning
Stort card (samme chrome):
- Header med tittel "Live BGP-strøm" + undertekst "nyeste øverst · 150 siste hendelser" + grønn pulserende prikk "strømmer fra RIPE RIS"
- Kolonneheader (grid `90px 110px 1.4fr 1.6fr 130px`): Tid · Type · Prefiks/opprinnelse · AS-sti · Peer
- Rader (samme grid, padding `9px 22px`, 12px):
  - Tid (mono dim tabular-nums)
  - Type-badge (mono 10 weight 700 letter-spacing 1, padding `2px 7px`, radius 3, bg `${c}1c`, justify-self start): "UPDATE" (blå #7cb6ff), "WITHDRAW" (gul), "⚠ HIJACK" (rød)
  - Prefiks-cell (flex gap 10): prefiks (mono weight 500), AS-nummer (mono 11 dim), navn (11 dim italic)
  - AS-sti (mono 11 dim, format `AS1 → AS2 → AS3`)
  - Peer (mono 11 dim høyrejustert)
- Hijack-rader: bg `red10`, border-left 2px rød (med `margin-left: -2px` for å overlappe panel-borderet)

---

### 3) Topologi (`/topologi`) — `c-sonar-topo.jsx`

**Hero** (padding `28px 40px 22px`, flex end gap 56):
- Venstre: kicker `AS-Topologi`, H1 (32px weight 500): `11 av 13 norske ASN-er er observert i live BGP-stien.` (siste del dim)
- Høyre: 4 stats — Noder, Koblinger, Aktive 30s, Varsler (rød)

**Hovedområde** (absolute-posisjonert: `top: 240, left: 0, right: 0, bottom: 24`, grid `1fr 320px`, gap 20, padding `0 40px`):

#### Graf-canvas (venstre)
- Container: bg `var(--card)`, border, radius 14, overflow hidden, position relative
- **Bakgrunnsraster:** SVG-pattern `topo-grid` (40×40), prikker (circle r=0.6 fill border-farge), opasitet 0.35 mørk / 0.5 lys
- **Topp-label:** absolute (`top: 12, left: 16`), uppercase 10.5 dim: `Norske nettverksoperatører` + instrukstekst (dimmer italic, "dra noder · scroll for å zoome · hover for detaljer")
- **Zoom-kontroller:** absolute bottom-right (14px), kolonne av 3 knapper (`+` `−` `⤢`), 30×30, bg `var(--card-elevated)`, border, radius 8
- **Force-graf** (SVG, position absolute, fyller container):
  - Kant-linjer mellom noder. Vanlige: stroke `var(--border)`, opacity 0.6. Hijack-involverte: stroke rød, width 1.5, opacity 0.8
  - Noder (`<g>`):
    - Pulse-ring (ved active/hijack/withdraw): `<circle fill="none" stroke={color}>` med `<animate>` r (start→start+14) og opacity (0.55→0) over 2s (1.4s ved alert)
    - Hovedsirkel: fill `${color}33` ved alert, ellers `#1a2840` (mørk) / `#dfeaf7` (lys). Stroke 2.5 ved alert, 2.2 ved hub, 1.6 ellers
    - To text-labels under noden: operatørnavn (11 weight 500, dy `r+14`) + ASN (mono 9.5 dim, dy `r+26`)
  - Nodestørrelse: `max(14, min(30, 14 + sqrt(activity) * 0.6))`

**Node-statuser & farger:**
| State | Farge | Mening |
|---|---|---|
| `active` | `#7ab8ff` | hendelse siste 5 s |
| `recent` | `#5294e0` | nylig (5–15 s) |
| `monitored` | `#4d94ff` | overvåket, ingen fersk |
| `idle` | `#3a5a8c` | ingen aktivitet |
| `withdraw` | `var(--amber)` | tilbaketrekk siste 15 s |
| `hijack` | `var(--red)` | hijack siste 30 s |

- **Floating tooltip-eksempel** ved Altibox (absolute, `left: x+36, top: y-60`):
  - bg `var(--card-elevated)`, border, radius 10, padding `12px 14px`, min-width 180
  - Box-shadow: mørk `0 4px 24px rgba(0,0,0,0.6)`, lys `0 4px 24px rgba(0,0,0,0.12)`
  - Innhold: Navn + ASN, "BGP-hendelser" + tall, "Sist sett" + tid, footer (border-top) "⚠ Involvert i hijack siste 30s"

#### Høyre sidepanel (`width: 320px`, flex-col gap 14)
- **Tegnforklaring-kort** (bg `var(--card)`, border, radius 14, padding 18):
  - Uppercase label "Tegnforklaring"
  - 4 legend-rader: SVG-sirkel (22×22, r 8) + tittel (12.5 weight 500) + sub (11 dim). Withdraw-raden har stroke-width 2.5 (`ring`). Hijack-raden har fill `${color}33` (`fill`).
  - Footer (border-top): "Nodestørrelse skalerer med antall BGP-hendelser i økten."
- **«Mest aktive nå»-kort** (samme card-stil, flex 1):
  - Label
  - 7 rader (fra sortert NODE_DATA): statusprikk (7×7 fargekodet) + navn (12.5, ellipsis) + ASN (mono 11 dim) + aktivitetstall (mono 12 weight 600 tabular-nums, høyrejustert, width 50)

---

### 4) Om (`/om`) — `c-sonar-om.jsx`

**Layout:** grid `220px 1fr`, height beregnet etter toppnav.

**Venstre — Anker-nav** (padding `40px 24px 40px 40px`, border-right):
- Uppercase label "På denne siden" (10 dim weight 600 letter-spacing 1.6)
- Anker-lenker (en kolonne, gap 2): 13/dim font, padding `7px 0`, border-left 2px (transparent når inaktiv, `var(--text)` ved aktiv), padding-left 12, margin-left -14, weight 500 ved aktiv

**Høyre — innhold** (overflow auto, padding `40px 56px 60px`):

**Hero** (max-width 720, margin-bottom 56):
- Kicker "Om denne siden"
- H1 (48px weight 500 letter-spacing -1.6 line-height 1.05): "Sanntids-radar for norsk internett."
- Lead-paragraf (17px line-height 1.55 dim, max-width 620)
- 4 fact pills (flex gap 20 wrap): label (10 uppercase dim) + verdi (mono 15 weight 500 tabular-nums)

**Seksjoner** (Anchor-komponent: margin-top 40, padding-bottom 10, border-bottom):
- Kicker over hver h2 (10 dim weight 600 letter-spacing 1.4)
- H2 (28 weight 500 letter-spacing -0.8)

**BGP-hendelser:**
- Prose-paragrafer (14.5 line-height 1.65 dim)
- 4 EventTypeCard i grid 2×2 (gap 14):
  - bg `var(--card)`, border, radius 12, padding 18, position relative
  - 3px farget venstrekant
  - Header: mono badge (`UPDATE`/`WITHDRAW`/`HIJACK`/`ROUTE LEAK`, 10 weight 700 letter-spacing 1.2, bg `${c}1c`) + tittel (14.5 weight 500)
  - Body (13 dim line-height 1.55)
- Callout-boks under (bg card, border-left 2px dim, padding `14px 18px`, 13 dim): forklarer prefiks-notasjon

**Dashboard-paneler:**
- Grid 3 PanelExplainer-kort: spørsmål i italic serif (Source Serif 4) + svar-tittel + beskrivelse

**AS-Topologi:**
- Prose-paragrafer
- Fargelegende-kort (bg card, border, padding 18, radius 12) med 2-kolonne grid av LegendRow (14×14 prikk med box-shadow + label + body)
- Footer-tekst om interaksjon

**Datakilder:**
- 3 SourceCard i grid (bg card, border, radius 12, padding 18, flex-col gap 10):
  - Header: 8×8 fargeprikk med glow + navn (14.5 weight 600)
  - Beskrivelse (12.5 dim flex 1)
  - Footer (border-top): mono lenke "↗ link" i samme farge

---

## Interaksjoner og oppførsel

### Live BGP-feed (BGP-aktivitet Logg-visning)
Hver nye hendelse fra WebSocket-strømmen plasseres øverst i lista, og lista holdes på maks 150 elementer.
Anbefalt: enkel CSS-transition for opacity/transform-fade-in på første rad. Ingen aggressiv animasjon — feeden ruller hurtig nok i seg selv.

### Hijack-flash i topologi-grafen
Når en `bgp_event` med `event_type: hijack` kommer inn, sett `lastHijack = Date.now()` på de berørte nodene. Sirkelen byttes til hijack-fargen og pulse-ringen aktiveres. Etter 30 sekunder revertes noden til `active`/`monitored` basert på lastSeen.

Tilsvarende for `withdrawal` (15 sek timeout, gul).

### Sammendrag-tabell sortering
Klikk på en kolonneheader sorterer tabellen synkende på den kolonnen. Aktiv kolonne har fargeprikk-indikator og pil. Default-sort: `updates`.

### View-toggle (BGP-aktivitet)
Klikkbar pille bytter mellom Sammendrag og Logg uten å navigere bort fra siden. URL-oppdatering valgfri (kan f.eks. bruke `?view=log`).

### Tema-toggle (lys/mørk)
- Implementer som `[data-theme="dark"|"light"]` på `<html>`, eller via CSS-variabler scopet på `body.theme-dark` / `body.theme-light`.
- Persisterbart i `localStorage`.
- Default: respekter `prefers-color-scheme`.

### Animasjoner
- **Status-prikk-puls** (`c-pulse`): `keyframes { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }`, 2.5s ease-in-out infinite.
- **Pulse-ringer i topologi:** SVG `<animate>` på r (start → start+14) og opacity (0.55 → 0), 2s / 1.4s ved alert. Repeat indefinite.
- **Strømmer fra RIPE-prikk:** samme c-pulse, 1.5s.
- **Hover på AlertCard / EventTypeCard:** valgfritt; subtil `transform: translateY(-1px)` + border-fargeskift, 150ms ease.

### Responsivt
Designet er optimalisert for 1440×900. For mindre viewports:
- Dashboard: stable hero-rad vertikalt (`grid-template-columns: 1fr` ved < 1100px), DDoS-grid blir 1 kolonne ved < 900px, sikkerhetsvarsler-grid → 1 kolonne mobile.
- BGP-aktivitet: tabell trenger horisontal scroll på smale skjermer, ellers OK.
- Topologi: sidepanel kan kollapse til drawer på mobil; graf-canvas fyller hele bredden.
- Om-siden: anker-nav blir en horisontal scroll-bar på toppen ved smale skjermer.

---

## State management

Holdes minimalt — det meste er server-pushet via eksisterende WebSocket:

| State | Hvor | Trigger |
|---|---|---|
| `theme` | localStorage | bruker-toggle |
| `bgpView` (summary/log) | URL eller komponent-state | view-toggle |
| `bgpEvents` | komponent-state, max 150 | WebSocket `bgp_event` |
| `asnStats` | komponent-state, akkumulert | hver `bgp_event` øker counters |
| `topoNodes` / `topoEdges` | komponent-state | WebSocket `bgp_event` (med `matched_no_asns`) |
| `sortBy` (Sammendrag) | komponent-state | kolonne-klikk |
| `hoveredNode` (Topologi) | komponent-state | mouseover på node |

WebSocket-tilkoblingen og dataformatet er **uendret** fra dagens implementasjon. Se `frontend/index.html` og `frontend/topologi.html` for referanse.

---

## Design tokens

### Farger — mørk modus
```css
--bg:             #0a0a0c;
--text:           #f5f5f7;
--dim:            #8a8a93;
--dimmer:         #5a5a63;
--card:           #0f0f12;
--card-elevated:  #13131a;
--border:         rgba(255, 255, 255, 0.07);
--accent:         #d4d4dc;

/* Status-farger */
--red:    #ff6b5b;   /* hijack, kritisk */
--amber:  #f5b942;   /* withdraw, forhøyet */
--green:  #4fd58a;   /* normal, OK */
--blue:   #7cb6ff;   /* update, info */
```

### Farger — lys modus
```css
--bg:             #f7f6f3;
--text:           #15151a;
--dim:            #74747e;
--dimmer:         #a8a8b0;
--card:           #ffffff;
--card-elevated:  #ffffff;
--border:         rgba(15, 15, 26, 0.10);
--accent:         #15151a;

--red:    #d83a2e;
--amber:  #b87a0c;
--green:  #1f7a3e;
--blue:   #1e5fc9;
```

### Statusfarger (topologi-graf)
```css
--node-active:    #7ab8ff;
--node-recent:    #5294e0;
--node-monitored: #4d94ff;
--node-idle:      #3a5a8c;
/* node-withdraw og node-hijack bruker --amber og --red */

/* Node-fyll mørk: #1a2840  ·  lys: #dfeaf7 */
```

### Typografi
```css
--font-sans:  "Inter", "Söhne", -apple-system, "Segoe UI", system-ui, sans-serif;
--font-mono:  "JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace;
--font-serif: "Source Serif 4", "Source Serif Pro", Georgia, serif; /* kun i Om-side hero og PanelExplainer-spørsmål */
```

Last fra Google Fonts:
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Source+Serif+4:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap">
```

### Type-skala (de viktigste)
| Bruk | Family | Størrelse | Vekt | Letter-spacing | Line-height |
|---|---|---|---|---|---|
| Hero H1 (Dashboard) | sans | 56 | 500 | -2 | 1.04 |
| Hero H1 (Om) | sans | 48 | 500 | -1.6 | 1.05 |
| Hero H1 (BGP) | sans | 40 | 500 | -1.2 | 1.05 |
| Hero H1 (Topo) | sans | 32 | 500 | -1 | 1.1 |
| Section H2 (Om) | sans | 28 | 500 | -0.8 | 1.1 |
| Lead-paragraf | sans | 17 | 400 | – | 1.55 |
| Kort-tittel | sans | 14.5 | 500–600 | -0.2 | 1.25 |
| KPI-tall | mono | 26 | 500 | -0.4 | 1 |
| Body | sans | 13 | 400 | – | 1.45 |
| Småtekst/labels | sans | 11 | 600 | 1.2–1.8 (uppercase) | – |
| Tabular data | mono | 11–13 | 400–600 | tabular-nums | – |

`text-wrap: balance` på alle H1/H2. `font-feature-settings: "cv11", "ss01"` på body for Inter sin moderne `1` og `4`.

### Spacing
Standardsteg: 4, 8, 10, 14, 18, 22, 28, 40, 56, 60.
Padding mellom hovedseksjoner: 22–28px. Mellom kort i grids: 14px. Mellom kortinternt: 10–14px.

### Border radius
| Element | Radius |
|---|---|
| Knapper / pills | 7–10 |
| Kort | 12 |
| Store kort / paneler | 14 |
| Mini-bars | 1–2 |
| Sirkler / prikker | 50% |

### Shadows
Kun på floating tooltip og hover-tilstander. `0 4px 24px rgba(0,0,0,0.6)` mørk, `0 4px 24px rgba(0,0,0,0.12)` lys. Ikke bruk shadows på flate kort.

---

## Datakilder og bakend

Backend forblir uendret. Filene som er relevante (referer i designarbeid):
- `backend/main.py` — FastAPI app, ruter `/`, `/topologi`, `/bgp`, `/om`, `/ws`
- `backend/models.py` — `BGPEvent` (felter: `prefix`, `event_type` ('announcement'|'withdrawal'|'hijack'), `as_path`, `peer_asn`, `timestamp`, `asn_name`, `matched_no_asns`)
- `backend/peeringdb.py` — `FALLBACK_NO_ASNS` (13 norske ASN-er)
- `backend/cloudflare.py` — `/bgp/hijacks/events`, `/bgp/leaks/events`, DDoS-tidsserier
- `backend/ripe.py` — RIPE RIS Live WebSocket-tilkobling

WebSocket-meldinger (uendret format):
```json
{ "type": "state_snapshot", "data": { "no_asns": {...}, "events": [...] } }
{ "type": "bgp_event", "data": { /* BGPEvent */ } }
{ "type": "hijack_alert", "data": { "prefix": "...", "hijacker_asn": ..., "victim_asn": ..., "detected_at": "..." } }
{ "type": "route_leak", "data": { "prefix": "...", "leak_asn": ..., "origin_asn": ..., "detected_at": "..." } }
```

Cloudflare-data (polles hvert 60. s, eksponeres via REST-endepunkt):
- `attack_timeseries`: `[{ timestamp, value }]` for L7 og L3/4 (normalisert 0–1)
- `attack_origins`: `[{ country_code, country_name, percentage }]`
- `attack_as_origins`: `[{ as_number, as_name, percentage }]`

---

## Assets

- **Ingen bilder** — alt er CSS/SVG.
- **Logo-merket:** Inline SVG i hver topp-nav. Tre konsentriske sirkler (r 10/6.5/2.5 i 22×22 viewBox), opasiteter 0.25/0.5/1, midt-prikk fylt. Den eksisterende SVG-koden i `c-sonar*.jsx` (`<SonarMark>`) kan kopieres direkte.
- **Landflagg:** Unicode emoji via `String.fromCodePoint(0x1F1E6 + cc.charCodeAt(0) - 65)`. Se `countryFlag()` i `data.jsx`. Vurder å bytte til SVG-flagg fra `country-flag-icons` for konsistens på Windows.
- **Fonts:** Lastes fra Google Fonts (Inter, JetBrains Mono, Source Serif 4).

---

## Filer

I `design_references/`:

| Fil | Inneholder |
|---|---|
| `Nettradar Designretninger.html` | Hovedfilen — åpne den i nettleser for å se alt sammen. Bruker design-canvas for å vise alle artboards. |
| `c-sonar.jsx` | Dashboard-komponenten (`CDashboard`) — props `theme`, `allClear`. Inkluderer alle hjelpekomponenter (`SectionTitle`, `AlertCard`, `SonarChart`, `Stat`, `MiniStat`, `Card`, `CardHeader`, `SonarMark`, `Dot`, `Legend`). |
| `c-sonar-om.jsx` | Om-siden (`COmPage`) — `EventTypeCard`, `PanelExplainer`, `SourceCard`, `Anchor`, `Prose`, `Callout`, `LegendRow`. |
| `c-sonar-bgp.jsx` | BGP-aktivitet (`CBgpPage`) — props `theme`, `view` ('summary' \| 'log'). Inkluderer `BgpStat`, `ViewToggle`, `SummaryView`, `LogView`, `MiniSpark`. |
| `c-sonar-topo.jsx` | Topologi (`CTopoPage`) — `TopoLegend` + statisk pre-beregnet layout (i produksjon brukes D3 force som i dagens topologi.html). |
| `data.jsx` | Mockdata + datatyper. Speiler bakend-modellene. Bruk som referanse for typer; ikke shipping-kode. |
| `design-canvas.jsx`, `tweaks-panel.jsx` | Verktøy for å vise designene side-ved-side. Ikke del av leveransen. |

---

## Implementeringsforslag

Siden eksisterende kodebase bruker vanilla HTML/Tailwind + D3 og holder seg lett, foreslår jeg:

1. **Behold vanilla-stacken.** Du trenger ikke React for dette — komponentene er ikke veldig dypt nestet og state er overskuelig.
2. **Innfør CSS-variabler** for tokens i en delt `assets/theme.css`. Sett `data-theme` på `<html>` for å bytte.
3. **Bytt ut Tailwind-bruken** litt etter litt. Sonar-spacingen er ikke alltid på Tailwinds 4px-grid (f.eks. 22, 28, 14) — egne utility-klasser eller inline-styles for de tilfellene er greit.
4. **Topologi:** Behold D3 force-simulering — bytt bare ut `attr`-verdiene for å matche Sonar-farger og legg til pulse-ringer som SVG `<animate>` (eller request-animation-frame om du foretrekker JS-styring).
5. **DDoS-grafen:** Skriv den som ren SVG (som vist i `SonarChart`) eller bruk D3 hvis du allerede har det inne.

Render-strategien for dashboard: en `init()` ved sideload som tegner tomt skall, deretter små `render*` funksjoner for hver del som kalles ved relevante WebSocket-events. Dette matcher dagens mønster.

---

## Spørsmål?

Hovedfilen `Nettradar Designretninger.html` viser alt — bla gjennom seksjonene «Sonar — alle fanene» og «Sonar — flere tilstander og sider». Klikk et hvilket som helst artboard for fullskjerm. Mørk er default; lys-variantene er der for å se at begge fungerer.

Lykke til 🛰️
