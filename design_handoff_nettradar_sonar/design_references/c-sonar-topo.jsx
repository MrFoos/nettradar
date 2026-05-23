// C · Sonar — Topologi-siden. Force-graf av norske ASN-er.
// Posisjoner er forhåndsberegnet for forutsigbar layout i mockup.

function CTopoPage({ width, height, theme = 'dark' }) {
  const T = theme === 'dark' ? C_DARK : C_LIGHT;
  const sans = '"Inter", "Söhne", -apple-system, system-ui, sans-serif';
  const mono = '"JetBrains Mono", ui-monospace, monospace';

  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);

  // Forhåndsberegnede posisjoner — ser organisk ut, sterkt sammenkoblede i midten
  // Felt-bredde: 0..1, vil bli skalert til canvas
  const NODE_DATA = [
    { asn: 2119,   name: 'Telenor Norge',   x: 0.45, y: 0.42, activity: 1842, state: 'active', isHub: true },
    { asn: 8222,   name: 'Altibox',         x: 0.62, y: 0.34, activity: 1247, state: 'hijack', isHub: true },
    { asn: 29695,  name: 'Ice.net',         x: 0.36, y: 0.62, activity: 893,  state: 'active' },
    { asn: 39029,  name: 'NextGenTel',      x: 0.58, y: 0.58, activity: 712,  state: 'active' },
    { asn: 2116,   name: 'UNINETT',         x: 0.30, y: 0.40, activity: 583,  state: 'withdraw' },
    { asn: 16175,  name: 'Lyse Tele',       x: 0.48, y: 0.70, activity: 421,  state: 'recent' },
    { asn: 44543,  name: 'Broadnet',        x: 0.70, y: 0.50, activity: 389,  state: 'active' },
    { asn: 12929,  name: 'BaneTele',        x: 0.20, y: 0.55, activity: 267,  state: 'idle' },
    { asn: 20834,  name: 'Catchcom',        x: 0.65, y: 0.72, activity: 198,  state: 'idle' },
    { asn: 198144, name: 'Eidsiva Nett',    x: 0.78, y: 0.38, activity: 142,  state: 'idle' },
    { asn: 56655,  name: 'TDC Norge',       x: 0.22, y: 0.28, activity: 108,  state: 'idle' },
    { asn: 31027,  name: 'GreenHost',       x: 0.82, y: 0.62, activity: 67,   state: 'idle' },
    { asn: 43996,  name: 'Ventelo',         x: 0.55, y: 0.22, activity: 0,    state: 'monitored' },
  ];
  const EDGES = [
    [2119, 8222], [2119, 29695], [2119, 2116], [2119, 39029], [2119, 44543],
    [8222, 39029], [8222, 44543], [8222, 16175],
    [29695, 16175], [29695, 12929],
    [2116, 56655], [2116, 12929],
    [39029, 20834], [44543, 198144], [44543, 31027],
    [16175, 20834], [198144, 31027],
    [2119, 56655], [8222, 198144],
  ];

  const stateColors = {
    active:    '#7ab8ff',  // lys blå — fersk aktivitet (siste 5s)
    recent:    '#5294e0',  // litt mørkere
    monitored: '#4d94ff',  // overvåket, ingen fersk
    idle:      '#3a5a8c',
    withdraw:  T.amber,
    hijack:    T.red,
  };

  // Canvas
  const PAD = 60;
  const canvasW = width - 360 - PAD * 2; // hovedflate (- legend/right column)
  const canvasH = height - 250;
  const cx = x => PAD + x * canvasW;
  const cy = y => 240 + y * canvasH;
  const nodeR = (n) => Math.max(14, Math.min(30, 14 + Math.sqrt(n.activity) * 0.6));

  const nodeMap = Object.fromEntries(NODE_DATA.map(n => [n.asn, n]));

  return (
    <div style={{
      width, height, background: T.bg, color: T.text, fontFamily: sans,
      position: 'relative', overflow: 'hidden', fontSize: 13,
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
            <span key={l} style={{ fontSize: 13, color: i === 2 ? T.text : T.dim,
              fontWeight: i === 2 ? 600 : 500, cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: mono, fontSize: 11.5, color: T.dim }}>
          <Dot color={T.green} />RIPE RIS live
          <span>oppe i 23 min</span>
        </div>
      </div>

      {/* HERO */}
      <div style={{ padding: '28px 40px 22px', display: 'flex', alignItems: 'end', gap: 56 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.4, color: T.dim,
            textTransform: 'uppercase', marginBottom: 12 }}>
            AS-Topologi
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: -1, lineHeight: 1.1, margin: 0, textWrap: 'balance' }}>
            <span style={{ color: T.text }}>11 av 13</span>{' '}
            <span style={{ color: T.dim }}>norske ASN-er er observert i live BGP-stien.</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          <BgpStat T={T} mono={mono} label="Noder" value="13" sub="i grafen" />
          <BgpStat T={T} mono={mono} label="Koblinger" value="19" sub="observerte BGP-stier" />
          <BgpStat T={T} mono={mono} label="Aktive 30s" value="7" sub="sendt hendelse" />
          <BgpStat T={T} mono={mono} label="Varsler" value="1" sub="hijack, AS8222" tone="bad" />
        </div>
      </div>

      {/* HOVED-OMRÅDE: graf + sidepanel */}
      <div style={{ position: 'absolute', top: 240, left: 0, right: 0, bottom: 24,
        display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, padding: '0 40px' }}>
        {/* GRAF */}
        <div style={{ position: 'relative', background: T.card,
          border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {/* Mikronett-bakgrunn */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: theme === 'dark' ? 0.35 : 0.5 }}>
            <defs>
              <pattern id="topo-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="0.6" fill={T.border} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#topo-grid)" />
          </svg>

          {/* Verktøytips topp */}
          <div style={{ position: 'absolute', top: 12, left: 16, fontSize: 10.5,
            color: T.dim, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600 }}>
            Norske nettverksoperatører
            <span style={{ color: T.dimmer, marginLeft: 14, fontWeight: 400, textTransform: 'none',
              letterSpacing: 0, fontStyle: 'italic' }}>dra noder · scroll for å zoome · hover for detaljer</span>
          </div>

          {/* Zoom-kontroller */}
          <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', flexDirection: 'column',
            gap: 1, background: T.cardElevated, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {['+', '−', '⤢'].map((c, i) => (
              <div key={i} style={{
                width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.dim, fontSize: 16, cursor: 'pointer',
                borderBottom: i < 2 ? `1px solid ${T.border}` : 'none',
              }}>{c}</div>
            ))}
          </div>

          {/* SVG graph */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            {/* Edges */}
            {EDGES.map(([a, b], i) => {
              const na = nodeMap[a], nb = nodeMap[b];
              if (!na || !nb) return null;
              const involvedHighlight = na.state === 'hijack' || nb.state === 'hijack';
              return (
                <line key={i}
                  x1={cx(na.x) - PAD} y1={cy(na.y) - 240}
                  x2={cx(nb.x) - PAD} y2={cy(nb.y) - 240}
                  stroke={involvedHighlight ? T.red : T.border}
                  strokeWidth={involvedHighlight ? 1.5 : 1}
                  strokeOpacity={involvedHighlight ? 0.8 : 0.6} />
              );
            })}

            {/* Nodes */}
            {NODE_DATA.map((n) => {
              const x = cx(n.x) - PAD;
              const y = cy(n.y) - 240;
              const r = nodeR(n);
              const color = stateColors[n.state];
              const isAlert = n.state === 'hijack' || n.state === 'withdraw';
              const labelLines = n.name.length > 14 ? [n.name.slice(0, 14) + '…'] : [n.name];

              return (
                <g key={n.asn}>
                  {/* pulse ring for active/hijack/withdraw */}
                  {(n.state === 'active' || isAlert) && (
                    <circle cx={x} cy={y} r={r}
                      fill="none" stroke={color} strokeWidth="1.5" opacity="0.4">
                      <animate attributeName="r" from={r} to={r + 14} dur={isAlert ? '1.4s' : '2s'} repeatCount="indefinite" />
                      <animate attributeName="opacity" from={0.55} to={0} dur={isAlert ? '1.4s' : '2s'} repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* hovedsirkel */}
                  <circle cx={x} cy={y} r={r}
                    fill={isAlert ? `${color}33` : (theme === 'dark' ? '#1a2840' : '#dfeaf7')}
                    stroke={color} strokeWidth={isAlert ? 2.5 : (n.isHub ? 2.2 : 1.6)} />
                  {/* label */}
                  <text x={x} y={y + r + 14} textAnchor="middle"
                    fill={T.text} fontSize="11" fontWeight="500"
                    style={{ fontFamily: sans }}>{labelLines[0]}</text>
                  <text x={x} y={y + r + 26} textAnchor="middle"
                    fill={T.dim} fontSize="9.5"
                    style={{ fontFamily: mono }}>AS{n.asn}</text>
                </g>
              );
            })}
          </svg>

          {/* Floating tooltip for Altibox */}
          {(() => {
            const n = nodeMap[8222];
            const x = cx(n.x) - PAD;
            const y = cy(n.y) - 240;
            return (
              <div style={{
                position: 'absolute', left: x + 36, top: y - 60,
                background: T.cardElevated, border: `1px solid ${T.border}`, borderRadius: 10,
                padding: '12px 14px', minWidth: 180, fontSize: 12,
                boxShadow: theme === 'dark' ? '0 4px 24px rgba(0,0,0,0.6)' : '0 4px 24px rgba(0,0,0,0.12)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Altibox</span>
                  <span style={{ fontFamily: mono, color: T.dim, fontSize: 11 }}>AS8222</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: T.dim, fontSize: 11, marginBottom: 3 }}>
                  <span>BGP-hendelser</span><span style={{ fontFamily: mono, color: T.text }}>1 247</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: T.dim, fontSize: 11, marginBottom: 3 }}>
                  <span>Sist sett</span><span style={{ fontFamily: mono, color: T.text }}>2s siden</span>
                </div>
                <div style={{ marginTop: 7, paddingTop: 7, borderTop: `1px solid ${T.border}`,
                  color: T.red, fontSize: 11, fontWeight: 600 }}>
                  ⚠ Involvert i hijack siste 30s
                </div>
              </div>
            );
          })()}
        </div>

        {/* HØYRE PANEL — legende + topp aktive */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
          {/* Legende */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase',
              color: T.dim, marginBottom: 14 }}>Tegnforklaring</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <TopoLegend color={stateColors.active}    T={T} title="Aktiv"      sub="hendelse siste 5 s" />
              <TopoLegend color={stateColors.monitored} T={T} title="Overvåket"  sub="pulserer rolig" />
              <TopoLegend color={stateColors.withdraw}  T={T} title="Tilbaketrekk" sub="siste 15 s" ring />
              <TopoLegend color={stateColors.hijack}    T={T} title="Hijack"     sub="involvert siste 30 s" fill />
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`,
              fontSize: 11.5, color: T.dim, lineHeight: 1.5 }}>
              Nodestørrelse skalerer med <strong style={{ color: T.text, fontWeight: 500 }}>antall BGP-hendelser</strong> i økten.
            </div>
          </div>

          {/* Topp aktive nå */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase',
              color: T.dim, marginBottom: 12 }}>Mest aktive nå</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {NODE_DATA.slice()
                .sort((a, b) => b.activity - a.activity)
                .slice(0, 7)
                .map(n => (
                  <div key={n.asn} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
                    borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ width: 7, height: 7, borderRadius: 4, background: stateColors[n.state], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</span>
                    <span style={{ fontFamily: mono, color: T.dim, fontSize: 11 }}>AS{n.asn}</span>
                    <span style={{ fontFamily: mono, fontVariantNumeric: 'tabular-nums', fontSize: 12,
                      fontWeight: 600, color: T.text, width: 50, textAlign: 'right' }}>{n.activity.toLocaleString('nb-NO')}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopoLegend({ color, title, sub, T, ring, fill }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="22" height="22">
        <circle cx="11" cy="11" r="8"
          fill={fill ? `${color}33` : 'transparent'}
          stroke={color} strokeWidth={ring ? 2.5 : 1.8} />
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: T.text }}>{title}</div>
        <div style={{ fontSize: 11, color: T.dim }}>{sub}</div>
      </div>
    </div>
  );
}

window.CTopoPage = CTopoPage;
