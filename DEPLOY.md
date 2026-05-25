# Deploy Triage Engine — Free, Live, in ~10 Minutes

This gets you a public **https** link you can put in your hackathon write-up.
Stack: **Vite + React** front end, a **Vercel serverless function** that calls
**Google Gemini** (free tier). Your API key stays on the server — never in the browser.

You'll need three free accounts (no credit card): **Google AI Studio**, **GitHub**, **Vercel**.

---

## Step 1 — Get a free Gemini API key
1. Go to **https://aistudio.google.com/apikey**
2. Sign in with your Google account → click **Create API key**.
3. Copy the key somewhere safe. **Do not paste it into any file or commit it.**

> Free tier (gemini-2.5-flash): ~10 requests/min, ~250/day. Plenty for the demo.

---

## Step 2 — Put the code on GitHub
**Easiest (no command line):**
1. Create a free account at **https://github.com** → click **New repository** → name it `triage-engine` → **Create**.
2. On the empty repo page, click **uploading an existing file**.
3. Unzip `triage-engine.zip` (the file I gave you) and **drag all the contents** (the `src` folder, `api` folder, `index.html`, `package.json`, etc.) into the upload box.
4. Click **Commit changes**.

> ⚠️ Make sure you upload the *contents* of the folder, keeping the `src/` and `api/` folders intact. Do **not** upload your real `.env` file (there isn't one — only `.env.example`, which is safe).

---

## Step 3 — Deploy on Vercel
1. Create a free account at **https://vercel.com** → **sign in with GitHub** (one click).
2. Click **Add New… → Project**.
3. Find your `triage-engine` repo → **Import**.
4. Vercel auto-detects **Vite** — leave all build settings as default.
5. Before deploying, open **Environment Variables** and add:
   | Name | Value |
   |------|-------|
   | `GEMINI_API_KEY` | *(paste your key from Step 1)* |
   | `GEMINI_MODEL` | `gemini-2.5-flash` *(optional)* |
6. Click **Deploy**. Wait ~60 seconds.
7. You'll get a live link like `https://triage-engine-xxxx.vercel.app` 🎉

**Paste that link into the write-up's "Hosted Project Link" section and into the submission form.**

---

## Step 4 — Test it
Open your live link → **Load sample queue** → **Run Triage**.
You should see tickets get prioritized, drafted, and clustered.

---

## Troubleshooting
- **"Server is missing GEMINI_API_KEY"** → you forgot Step 3.5, or didn't redeploy after adding it. In Vercel: Settings → Environment Variables → add it → Deployments → **Redeploy**.
- **A model/404 error** → the model name changed. Set `GEMINI_MODEL` to `gemini-2.5-flash-lite` (Settings → Env Vars → Redeploy).
- **429 / rate limit** → you're sending too many requests on the free tier. Wait a minute, or switch to `gemini-2.5-flash-lite` (higher free limits).
- **Blank page** → check the Vercel build log; usually a typo in an env var name.

---

## Alternative: deploy from your terminal (optional)
```bash
npm install -g vercel
cd triage-engine
vercel            # follow prompts, links the project
vercel env add GEMINI_API_KEY     # paste key when asked
vercel --prod     # deploys to your public URL
```
To test locally *with* the AI working, use `vercel dev` (plain `npm run dev`
serves the UI but not the /api function).

---

## What to put in the write-up
Open `Triage_Engine_Writeup.pdf`, section **00 — Hosted Project Link**, and
replace the placeholder with your live Vercel URL. Done.
