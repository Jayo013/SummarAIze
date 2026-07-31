import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { env } from "../config/env";
import { AppError } from "../utils/errors";
import { SUMMARY_MODE_PROMPTS, type SummaryMode } from "./summaryModes";

const OPENAI_MODEL = "gpt-4o-mini";

const geminiPrompt = (text: string, mode: SummaryMode) =>
  `${SUMMARY_MODE_PROMPTS[mode]}\n\n${text}`;

type SummaryResult = { summary: string; provider: "gemini" | "groq" | "openai" | "demo"; model?: string };

async function tryGemini(text: string, mode: SummaryMode): Promise<SummaryResult | null> {
  if (!env.GEMINI_API_KEY) return null;
  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });
    const result = await model.generateContent(geminiPrompt(text, mode));
    const summary = result.response.text().trim();
    return summary ? { summary, provider: "gemini", model: env.GEMINI_MODEL } : null;
  } catch (err: any) {
    const msg = String(err?.message || err);
    console.error("[Gemini] error:", msg);
    if (msg.includes("ListModels") || msg.includes("404 Not Found") || msg.includes("models/gemini-pro")) {
      throw new AppError(
        400,
        "Gemini model unavailable. Use 'gemini-2.0-flash' or 'gemini-2.5-flash-lite' and ensure Generative Language API is enabled.",
        { provider: "gemini", model: env.GEMINI_MODEL }
      );
    }
    return null; // fall through to Groq
  }
}

async function tryGroq(text: string, mode: SummaryMode): Promise<SummaryResult | null> {
  if (!env.GROQ_API_KEY) return null;
  try {
    const groq = new OpenAI({ apiKey: env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
    const completion = await groq.chat.completions.create({
      model: env.GROQ_MODEL,
      messages: [
        { role: "system", content: SUMMARY_MODE_PROMPTS[mode] },
        { role: "user", content: text },
      ],
    });
    const summary = completion.choices?.[0]?.message?.content?.trim() ?? "";
    return summary ? { summary, provider: "groq", model: env.GROQ_MODEL } : null;
  } catch (err: any) {
    console.error("[Groq] error:", String(err?.message || err));
    return null; // fall through to OpenAI
  }
}

async function tryOpenAI(text: string, mode: SummaryMode): Promise<SummaryResult | null> {
  if (!env.OPENAI_API_KEY) return null;
  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SUMMARY_MODE_PROMPTS[mode] },
        { role: "user", content: text },
      ],
    });
    const summary = completion.choices?.[0]?.message?.content?.trim() ?? "";
    if (!summary) throw new Error("OpenAI returned an empty response.");
    return { summary, provider: "openai", model: OPENAI_MODEL };
  } catch (err: any) {
    const msg = String(err?.message || err);
    console.error("[OpenAI] error:", msg);
    if (msg.includes("exceeded your current quota")) {
      throw new AppError(429, "OpenAI quota exceeded. Check plan/billing or use Gemini.", { provider: "openai" });
    }
    return null; // fall through to demo
  }
}

function demoFallback(text: string, mode: SummaryMode): SummaryResult {
  return {
    summary:
      `• (Demo) No AI provider responded\n` +
      `• Mode requested: ${mode}\n` +
      "• Tip: set GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY\n" +
      `• Input length: ${text.length} chars`,
    provider: "demo",
  };
}

export async function generateSummary(text: string, mode: SummaryMode): Promise<SummaryResult> {
  const gemini = await tryGemini(text, mode);
  if (gemini) return gemini;

  const groq = await tryGroq(text, mode);
  if (groq) return groq;

  const openai = await tryOpenAI(text, mode);
  if (openai) return openai;

  return demoFallback(text, mode);
}
