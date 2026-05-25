# Triage Engine — AI Operations Inbox Intelligence

Turns a chaotic, unstructured support/ops inbox into a prioritized, routed,
reply-ready action plan — in seconds instead of hours.

**Hackathon:** AI Generalist Individual · **Stack:** Vite + React + Gemini (serverless proxy)

## What it does
Paste a raw queue of messy messages. For each ticket the AI returns category,
priority (P1–P4) with reasoning, urgency, sentiment, churn risk, owning team,
SLA-risk flag, a one-line summary, and a drafted reply. Across the whole batch
it finds recurring root-cause clusters and gives operations recommendations,
then reports the manual hours saved.

## Run it
- **Live:** see your Vercel URL after following `DEPLOY.md`.
- **Local:** `npm install` then `vercel dev` (the AI needs the serverless
  function; plain `npm run dev` serves only the UI).

## How the AI works (two-stage pipeline)
1. **Per-ticket triage** — tickets sent to Gemini in batches of 6, returning
   strict JSON; results stream into the dashboard live.
2. **Root-cause clustering** — compact results sent back to Gemini to group by
   underlying cause and produce recommendations.

The `GEMINI_API_KEY` is held by the `/api/triage` serverless function and is
never exposed to the browser.

## Project structure
```
triage-engine/
├── api/triage.js      # serverless proxy → Gemini (holds the key)
├── src/App.jsx        # the application
├── src/main.jsx       # React entry
├── index.html
├── package.json
├── vite.config.js
├── .env.example       # GEMINI_API_KEY / GEMINI_MODEL
└── DEPLOY.md          # step-by-step free deploy guide
```

## Config
| Env var | Default | Notes |
|---------|---------|-------|
| `GEMINI_API_KEY` | — | required; free at aistudio.google.com/apikey |
| `GEMINI_MODEL` | `gemini-2.5-flash` | alt: `gemini-2.5-flash-lite` (higher free limits) |
