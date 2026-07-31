import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose-node-cjs-runtime";
import { env } from "../config/env";
import type { AuthClaims } from "../types/auth";

const ISSUER = `https://${env.AUTH0_DOMAIN}/`;
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}.well-known/jwks.json`));

function unauthorized(res: Response, detail?: string) {
  return res.status(401).json({ error: "Unauthorized", detail });
}

export async function checkJwt(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return unauthorized(res, "Missing Bearer token");
    }
    const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUER, audience: env.AUTH0_AUDIENCE });
    (req as Request & { auth?: AuthClaims }).auth = payload as unknown as AuthClaims;
    return next();
  } catch (e: any) {
    console.error("[Auth] token verification failed:", String(e?.message || e));
    return unauthorized(res, "Invalid or expired token");
  }
}
