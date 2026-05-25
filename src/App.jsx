import React, { useState, useEffect, useMemo } from "react";

/**
 * ============================================================================
 * TRIAGE ENGINE — AI Operations Inbox Intelligence  (Gemini / hosted build)
 * ----------------------------------------------------------------------------
 * Paste a pile of messy, unstructured support / ops requests. The engine:
 *   1. Reads each ticket (handles typos, lowercase, no formatting)
 *   2. Classifies category, priority (P1-P4), urgency, sentiment, churn risk
 *   3. Routes to the correct team + flags SLA risk
 *   4. Drafts a ready-to-send reply
 *   5. Clusters the whole batch into recurring root causes + recommendations
 *   6. Reports measurable hours saved
 *
 * AI layer: Google Gemini, called through our own /api/triage serverless
 * function so the API key never reaches the browser. Tickets are processed in
 * BATCHES so the pipeline scales from a dozen to hundreds of inputs.
 * ========================================================================== */

const BATCH_SIZE = 6;                 // tickets per API call
const MINUTES_SAVED_PER_TICKET = 6;   // conservative manual-triage estimate

/* ---- Design tokens (single source of truth for the whole UI) ------------- */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;900&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

:root{
  --bg:#0c0d10; --panel:#15171c; --panel2:#1b1e25; --line:#2a2e37;
  --text:#e8eaed; --muted:#969cab; --faint:#5d6470;
  --accent:#c8f24e; --accent-dim:#7f9a32;
  --p1:#ff5d5d; --p2:#ffb43d; --p3:#5db4ff; --p4:#8b93a3;
  --ok:#c8f24e; --warn:#ffb43d; --bad:#ff5d5d;
  --sans:'IBM Plex Sans',system-ui,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,monospace;
  --disp:'Archivo',var(--sans);
}
*{box-sizing:border-box}
html,body,#root{background:var(--bg);margin:0}
.te-root{
  font-family:var(--sans); color:var(--text); background:var(--bg);
  min-height:100vh; width:100%; padding:24px; line-height:1.5;
  background-image:
    radial-gradient(1100px 520px at 85% -10%, rgba(200,242,78,.10), transparent 60%),
    radial-gradient(900px 500px at -5% 0%, rgba(93,180,255,.06), transparent 55%);
}
.te-wrap{max-width:1180px;margin:0 auto}
.te-head{display:flex;justify-content:space-between;align-items:flex-end;
  flex-wrap:wrap;gap:18px;border-bottom:1px solid var(--line);padding-bottom:20px}
