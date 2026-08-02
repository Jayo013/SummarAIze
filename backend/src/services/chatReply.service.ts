import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

const OPENAI_MODEL = "gpt-4o-mini";

// Sliding window: only the most recent turns are sent to the model, so prompt size (and
// cost) stays flat no matter how long the conversation grows. Full history still lives in
// the DB for display — this only bounds what gets billed as input tokens.
const MAX_CONTEXT_TURNS = 8;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatContext {
  modeLabel: string;
  summaryText: string;
}

type ChatResult = { reply: string; provider: "gemini" | "groq" | "openai" | "demo"; model?: string };

function systemPrompt(ctx: ChatContext): string {
  return [
    "You are answering questions about an AI-generated summary. Base every answer strictly on the summary text below.",
    "If the answer isn't contained in it, say so plainly instead of guessing or inventing details.",
    "",
    `Summary mode: ${ctx.modeLabel}`,
    "Summary:",
    ctx.summaryText,
  ].join("\n");
}

function recentHistory(history: ChatTurn[]): ChatTurn[] {
  return history.slice(-MAX_CONTEXT_TURNS);
}

async function tryGemini(ctx: ChatContext, history: ChatTurn[], question: string): Promise<ChatResult | null> {
  if (!env.GEMINI_API_KEY) return null;
  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL,
      systemInstruction: systemPrompt(ctx),
    });
    const chat = model.startChat({
      history: recentHistory(history).map((t) => ({
        role: t.role === "assistant" ? "model" : "user",
        parts: [{ text: t.content }],
      })),
    });
    const result = await chat.sendMessage(question);
    const reply = result.response.text().trim();
    return reply ? { reply, provider: "gemini", model: env.GEMINI_MODEL } : null;
  } catch (err: any) {
    console.error("[Chat/Gemini] error:", String(err?.message || err));
    return null; // fall through to Groq
  }
}

async function tryGroq(ctx: ChatContext, history: ChatTurn[], question: string): Promise<ChatResult | null> {
  if (!env.GROQ_API_KEY) return null;
  try {
    const groq = new OpenAI({ apiKey: env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
    const completion = await groq.chat.completions.create({
      model: env.GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt(ctx) },
        ...recentHistory(history).map((t) => ({ role: t.role, content: t.content })),
        { role: "user", content: question },
      ],
    });
    const reply = completion.choices?.[0]?.message?.content?.trim() ?? "";
    return reply ? { reply, provider: "groq", model: env.GROQ_MODEL } : null;
  } catch (err: any) {
    console.error("[Chat/Groq] error:", String(err?.message || err));
    return null; // fall through to OpenAI
  }
}

async function tryOpenAI(ctx: ChatContext, history: ChatTurn[], question: string): Promise<ChatResult | null> {
  if (!env.OPENAI_API_KEY) return null;
  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt(ctx) },
        ...recentHistory(history).map((t) => ({ role: t.role, content: t.content })),
        { role: "user", content: question },
      ],
    });
    const reply = completion.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) throw new Error("OpenAI returned an empty response.");
    return { reply, provider: "openai", model: OPENAI_MODEL };
  } catch (err: any) {
    const msg = String(err?.message || err);
    console.error("[Chat/OpenAI] error:", msg);
    if (msg.includes("exceeded your current quota")) {
      throw new AppError(429, "OpenAI quota exceeded. Check plan/billing or use Gemini.", { provider: "openai" });
    }
    return null; // fall through to demo
  }
}

function demoFallback(question: string): ChatResult {
  return {
    reply:
      `(Demo) No AI provider responded.\n` +
      `You asked: "${question}"\n` +
      "Set GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY to enable chat.",
    provider: "demo",
  };
}

export async function generateChatReply(ctx: ChatContext, history: ChatTurn[], question: string): Promise<ChatResult> {
  const gemini = await tryGemini(ctx, history, question);
  if (gemini) return gemini;

  const groq = await tryGroq(ctx, history, question);
  if (groq) return groq;

  const openai = await tryOpenAI(ctx, history, question);
  if (openai) return openai;

  return demoFallback(question);
}

// Exported for testing the token-optimization window in isolation.
export { recentHistory, systemPrompt, MAX_CONTEXT_TURNS };
