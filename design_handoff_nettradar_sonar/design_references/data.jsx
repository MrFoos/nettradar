// Mock-data matchet mot nettradar's faktiske bakend (models.py + peeringdb.py).
// Felter speiler ekte struktur: event_type, matched_no_asns, hijacker_asn,
// victim_asn, attack_timeseries (L7 + L3), attack_origins (country_code).

// Faktisk FALLBACK_NO_ASNS-liste fra backend/peeringdb.py
const NO_ASNS = {
  2119: 'Telenor Norge',
  16175: 'Lyse Tele',
  12929: 'BaneTele',
  8222: 'Altibox',
  29695: 'Ice.net',
  2116: 'UNINETT',
  39029: 'NextGenTel',
  31027: 'GreenHost',
  44543: 'Broadnet',
  43996: 'Ventelo',
  198144: 'Eidsiva Nett',
  56655: 'TDC Norge',
  20834: 'Catchcom',
};
const NO_ASN_ENTRIES = Object.entries(NO_ASNS).map(([k, v]) => ({ asn: +k, name: v }));

const PREFIXES = [
  '193.213.0.0/16',  '158.36.0.0/16',  '128.39.0.0/16',  '193.69.0.0/16',
  '85.221.0.0/16',   '109.74.180.0/22','178.255.144.0/20','195.18.0.0/16',
  '2a02:c0:0::/29',  '2001:700::/32',  '2a01:798::/32',
];

// BGP-hendelser i ekte form
// { event_type: 'announcement'|'withdrawal'|'hijack',
//   prefix, as_path, peer_asn, timestamp (sec), asn_name, matched_no_asns }
function makeBGPEvent(secondsAgo, opts = {}) {
  const kinds = ['announcement', 'announcement', 'announcement', 'withdrawal', 'hijack'];
  const event_type = opts.event_type || kinds[Math.floor(Math.random() * kinds.length)];
  const a = opts.no_asn || NO_ASN_ENTRIES[Math.floor(Math.random() * NO_ASN_ENTRIES.length)];
  const prefix = opts.prefix || PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const transits = [3356, 1299, 6939, 174, 2914, 6453];
  const len = 2 + Math.floor(Math.random() * 4);
  const as_path = [];
  for (let i = 0; i < len; i++) as_path.push(transits[Math.floor(Math.random() * transits.length)]);
  as_path.push(a.asn);
  return {
    timestamp: (Date.now() - secondsAgo * 1000) / 1000,
    event_type,
    prefix,
    as_path,
    peer_asn: transits[0],
    asn_name: a.name,
    matched_no_asns: [a.asn],
  };
}

// Pregenererte hendelser
const INITIAL_BGP_EVENTS = (() => {
  const seed = [];
  // Hijack-scenario: russisk AS annonserer Altibox-prefiks
  seed.push({
    timestamp: (Date.now() - 4 * 60 * 1000) / 1000,
    event_type: 'hijack',
    prefix: '109.74.180.0/22',
    as_path: [199524, 8222],
    peer_asn: 3356,
    asn_name: 'Altibox',
    matched_no_asns: [8222],
  });
  seed.push({
    timestamp: (Date.now() - 12 * 60 * 1000) / 1000,
    event_type: 'hijack',
    prefix: '193.213.0.0/16',
    as_path: [202425, 2119],
    peer_asn: 1299,
    asn_name: 'Telenor Norge',
    matched_no_asns: [2119],
  });
  // En del normale events
  for (let i = 0; i < 80; i++) seed.push(makeBGPEvent(15 + i * 9));
  return seed.sort((a, b) => b.timestamp - a.timestamp);
})();

// Cloudflare hijack alerts
const HIJACK_ALERTS = [
  { prefix: '109.74.180.0/22', hijacker_asn: 199524, victim_asn: 8222,
    detected_at: new Date(Date.now() - 4*60*1000).toISOString(),
    hijacker_name: 'OOO Network Solutions (RU)', victim_name: 'Altibox' },
  { prefix: '85.221.0.0/16', hijacker_asn: 9009, victim_asn: 39029,
    detected_at: new Date(Date.now() - 38*60*1000).toISOString(),
    hijacker_name: 'M247 Ltd (RO)', victim_name: 'NextGenTel' },
];

const ROUTE_LEAKS = [
  { prefix: '128.39.0.0/16', leak_asn: 6939, origin_asn: 2116, peer_asn: 1299,
    detected_at: new Date(Date.now() - 9*60*1000).toISOString(),
    leak_name: 'Hurricane Electric', origin_name: 'UNINETT' },
];

// Cloudflare attack timeseries — siste 24 timer, normalisert 0..1
function genTimeseries(peak1Hour, peak1Val, peak2Hour, peak2Val, base = 0.1) {
  const out = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);
  for (let h = -23; h <= 0; h++) {
    const t = new Date(now.getTime() + h * 3600 * 1000);
    let v = base + Math.random() * 0.05;
    v += peak1Val * Math.exp(-Math.pow((h - peak1Hour) / 2.5, 2));
    v += peak2Val * Math.exp(-Math.pow((h - peak2Hour) / 3.5, 2));
    out.push({ timestamp: t.toISOString(), value: Math.min(1, v) });
  }
  return out;
}
const ATTACK_TIMESERIES_L7 = genTimeseries(-3, 0.72, -14, 0.45);
const ATTACK_TIMESERIES_L3 = genTimeseries(-3, 0.91, -8, 0.38);

