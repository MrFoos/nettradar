// C · Sonar — BGP-aktivitet-siden. To visninger: Sammendrag og Logg.

function CBgpPage({ width, height, theme = 'dark', view = 'summary' }) {
  const T = theme === 'dark' ? C_DARK : C_LIGHT;
  const sans = '"Inter", "Söhne", -apple-system, system-ui, sans-serif';
  const mono = '"JetBrains Mono", ui-monospace, monospace';

  const [now, setNow] = React.useState(new Date());
  const [events, setEvents] = React.useState(() => INITIAL_BGP_EVENTS.slice(0, 80));
  React.useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  React.useEffect(() => {
    const id = setInterval(() => setEvents(e => [makeBGPEvent(0), ...e].slice(0, 150)), 1500);
    return () => clearInterval(id);
  }, []);

  const totalUpdates = ASN_STATS.reduce((s, a) => s + a.updates, 0);
  const totalWithdraws = ASN_STATS.reduce((s, a) => s + a.withdraws, 0);
  const totalHijacks = ASN_STATS.reduce((s, a) => s + a.hijacks, 0);

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
            <span key={l} style={{ fontSize: 13, color: i === 1 ? T.text : T.dim,
              fontWeight: i === 1 ? 600 : 500, cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: mono, fontSize: 11.5, color: T.dim }}>
          <Dot color={T.green} />RIPE RIS live
          <span>{now.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>

      {/* HERO — tittel + stats + view-toggle */}
      <div style={{ padding: '32px 40px 26px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 40,
        alignItems: 'end' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.4, color: T.dim,
            textTransform: 'uppercase', marginBottom: 12 }}>
            BGP-aktivitet
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 500, letterSpacing: -1.2, lineHeight: 1.05,
            margin: 0, textWrap: 'balance' }}>
            <span style={{ fontFamily: mono, fontVariantNumeric: 'tabular-nums' }}>142</span>{' '}
            <span style={{ color: T.dim }}>hendelser per minutt fra norske nettverk.</span>
          </h1>
          <div style={{ marginTop: 22, display: 'flex', gap: 36 }}>
            <BgpStat T={T} mono={mono} label="ASN-er observert" value="11" sub="av 13 overvåket" />
            <BgpStat T={T} mono={mono} label="Annonseringer" value={totalUpdates.toLocaleString('nb-NO')} sub="siden oppstart" />
            <BgpStat T={T} mono={mono} label="Tilbaketrekk" value={totalWithdraws.toString()} sub="siden oppstart" />
            <BgpStat T={T} mono={mono} label="Hijacks" value={totalHijacks.toString()} sub="siden oppstart" tone="bad" />
          </div>
        </div>

        {/* View-toggle */}
        <ViewToggle T={T} current={view} />
      </div>

      {/* INNHOLD */}
      <div style={{ padding: '0 40px 32px', height: height - 280, overflow: 'hidden' }}>
        {view === 'summary'
          ? <SummaryView T={T} mono={mono} sans={sans} />
          : <LogView T={T} mono={mono} events={events} />}
      </div>
    </div>
  );
}

