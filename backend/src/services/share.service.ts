import { randomBytes } from "crypto";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

const MAX_EXPIRY_DAYS = 365;

export interface ShareInfo {
  token: string;
  url: string;
  expiresAt: string | null;
}

export interface PublicSharedSummary {
  summary: string;
  mode: string;
  provider: string;
  model: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

function toShareInfo(token: string, expiresAt: Date | null): ShareInfo {
  return {
    token,
    url: `${env.FRONTEND_ORIGIN}/share/${token}`,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
  };
}

export function isExpired(expiresAt: Date | null): boolean {
  return !!expiresAt && expiresAt.getTime() <= Date.now();
}

export function assertValidExpiryDays(expiresInDays: number | undefined): void {
  if (expiresInDays !== undefined && (expiresInDays < 1 || expiresInDays > MAX_EXPIRY_DAYS)) {
    throw new AppError(400, `expiresInDays must be between 1 and ${MAX_EXPIRY_DAYS}.`);
  }
}

async function findOwnedSummary(auth0Sub: string, summaryId: string) {
  const user = await prisma.user.findUnique({ where: { auth0Sub } });
  if (!user) throw new AppError(404, "Summary not found.");
  const summary = await prisma.summary.findFirst({ where: { id: summaryId, userId: user.id } });
  if (!summary) throw new AppError(404, "Summary not found.");
  return summary;
}

export async function getShareStatus(auth0Sub: string, summaryId: string): Promise<ShareInfo | null> {
  await findOwnedSummary(auth0Sub, summaryId);

  const existing = await prisma.sharedSummary.findUnique({ where: { summaryId } });
  if (!existing) return null;

  if (isExpired(existing.expiresAt)) {
    await prisma.sharedSummary.delete({ where: { summaryId } }).catch(() => {});
    return null;
  }

  return toShareInfo(existing.token, existing.expiresAt);
}

export async function createOrRotateShare(
  auth0Sub: string,
  summaryId: string,
  expiresInDays?: number
): Promise<ShareInfo> {
  await findOwnedSummary(auth0Sub, summaryId);
  assertValidExpiryDays(expiresInDays);

  const token = generateToken();
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

  const record = await prisma.sharedSummary.upsert({
    where: { summaryId },
    create: { summaryId, token, expiresAt },
    update: { token, expiresAt },
  });

  return toShareInfo(record.token, record.expiresAt);
}

export async function revokeShare(auth0Sub: string, summaryId: string): Promise<void> {
  await findOwnedSummary(auth0Sub, summaryId);
  await prisma.sharedSummary.deleteMany({ where: { summaryId } });
}

export async function getPublicSharedSummary(token: string): Promise<PublicSharedSummary | null> {
  const shared = await prisma.sharedSummary.findUnique({
    where: { token },
    include: { summary: true },
  });
  if (!shared) return null;

  if (isExpired(shared.expiresAt)) {
    await prisma.sharedSummary.delete({ where: { token } }).catch(() => {});
    return null;
  }

  return {
    // Only the generated output is public; the original pasted text stays private.
    summary: shared.summary.outputText,
    mode: shared.summary.mode,
    provider: shared.summary.provider,
    model: shared.summary.model,
    createdAt: shared.summary.createdAt.toISOString(),
    expiresAt: shared.expiresAt ? shared.expiresAt.toISOString() : null,
  };
}