const ATTACK_BASELINE_24H = 0.32;
const CURRENT_ATTACK_INTENSITY = 0.51;

const ATTACK_ORIGINS = [
  { country_code: 'RU', country_name: 'Russland',       percentage: 28.4 },
  { country_code: 'CN', country_name: 'Kina',           percentage: 18.2 },
  { country_code: 'US', country_name: 'USA',            percentage: 12.7 },
  { country_code: 'IR', country_name: 'Iran',           percentage:  8.9 },
  { country_code: 'NL', country_name: 'Nederland',      percentage:  6.5 },
  { country_code: 'BR', country_name: 'Brasil',         percentage:  5.1 },
  { country_code: 'DE', country_name: 'Tyskland',       percentage:  4.3 },
  { country_code: 'KP', country_name: 'Nord-Korea',     percentage:  3.8 },
  { country_code: 'IN', country_name: 'India',          percentage:  2.9 },
  { country_code: 'VN', country_name: 'Vietnam',        percentage:  2.2 },
];

const ATTACK_AS_ORIGINS = [
  { as_number: 199524, as_name: 'OOO Network Solutions', percentage: 14.2 },
  { as_number: 9009,   as_name: 'M247 Ltd',              percentage: 11.8 },
  { as_number: 4134,   as_name: 'China Telecom',         percentage:  9.4 },
  { as_number: 14061,  as_name: 'DigitalOcean',          percentage:  7.6 },
  { as_number: 16509,  as_name: 'Amazon AWS',            percentage:  6.1 },
  { as_number: 31898,  as_name: 'Oracle Cloud',          percentage:  5.3 },
  { as_number: 8075,   as_name: 'Microsoft Azure',       percentage:  4.7 },
  { as_number: 24940,  as_name: 'Hetzner Online',        percentage:  4.1 },
];

// Per-ASN stats (for BGP-aktivitet sammendrag)
const ASN_STATS = [
  { asn: 2119,   name: 'Telenor Norge',  updates: 1842, withdraws: 23, hijacks: 1 },
  { asn: 8222,   name: 'Altibox',        updates: 1247, withdraws: 19, hijacks: 1 },
  { asn: 29695,  name: 'Ice.net',        updates:  893, withdraws:  8, hijacks: 0 },
  { asn: 39029,  name: 'NextGenTel',     updates:  712, withdraws: 11, hijacks: 0 },
  { asn: 2116,   name: 'UNINETT',        updates:  583, withdraws:  4, hijacks: 0 },
  { asn: 16175,  name: 'Lyse Tele',      updates:  421, withdraws:  6, hijacks: 0 },
  { asn: 44543,  name: 'Broadnet',       updates:  389, withdraws:  3, hijacks: 0 },
  { asn: 12929,  name: 'BaneTele',       updates:  267, withdraws:  2, hijacks: 0 },
  { asn: 20834,  name: 'Catchcom',       updates:  198, withdraws:  1, hijacks: 0 },
  { asn: 198144, name: 'Eidsiva Nett',   updates:  142, withdraws:  0, hijacks: 0 },
  { asn: 56655,  name: 'TDC Norge',      updates:  108, withdraws:  2, hijacks: 0 },
  { asn: 31027,  name: 'GreenHost',      updates:   67, withdraws:  0, hijacks: 0 },
];

// Topp-stats
const TOP_STATS = {
  events_per_minute: 142,
  no_asns_count: Object.keys(NO_ASNS).length,
  active_alerts: HIJACK_ALERTS.length + ROUTE_LEAKS.length,
};

const CITIES = [
  { name: 'Oslo',        lat: 59.91, lon: 10.75 },
  { name: 'Bergen',      lat: 60.39, lon:  5.32 },
  { name: 'Trondheim',   lat: 63.43, lon: 10.39 },
  { name: 'Stavanger',   lat: 58.97, lon:  5.73 },
  { name: 'Tromsø',      lat: 69.65, lon: 18.96 },
  { name: 'Kristiansand',lat: 58.16, lon:  8.00 },
  { name: 'Bodø',        lat: 67.28, lon: 14.40 },
];

// Iso country code → emoji flag
function countryFlag(code) {
  return [...code.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
}

Object.assign(window, {
  NO_ASNS, NO_ASN_ENTRIES, PREFIXES, CITIES,
  INITIAL_BGP_EVENTS, HIJACK_ALERTS, ROUTE_LEAKS,
  ATTACK_TIMESERIES_L7, ATTACK_TIMESERIES_L3,
  ATTACK_BASELINE_24H, CURRENT_ATTACK_INTENSITY,
  ATTACK_ORIGINS, ATTACK_AS_ORIGINS, ASN_STATS, TOP_STATS,
  makeBGPEvent, countryFlag,
});
