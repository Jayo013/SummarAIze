import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { env } from "../config/env";
import { AppError } from "../utils/errors";
import type { SummaryMode } from "./summaryModes";
import { getActivePromptTemplate, buildGeminiPrompt, type PromptTemplate } from "../prompts/templates";
import { parseSummaryJson } from "../prompts/schemas";
import { renderStructuredSummary } from "./promptRenderer";

const OPENAI_MODEL = "gpt-4o-mini";

type SummaryResult = {
  summary: string;
  provider: "gemini" | "groq" | "openai" | "demo";
  model?: string;
  promptVersion: string;
  // False for legacy text-mode templates or when a provider returns a response that fails
  // JSON schema validation — surfaced so quality scoring can weigh unvalidated output lower.
  structured: boolean;
};

// Shared by every JSON-mode provider: parse + validate against the mode's schema, then
// render to the same plain-text format the rest of the app already expects. Returns null
// (not a thrown error) on malformed output so the caller's fallback chain treats it exactly
// like a provider failure — a hallucinated/off-schema response should never reach the user.
function fromStructuredResponse(
  mode: SummaryMode,
  template: PromptTemplate,
  raw: string,
  provider: SummaryResult["provider"],
  model?: string
): SummaryResult | null {
  const parsed = parseSummaryJson(mode, raw);
  if (!parsed) return null;
  return {
    summary: renderStructuredSummary(mode, parsed),
    provider,
    model,
    promptVersion: template.version,
    structured: true,
  };
}

async function tryGemini(text: string, mode: SummaryMode): Promise<SummaryResult | null> {
  if (!env.GEMINI_API_KEY) return null;
  const template = getActivePromptTemplate(mode);
  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL,
      ...(template.responseFormat === "json"
        ? { generationConfig: { responseMimeType: "application/json" } }
        : {}),
    });
    const result = await model.generateContent(buildGeminiPrompt(template, text));
    const raw = result.response.text().trim();
    if (!raw) return null;

    if (template.responseFormat === "json") {
      return fromStructuredResponse(mode, template, raw, "gemini", env.GEMINI_MODEL);
    }
    return { summary: raw, provider: "gemini", model: env.GEMINI_MODEL, promptVersion: template.version, structured: false };
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
  const template = getActivePromptTemplate(mode);
  try {
    const groq = new OpenAI({ apiKey: env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
    const completion = await groq.chat.completions.create({
      model: env.GROQ_MODEL,
      ...(template.responseFormat === "json" ? { response_format: { type: "json_object" as const } } : {}),
      messages: [
        { role: "system", content: template.instructions },
        { role: "user", content: text },
      ],
    });
    const raw = completion.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) return null;

    if (template.responseFormat === "json") {
      return fromStructuredResponse(mode, template, raw, "groq", env.GROQ_MODEL);
    }
    return { summary: raw, provider: "groq", model: env.GROQ_MODEL, promptVersion: template.version, structured: false };
  } catch (err: any) {
    console.error("[Groq] error:", String(err?.message || err));
    return null; // fall through to OpenAI
  }
}

async function tryOpenAI(text: string, mode: SummaryMode): Promise<SummaryResult | null> {
  if (!env.OPENAI_API_KEY) return null;
  const template = getActivePromptTemplate(mode);
  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      ...(template.responseFormat === "json" ? { response_format: { type: "json_object" as const } } : {}),
      messages: [
        { role: "system", content: template.instructions },
        { role: "user", content: text },
      ],
    });
    const raw = completion.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) throw new Error("OpenAI returned an empty response.");

    if (template.responseFormat === "json") {
      return fromStructuredResponse(mode, template, raw, "openai", OPENAI_MODEL);
    }
    return { summary: raw, provider: "openai", model: OPENAI_MODEL, promptVersion: template.version, structured: false };
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
    promptVersion: "demo",
    structured: false,
  };
}

type ProviderName = "gemini" | "groq" | "openai";

const PROVIDER_FNS: Record<ProviderName, (text: string, mode: SummaryMode) => Promise<SummaryResult | null>> = {
  gemini: tryGemini,
  groq: tryGroq,
  openai: tryOpenAI,
};

const DEFAULT_PROVIDER_ORDER: ProviderName[] = ["gemini", "groq", "openai"];

function isProviderName(value: unknown): value is ProviderName {
  return typeof value === "string" && (DEFAULT_PROVIDER_ORDER as string[]).includes(value);
}

// Puts the user's preferred provider first; the rest stay in the default order as fallbacks
// so a summary still gets generated even if the preferred provider has no key or errors out.
export function resolveProviderOrder(preferredProvider?: string | null): ProviderName[] {
  if (!isProviderName(preferredProvider)) return DEFAULT_PROVIDER_ORDER;
  return [preferredProvider, ...DEFAULT_PROVIDER_ORDER.filter((p) => p !== preferredProvider)];
}

export async function generateSummary(
  text: string,
  mode: SummaryMode,
  preferredProvider?: string | null
): Promise<SummaryResult> {
  for (const name of resolveProviderOrder(preferredProvider)) {
    const result = await PROVIDER_FNS[name](text, mode);
    if (result) return result;
  }
  return demoFallback(text, mode);
}
