
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { generateSummary } from "../services/summarize.service";
import { saveSummary } from "../services/summary.service";
import { getPreferredProvider } from "../services/settings.service";
import { scoreSummary } from "../services/qualityScore.service";
import { SUMMARY_MODES } from "../services/summaryModes";
import type { AuthClaims } from "../types/auth";

const Body = z.object({
  text: z.string().min(1).max(20000),
  mode: z.enum(SUMMARY_MODES).default("quick"),
});

export async function 
summarizeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { text, mode } = Body.parse(req.body);
    const auth0Sub = (req as Request & { auth?: AuthClaims }).auth?.sub;
    const preferredProvider = auth0Sub ? await getPreferredProvider(auth0Sub) : null;
    const result = await generateSummary(text, mode, preferredProvider);
    const quality = scoreSummary({ mode, inputText: text, outputText: result.summary, structured: result.structured });

    // Generated up front so the client can reference this summary (e.g. for sharing)
    // even though persistence below is fire-and-forget.
    const id = auth0Sub ? randomUUID() : undefined;
    if (auth0Sub && id) {
      // Fire-and-forget: persistence must never block or fail the summarize response.
      saveSummary({
        id,
        auth0Sub,
        inputText: text,
        outputText: result.summary,
        provider: result.provider,
        model: result.model,
        mode,
        promptVersion: result.promptVersion,
        qualityScore: quality.score,
        qualityFlags: quality.flags,
      }).catch((err) => console.error("[Summary persistence] error:", err));
    }

    return res.status(200).json({ ...result, mode, id, qualityScore: quality.score, qualityFlags: quality.flags });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid body. Provide non-empty 'text' ≤ 20,000 chars and a valid 'mode'." });
    }
    return next(err);
  }
}