function BgpStat({ label, value, sub, tone, T, mono }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: T.dim, letterSpacing: 1, textTransform: 'uppercase',
        fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 500, letterSpacing: -0.4, lineHeight: 1,
        color: tone === 'bad' ? T.red : T.text, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 11, color: T.dim, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function ViewToggle({ T, current }) {
  return (
    <div style={{
      display: 'inline-flex', background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: 3, gap: 2,
    }}>
      {[{ id: 'summary', label: 'Sammendrag' }, { id: 'log', label: 'Logg' }].map(t => (
        <div key={t.id} style={{
          padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500,
          background: current === t.id ? T.cardElevated : 'transparent',
          color: current === t.id ? T.text : T.dim,
          border: current === t.id ? `1px solid ${T.border}` : '1px solid transparent',
          cursor: 'pointer',
        }}>{t.label}</div>
      ))}
    </div>
  );
}

function SummaryView({ T, mono, sans }) {
  const [sortBy, setSortBy] = React.useState('updates');
  // sortert i synkende rekkefølge per sortBy
  const sorted = [...ASN_STATS].sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
      height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 22px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>Per ASN — siden oppstart</span>
        <span style={{ fontSize: 11.5, color: T.dim }}>klikk en kolonne for å sortere · oppdateres hvert 30. s</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: mono, fontSize: 11.5, color: T.dim }}>neste oppdatering: 00:18</span>
      </div>

      {/* Tabell */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {/* header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '80px 1.6fr 1fr 1fr 1fr 1fr 100px',
          padding: '10px 22px', fontSize: 10.5, fontWeight: 600, letterSpacing: 1.1,
          textTransform: 'uppercase', color: T.dim, borderBottom: `1px solid ${T.border}`,
        }}>
          <span>ASN</span>
          <span>Operatør</span>
          <SortableHeader label="Update" active={sortBy === 'updates'} color="#7cb6ff" />
          <SortableHeader label="Withdraw" active={sortBy === 'withdraws'} color={T.amber} />
          <SortableHeader label="Hijack" active={sortBy === 'hijacks'} color={T.red} />
          <SortableHeader label="Aktivitet" />
          <span style={{ textAlign: 'right' }}>Sist sett</span>
        </div>

        {/* rader */}
        <div style={{ overflow: 'auto' }}>
          {sorted.map((row, i) => {
            const ago = [12, 28, 47, 89, 124, 4, 18, 67, 35, 192, 73, 256][i] || 0;
            const sparkData = Array.from({ length: 24 }, (_, j) => {
              return Math.max(0, Math.sin(j / 3 + i) * row.updates * 0.04 + row.updates * 0.06 + Math.random() * row.updates * 0.04);
            });
            return (
              <div key={row.asn} style={{
                display: 'grid', gridTemplateColumns: '80px 1.6fr 1fr 1fr 1fr 1fr 100px',
                padding: '11px 22px', fontSize: 13, alignItems: 'center',
                borderBottom: `1px solid ${T.border}`,
                background: row.hijacks > 0 ? `${T.red}07` : 'transparent',
              }}>
                <span style={{ fontFamily: mono, color: T.dim, fontSize: 12 }}>AS{row.asn}</span>
                <span style={{ fontWeight: 500 }}>{row.name}</span>
                <span style={{ fontFamily: mono, fontVariantNumeric: 'tabular-nums',
                  color: '#7cb6ff', fontWeight: row.updates > 1000 ? 600 : 400 }}>
                  {row.updates.toLocaleString('nb-NO')}
                </span>
                <span style={{ fontFamily: mono, fontVariantNumeric: 'tabular-nums',
                  color: row.withdraws > 0 ? T.amber : T.dimmer,
                  fontWeight: row.withdraws > 10 ? 600 : 400 }}>
                  {row.withdraws}
                </span>
                <span style={{ fontFamily: mono, fontVariantNumeric: 'tabular-nums',
                  color: row.hijacks > 0 ? T.red : T.dimmer,
                  fontWeight: row.hijacks > 0 ? 700 : 400 }}>
                  {row.hijacks > 0 ? `⚠ ${row.hijacks}` : 0}
                </span>
                <span><MiniSpark data={sparkData} color={row.hijacks > 0 ? T.red : '#7cb6ff'} /></span>
                <span style={{ textAlign: 'right', fontFamily: mono, fontSize: 11.5, color: T.dim,
                  fontVariantNumeric: 'tabular-nums' }}>
                  {ago < 60 ? `${ago}s` : `${Math.floor(ago / 60)}m ${ago % 60}s`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SortableHeader({ label, active, color }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
      color: active ? (color || '#fff') : 'inherit' }}>
      {color && <span style={{ width: 6, height: 6, borderRadius: 3, background: color }} />}
      {label} {active && <span style={{ fontSize: 9 }}>↓</span>}
    </span>
  );
}

function MiniSpark({ data, color }) {
  const max = Math.max(...data, 0.1);
  const w = 80, h = 18;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 1 - (v / max) * (h - 2)]);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <path d={line} fill="none" stroke={color} strokeWidth={1.2} opacity={0.85} />
    </svg>
  );
}

function LogView({ T, mono, events }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
      height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 22px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>Live BGP-strøm</span>
        <span style={{ fontSize: 11.5, color: T.dim }}>nyeste øverst · 150 siste hendelser</span>
        <span style={{ flex: 1 }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: T.green }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: T.green, boxShadow: `0 0 6px ${T.green}`,
            animation: 'c-pulse 1.5s ease-in-out infinite' }} />
          <span>strømmer fra RIPE RIS</span>
        </span>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '90px 110px 1.4fr 1.6fr 130px',
        padding: '10px 22px', fontSize: 10.5, fontWeight: 600, letterSpacing: 1.1,
        textTransform: 'uppercase', color: T.dim, borderBottom: `1px solid ${T.border}`,
      }}>
        <span>Tid</span>
        <span>Type</span>
        <span>Prefiks / opprinnelse</span>
        <span>AS-sti</span>
        <span style={{ textAlign: 'right' }}>Peer</span>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {events.slice(0, 18).map((e, i) => {
          const isHijack = e.event_type === 'hijack';
          const isWithdraw = e.event_type === 'withdrawal';
          const c = isHijack ? T.red : isWithdraw ? T.amber : '#7cb6ff';
          const tag = isHijack ? '⚠ HIJACK' : isWithdraw ? 'WITHDRAW' : 'UPDATE';
          const t = new Date(e.timestamp * 1000).toLocaleTimeString('nb-NO',
            { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '90px 110px 1.4fr 1.6fr 130px',
              padding: '9px 22px', fontSize: 12, alignItems: 'center',
              borderBottom: `1px solid ${T.border}`,
              background: isHijack ? `${T.red}10` : 'transparent',
              borderLeft: isHijack ? `2px solid ${T.red}` : '2px solid transparent',
              marginLeft: isHijack ? -2 : 0,
            }}>
              <span style={{ fontFamily: mono, color: T.dim, fontVariantNumeric: 'tabular-nums' }}>{t}</span>
              <span style={{
                fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: 1, color: c,
                padding: '2px 7px', background: `${c}1c`, borderRadius: 3, justifySelf: 'start',
              }}>{tag}</span>
              <span style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <span style={{ fontFamily: mono, color: T.text, fontWeight: 500 }}>{e.prefix}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: T.dim }}>AS{e.matched_no_asns[0]}</span>
                <span style={{ fontSize: 11, color: T.dim, fontStyle: 'italic' }}>{e.asn_name}</span>
              </span>
              <span style={{ fontFamily: mono, fontSize: 11, color: T.dim }}>
                {e.as_path.map(asn => `AS${asn}`).join(' → ')}
              </span>
              <span style={{ textAlign: 'right', fontFamily: mono, fontSize: 11, color: T.dim }}>
                AS{e.peer_asn}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.CBgpPage = CBgpPage;
