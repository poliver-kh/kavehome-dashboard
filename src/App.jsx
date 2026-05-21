import { useState, useEffect, useCallback, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./index.css";

const SUPABASE_URL = "https://lgkotzadckfisvvoaiht.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxna290emFkY2tmaXN2dm9haWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNjQwMTEsImV4cCI6MjA5NDk0MDAxMX0.SgYOi-9kHjM1VHNWG2eMQcah4-ZoocmLhvmzftTYHaI";
const AUTH_USER   = "mktperformance";
const AUTH_PASS   = "KaveHomePRF2026!";
const AUTH_KEY    = "kh_auth";

// ── COLORS ────────────────────────────────────────────────────────────────────
const C = {
  bg:      "#0a0b08",
  surface: "rgba(242,241,231,0.03)",
  border:  "rgba(242,241,231,0.08)",
  cream:   "#F2F1E7",
  sand:    "#DAD4C7",
  taupe:   "#BDAFA0",
  rust:    "#A9431E",
  rustL:   "#c4511f",
  white:   "#FFFFFF",
  dim:     "rgba(242,241,231,0.35)",
  dimmer:  "rgba(242,241,231,0.15)",
};

async function supabaseQuery(table, params = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set("select", params.select || "*");
  if (params.gte) Object.entries(params.gte).forEach(([k, v]) => url.searchParams.append(k, `gte.${v}`));
  if (params.lte) Object.entries(params.lte).forEach(([k, v]) => url.searchParams.append(k, `lte.${v}`));
  if (params.in)  Object.entries(params.in).forEach(([k, v])  => url.searchParams.append(k, `in.(${v.join(",")})`));
  url.searchParams.set("limit", params.limit || 50000);
  const res = await fetch(url.toString(), {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const DATE_PRESETS = [
  { label: "Yesterday", value: "yesterday", days: 1   },
  { label: "Last 7d",   value: "7d",        days: 7   },
  { label: "Last 14d",  value: "14d",       days: 14  },
  { label: "Last 30d",  value: "30d",       days: 30  },
  { label: "Last 90d",  value: "90d",       days: 90  },
  { label: "This year", value: "ytd",       days: null },
];

function getDateRange(preset) {
  const now = new Date();
  const pad = d => d.toISOString().split("T")[0];
  if (preset === "yesterday") { const d = new Date(now - 86400000); return { start: pad(d), end: pad(d) }; }
  if (preset === "ytd") return { start: `${now.getFullYear()}-01-01`, end: pad(now) };
  const p = DATE_PRESETS.find(d => d.value === preset);
  return { start: pad(new Date(now - (p?.days || 30) * 86400000)), end: pad(now) };
}

const safe = (n, d = 0) => (isNaN(n) || !isFinite(n) ? d : +n || d);

function calcMetrics(rows) {
  const s = rows.reduce((a, r) => {
    a.cost            += safe(r.cost);
    a.impressions     += safe(r.impressions);
    a.reach           += safe(r.reach);
    a.outbound_clicks += safe(r.outbound_clicks);
    a.vc              += safe(r.view_content);
    a.atc             += safe(r.add_to_cart);
    a.purchases       += safe(r.purchases);
    a.revenue         += safe(r.purchase_value);
    return a;
  }, { cost:0, impressions:0, reach:0, outbound_clicks:0, vc:0, atc:0, purchases:0, revenue:0 });
  return {
    ...s,
    roas:          safe(s.revenue / s.cost,              0),
    aov:           safe(s.revenue / s.purchases,         0),
    cpa:           safe(s.cost    / s.purchases,         0),
    cpc:           safe(s.cost    / s.outbound_clicks,   0),
    cpm:           safe((s.cost   / s.impressions)*1000, 0),
    ctr:           safe(s.outbound_clicks / s.impressions, 0),
    cvr:           safe(s.purchases / s.outbound_clicks, 0),
    vc_rate:       safe(s.vc  / s.outbound_clicks,       0),
    atc_rate:      safe(s.atc / s.outbound_clicks,       0),
    cost_per_vc:   safe(s.cost / s.vc,                   0),
    cost_per_atc:  safe(s.cost / s.atc,                  0),
    checkout_rate: safe(s.purchases / s.atc,             0),
  };
}

function fmt(n, type = "num") {
  if (n === null || n === undefined || isNaN(n) || !isFinite(n)) return "—";
  const v = +n;
  if (type === "eur") return v >= 1000 ? `€${(v/1000).toFixed(1)}k` : `€${v.toFixed(0)}`;
  if (type === "pct") return `${(v*100).toFixed(2)}%`;
  if (type === "x")   return `${v.toFixed(2)}x`;
  if (v >= 1000000)   return `${(v/1000000).toFixed(1)}M`;
  if (v >= 1000)      return `${(v/1000).toFixed(1)}K`;
  return v.toLocaleString();
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [user, setUser]   = useState("");
  const [pass, setPass]   = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleLogin = () => {
    if (user === AUTH_USER && pass === AUTH_PASS) {
      sessionStorage.setItem(AUTH_KEY, "1");
      onLogin();
    } else {
      setError(true); setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ animation: shake ? "shake 0.4s ease" : "none", width: 380, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "44px 40px" }}>
        <img src="/logo.svg" alt="Kave Home" style={{ height: 28, marginBottom: 36, opacity: 0.9 }} />
        <div style={{ fontSize: 11, color: C.taupe, textTransform: "uppercase", letterSpacing: 3, fontWeight: 600, marginBottom: 28 }}>Performance Dashboard</div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.taupe, textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 6 }}>Usuario</div>
          <input value={user} onChange={e => { setUser(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: `1px solid ${error ? C.rust : C.border}`, borderRadius: 8, color: C.cream, padding: "11px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
            placeholder="usuario" autoComplete="username" />
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.taupe, textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 6 }}>Contraseña</div>
          <input type="password" value={pass} onChange={e => { setPass(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: `1px solid ${error ? C.rust : C.border}`, borderRadius: 8, color: C.cream, padding: "11px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
            placeholder="••••••••••••" autoComplete="current-password" />
        </div>
        {error && <div style={{ fontSize: 12, color: C.rust, marginBottom: 16, textAlign: "center" }}>Usuario o contraseña incorrectos</div>}
        <button onClick={handleLogin} style={{ width: "100%", background: C.rust, border: "none", borderRadius: 8, color: C.white, padding: "13px", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 2, textTransform: "uppercase", fontFamily: "inherit", transition: "background 0.15s" }}
          onMouseEnter={e => e.target.style.background = C.rustL}
          onMouseLeave={e => e.target.style.background = C.rust}>
          Acceder
        </button>
      </div>
    </div>
  );
}

// ── FILTER PILL ───────────────────────────────────────────────────────────────
function FilterPill({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const isAll = selected.length === 0;
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: isAll ? C.surface : `rgba(169,67,30,0.12)`,
        border: `1px solid ${isAll ? C.border : "rgba(169,67,30,0.35)"}`,
        borderRadius: 6, color: isAll ? C.taupe : C.rust,
        padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", fontFamily: "inherit",
      }}>
        {label}{!isAll && ` (${selected.length})`}
        <span style={{ fontSize: 8, opacity: 0.5 }}>▼</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 190, background: "#111209", border: `1px solid ${C.border}`, borderRadius: 10, zIndex: 200, boxShadow: "0 20px 60px rgba(0,0,0,0.8)", maxHeight: 260, overflowY: "auto" }}>
          <div onClick={() => { onChange([]); setOpen(false); }} style={{ padding: "9px 14px", fontSize: 12, cursor: "pointer", color: isAll ? C.rust : C.taupe, borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontFamily: "inherit" }}>All</div>
          {options.map(opt => {
            const sel = selected.includes(opt);
            return (
              <div key={opt} onClick={() => onChange(sel ? selected.filter(v => v !== opt) : [...selected, opt])} style={{ padding: "8px 14px", fontSize: 12, cursor: "pointer", color: sel ? C.cream : C.taupe, background: sel ? "rgba(169,67,30,0.08)" : "transparent", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit" }}>
                {opt} {sel && <span style={{ color: C.rust, fontSize: 10 }}>✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── KPI CARD ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, accent = C.rust, small }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: small ? "14px 16px" : "20px 22px", borderTop: `2px solid ${accent}`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", bottom: -16, right: -16, width: 60, height: 60, background: accent, opacity: 0.06, borderRadius: "50%" }} />
      <div style={{ fontSize: 9, color: C.taupe, textTransform: "uppercase", letterSpacing: 2.5, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: small ? 17 : 24, fontWeight: 700, color: C.cream, letterSpacing: -0.5 }}>{value}</div>
    </div>
  );
}

// ── FUNNEL BAR ────────────────────────────────────────────────────────────────
function FunnelBar({ label, value, max, color }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
      <div style={{ width: 130, fontSize: 11, color: C.taupe, textAlign: "right", flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, background: "rgba(242,241,231,0.04)", borderRadius: 3, height: 28, position: "relative", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.7s ease" }} />
        <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 700, color: C.white }}>{fmt(value)}</div>
      </div>
      <div style={{ width: 48, fontSize: 11, color: C.taupe, textAlign: "right" }}>{pct.toFixed(1)}%</div>
    </div>
  );
}

// ── CHART TOOLTIP ─────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0d0e0b", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 11, fontFamily: "inherit" }}>
      <div style={{ color: C.taupe, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <span style={{ color: C.cream, fontWeight: 700 }}>
            {p.name === "ROAS" ? fmt(p.value, "x") : fmt(p.value, "eur")}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── TABLE COLS ────────────────────────────────────────────────────────────────
const TABLE_COLS = [
  { k: "name",         l: "Name",      fmt: v => v,               align: "left"  },
  { k: "cost",         l: "Spend",     fmt: v => fmt(v, "eur"),   align: "right" },
  { k: "revenue",      l: "Revenue",   fmt: v => fmt(v, "eur"),   align: "right" },
  { k: "roas",         l: "ROAS",      fmt: v => fmt(v, "x"),     align: "right" },
  { k: "purchases",    l: "Purchases", fmt: v => fmt(v),          align: "right" },
  { k: "aov",          l: "AOV",       fmt: v => fmt(v, "eur"),   align: "right" },
  { k: "cpa",          l: "CPA",       fmt: v => fmt(v, "eur"),   align: "right" },
  { k: "cvr",          l: "CVR",       fmt: v => fmt(v, "pct"),   align: "right" },
  { k: "ctr",          l: "CTR",       fmt: v => fmt(v, "pct"),   align: "right" },
  { k: "cpc",          l: "CPC",       fmt: v => fmt(v, "eur"),   align: "right" },
  { k: "cpm",          l: "CPM",       fmt: v => fmt(v, "eur"),   align: "right" },
  { k: "impressions",  l: "Impr.",     fmt: v => fmt(v),          align: "right" },
  { k: "vc",           l: "VC",        fmt: v => fmt(v),          align: "right" },
  { k: "vc_rate",      l: "VC Rate",   fmt: v => fmt(v, "pct"),   align: "right" },
  { k: "cost_per_vc",  l: "Cost/VC",   fmt: v => fmt(v, "eur"),   align: "right" },
  { k: "atc",          l: "ATC",       fmt: v => fmt(v),          align: "right" },
  { k: "atc_rate",     l: "ATC Rate",  fmt: v => fmt(v, "pct"),   align: "right" },
  { k: "cost_per_atc", l: "Cost/ATC",  fmt: v => fmt(v, "eur"),   align: "right" },
];

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const [datePreset, setDatePreset] = useState("30d");
  const [fPlatform, setFPlatform]   = useState([]);
  const [fCountry, setFCountry]     = useState([]);
  const [fCampaign, setFCampaign]   = useState([]);
  const [data, setData]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState("overview");
  const [sortCol, setSortCol]       = useState("cost");
  const [sortDir, setSortDir]       = useState("desc");
  const [groupBy, setGroupBy]       = useState("campaign_name");
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { start, end } = getDateRange(datePreset);
      const cols = "date,platform,country,campaign_name,adset_name,ad_name,impressions,cost,reach,outbound_clicks,view_content,add_to_cart,purchases,purchase_value";
      const url = new URL(`${SUPABASE_URL}/rest/v1/campaigns`);
      url.searchParams.set("select", cols);
      url.searchParams.append("date", `gte.${start}`);
      url.searchParams.append("date", `lte.${end}`);
      if (fPlatform.length) url.searchParams.append("platform", `in.(${fPlatform.join(",")})`);
      if (fCountry.length)  url.searchParams.append("country",  `in.(${fCountry.join(",")})`);
      if (fCampaign.length) url.searchParams.append("campaign_name", `in.(${fCampaign.map(c => `"${c}"`).join(",")})`);
      url.searchParams.set("limit", "50000");
      const res = await fetch(url.toString(), { headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` } });
      if (!res.ok) throw new Error(await res.text());
      const rows = await res.json();
      setData(rows || []);
      setLastUpdate(new Date());
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [datePreset, fPlatform, fCountry, fCampaign]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allPlatforms = useMemo(() => [...new Set(data.map(r => r.platform).filter(Boolean))].sort(), [data]);
  const allCountries = useMemo(() => [...new Set(data.map(r => r.country).filter(Boolean))].sort(), [data]);
  const allCampaigns = useMemo(() => [...new Set(data.map(r => r.campaign_name).filter(Boolean))].sort(), [data]);
  const kpis         = useMemo(() => calcMetrics(data), [data]);

  const trendData = useMemo(() => {
    const byDate = {};
    data.forEach(r => {
      const d = r.date;
      if (!byDate[d]) byDate[d] = { date: d, cost: 0, revenue: 0 };
      byDate[d].cost    += safe(r.cost);
      byDate[d].revenue += safe(r.purchase_value);
    });
    return Object.values(byDate).sort((a, b) => a.date > b.date ? 1 : -1).map(d => ({ ...d, roas: safe(d.revenue / d.cost, 0) }));
  }, [data]);

  const tableData = useMemo(() => {
    const grouped = {};
    data.forEach(r => {
      const key = r[groupBy] || "Unknown";
      if (!grouped[key]) grouped[key] = { name: key, rows: [] };
      grouped[key].rows.push(r);
    });
    return Object.values(grouped).map(g => ({ name: g.name, ...calcMetrics(g.rows) }))
      .sort((a, b) => sortDir === "desc" ? b[sortCol] - a[sortCol] : a[sortCol] - b[sortCol]);
  }, [data, groupBy, sortCol, sortDir]);

  const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "22px 24px" };
  const cardTitle = { fontSize: 9, color: C.taupe, textTransform: "uppercase", letterSpacing: 2.5, fontWeight: 600, marginBottom: 18 };

  const PLATFORM_COLORS = { "Meta Ads": "#1877F2", "Pinterest Ads": "#E60023" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.cream }}>

      {/* HEADER */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, background: "rgba(10,11,8,0.96)", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img src="/logo.svg" alt="Kave Home" style={{ height: 22, opacity: 0.9 }} />
          <div style={{ width: 1, height: 20, background: C.border }} />
          <span style={{ fontSize: 11, color: C.taupe, letterSpacing: 2, textTransform: "uppercase", fontWeight: 500 }}>Performance Dashboard</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {lastUpdate && <span style={{ fontSize: 10, color: C.dimmer }}>Updated {lastUpdate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>}
          {loading    && <span style={{ fontSize: 10, color: C.rust }}>● LOADING</span>}
          <button onClick={fetchData} disabled={loading} style={{ background: `rgba(169,67,30,0.1)`, border: `1px solid rgba(169,67,30,0.25)`, borderRadius: 6, color: C.rust, padding: "5px 14px", fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "inherit" }}>Refresh</button>
        </div>
      </div>

      <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* FILTERS */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 2, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3 }}>
            {DATE_PRESETS.map(p => (
              <button key={p.value} onClick={() => setDatePreset(p.value)} style={{ padding: "5px 10px", borderRadius: 5, border: "none", fontSize: 11, fontWeight: datePreset === p.value ? 700 : 500, cursor: "pointer", background: datePreset === p.value ? C.rust : "transparent", color: datePreset === p.value ? C.white : C.taupe, transition: "all 0.12s", fontFamily: "inherit" }}>{p.label}</button>
            ))}
          </div>
          <div style={{ width: 1, height: 22, background: C.border }} />
          <FilterPill label="Platform" options={allPlatforms} selected={fPlatform} onChange={setFPlatform} />
          <FilterPill label="Country"  options={allCountries} selected={fCountry}  onChange={setFCountry}  />
          <FilterPill label="Campaign" options={allCampaigns} selected={fCampaign} onChange={setFCampaign} />
          <span style={{ marginLeft: "auto", fontSize: 10, color: C.dimmer }}>{data.length.toLocaleString()} rows</span>
        </div>

        {error && <div style={{ background: "rgba(169,67,30,0.08)", border: `1px solid rgba(169,67,30,0.25)`, borderRadius: 8, padding: "10px 16px", fontSize: 12, color: C.rust }}>⚠ {error}</div>}

        {/* PRIMARY KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <KpiCard label="Revenue"   value={fmt(kpis.revenue,   "eur")} accent="#4a7c59" />
          <KpiCard label="Ad Spend"  value={fmt(kpis.cost,      "eur")} accent={C.rust}  />
          <KpiCard label="ROAS"      value={fmt(kpis.roas,      "x"  )} accent={C.taupe} />
          <KpiCard label="Purchases" value={fmt(kpis.purchases       )} accent={C.sand}  />
        </div>

        {/* SECONDARY KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 10 }}>
          <KpiCard label="AOV"       value={fmt(kpis.aov,          "eur")} accent={C.dimmer} small />
          <KpiCard label="CPA"       value={fmt(kpis.cpa,          "eur")} accent={C.dimmer} small />
          <KpiCard label="CVR"       value={fmt(kpis.cvr,          "pct")} accent={C.dimmer} small />
          <KpiCard label="CPC"       value={fmt(kpis.cpc,          "eur")} accent={C.dimmer} small />
          <KpiCard label="CPM"       value={fmt(kpis.cpm,          "eur")} accent={C.dimmer} small />
          <KpiCard label="CTR"       value={fmt(kpis.ctr,          "pct")} accent={C.dimmer} small />
          <KpiCard label="Cost/VC"   value={fmt(kpis.cost_per_vc,  "eur")} accent={C.dimmer} small />
          <KpiCard label="Cost/ATC"  value={fmt(kpis.cost_per_atc, "eur")} accent={C.dimmer} small />
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}` }}>
          {["overview", "performance", "funnel"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "9px 20px", background: "transparent", border: "none", borderBottom: `2px solid ${activeTab === t ? C.rust : "transparent"}`, color: activeTab === t ? C.cream : C.taupe, fontSize: 10, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: -1, transition: "all 0.12s", fontFamily: "inherit" }}>{t}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={card}>
              <div style={cardTitle}>Revenue vs Spend · Daily</div>
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,241,231,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: C.taupe, fontSize: 10, fontFamily: "inherit" }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="l" tick={{ fill: C.taupe, fontSize: 10, fontFamily: "inherit" }} tickLine={false} axisLine={false} tickFormatter={v => "€" + fmt(v)} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fill: C.taupe, fontSize: 10, fontFamily: "inherit" }} tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(1) + "x"} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line yAxisId="l" type="monotone" dataKey="revenue" stroke="#4a7c59" strokeWidth={2} dot={false} name="Revenue" />
                  <Line yAxisId="l" type="monotone" dataKey="cost"    stroke={C.rust}  strokeWidth={2} dot={false} name="Spend" strokeDasharray="5 3" />
                  <Line yAxisId="r" type="monotone" dataKey="roas"    stroke={C.taupe} strokeWidth={1.5} dot={false} name="ROAS" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {["Meta Ads", "Pinterest Ads"].map(platform => {
                const m = calcMetrics(data.filter(r => r.platform === platform));
                const color = PLATFORM_COLORS[platform];
                return (
                  <div key={platform} style={card}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                      <div style={cardTitle}>{platform}</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                      {[
                        { l: "Spend",     v: fmt(m.cost,      "eur") },
                        { l: "Revenue",   v: fmt(m.revenue,   "eur") },
                        { l: "ROAS",      v: fmt(m.roas,      "x"  ) },
                        { l: "Purchases", v: fmt(m.purchases        ) },
                        { l: "CPA",       v: fmt(m.cpa,       "eur") },
                        { l: "AOV",       v: fmt(m.aov,       "eur") },
                      ].map(item => (
                        <div key={item.l}>
                          <div style={{ fontSize: 9, color: C.taupe, textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 5 }}>{item.l}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: C.cream }}>{item.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PERFORMANCE */}
        {activeTab === "performance" && (
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={cardTitle}>Breakdown</div>
              <div style={{ display: "flex", gap: 4 }}>
                {[
                  { l: "Campaign", v: "campaign_name" },
                  { l: "Country",  v: "country"       },
                  { l: "Platform", v: "platform"      },
                  { l: "Ad Set",   v: "adset_name"    },
                  { l: "Ad",       v: "ad_name"       },
                ].map(g => (
                  <button key={g.v} onClick={() => setGroupBy(g.v)} style={{ padding: "4px 10px", borderRadius: 5, border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer", background: groupBy === g.v ? C.rust : C.surface, color: groupBy === g.v ? C.white : C.taupe, fontFamily: "inherit", letterSpacing: 0.5 }}>{g.l}</button>
                ))}
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr>
                    {TABLE_COLS.map(col => (
                      <th key={col.k} onClick={() => col.k !== "name" && (sortCol === col.k ? setSortDir(d => d === "desc" ? "asc" : "desc") : (setSortCol(col.k), setSortDir("desc")))}
                        style={{ padding: "8px 10px", textAlign: col.align, color: sortCol === col.k ? C.cream : C.taupe, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, borderBottom: `1px solid ${C.border}`, cursor: col.k !== "name" ? "pointer" : "default", whiteSpace: "nowrap", userSelect: "none", fontFamily: "inherit" }}>
                        {col.l}{sortCol === col.k ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.slice(0, 100).map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid rgba(242,241,231,0.03)`, background: i % 2 === 0 ? "transparent" : "rgba(242,241,231,0.01)" }}>
                      {TABLE_COLS.map(col => (
                        <td key={col.k} style={{ padding: "8px 10px", textAlign: col.align, color: col.k === "name" ? C.sand : C.taupe, maxWidth: col.k === "name" ? 200 : "auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                          {col.fmt(row[col.k])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {tableData.length > 100 && <div style={{ textAlign: "center", padding: "12px", fontSize: 11, color: C.taupe }}>Showing 100 of {tableData.length} rows</div>}
            </div>
          </div>
        )}

        {/* FUNNEL */}
        {activeTab === "funnel" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={card}>
              <div style={cardTitle}>Conversion Funnel</div>
              <FunnelBar label="Impressions"     value={kpis.impressions}     max={kpis.impressions}  color={`rgba(189,175,160,0.4)`} />
              <FunnelBar label="Reach"           value={kpis.reach}           max={kpis.impressions}  color={`rgba(189,175,160,0.35)`} />
              <FunnelBar label="Outbound Clicks" value={kpis.outbound_clicks} max={kpis.impressions}  color={`rgba(218,212,199,0.5)`} />
              <FunnelBar label="View Content"    value={kpis.vc}              max={kpis.impressions}  color={`rgba(242,241,231,0.5)`} />
              <FunnelBar label="ATC"             value={kpis.atc}             max={kpis.impressions}  color={`rgba(169,67,30,0.6)`}  />
              <FunnelBar label="Purchases"       value={kpis.purchases}       max={kpis.impressions}  color={C.rust}                 />
            </div>
            <div style={card}>
              <div style={cardTitle}>Step Rates</div>
              {[
                { label: "CTR",           value: fmt(kpis.ctr,           "pct"), sub: "Outbound Clicks / Impressions" },
                { label: "VC Rate",       value: fmt(kpis.vc_rate,       "pct"), sub: "VC / Outbound Clicks"          },
                { label: "ATC Rate",      value: fmt(kpis.atc_rate,      "pct"), sub: "ATC / Outbound Clicks"         },
                { label: "Checkout Rate", value: fmt(kpis.checkout_rate, "pct"), sub: "Purchases / ATC"               },
                { label: "CVR",           value: fmt(kpis.cvr,           "pct"), sub: "Purchases / Outbound Clicks"   },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: `1px solid rgba(242,241,231,0.04)` }}>
                  <div>
                    <div style={{ fontSize: 12, color: C.sand, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: C.taupe, marginTop: 2 }}>{item.sub}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.rust }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && data.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 14, color: C.taupe }}>No data for this period.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── APP (with auth) ───────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "1");
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;
  return <Dashboard />;
}
