import { useState, useEffect } from "react";

const METRICS = [
  {
    id: "scale",
    label: "Scale (EBITDA $)",
    category: "Financial",
    left: "<$0.5M",
    right: "$5M+",
    weight: 25,
    tip: "Scale is the single biggest driver of multiple expansion. Sub-$1M EBITDA limits your buyer universe to search funds; $3M+ opens the door to institutional PE.",
    displayValue: (v) => {
      const m = (v / 100) * 5;
      if (m >= 5) return "$5M+";
      if (m < 0.5) return `<$0.5M`;
      return `~$${m.toFixed(1)}M`;
    },
  },
  {
    id: "growth",
    label: "Revenue Growth",
    category: "Financial",
    left: "0%",
    right: "30%+",
    weight: 20,
    tip: "Consistent double-digit revenue growth signals strong demand and scalability to buyers.",
    displayValue: (v) => {
      const pct = Math.round((v / 100) * 30);
      if (pct >= 30) return "30%+";
      return `${pct}%`;
    },
  },
  {
    id: "ebitda",
    label: "EBITDA Margin",
    category: "Financial",
    left: "<5%",
    right: "35%+",
    weight: 18,
    tip: "Margins above 20% are the threshold where PE buyers get excited. Below that, you're leaving money on the table.",
    displayValue: (v) => {
      const pct = Math.round(5 + (v / 100) * 30);
      if (v <= 0) return "<5%";
      if (pct >= 35) return "35%+";
      return `${pct}%`;
    },
  },
  {
    id: "retention",
    label: "Retention (Gross & Net)",
    category: "Financial",
    left: "<70%",
    right: "90%+",
    weight: 15,
    tip: "Annual retention is Jan 1 customers who are still customers on Dec 31. Below 70% is a red flag; above 90% signals a sticky, recurring business.",
    displayValue: (v) => {
      const pct = Math.round(70 + (v / 100) * 20);
      if (v <= 0) return "<70%";
      if (pct >= 90) return "90%+";
      return `${pct}%`;
    },
  },
  {
    id: "concentration",
    label: "Customer Concentration (Top 10)",
    category: "Financial",
    left: "30%+ of revenue",
    right: "<5% of revenue",
    weight: 12,
    tip: "No single client should exceed 20% of revenue, and your top 10 combined should stay under 40%. High concentration is one of the most common reasons buyers discount or walk.",
    displayValue: (v) => {
      const pct = Math.round(30 - (v / 100) * 25);
      if (v <= 0) return "30%+";
      if (pct <= 5) return "<5%";
      return `~${pct}%`;
    },
  },
  {
    id: "founder",
    label: "Founder Dependence",
    category: "Commercial",
    left: "High",
    right: "Low",
    weight: 10,
    tip: "If the agency can't run without you, buyers discount heavily. Build a leadership team first.",
    displayValue: false,
  },
  {
    id: "verticals",
    label: "Verticals",
    category: "Commercial",
    left: "Diversified",
    right: "Specialized",
    weight: 8,
    tip: "Counterintuitively, deep specialization in 1–2 verticals commands a premium. Generalists compete on price.",
    displayValue: false,
  },
  {
    id: "standardization",
    label: "Standardization of Workflows & Processes",
    category: "Commercial",
    left: "Ad Hoc",
    right: "Fully Standardized",
    weight: 7,
    tip: "Documented, repeatable processes reduce key-person risk and make the business acquirable.",
    displayValue: false,
  },

  {
    id: "ai",
    label: "AI Story",
    category: "Commercial",
    left: "Uncertain",
    right: "Solidified",
    weight: 4,
    tip: "Buyers are asking about AI in every deal. A clear, credible AI strategy prevents a discount.",
    displayValue: false,
  },
];

