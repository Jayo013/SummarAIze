import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { askAboutSummary, clearChatHistory, getChatHistory } from "../services/chat.service";
import { AppError } from "../utils/errors";
import type { AuthClaims } from "../types/auth";

const IdParam = z.object({ id: z.string().uuid("Invalid summary id.") });
const AskBody = z.object({ message: z.string().trim().min(1).max(2000) });

function getAuthSub(req: Request): string {
  const auth0Sub = (req as Request & { auth?: AuthClaims }).auth?.sub;
  if (!auth0Sub) throw new AppError(401, "Unauthorized");
  return auth0Sub;
}

export async function getChatHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const auth0Sub = getAuthSub(req);
    const { id } = IdParam.parse(req.params);
    const messages = await getChatHistory(auth0Sub, id);
    return res.status(200).json({ messages });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid summary id." });
    return next(err);
  }
}

export async function postChatHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const auth0Sub = getAuthSub(req);
    const { id } = IdParam.parse(req.params);
    const { message } = AskBody.parse(req.body);
    const result = await askAboutSummary(auth0Sub, id, message);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid body. Provide non-empty 'message' ≤ 2,000 chars." });
    }
    return next(err);
  }
}

export async function deleteChatHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const auth0Sub = getAuthSub(req);
    const { id } = IdParam.parse(req.params);
    await clearChatHistory(auth0Sub, id);
    return res.status(204).send();
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid summary id." });
    return next(err);
  }
}
