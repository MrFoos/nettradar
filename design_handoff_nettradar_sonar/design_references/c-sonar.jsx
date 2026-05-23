// Direction C — Sonar
// Rolig, skandinavisk. Mye luft, hierarki gjennom skala, ikke linjer.
// Stor primær-metrikk øverst, mer detaljer nedover.

function CDashboard({ width, height, theme = 'dark', allClear = false }) {
  const T = theme === 'dark' ? C_DARK : C_LIGHT;
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  const intensityDelta = allClear ? -8 : Math.round((CURRENT_ATTACK_INTENSITY / ATTACK_BASELINE_24H - 1) * 100);
  const alerts = allClear ? [] : [
    ...HIJACK_ALERTS.map(h => ({ ...h, kind: 'hijack' })),
    ...ROUTE_LEAKS.map(l => ({ ...l, kind: 'leak' })),
  ];

  const sans = '"Inter", "Söhne", -apple-system, system-ui, sans-serif';
  const mono = '"JetBrains Mono", ui-monospace, monospace';

  return (
    <div style={{
      width, height, background: T.bg, color: T.text, fontFamily: sans,
      position: 'relative', overflow: 'hidden', fontSize: 13,
      fontFeatureSettings: '"cv11", "ss01"',
    }}>
      {/* TOPP — minimal nav */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '24px 40px 0', gap: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SonarMark color={T.accent} />
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>nettradar</span>
          <span style={{ fontSize: 14, fontWeight: 400, color: T.dim, letterSpacing: -0.2 }}>.no</span>
        </div>
        <div style={{ display: 'flex', gap: 18, marginLeft: 20 }}>
          {['Dashboard', 'BGP-aktivitet', 'Topologi', 'Om'].map((l, i) => (
            <span key={l} style={{ fontSize: 13, color: i === 0 ? T.text : T.dim, fontWeight: 500, cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: mono, fontSize: 11.5, color: T.dim }}>
          <Dot color={T.green} />RIPE
          <Dot color={T.green} />Cloudflare
          <span>{now.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>

      {/* HOVED — store tall + status */}
      <div style={{ padding: '40px 40px 28px', display: 'grid',
        gridTemplateColumns: '1.4fr 1fr', gap: 60, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: 0.4,
            color: T.dim, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4,
              background: allClear ? T.green : T.amber,
              boxShadow: `0 0 12px ${allClear ? T.green : T.amber}`,
              animation: 'c-pulse 2.5s ease-in-out infinite' }} />
            Nasjonal status · {allClear ? 'normal' : 'forhøyet'}
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 500, letterSpacing: -2,
            lineHeight: 1.04, margin: '14px 0 0', maxWidth: 720, textWrap: 'balance' }}>
            {allClear ? (
              <>Ingen aktive sikkerhetsvarsler.{' '}
                <span style={{ color: T.dim }}>DDoS-aktivitet ligger {Math.abs(intensityDelta)}% under snitt.</span></>
            ) : (
              <>Tre aktive sikkerhetsvarsler.{' '}
                <span style={{ color: T.dim }}>DDoS-aktivitet ligger {intensityDelta}% over snitt.</span></>
            )}
          </h1>
          <div style={{ marginTop: 22, display: 'flex', gap: 40 }}>
            <Stat label="BGP-rate" value="142" unit="/min" T={T} mono={mono} />
            <Stat label="Aktive ASN" value="13" T={T} mono={mono} />
            <Stat label="Norske prefikser" value="2 419" T={T} mono={mono} />
            <Stat label="Uptime" value="99.97" unit="%" T={T} mono={mono} />
          </div>
        </div>

        {/* Hero-kort: største trussel ELLER alt-rolig */}
        {allClear ? (
          <div style={{
            padding: 24, background: T.cardElevated,
            border: `1px solid ${T.border}`, borderRadius: 14, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200,
              background: `radial-gradient(circle, ${T.green}22, transparent 65%)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 22, height: 22, borderRadius: 11, background: `${T.green}1f`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7.5l3 3 7-7" stroke={T.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.4, color: T.green, textTransform: 'uppercase' }}>
                Alle systemer normale
              </span>
            </div>
            <div style={{ fontSize: 19, fontWeight: 500, letterSpacing: -0.4, lineHeight: 1.3, marginBottom: 8, textWrap: 'balance' }}>
              Ingen hijacks, lekkasjer eller uregelmessige BGP-annonseringer siste 24 timer.
            </div>
            <div style={{ fontSize: 12.5, color: T.dim, lineHeight: 1.5, marginBottom: 14 }}>
              Norsk internett-infrastruktur kjører som forventet. BGP-feeden ruller stødig,
              DDoS-aktivitet ligger under snitt, og alle 13 overvåkede ASN-er svarer normalt.
            </div>
            <div style={{ display: 'flex', gap: 18, padding: '10px 0 0', borderTop: `1px solid ${T.border}` }}>
              <MiniStat label="Siste hendelse" value="3 d 4 t siden" sub="route leak · UNINETT" T={T} />
              <MiniStat label="Uptime 30 d" value="99.94 %" sub="ingen ASN nede" T={T} />
            </div>
          </div>
        ) : (
          <div style={{
            padding: 22, background: T.cardElevated,
            border: `1px solid ${T.border}`, borderRadius: 14, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180,
              background: `radial-gradient(circle, ${T.red}25, transparent 65%)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, color: T.red,
                padding: '3px 8px', background: `${T.red}1f`, borderRadius: 4 }}>HIJACK</span>
              <span style={{ fontSize: 11, color: T.dim }}>oppdaget kl. {new Date(Date.now() - 4*60*1000).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: mono, fontSize: 11, color: T.dim }}>04:18 siden</span>
            </div>
            <div style={{ fontSize: 19, fontWeight: 500, letterSpacing: -0.4, lineHeight: 1.25, marginBottom: 4, textWrap: 'balance' }}>
              AS199524 annonserer Altibox-prefiks
            </div>
            <div style={{ fontFamily: mono, fontSize: 12, color: T.dim, marginBottom: 12 }}>
              109.74.180.0/22 → normalt opprinnet av AS8222
            </div>
            <div style={{ display: 'flex', gap: 18, padding: '10px 0 0', borderTop: `1px solid ${T.border}` }}>
              <MiniStat label="Hijacker" value="OOO Network Solutions" sub="RU · AS199524" T={T} />
              <MiniStat label="Offer" value="Altibox" sub="NO · AS8222" T={T} />
            </div>
          </div>
        )}
      </div>

      {/* DATA-GRID */}
      <div style={{ padding: '0 40px 32px', display: 'flex', flexDirection: 'column', gap: 22,
        height: height - 304 }}>

        {/* SIKKERHETSVARSLER — egen seksjon */}
        <div>
          <SectionTitle T={T} title="Sikkerhetsvarsler"
            sub="BGP-hendelser flagget av Cloudflare og RIPE RIS"
            right={alerts.length > 0
              ? <span style={{ color: T.red, fontSize: 12, fontWeight: 600 }}>{alerts.length} åpne · siste 24 t.</span>
              : <span style={{ color: T.green, fontSize: 12, fontWeight: 600 }}>● 0 åpne · siste 24 t.</span>
            } />
          {alerts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 10 }}>
              {alerts.map((it, i) => <AlertCard key={i} kind={it.kind} item={it} T={T} mono={mono} />)}
            </div>
          ) : (
            <div style={{
              marginTop: 10, padding: '22px 26px',
              background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 24, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -50, left: -50, width: 200, height: 200,
                background: `radial-gradient(circle, ${T.green}14, transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{ width: 44, height: 44, borderRadius: 22, background: `${T.green}1c`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10.5l3.5 3.5L16 5.5" stroke={T.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: -0.2, marginBottom: 3 }}>
                  Ingen aktive varsler
                </div>
                <div style={{ fontSize: 13, color: T.dim, lineHeight: 1.5 }}>
                  Cloudflare har ikke flagget hijacks eller route leaks mot norsk infrastruktur siste 24 timer,
                  og RIPE RIS-strømmen viser ingen uregelmessige annonseringer.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 24, paddingLeft: 24, borderLeft: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase', color: T.dim, marginBottom: 4 }}>
                    Siste hendelse
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>3 d 4 t siden</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase', color: T.dim, marginBottom: 4 }}>
                    Snitt per uke
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>2,3</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DDOS-SEKSJON — graf + AS-kilder + opprinnelse gruppert */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <SectionTitle T={T} title="DDoS-aktivitet"
            sub="siste 24 timer · normalisert intensitet"
            right={<span style={{ color: T.red, fontWeight: 600, fontSize: 12 }}>+{intensityDelta}% over snitt</span>} />
          <div style={{ flex: 1, minHeight: 0, display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr', gap: 14, marginTop: 10 }}>
            {/* DDoS chart */}
            <Card T={T}>
              <CardHeader T={T} title="Intensitet mot Norge"
                sub="layer 7 vs. layer 3/4" />
              <div style={{ flex: 1, minHeight: 0, padding: '12px 18px 0' }}>
                <SonarChart l7={ATTACK_TIMESERIES_L7} l3={ATTACK_TIMESERIES_L3} T={T} />
              </div>
              <div style={{ display: 'flex', gap: 16, padding: '8px 20px 14px', fontSize: 11, color: T.dim }}>
                <Legend color={T.amber} label="L7 (app)" /><Legend color={T.red} label="L3/4 (volum)" />
                <span style={{ flex: 1 }} /><span>oppdatert nå</span>
              </div>
            </Card>

            {/* Kilde-AS */}
            <Card T={T}>
              <CardHeader T={T} title="Kilde-AS" sub="andel av angrep" />
              <div style={{ padding: '10px 18px 14px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {ATTACK_AS_ORIGINS.slice(0, 7).map((o) => (
                  <div key={o.as_number} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                    <span style={{ fontFamily: mono, color: T.dim, width: 56, fontSize: 11 }}>AS{o.as_number}</span>
                    <span style={{ flex: 1, fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis' }}>{o.as_name}</span>
                    <div style={{ width: 50, height: 3, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${(o.percentage / ATTACK_AS_ORIGINS[0].percentage) * 100}%`, height: '100%', background: T.red }} />
                    </div>
                    <span style={{ width: 40, textAlign: 'right', fontFamily: mono, fontSize: 11.5, fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums' }}>{o.percentage.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Land */}
            <Card T={T}>
              <CardHeader T={T} title="Opprinnelse" sub="kilde-IP per land" />
              <div style={{ padding: '10px 18px 14px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {ATTACK_ORIGINS.slice(0, 7).map((o) => (
                  <div key={o.country_code} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '5px 0' }}>
                    <span style={{ fontSize: 17, lineHeight: 1, width: 22 }}>{countryFlag(o.country_code)}</span>
                    <span style={{ flex: 1, fontSize: 12.5 }}>{o.country_name}</span>
                    <div style={{ width: 50, height: 3, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${(o.percentage / ATTACK_ORIGINS[0].percentage) * 100}%`, height: '100%', background: T.red }} />
                    </div>
                    <span style={{ width: 40, textAlign: 'right', fontFamily: mono, fontSize: 11.5, fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums' }}>{o.percentage.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style>{`@keyframes c-pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }`}</style>
    </div>
  );
}

const C_DARK = {
  bg: '#0a0a0c', text: '#f5f5f7', dim: '#8a8a93', dimmer: '#5a5a63',
  card: '#0f0f12', cardElevated: '#13131a', border: 'rgba(255,255,255,0.07)',
  accent: '#d4d4dc',
  red: '#ff6b5b', amber: '#f5b942', green: '#4fd58a',
};
const C_LIGHT = {
  bg: '#f7f6f3', text: '#15151a', dim: '#74747e', dimmer: '#a8a8b0',
  card: '#ffffff', cardElevated: '#ffffff', border: 'rgba(15,15,26,0.10)',
  accent: '#15151a',
  red: '#d83a2e', amber: '#b87a0c', green: '#1f7a3e',
};

function SonarMark({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="10" fill="none" stroke={color} strokeWidth="1.2" opacity="0.25" />
      <circle cx="11" cy="11" r="6.5" fill="none" stroke={color} strokeWidth="1.2" opacity="0.5" />
      <circle cx="11" cy="11" r="2.5" fill={color} />
    </svg>
  );
}

function Dot({ color }) {
  return <span style={{ width: 6, height: 6, borderRadius: 3, background: color, marginRight: 4, display: 'inline-block' }} />;
}

function Stat({ label, value, unit, T, mono }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: T.dim, marginBottom: 4, letterSpacing: 0.2 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 500, letterSpacing: -0.8, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: T.dim }}>{unit}</span>}
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub, T }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase', color: T.dim, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: T.dim, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function Card({ T, children }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
      display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {children}
    </div>
  );
}

function CardHeader({ T, title, sub, right }) {
  return (
    <div style={{ padding: '14px 20px 10px', display: 'flex', alignItems: 'baseline', gap: 10,
      borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: -0.1 }}>{title}</span>
      {sub && <span style={{ fontSize: 11, color: T.dim }}>{sub}</span>}
      <span style={{ flex: 1 }} />
      {right}
    </div>
  );
}

function SectionTitle({ T, title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, paddingBottom: 8,
      borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.8, textTransform: 'uppercase', color: T.dim }}>
        {title}
      </span>
      {sub && <span style={{ fontSize: 11.5, color: T.dim }}>{sub}</span>}
      <span style={{ flex: 1 }} />
      {right}
    </div>
  );
}

function AlertCard({ kind, item, T, mono }) {
  const isHijack = kind === 'hijack';
  const c = isHijack ? T.red : T.amber;
  const t = new Date(item.detected_at).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
  const ago = Math.floor((Date.now() - new Date(item.detected_at).getTime()) / 60000);
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, background: c, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.3, color: c,
          padding: '3px 7px', background: `${c}1f`, borderRadius: 3 }}>
          {isHijack ? '⚠ HIJACK' : '↯ ROUTE LEAK'}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 10.5, color: T.dim, fontFamily: mono }}>
          {ago} min siden · {t}
        </span>
      </div>
      <div style={{ fontFamily: mono, fontSize: 13.5, color: T.text, fontWeight: 500 }}>
        {item.prefix}
      </div>
      <div style={{ fontSize: 12.5, color: T.dim, lineHeight: 1.45 }}>
        {isHijack ? (
          <><strong style={{ color: T.text, fontWeight: 500 }}>{item.hijacker_name}</strong> annonserer prefiks som tilhører <strong style={{ color: T.text, fontWeight: 500 }}>{item.victim_name}</strong></>
        ) : (
          <><strong style={{ color: T.text, fontWeight: 500 }}>{item.leak_name}</strong> videresendte ruter fra <strong style={{ color: T.text, fontWeight: 500 }}>{item.origin_name}</strong></>
        )}
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 'auto', paddingTop: 8,
        borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.dim }}>
        {isHijack ? (
          <>
            <span><span style={{ color: T.dim }}>Hijacker</span> <span style={{ color: T.text, fontFamily: mono }}>AS{item.hijacker_asn}</span></span>
            <span><span style={{ color: T.dim }}>Offer</span> <span style={{ color: T.text, fontFamily: mono }}>AS{item.victim_asn}</span></span>
          </>
        ) : (
          <>
            <span><span style={{ color: T.dim }}>Lekkasje</span> <span style={{ color: T.text, fontFamily: mono }}>AS{item.leak_asn}</span></span>
            <span><span style={{ color: T.dim }}>Opprinnelse</span> <span style={{ color: T.text, fontFamily: mono }}>AS{item.origin_asn}</span></span>
          </>
        )}
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 14, height: 2, background: color }} /><span>{label}</span>
    </span>
  );
}

function SonarChart({ l7, l3, T }) {
  const [el, setEl] = React.useState(null);
  const [box, setBox] = React.useState({ w: 400, h: 180 });
  React.useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(es => setBox({ w: es[0].contentRect.width, h: es[0].contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  const { w, h } = box;
  const padTop = 10, padBot = 20, padX = 0;
  const innerH = h - padTop - padBot, innerW = w - padX * 2;
  const xAt = i => padX + (i / (l7.length - 1)) * innerW;
  const yAt = v => padTop + (1 - v) * innerH;
  const line = d => d.map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i)},${yAt(p.value)}`).join(' ');
  const area = d => line(d) + ` L${xAt(d.length - 1)},${padTop + innerH} L${xAt(0)},${padTop + innerH} Z`;
  return (
    <div ref={setEl} style={{ width: '100%', height: '100%', minHeight: 120 }}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="g-l3" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={T.red} stopOpacity={0.35} />
            <stop offset="100%" stopColor={T.red} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="g-l7" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={T.amber} stopOpacity={0.3} />
            <stop offset="100%" stopColor={T.amber} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area(l3)} fill="url(#g-l3)" />
        <path d={line(l3)} fill="none" stroke={T.red} strokeWidth={1.6} />
        <path d={area(l7)} fill="url(#g-l7)" />
        <path d={line(l7)} fill="none" stroke={T.amber} strokeWidth={1.4} />
        {[0, 8, 16, 23].map(i => i < l7.length && (
          <text key={i} x={xAt(i)} y={h - 4} textAnchor="middle" fontSize={10} fill={T.dim}>
            {String(new Date(l7[i].timestamp).getHours()).padStart(2, '0')}
          </text>
        ))}
      </svg>
    </div>
  );
}

window.CDashboard = CDashboard;