.te-brand{display:flex;align-items:center;gap:13px}
.te-logo{width:42px;height:42px;border-radius:11px;flex:none;
  background:linear-gradient(150deg,var(--accent),#7adf6b);
  display:grid;place-items:center;color:#0c0d10;font-family:var(--disp);
  font-weight:900;font-size:22px;box-shadow:0 0 26px rgba(200,242,78,.35)}
.te-title{font-family:var(--disp);font-weight:900;font-size:25px;letter-spacing:-.5px;line-height:1}
.te-sub{font-family:var(--mono);font-size:11px;color:var(--accent);
  text-transform:uppercase;letter-spacing:2.5px;margin-top:6px}
.te-tag{color:var(--muted);font-size:13px;max-width:340px;text-align:right}
.te-panel{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:22px}
.te-mt{margin-top:20px}
.te-label{font-family:var(--mono);font-size:11px;letter-spacing:2px;
  text-transform:uppercase;color:var(--faint);margin-bottom:10px}
.te-ta{width:100%;min-height:170px;resize:vertical;background:var(--bg);
  border:1px solid var(--line);border-radius:11px;color:var(--text);
  font-family:var(--mono);font-size:13px;padding:14px;line-height:1.6}
.te-ta:focus{outline:none;border-color:var(--accent-dim)}
.te-row{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:14px}
.te-btn{font-family:var(--sans);font-weight:600;font-size:14px;border-radius:10px;
  padding:12px 22px;border:1px solid var(--line);cursor:pointer;transition:.15s;
  background:var(--panel2);color:var(--text)}
.te-btn:hover{border-color:var(--faint)}
.te-btn.primary{background:var(--accent);color:#0c0d10;border-color:var(--accent)}
.te-btn.primary:hover{filter:brightness(1.07)}
.te-btn:disabled{opacity:.45;cursor:not-allowed}
.te-count{font-family:var(--mono);font-size:12px;color:var(--muted);margin-left:auto}
.te-prog{height:7px;background:var(--panel2);border-radius:99px;overflow:hidden;margin-top:8px}
.te-prog>i{display:block;height:100%;background:linear-gradient(90deg,var(--accent),#7adf6b);
  border-radius:99px;transition:width .4s ease}
.te-progtxt{font-family:var(--mono);font-size:12px;color:var(--muted);margin-top:9px;display:flex;justify-content:space-between}
.te-impact{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.te-stat{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px 16px;position:relative;overflow:hidden}
.te-stat:before{content:"";position:absolute;inset:0 auto 0 0;width:3px;background:var(--accent)}
.te-stat .v{font-family:var(--disp);font-weight:900;font-size:30px;letter-spacing:-1px;line-height:1}
.te-stat .k{font-family:var(--mono);font-size:10.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-top:8px}
.te-stat.hot:before{background:var(--p1)}
.te-stat.hot .v{color:#ff8d8d}
.te-grid{display:grid;grid-template-columns:1.55fr 1fr;gap:20px;align-items:start}
.te-headline{font-family:var(--disp);font-weight:700;font-size:17px;line-height:1.35;
  border-left:3px solid var(--accent);padding-left:14px;margin-bottom:18px}
.te-cluster{border:1px solid var(--line);border-radius:12px;padding:13px 14px;margin-bottom:10px;background:var(--panel2)}
.te-cluster .ct{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.te-cluster .name{font-weight:600;font-size:14px}
.te-cluster .cnt{font-family:var(--mono);font-size:12px;color:var(--accent);flex:none}
.te-cluster .act{color:var(--muted);font-size:12.5px;margin-top:6px}
.te-rec{display:flex;gap:9px;font-size:13px;color:var(--text);margin-bottom:9px;align-items:flex-start}
.te-rec .dot{color:var(--accent);font-family:var(--mono);flex:none;margin-top:1px}
.te-dist{display:flex;flex-direction:column;gap:9px;margin-top:4px}
.te-distrow{display:grid;grid-template-columns:30px 1fr 28px;gap:10px;align-items:center;font-family:var(--mono);font-size:12px}
.te-distbar{height:9px;border-radius:99px;background:var(--panel2);overflow:hidden}
.te-distbar>i{display:block;height:100%;border-radius:99px}
.te-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.te-chip{font-family:var(--mono);font-size:12px;padding:6px 13px;border-radius:99px;
  border:1px solid var(--line);background:var(--panel);color:var(--muted);cursor:pointer;transition:.12s}
.te-chip:hover{color:var(--text)}
.te-chip.on{background:var(--accent);color:#0c0d10;border-color:var(--accent);font-weight:600}
.te-card{border:1px solid var(--line);border-radius:14px;background:var(--panel);
  padding:15px 16px;margin-bottom:12px;animation:rise .45s ease backwards}
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.te-ctop{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.te-prio{font-family:var(--disp);font-weight:900;font-size:13px;padding:3px 9px;border-radius:7px;flex:none}
.te-meta{font-family:var(--mono);font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}
.te-pill{font-family:var(--mono);font-size:10.5px;padding:3px 8px;border-radius:99px;border:1px solid var(--line)}
.te-sum{font-size:14.5px;font-weight:500;margin:11px 0 4px}
.te-orig{font-family:var(--mono);font-size:12px;color:var(--faint);
  white-space:pre-wrap;border-left:2px solid var(--line);padding-left:11px;margin-top:9px}
.te-reason{font-size:12.5px;color:var(--muted);margin-top:9px}
.te-reason b{color:var(--accent);font-weight:600;font-family:var(--mono);font-size:11px;letter-spacing:1px}
.te-reply{background:var(--bg);border:1px solid var(--line);border-radius:10px;
  padding:12px;margin-top:11px;font-size:13px;color:#cfd3da;position:relative}
.te-copy{position:absolute;top:9px;right:9px;font-family:var(--mono);font-size:10px;
  padding:4px 9px;border-radius:6px;border:1px solid var(--line);background:var(--panel2);
  color:var(--muted);cursor:pointer}
.te-copy:hover{color:var(--text)}
.te-expand{font-family:var(--mono);font-size:11px;color:var(--accent);cursor:pointer;
  margin-top:10px;display:inline-block}
.te-foot{text-align:center;color:var(--faint);font-family:var(--mono);font-size:11px;
  margin-top:28px;letter-spacing:1px}
.te-err{background:rgba(255,93,93,.1);border:1px solid var(--bad);color:#ffb0b0;
  border-radius:10px;padding:12px 14px;font-size:13px;margin-top:14px}
@media(max-width:860px){
  .te-grid{grid-template-columns:1fr}
  .te-impact{grid-template-columns:repeat(2,1fr)}
  .te-tag{display:none}
  .te-root{padding:16px}
}
`;

/* ---- Realistic MESSY sample data (the "reads unstructured input" proof) --- */
const SAMPLE = [
  "ur app charged me TWICE this month for the pro plan?? i want the duplicate refunded now or im cancelling. been a customer 3 yrs and this is ridiculous",
  "hi team, small thing — would love a dark mode in the dashboard at some point. no rush, loving the product otherwise :)",
  "URGENT the whole checkout is DOWN. customers cant pay. losing sales every minute. we are a 200 person company this is costing us real money please escalate",
  "cant log in. says password wrong but im sure its right. tried reset link didnt get the email either",
  "i was promised a refund 8 days ago by someone named raj and nothing has happened. this is the 3rd time im following up. extremely disappointed",
  "package still not delivered, tracking hasnt moved in 5 days, ordered #INV-90421",
  "your sales guy keeps emailing me i never signed up for anything stop",
  "the report export feature gives me a blank pdf every time. happens on chrome and edge. kind of blocking my monthly reporting",
  "honestly just wanted to say the new onboarding flow is fantastic, way smoother than before. great work everyone",
  "i think someone accessed my account from a device i dont recognize, got a login alert from another country. worried my data is exposed",
  "the api integration returns 500 errors intermittently when we post bulk records, started yesterday afternoon, breaking our nightly sync",
  "how do i change my billing email? cant find the setting anywhere",
];

/* ---- API helper: calls our serverless proxy, returns parsed JSON ---------- */
async function askAI(prompt) {
  const res = await fetch("/api/triage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `API ${res.status}`);
  }
  const { text } = await res.json();
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const m = clean.match(/[\[{][\s\S]*[\]}]/); // grab the JSON block defensively
  return JSON.parse(m ? m[0] : clean);
}

/* ---- Prompt builders ----------------------------------------------------- */
const triagePrompt = (batch) => `You are an expert support-operations triage analyst. Analyze the customer/ops messages below. They are raw and unedited (typos, lowercase, no formatting are normal).

For EACH message return one object with this exact schema:
{"id":<number>,"category":"Billing|Technical|Account|Shipping|Security|Product Feedback|Spam|Other","priority":"P1|P2|P3|P4","urgency":<1-10 integer>,"sentiment":"angry|frustrated|neutral|happy","churn_risk":"high|medium|low","team":"<owning team, e.g. Payments, Engineering, Trust & Safety>","sla_risk":"high|medium|low","summary":"<=12 word factual summary","reasoning":"<=18 words on why this priority","reply":"a warm, specific 2-3 sentence draft reply to the customer"}

Priority guide: P1 = outage/security/revenue-blocking or high churn risk; P2 = blocked workflow or angry paying customer; P3 = standard request/bug; P4 = low-impact/feedback/spam.

Respond with ONLY a JSON array. No prose, no markdown.

MESSAGES:
${batch.map((t) => `[id ${t.id}] ${t.text}`).join("\n")}`;

const aggregatePrompt = (rows) => `You are a head of support operations reviewing today's triaged queue. Find the operational signal in this data.

Return ONLY this JSON (no markdown):
{"headline":"<one punchy sentence on the state of the queue>","themes":[{"theme":"<recurring root cause>","count":<n>,"action":"<concrete fix, <=14 words>"}],"recommendations":["<ops recommendation>","<ops recommendation>","<ops recommendation>"]}

Give 2-4 themes (group related tickets by underlying cause, not just category) and exactly 3 recommendations.

TRIAGED QUEUE:
${rows.map((r) => `#${r.id} [${r.priority}/${r.category}] ${r.summary}`).join("\n")}`;

/* ---- Color maps ---------------------------------------------------------- */
const PRIO = {
  P1: { bg: "rgba(255,93,93,.16)", c: "var(--p1)" },
  P2: { bg: "rgba(255,180,61,.16)", c: "var(--p2)" },
  P3: { bg: "rgba(93,180,255,.16)", c: "var(--p3)" },
  P4: { bg: "rgba(139,147,163,.16)", c: "var(--p4)" },
};
const SENT = { angry: "var(--bad)", frustrated: "var(--warn)", neutral: "var(--muted)", happy: "var(--ok)" };

/* ========================================================================== */
export default function TriageEngine() {
  const [raw, setRaw] = useState("");
  const [tickets, setTickets] = useState([]);
  const [aggregate, setAggregate] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, msg: "" });
  const [elapsed, setElapsed] = useState(0);
  const [filter, setFilter] = useState("ALL");
  const [open, setOpen] = useState({});
  const [err, setErr] = useState("");

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  const loadSample = () => setRaw(SAMPLE.join("\n---\n"));

  const parse = (text) => {
    let parts = text.split(/\n-{3,}\n/).map((s) => s.trim()).filter(Boolean);
    if (parts.length <= 1) parts = text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    return parts.map((t, i) => ({ id: i + 1, text: t }));
  };

  const parsedCount = useMemo(() => parse(raw).length, [raw]);

  async function run() {
    const items = parse(raw);
    if (!items.length) { setErr("Paste at least one ticket, or load the sample queue."); return; }
    setErr(""); setBusy(true); setAggregate(null); setTickets([]); setOpen({});
    setFilter("ALL");
    const start = Date.now();
    setProgress({ done: 0, total: items.length, msg: "Reading queue…" });

    const analyzed = [];
    try {
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        setProgress({ done: i, total: items.length, msg: `Triaging tickets ${i + 1}-${Math.min(i + BATCH_SIZE, items.length)}…` });
        const out = await askAI(triagePrompt(batch));
        out.forEach((a) => {
          const src = batch.find((b) => b.id === a.id) || batch[0];
          analyzed.push({ ...a, text: src.text });
        });
        setTickets([...analyzed]);
        setProgress({ done: Math.min(i + BATCH_SIZE, items.length), total: items.length, msg: "Triaging…" });
      }

      setProgress({ done: items.length, total: items.length, msg: "Finding operational patterns…" });
      const agg = await askAI(aggregatePrompt(analyzed));
      setAggregate(agg);
      setElapsed(((Date.now() - start) / 1000).toFixed(1));
    } catch (e) {
      setErr(`Something went wrong while analyzing (${e.message}). Try again or reduce the batch.`);
    } finally {
      setBusy(false);
    }
  }

  const metrics = useMemo(() => {
    if (!tickets.length) return null;
    const p1 = tickets.filter((t) => t.priority === "P1").length;
    const mins = tickets.length * MINUTES_SAVED_PER_TICKET;
    return {
      total: tickets.length, p1,
      hours: (mins / 60).toFixed(1),
      dist: ["P1", "P2", "P3", "P4"].map((p) => ({ p, n: tickets.filter((t) => t.priority === p).length })),
    };
  }, [tickets]);

  const shown = useMemo(() => {
    const order = { P1: 0, P2: 1, P3: 2, P4: 3 };
    const f = filter === "ALL" ? tickets : tickets.filter((t) => t.priority === filter);
    return [...f].sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9));
  }, [tickets, filter]);

  return (
    <div className="te-root">
      <div className="te-wrap">

        <div className="te-head">
          <div className="te-brand">
            <div className="te-logo">T</div>
            <div>
              <div className="te-title">Triage Engine</div>
              <div className="te-sub">AI Operations Inbox Intelligence</div>
            </div>
          </div>
          <div className="te-tag">
            Turns a chaotic support queue into a prioritized, routed, reply-ready
            action plan — in seconds instead of hours.
          </div>
        </div>

        <div className="te-panel te-mt">
          <div className="te-label">Raw queue · paste tickets, emails or complaints (separate with a blank line or ---)</div>
          <textarea
            className="te-ta"
            placeholder="Paste your messy support tickets here… or load the sample queue to see it work."
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            disabled={busy}
          />
          <div className="te-row">
            <button className="te-btn primary" onClick={run} disabled={busy}>
              {busy ? "Analyzing…" : "▸ Run Triage"}
            </button>
            <button className="te-btn" onClick={loadSample} disabled={busy}>Load sample queue</button>
            <button className="te-btn" onClick={() => { setRaw(""); setTickets([]); setAggregate(null); setErr(""); }} disabled={busy}>Clear</button>
            <span className="te-count">{parsedCount} ticket{parsedCount === 1 ? "" : "s"} detected</span>
          </div>

          {busy && (
            <div style={{ marginTop: 18 }}>
              <div className="te-prog"><i style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 5}%` }} /></div>
              <div className="te-progtxt"><span>{progress.msg}</span><span>{progress.done}/{progress.total}</span></div>
            </div>
          )}
          {err && <div className="te-err">{err}</div>}
        </div>

        {metrics && (
          <div className="te-impact te-mt">
            <div className="te-stat"><div className="v">{metrics.total}</div><div className="k">Tickets triaged</div></div>
            <div className="te-stat"><div className="v">{elapsed || "—"}s</div><div className="k">Processing time</div></div>
            <div className="te-stat"><div className="v">~{metrics.hours}h</div><div className="k">Manual work saved</div></div>
            <div className={`te-stat ${metrics.p1 ? "hot" : ""}`}><div className="v">{metrics.p1}</div><div className="k">P1 · act now</div></div>
          </div>
        )}

        {tickets.length > 0 && (
          <div className="te-grid te-mt">
            <div>
              <div className="te-filters">
                {["ALL", "P1", "P2", "P3", "P4"].map((f) => (
                  <span key={f} className={`te-chip ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>
                    {f}{f !== "ALL" ? ` · ${tickets.filter((t) => t.priority === f).length}` : ` · ${tickets.length}`}
                  </span>
                ))}
              </div>

              {shown.map((t, i) => (
                <div key={t.id} className="te-card" style={{ animationDelay: `${i * 45}ms` }}>
                  <div className="te-ctop">
                    <span className="te-prio" style={{ background: PRIO[t.priority]?.bg, color: PRIO[t.priority]?.c }}>{t.priority}</span>
                    <span className="te-meta">{t.category} · {t.team}</span>
                    <span className="te-pill" style={{ color: SENT[t.sentiment] }}>{t.sentiment}</span>
                    {t.churn_risk === "high" && <span className="te-pill" style={{ color: "var(--bad)" }}>churn risk</span>}
                    {t.sla_risk === "high" && <span className="te-pill" style={{ color: "var(--warn)" }}>SLA risk</span>}
                    <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--faint)" }}>urgency {t.urgency}/10</span>
                  </div>

                  <div className="te-sum">{t.summary}</div>
                  <div className="te-reason"><b>WHY</b> &nbsp;{t.reasoning}</div>

                  <span className="te-expand" onClick={() => setOpen((o) => ({ ...o, [t.id]: !o[t.id] }))}>
                    {open[t.id] ? "− hide detail" : "+ original + drafted reply"}
                  </span>

                  {open[t.id] && (
                    <>
                      <div className="te-orig">{t.text}</div>
                      <div className="te-reply">
                        <button className="te-copy" onClick={() => navigator.clipboard?.writeText(t.reply)}>copy</button>
                        {t.reply}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="te-panel" style={{ position: "sticky", top: 16 }}>
              <div className="te-label">Operational intelligence</div>
              {aggregate ? (
                <>
                  <div className="te-headline">{aggregate.headline}</div>
                  <div className="te-label">Recurring root causes</div>
                  {(aggregate.themes || []).map((c, i) => (
                    <div className="te-cluster" key={i}>
                      <div className="ct"><span className="name">{c.theme}</span><span className="cnt">×{c.count}</span></div>
                      <div className="act">→ {c.action}</div>
                    </div>
                  ))}
                  <div className="te-label" style={{ marginTop: 18 }}>Priority distribution</div>
                  <div className="te-dist">
                    {metrics.dist.map(({ p, n }) => (
                      <div className="te-distrow" key={p}>
                        <span style={{ color: PRIO[p].c }}>{p}</span>
                        <span className="te-distbar"><i style={{ width: `${metrics.total ? (n / metrics.total) * 100 : 0}%`, background: PRIO[p].c }} /></span>
                        <span>{n}</span>
                      </div>
                    ))}
                  </div>
                  <div className="te-label" style={{ marginTop: 18 }}>Recommended actions</div>
                  {(aggregate.recommendations || []).map((r, i) => (
                    <div className="te-rec" key={i}><span className="dot">▸</span><span>{r}</span></div>
                  ))}
                </>
              ) : (
                <div style={{ color: "var(--muted)", fontSize: 13, fontFamily: "var(--mono)" }}>
                  Computing patterns across the queue…
                </div>
              )}
            </div>
          </div>
        )}

        <div className="te-foot">TRIAGE ENGINE · reads messy input → prioritizes → routes → drafts → finds patterns</div>
      </div>
    </div>
  );
}
