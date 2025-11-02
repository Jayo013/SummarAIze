// backend/src/server.ts
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { z } from "zod";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", (_req: Request, res: Response) => res.json({ ok: true }));

// Validate input
const Body = z.object({ text: z.string().min(1).max(20000) });

// Use a free-tier Gemini model by default; allow override via env
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash"; // or "gemini-2.5-flash-lite"

app.post("/api/summarize", async (req: Request, res: Response) => {
  try {
    const { text } = Body.parse(req.body);

    // ---------- Try Gemini first ----------
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const prompt =
          `Summarize the following notes into exactly 5 concise, factual bullet points.\n\n${text}`;

        // (String prompt is fine; the SDK will wrap it)
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

        // If it's a quota error, surface a 429 so the UI shows a clear message.
        if (String(oerr?.message || "").includes("exceeded your current quota")) {
          return res.status(429).json({
            error: "OpenAI quota exceeded. Check plan/billing or use Gemini.",
            provider: "openai",
          });
        }
        // Otherwise, continue to demo response.
      }
    }

    // ---------- Demo response (no working providers) ----------
    return res.status(200).json({
      summary:
        "• (Demo) No AI provider responded\n" +
        `• Gemini model tried: ${GEMINI_MODEL}\n` +
        "• Tip: use GEMINI_MODEL=gemini-2.0-flash (free tier) with an AI Studio key\n" +
        "• Or add OPENAI_API_KEY (with quota)\n" +
        `• Input length: ${text.length} chars`,
      provider: "demo",
    });
  } catch (err: any) {
    const msg = String(err?.message || err);

    // Helpful mapping for common Gemini misconfig
    if (msg.includes("ListModels") || msg.includes("404 Not Found") || msg.includes("models/gemini-pro")) {
      return res.status(400).json({
        error:
          "Gemini model unavailable. Use 'gemini-2.0-flash' or 'gemini-2.5-flash-lite' and ensure the Generative Language API is enabled for your key/project.",
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

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
