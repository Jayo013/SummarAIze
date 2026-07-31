import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { generateSummary } from "../services/summarize.service";
import { saveSummary } from "../services/summary.service";
import { SUMMARY_MODES } from "../services/summaryModes";
import type { AuthClaims } from "../types/auth";

const Body = z.object({
  text: z.string().min(1).max(20000),
  mode: z.enum(SUMMARY_MODES).default("quick"),
});

export async function summarizeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { text, mode } = Body.parse(req.body);
    const result = await generateSummary(text, mode);

    const auth0Sub = (req as Request & { auth?: AuthClaims }).auth?.sub;
    if (auth0Sub) {
      // Fire-and-forget: persistence must never block or fail the summarize response.
      saveSummary({
        auth0Sub,
        inputText: text,
        outputText: result.summary,
        provider: result.provider,
        model: result.model,
        mode,
      }).catch((err) => console.error("[Summary persistence] error:", err));
    }

    return res.status(200).json({ ...result, mode });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid body. Provide non-empty 'text' ≤ 20,000 chars and a valid 'mode'." });
    }
    return next(err);
  }
}