const BENCHMARKS = [
  {
    id: "typical",
    label: "Typical Agency",
    description: "Most owner-operated agencies going to market",
    color: "#e07b39",
    fixedMultiple: 4.5,
    rangeLabel: "4x – 5x",
    scores: { scale: 25, growth: 40, ebitda: 45, retention: 40, concentration: 30, founder: 25, verticals: 50, standardization: 30, ai: 25 },
  },
  {
    id: "strong",
    label: "Strong Performer",
    description: "Top-quartile agency, PE-ready",
    color: "#c5a52a",
    fixedMultiple: 5.5,
    rangeLabel: "5x – 6x",
    scores: { scale: 60, growth: 70, ebitda: 70, retention: 68, concentration: 65, founder: 60, verticals: 72, standardization: 65, ai: 55 },
  },
  {
    id: "premium",
    label: "Premium Asset",
    description: "Best-in-class, multiple strategic bidders",
    color: "#2aaa8a",
    fixedMultiple: 7.5,
    rangeLabel: "7x – 8x",
    scores: { scale: 88, growth: 88, ebitda: 85, retention: 85, concentration: 85, founder: 82, verticals: 80, standardization: 82, ai: 78 },
  },
];

const CATEGORY_COLORS = { Financial: "#0e4f4f", Commercial: "#2aaa8a" };
const CATEGORY_BG = { Financial: "#e8f5f2", Commercial: "#f5fdfb" };

function getMultiple(score, scaleValue) {
  // Convert scaleValue (0-100) to EBITDA in $M (0-5M)
  const ebitda = (scaleValue / 100) * 5;

  // Base multiple from quality score
  let base;
  if (score <= 44) base = 3.0 + (score / 44) * 1.5;
  else if (score < 72)  base = 4.5 + ((score - 44) / 28) * 2.0;
  else if (score < 88)  base = 6.5 + ((score - 72) / 16) * 1.5;
  else base = Math.min(8.0 + ((score - 88) / 12) * 2.0, 10);

  // Scale caps and floors
  if (ebitda < 0.5) return Math.min(base, 2.9);           // Always sub-3x
  if (ebitda < 1.0) return Math.min(base, 4.5);           // Cap at 4.5x
  if (ebitda < 2.0) return Math.min(base, 6.0);           // Cap at 6x
  if (ebitda < 2.5) return Math.max(Math.min(base, 6.5), 5.0);  // 5x–6.5x range
  if (ebitda < 3.0) return Math.max(Math.min(base, 7.5), 6.0);  // 6x–7.5x range
  return Math.max(base, 6.5);                              // Always 6.5x+ above $3M
}

function getMultipleLabel(multiple) {
  if (multiple < 3)   return { label: "Sub-Scale",         range: "< 3x",   color: "#c0392b", bg: "#fdf0ee" };
  if (multiple < 4)   return { label: "Early Stage",      range: "3x – 4x", color: "#e07b39", bg: "#fff4ee" };
  if (multiple < 5)   return { label: "Emerging Asset",   range: "4x – 5x", color: "#c5a52a", bg: "#fffbee" };
  if (multiple < 6)   return { label: "Good Foundation",  range: "5x – 6x", color: "#7a9e30", bg: "#f6faea" };
  if (multiple < 7)   return { label: "Strong Asset",     range: "6x – 7x", color: "#2a8a5e", bg: "#f0faf6" };
  return                     { label: "Premium Asset",    range: "7x+",     color: "#0e4f4f", bg: "#e8f5f2" };
}

// Convert a multiple value back to a 0-100 bar position
function multipleToBarPct(m) {
  if (m <= 3) return 0;
  if (m <= 4.5) return ((m - 3) / 1.5) * 44;
  if (m <= 6.5) return 44 + ((m - 4.5) / 2) * 28;
  if (m <= 8) return 72 + ((m - 6.5) / 1.5) * 16;
  return Math.min(88 + ((m - 8) / 2) * 12, 100);
}

function calcScore(values, weights) {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  return METRICS.reduce((acc, m) => acc + ((values[m.id] || 0) * weights[m.id]) / totalWeight, 0);
}

