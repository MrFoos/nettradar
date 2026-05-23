// C · Sonar — Om-siden. Lest som lang form artikkel, men med Sonar-aestetikk.
// Anker-nav til venstre, innhold til høyre.

function COmPage({ width, height, theme = 'dark' }) {
  const T = theme === 'dark' ? C_DARK : C_LIGHT;
  const sans = '"Inter", "Söhne", -apple-system, system-ui, sans-serif';
  const mono = '"JetBrains Mono", ui-monospace, monospace';
  const serif = '"Source Serif 4", Georgia, serif';

  const sections = [
    { id: 's1', label: 'Hva er Nettradar' },
    { id: 's2', label: 'BGP-hendelser' },
    { id: 's3', label: 'Dashboard-paneler' },
    { id: 's4', label: 'BGP-aktivitet' },
    { id: 's5', label: 'AS-Topologi' },
    { id: 's6', label: 'Datakilder' },
  ];

  return (
    <div style={{
      width, height, background: T.bg, color: T.text, fontFamily: sans,
      position: 'relative', overflow: 'hidden', fontSize: 14,
    }}>
      {/* TOPP-NAV */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '24px 40px 18px', gap: 28,
        borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SonarMark color={T.accent} />
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>nettradar</span>
          <span style={{ fontSize: 14, fontWeight: 400, color: T.dim, letterSpacing: -0.2 }}>.no</span>
        </div>
        <div style={{ display: 'flex', gap: 18, marginLeft: 20 }}>
          {['Dashboard', 'BGP-aktivitet', 'Topologi', 'Om'].map((l, i) => (
            <span key={l} style={{ fontSize: 13, color: i === 3 ? T.text : T.dim,
              fontWeight: i === 3 ? 600 : 500, cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: mono, fontSize: 11.5, color: T.dim }}>
          <Dot color={T.green} />RIPE
          <Dot color={T.green} />Cloudflare
        </div>
      </div>

      {/* HOVED-LAYOUT: ankernav + innhold */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', height: height - 70, overflow: 'hidden' }}>
        {/* ANKER-NAV */}
        <div style={{ padding: '40px 24px 40px 40px', borderRight: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.6, color: T.dim,
            textTransform: 'uppercase', marginBottom: 14 }}>
            På denne siden
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sections.map((s, i) => (
              <a key={s.id} href={`#${s.id}`}
                style={{ fontSize: 13, color: i === 0 ? T.text : T.dim, textDecoration: 'none',
                  padding: '7px 0', borderLeft: i === 0 ? `2px solid ${T.text}` : '2px solid transparent',
                  paddingLeft: 12, marginLeft: -14, fontWeight: i === 0 ? 500 : 400 }}>
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* INNHOLD */}
        <div style={{ overflow: 'auto', padding: '40px 56px 60px' }}>
          {/* HERO */}
          <div style={{ maxWidth: 720, marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.4, color: T.dim,
              textTransform: 'uppercase', marginBottom: 16 }}>
              Om denne siden
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 500, letterSpacing: -1.6, lineHeight: 1.05,
              margin: 0, textWrap: 'balance' }}>
              Sanntids-radar for norsk internett.
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.55, color: T.dim, marginTop: 18,
              maxWidth: 620, textWrap: 'pretty' }}>
              Nettradar viser tilstanden til norsk internettinfrastruktur etter hvert som den endrer seg —
              BGP-ruteendringer, DDoS-angrep og sikkerhetsvarsler.
              Alt som vises er ekte, live data fra åpne kilder.
            </p>
            <div style={{ display: 'flex', gap: 20, marginTop: 28, flexWrap: 'wrap' }}>
              <FactPill T={T} mono={mono} label="BGP-hendelser" value="umiddelbart" />
              <FactPill T={T} mono={mono} label="Angrep & varsler" value="hvert 60. s" />
              <FactPill T={T} mono={mono} label="Overvåkede ASN-er" value="13 norske" />
              <FactPill T={T} mono={mono} label="Lagring" value="ingen" />
            </div>
          </div>

          {/* SECTION 2 — BGP-hendelser */}
          <Anchor id="s2" T={T} title="BGP-hendelser" kicker="Protokoll" />
          <Prose T={T}>
            <p>
              BGP (Border Gateway Protocol) er protokollen alle nettverksoperatører bruker for å
              annonsere hvilke IP-adresser de er ansvarlige for. Tenk på det som et digitalt veikart
              som oppdateres kontinuerlig.
            </p>
            <p>
              Nettradar lytter på den globale BGP-datastrømmen fra RIPE RIS Live og filtrerer ut alle
              meldinger som involverer norske nettverk. Fire typer hendelser overvåkes:
            </p>
          </Prose>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '20px 0 32px' }}>
            <EventTypeCard T={T} mono={mono}
              tag="UPDATE" color={T.accent2 || '#7cb6ff'} variant="info"
              title="Annonsering"
              body="En operatør melder: «IP-blokken 185.93.54.0/24 er tilgjengelig via meg.» Skjer ved oppstart av rutere, failover til backup eller når nye IP-blokker tas i bruk. Hundrevis i minuttet er normalt." />
            <EventTypeCard T={T} mono={mono}
              tag="WITHDRAW" color={T.amber} variant="warn"
              title="Tilbaketrekk"
              body="«Den IP-blokken er ikke lenger tilgjengelig via meg.» Kan bety planlagt vedlikehold eller failover. Isolerte tilfeller er ufarlige; mange på kort tid kan signalere driftsavbrudd." />
            <EventTypeCard T={T} mono={mono}
              tag="HIJACK" color={T.red} variant="crit"
              title="Hijack"
              body="En aktør annonserer en IP-blokk som tilhører en annen operatør — uten rett til det. Vanligvis feilkonfigurasjon, sjelden bevisst angrep. BGP har ingen innebygd verifisering. Berørte noder vises i 30 sekunder i topologien." />
            <EventTypeCard T={T} mono={mono}
              tag="ROUTE LEAK" color={T.amber} variant="warn"
              title="Rutelekkasje"
              body="En operatør videresender ruter til naboer den ikke skulle ha propagert. Trafikk kan bli feilrutet uten at noen vet. Vanligere enn hijacks, oftest feil i ruterkonfigurasjon." />
          </div>

          <Callout T={T} mono={mono}>
            <strong style={{ color: T.text, fontWeight: 600 }}>Prefiks-notasjon:</strong> IP-blokker
            skrives som <code style={{ fontFamily: mono, fontSize: 12.5 }}>185.93.54.0/24</code>.
            Tallet etter skråstreken angir størrelsen — /24 er 256 adresser, /16 er 65 536. IPv6 fungerer
            likt (f.eks. <code style={{ fontFamily: mono, fontSize: 12.5 }}>2a02:ac81::/32</code>).
          </Callout>

          {/* SECTION 3 — Dashboard */}
          <Anchor id="s3" T={T} title="Dashboard-paneler" kicker="Hva du ser på forsiden" />
          <Prose T={T}>
            <p>Forsiden viser tre seksjoner som hver svarer på et spørsmål:</p>
          </Prose>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, margin: '20px 0 32px' }}>
            <PanelExplainer T={T} mono={mono}
              q="Er det noe galt akkurat nå?"
              h="Sikkerhetsvarsler"
              body="Aktive BGP-hijacks og route leaks oppdaget av Cloudflare Radar, samt hijacks fanget i sanntid fra RIPE RIS Live. Grønt = ingen. Rødt = noe krever oppmerksomhet." />
            <PanelExplainer T={T} mono={mono}
              q="Hvor mye DDoS-trafikk?"
              h="DDoS-aktivitet"
              body="Time-for-time L7 (HTTP) og L3/4 (volum) angrep mot norsk infra. Y-aksen er normalisert: 1,0 = dagens topp for den typen, ikke et absolutt trafikktall." />
            <PanelExplainer T={T} mono={mono}
              q="Hvem og hvor stammer det fra?"
              h="Opprinnelse"
              body="Kilde-AS (hvilket nettverk angrepstrafikken kommer fra) og kilde-land (hvilket land kilde-IP-en er registrert i). De fleste angrep bruker kompromitterte servere på tvers av land." />
          </div>

          {/* SECTION 4 — BGP-aktivitet */}
          <Anchor id="s4" T={T} title="BGP-aktivitet" kicker="Egen fane" />
          <Prose T={T}>
            <p>
              BGP-aktivitet-siden gir to visninger av sanntidsdata fra norske nettverk:
            </p>
            <p>
              <strong style={{ color: T.text, fontWeight: 600 }}>Sammendrag</strong> — en tabell
              som summerer annonseringer, tilbaketrekk og hijacks per operatør siden siden ble lastet.
              Oppdateres automatisk hvert 30. sekund. Sorterbar.
            </p>
            <p>
              <strong style={{ color: T.text, fontWeight: 600 }}>Logg</strong> — en løpende strøm,
              nyeste øverst, de 150 siste hendelsene. Hijack-rader markeres rødt. Teller for hend/min
              i panelet reflekterer faktisk BGP-aktivitet i norsk infrastruktur nå.
            </p>
          </Prose>

          {/* SECTION 5 — Topologi */}
          <Anchor id="s5" T={T} title="AS-Topologi" kicker="Egen fane" />
          <Prose T={T}>
            <p>
              Et AS (Autonomous System) er et nett av IP-adresser under felles administrasjon — typisk
              en ISP, et mobilnett eller en stor bedrift. Hvert AS har et unikt nummer (ASN). Telenor
              er AS2119, UNINETT er AS2116, og så videre.
            </p>
            <p>
              Topologigrafen viser norske AS-er som noder. En linje mellom to noder betyr at begge
              dukket opp i samme BGP-rutingsti i live-dataen — altså at de faktisk ruter trafikk
              gjennom hverandre.
            </p>
          </Prose>

          <div style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
            padding: '18px 22px', margin: '20px 0 16px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase',
              color: T.dim, marginBottom: 14 }}>Farger og størrelser</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 32px' }}>
              <LegendRow color="#7ab8ff" T={T} label="aktiv" body="sendte BGP-hendelse siste 5 sek." />
              <LegendRow color="#4d94ff" T={T} label="overvåket" body="ingen fersk aktivitet, pulserer" />
              <LegendRow color={T.amber} T={T} label="gul ring" body="tilbaketrekk siste 15 sek." />
              <LegendRow color={T.red} T={T} label="rød node" body="involvert i hijack siste 30 sek." />
            </div>
            <div style={{ fontSize: 12.5, color: T.dim, marginTop: 14, paddingTop: 12,
              borderTop: `1px solid ${T.border}` }}>
              <strong style={{ color: T.text, fontWeight: 500 }}>Nodestørrelse</strong> skalerer
              med antall BGP-hendelser i økten. Grafen bygger seg opp etter hvert som data strømmer inn —
              30–60 minutter for komplett bilde. <strong style={{ color: T.text, fontWeight: 500 }}>Interaksjon:</strong> dra
              noder, scroll for zoom, hover for detaljer.
            </div>
          </div>

          {/* SECTION 6 — Datakilder */}
          <Anchor id="s6" T={T} title="Datakilder" kicker="Hvor dataene kommer fra" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, margin: '20px 0 24px' }}>
            <SourceCard T={T} mono={mono} name="RIPE RIS Live" color="#7cb6ff"
              body="Persistent WebSocket-strøm av globale BGP-oppdateringer. Filtrert på norske AS-nummer og prefikser. Gratis, ingen nøkkel."
              link="ris-live.ripe.net" />
            <SourceCard T={T} mono={mono} name="Cloudflare Radar" color={T.amber}
              body="L7- og L3/4 DDoS-tidsserier, BGP-hijacks, route leaks og angrepenes opprinnelse for Norge. Oppdateres hvert 60. sekund."
              link="radar.cloudflare.com" />
            <SourceCard T={T} mono={mono} name="PeeringDB" color={T.green}
              body="Register over norske nettverksoperatører og AS-nummer. Lastes ved oppstart og oppdateres daglig."
              link="peeringdb.com" />
          </div>
          <Prose T={T}>
            <p style={{ color: T.dim, fontSize: 13 }}>
              All data er offentlig tilgjengelig. Nettradar lagrer ingenting — hendelser holdes kun i
              minnet og nullstilles ved serveroppstart.
            </p>
          </Prose>
        </div>
      </div>
    </div>
  );
}

