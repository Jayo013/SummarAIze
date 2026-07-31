import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { generateSummary } from "../services/summarize.service";
import { saveSummary } from "../services/summary.service";
import type { AuthClaims } from "../types/auth";

const Body = z.object({ text: z.string().min(1).max(20000) });

export async function summarizeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { text } = Body.parse(req.body);
    const result = await generateSummary(text);

    const auth0Sub = (req as Request & { auth?: AuthClaims }).auth?.sub;
    if (auth0Sub) {
      // Fire-and-forget: persistence must never block or fail the summarize response.
      saveSummary({
        auth0Sub,
        inputText: text,
        outputText: result.summary,
        provider: result.provider,
        model: result.model,
      }).catch((err) => console.error("[Summary persistence] error:", err));
    }

    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid body. Provide non-empty 'text' ≤ 20,000 chars." });
    }
    return next(err);
  }
}