function MetricSlider({ metric, value, onChange, visibleBenchmarks }) {
  const catColor = CATEGORY_COLORS[metric.category];
  const displayVal = metric.displayValue === false ? null : metric.displayValue ? metric.displayValue(value) : `${value}%`;

  return (
    <div
      style={{
        background: "white", borderRadius: 16, padding: "20px 24px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e8f0ee",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <span style={{
            display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: catColor, background: CATEGORY_BG[metric.category],
            borderRadius: 4, padding: "2px 8px", marginBottom: 6,
          }}>{metric.category}</span>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#1a2e2a", lineHeight: 1.3 }}>{metric.label}</div>
        </div>
        <div style={{
          fontFamily: "'DM Mono', monospace", fontWeight: 700, fontSize: 13,
          color: catColor, background: CATEGORY_BG[metric.category],
          padding: "4px 10px", borderRadius: 8, whiteSpace: "nowrap", marginLeft: 12,
          visibility: displayVal ? "visible" : "hidden",
        }}>{displayVal || ""}</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#7a9e98", marginBottom: 6, fontStyle: "italic" }}>
        <span>{metric.left}</span><span>{metric.right}</span>
      </div>

      {/* Track area */}
      <div style={{ position: "relative", marginBottom: visibleBenchmarks.length > 0 ? 24 : 4 }}>
        {/* Background track */}
        <div style={{ position: "relative", height: 8, background: "#e4efed", borderRadius: 99 }}>
          {/* Fill */}
          <div style={{
            position: "absolute", left: 0, top: 0, height: "100%", width: `${value}%`,
            background: `linear-gradient(90deg, ${catColor}55, ${catColor})`,
            borderRadius: 99, transition: "width 0.08s",
          }} />
          {/* Benchmark dots */}
          {visibleBenchmarks.map(b => (
            <div key={b.id} style={{
              position: "absolute", left: `${b.scores[metric.id]}%`, top: "50%",
              transform: "translate(-50%, -50%)",
              width: 13, height: 13, borderRadius: "50%",
              background: b.color, border: "2.5px solid white",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)", zIndex: 2,
            }} />
          ))}
          {/* User dot */}
          <div style={{
            position: "absolute", left: `${value}%`, top: "50%",
            transform: "translate(-50%, -50%)",
            width: 20, height: 20, borderRadius: "50%",
            background: catColor, border: "3px solid white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)", zIndex: 4,
            transition: "left 0.08s",
          }} />
        </div>

        {/* Benchmark labels */}
        {visibleBenchmarks.length > 0 && (
          <div style={{ position: "relative", height: 18, marginTop: 6 }}>
            {visibleBenchmarks.map(b => (
              <div key={b.id} style={{
                position: "absolute", left: `${b.scores[metric.id]}%`,
                transform: "translateX(-50%)",
                fontSize: 9, fontWeight: 700, color: b.color,
                whiteSpace: "nowrap", letterSpacing: "0.04em",
              }}>
                {b.label.split(" ")[0]}
              </div>
            ))}
          </div>
        )}

        {/* Invisible range input */}
        <input
          type="range" min={0} max={100} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: "absolute", top: 0, left: 0, width: "100%",
            opacity: 0, height: 32, cursor: "pointer", margin: 0, zIndex: 10,
          }}
        />
      </div>

      <div style={{
        fontSize: 12, color: "#7a9e98", lineHeight: 1.5,
        borderTop: "1px solid #f0f7f5", paddingTop: 10, marginTop: 4,
      }}>
        💡 {metric.tip}
      </div>
    </div>
  );
}