function FactPill({ label, value, T, mono }) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, color: T.dim, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: mono, fontSize: 15, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function Anchor({ id, title, kicker, T }) {
  return (
    <div id={id} style={{ marginTop: 40, marginBottom: 14, paddingBottom: 10,
      borderBottom: `1px solid ${T.border}` }}>
      {kicker && <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.4, color: T.dim,
        textTransform: 'uppercase', marginBottom: 8 }}>{kicker}</div>}
      <h2 style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.1, margin: 0 }}>
        {title}
      </h2>
    </div>
  );
}

function Prose({ T, children }) {
  return (
    <div style={{ maxWidth: 700, fontSize: 14.5, lineHeight: 1.65, color: T.dim }}>
      {children}
    </div>
  );
}

function Callout({ T, mono, children }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderLeft: `2px solid ${T.dim}`,
      borderRadius: 8, padding: '14px 18px', margin: '16px 0 28px',
      fontSize: 13, lineHeight: 1.55, color: T.dim, maxWidth: 700,
    }}>
      {children}
    </div>
  );
}

function EventTypeCard({ tag, color, title, body, variant, T, mono }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
      padding: 18, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: color }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
          padding: '3px 7px', background: `${color}1c`, color, borderRadius: 3 }}>{tag}</span>
        <span style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: -0.2 }}>{title}</span>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: T.dim }}>{body}</div>
    </div>
  );
}

function PanelExplainer({ q, h, body, T, mono }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontSize: 11.5, color: T.dim, fontStyle: 'italic', marginBottom: 10,
        fontFamily: '"Source Serif 4", Georgia, serif' }}>
        «{q}»
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.2, marginBottom: 6 }}>{h}</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.55, color: T.dim }}>{body}</div>
    </div>
  );
}

function LegendRow({ color, label, body, T }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
      <span style={{ width: 14, height: 14, borderRadius: 7, background: color,
        boxShadow: `0 0 8px ${color}66`, flexShrink: 0 }} />
      <span style={{ fontWeight: 500, color: T.text }}>{label}</span>
      <span style={{ color: T.dim }}>— {body}</span>
    </div>
  );
}

function SourceCard({ name, color, body, link, T, mono }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: color,
          boxShadow: `0 0 8px ${color}` }} />
        <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: -0.2 }}>{name}</span>
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.55, color: T.dim, flex: 1 }}>{body}</div>
      <div style={{ fontFamily: mono, fontSize: 11.5, color, paddingTop: 6,
        borderTop: `1px solid ${T.border}` }}>↗ {link}</div>
    </div>
  );
}

window.COmPage = COmPage;
