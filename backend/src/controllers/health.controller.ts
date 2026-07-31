import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function healthHandler(_req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ ok: true, db: "connected" });
  } catch {
    return res.json({ ok: true, db: "unavailable" });
  }
}