export default function App() {
  const [values, setValues] = useState(() => Object.fromEntries(METRICS.map(m => [m.id, 50])));
  const [weights, setWeights] = useState(() => Object.fromEntries(METRICS.map(m => [m.id, m.weight])));
  const [showWeights, setShowWeights] = useState(false);
  const [activeBenchmarks, setActiveBenchmarks] = useState(["typical", "premium"]);
  const [animScore, setAnimScore] = useState(50);

  const score = calcScore(values, weights);

  useEffect(() => {
    const diff = score - animScore;
    if (Math.abs(diff) < 0.2) return;
    const timer = setTimeout(() => setAnimScore(prev => prev + diff * 0.15), 16);
    return () => clearTimeout(timer);
  }, [score, animScore]);

  const multiple = getMultiple(animScore, values.scale);
  const { label, range, color, bg } = getMultipleLabel(multiple);
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const categories = [...new Set(METRICS.map(m => m.category))];
  const visibleBenchmarks = BENCHMARKS.filter(b => activeBenchmarks.includes(b.id));

  const benchmarkMultiples = BENCHMARKS.map(b => ({
    ...b,
    score: multipleToBarPct(b.fixedMultiple),
    multiple: b.fixedMultiple,
  }));

  const toggleBenchmark = (id) =>
    setActiveBenchmarks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5fdfb 0%, #e8f5f2 100%)", fontFamily: "'DM Sans', sans-serif", padding: "0 0 60px" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "#0e4f4f", color: "white", padding: "40px 40px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 80% 50%, #1a7a5e33 0%, transparent 60%), radial-gradient(circle at 20% 80%, #2aaa8a22 0%, transparent 50%)" }} />
        <div style={{ position: "relative", maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: "#7ecec0", marginBottom: 10, fontWeight: 600 }}>Digital Marketing Agency</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, margin: 0, lineHeight: 1.15, marginBottom: 12 }}>Valuation Builder</h1>
          <p style={{ color: "#a8d8d0", fontSize: 15, margin: 0, maxWidth: 500, lineHeight: 1.6 }}>Adjust each factor to explore how operational and financial decisions drive your agency's exit multiple.</p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "-30px auto 0", padding: "0 24px" }}>

        {/* Main score card */}
        <div style={{ background: "white", borderRadius: 20, padding: "28px 36px", boxShadow: "0 8px 40px rgba(14,79,79,0.15)", display: "flex", alignItems: "center", gap: 36, flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7a9e98", marginBottom: 8 }}>Your Exit Multiple</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 900, color, lineHeight: 1, marginBottom: 8 }}>
              {range}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color, background: bg, padding: "4px 14px", borderRadius: 999 }}>{label}</span>
            <div style={{ fontSize: 12, color: "#7a9e98", marginTop: 8 }}>EBITDA multiple range</div>
          </div>

          {/* Score bar */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#7a9e98", marginBottom: 5 }}>
              <span>3x</span><span>5x</span><span>6.5x</span><span>7x+</span>
            </div>
            <div style={{ position: "relative", height: 14, background: "#e8f0ee", borderRadius: 99 }}>
              <div style={{
                height: "100%", width: `${Math.min(animScore, 100)}%`,
                background: "linear-gradient(90deg, #f97316 0%, #eab308 35%, #2aaa8a 65%, #0e4f4f 100%)",
                borderRadius: 99, transition: "width 0.05s",
              }} />
              {/* Benchmark markers */}
              {benchmarkMultiples.filter(b => activeBenchmarks.includes(b.id)).map(b => (
                <div key={b.id} title={`${b.label}: ${b.multiple.toFixed(1)}x`} style={{
                  position: "absolute", left: `${Math.min(b.score, 99)}%`, top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 14, height: 14, borderRadius: "50%",
                  background: b.color, border: "2.5px solid white",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.25)", zIndex: 3,
                }} />
              ))}
              {/* User marker */}
              <div style={{
                position: "absolute", left: `${Math.min(animScore, 99)}%`, top: "50%",
                transform: "translate(-50%, -50%)",
                width: 22, height: 22, borderRadius: "50%",
                background: "#0e4f4f", border: "3px solid white",
                boxShadow: "0 2px 10px rgba(14,79,79,0.45)", zIndex: 4,
                transition: "left 0.05s",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#aac8c2", marginTop: 4 }}>
              <span>Subscale</span><span>Institutional Quality</span>
            </div>
          </div>

          <button onClick={() => setShowWeights(!showWeights)} style={{
            background: "transparent",
            color: showWeights ? "#7a9e98" : "#aac8c2",
            border: "1px solid #d0e8e4", borderRadius: 8,
            padding: "7px 14px", fontSize: 11, fontWeight: 600,
            cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s",
            letterSpacing: "0.04em",
          }}>
            {showWeights ? "✓ weights" : "⚖ weights"}
          </button>
        </div>

        {/* Weight editor */}
        {showWeights && (
          <div style={{ background: "#0e4f4f", borderRadius: 16, padding: "24px 28px", marginTop: 12, color: "white" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Factor Weights</div>
            <div style={{ fontSize: 12, color: "#7ecec0", marginBottom: 20 }}>Adjust how much each metric influences the overall score. Total: {totalWeight}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {METRICS.map(m => (
                <div key={m.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: "#a8d8d0" }}>{m.label}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: "#7ecec0" }}>{weights[m.id]}</span>
                  </div>
                  <input type="range" min={1} max={30} value={weights[m.id]}
                    onChange={e => setWeights(prev => ({ ...prev, [m.id]: Number(e.target.value) }))}
                    style={{ width: "100%", accentColor: "#2aaa8a" }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Benchmark card */}
        <div style={{ background: "white", borderRadius: 16, padding: "18px 24px", marginTop: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e8f0ee" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7a9e98" }}>Benchmarks</span>
            <span style={{ fontSize: 12, color: "#bcd4cf" }}>— toggle to compare where you stand vs. market</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {BENCHMARKS.map(b => {
              const bm = benchmarkMultiples.find(x => x.id === b.id);
              const active = activeBenchmarks.includes(b.id);
              return (
                <button key={b.id} onClick={() => toggleBenchmark(b.id)} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: active ? b.color + "14" : "#f8faf9",
                  border: `2px solid ${active ? b.color : "#e0ebe8"}`,
                  borderRadius: 12, padding: "10px 16px", cursor: "pointer",
                  transition: "all 0.18s", textAlign: "left", width: "100%",
                }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%",
                    background: active ? b.color : "#ccc",
                    border: "2px solid white",
                    boxShadow: active ? `0 0 0 1.5px ${b.color}` : "none",
                    flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: active ? b.color : "#999", lineHeight: 1.2 }}>
                      {b.label}
                      {active && <span style={{ fontFamily: "'DM Mono', monospace", marginLeft: 6 }}>{b.rangeLabel}</span>}
                    </div>
                    <div style={{ fontSize: 10, color: "#aaa", lineHeight: 1.3 }}>{b.description}</div>
                  </div>
                </button>
              );
            })}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#0e4f4f14", border: "2px solid #0e4f4f",
              borderRadius: 12, padding: "10px 16px", width: "100%",
            }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#0e4f4f", border: "2px solid white", boxShadow: "0 0 0 1.5px #0e4f4f", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0e4f4f", lineHeight: 1.2 }}>
                  You — <span style={{ fontFamily: "'DM Mono', monospace" }}>{range}</span>
                </div>
                <div style={{ fontSize: 10, color: "#aaa", lineHeight: 1.3 }}>Your current settings</div>
              </div>
            </div>
          </div>
        </div>



        {/* Sliders */}
        <div style={{ marginTop: 32 }}>
          {categories.map(cat => (
            <div key={cat} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 4, height: 24, background: CATEGORY_COLORS[cat], borderRadius: 2 }} />
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: CATEGORY_COLORS[cat], margin: 0 }}>{cat}</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
                {METRICS.filter(m => m.category === cat).map(m => (
                  <MetricSlider
                    key={m.id}
                    metric={m}
                    value={values[m.id]}
                    onChange={val => setValues(prev => ({ ...prev, [m.id]: val }))}
                    visibleBenchmarks={visibleBenchmarks}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", fontSize: 12, color: "#7a9e98", marginTop: 16, lineHeight: 1.6, padding: "16px 24px", background: "white", borderRadius: 12, border: "1px dashed #c5e0da" }}>
          This tool is for illustrative purposes. Actual valuations depend on market conditions, buyer universe, deal structure, and advisor positioning. Ranges are based on typical PE/strategic M&A activity in the digital marketing services sector.
        </div>
      </div>
    </div>
  );
}
