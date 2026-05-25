import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// React + Vite. Vercel auto-detects this preset and serves /api as
// serverless functions on the same domain — no extra config needed.
export default defineConfig({ plugins: [react()] });
