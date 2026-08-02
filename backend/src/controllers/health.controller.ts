import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";

export async function healthHandler(_req: Request, res: Response) {
  let db: "connected" | "unavailable" = "unavailable";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "connected";
  } catch {
    // db stays "unavailable" — still respond 200 so uptime checks don't flap the whole
    // service just because the database had a hiccup; callers should inspect `db`.
  }

  return res.json({
    ok: true,
    db,
    apiVersion: "v1",
    env: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
