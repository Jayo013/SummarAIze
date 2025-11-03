// backend/src/server.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { z } from "zod";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRemoteJWKSet, jwtVerify } from "jose-node-cjs-runtime";



dotenv.config();

/* ---------------------------- App & Middleware ---------------------------- */
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

/* --------------------------------- Health -------------------------------- */
app.get("/api/health", (_req: Request, res: Response) => res.json({ ok: true }));

/* ------------------------------- Validation ------------------------------ */
const Body = z.object({ text: z.string().min(1).max(20000) });

/* ------------------------------- Providers ------------------------------- */
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash"; // or "gemini-2.5-flash-lite"

/* ------------------------------- Auth (JOSE) ------------------------------ */
// Required env:
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || "";            // e.g. dev-xxx.us.auth0.com
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || "";        // e.g. https://summaraize.api

const ISSUER = AUTH0_DOMAIN ? `https://${AUTH0_DOMAIN}/` : "";
const JWKS = AUTH0_DOMAIN ? createRemoteJWKSet(new URL(`${ISSUER}.well-known/jwks.json`)) : null;

function unauthorized(res: Response, detail?: string) {
  return res.status(401).json({ error: "Unauthorized", detail });
}

// Express middleware to validate Auth0 Access Token using jose
async function checkJwtJose(req: Request, res: Response, next: NextFunction) {
  try {
    if (!JWKS || !AUTH0_AUDIENCE || !ISSUER) {
      return unauthorized(res, "Auth not configured on server (missing AUTH0_* envs).");
    }
    const auth = req.headers.authorization || "";
    const [scheme, token] = auth.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return unauthorized(res, "Missing Bearer token");
    }
    const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUER, audience: AUTH0_AUDIENCE });
    (req as any).auth = payload; // attach claims if needed
    return next();
  } catch (e: any) {
    return unauthorized(res, String(e?.message || e));
  }
}

/* --------------------------- Protected Summarize -------------------------- */
app.post("/api/summarize", checkJwtJose, async (req: Request, res: Response) => {
  try {
    const { text } = Body.parse(req.body);

    // ---------- Try Gemini first ----------
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const prompt = `Summarize the following notes into exactly 5 concise, factual bullet points.\n\n${text}`;
        const result = await model.generateContent(prompt);
        const summary = result.response.text().trim();
        if (summary) {
          return res.json({ summary, provider: "gemini", model: GEMINI_MODEL });
        }
      } catch (gerr: any) {
        console.error("[Gemini] error:", gerr?.message || gerr);
        // fall through to OpenAI if available
      }
    }

    // ---------- OpenAI fallback ----------
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Summarize the user's notes into exactly 5 concise, factual bullet points." },
            { role: "user", content: text },
          ],
        });
        const summary = completion.choices?.[0]?.message?.content?.trim() ?? "";
        if (summary) {
          return res.json({ summary, provider: "openai", model: "gpt-4o-mini" });
        }
        throw new Error("OpenAI returned an empty response.");
      } catch (oerr: any) {
        console.error("[OpenAI] error:", oerr?.message || oerr);
        if (String(oerr?.message || "").includes("exceeded your current quota")) {
          return res.status(429).json({
            error: "OpenAI quota exceeded. Check plan/billing or use Gemini.",
            provider: "openai",
          });
        }
        // fall through to demo
      }
    }

    // ---------- Demo response (no working providers) ----------
    return res.status(200).json({
      summary:
        "• (Demo) No AI provider responded\n" +
        `• Gemini model tried: ${GEMINI_MODEL}\n` +
        "• Tip: set GEMINI_API_KEY (AI Studio) with gemini-2.0-flash\n" +
        "• Or add OPENAI_API_KEY (with quota)\n" +
        `• Input length: ${text.length} chars`,
      provider: "demo",
    });
  } catch (err: any) {
    const msg = String(err?.message || err);

    if (msg.includes("ListModels") || msg.includes("404 Not Found") || msg.includes("models/gemini-pro")) {
      return res.status(400).json({
        error:
          "Gemini model unavailable. Use 'gemini-2.0-flash' or 'gemini-2.5-flash-lite' and ensure Generative Language API is enabled.",
        provider: "gemini",
        model: GEMINI_MODEL,
      });
    }
    if (msg.includes('at "text"')) {
      return res.status(400).json({ error: "Invalid body. Provide non-empty 'text' ≤ 20,000 chars." });
    }

    console.error("[Summarize handler] error:", msg);
    return res.status(500).json({ error: "Unexpected server error. Check server logs." });
  }
});

/* --------------------------------- Start --------------------------------- */
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
