import { prisma } from "../lib/prisma";

export interface UserSettings {
  preferredProvider: string | null;
  preferredMode: string;
  preferredExportFormat: string;
}

async function upsertUser(auth0Sub: string) {
  return prisma.user.upsert({
    where: { auth0Sub },
    update: {},
    create: { auth0Sub },
  });
}

function toSettings(user: { preferredProvider: string | null; preferredMode: string; preferredExportFormat: string }): UserSettings {
  return {
    preferredProvider: user.preferredProvider,
    preferredMode: user.preferredMode,
    preferredExportFormat: user.preferredExportFormat,
  };
}

export async function getUserSettings(auth0Sub: string): Promise<UserSettings> {
  const user = await upsertUser(auth0Sub);
  return toSettings(user);
}

export async function updateUserSettings(
  auth0Sub: string,
  patch: Partial<{ preferredProvider: string | null; preferredMode: string; preferredExportFormat: string }>
): Promise<UserSettings> {
  await upsertUser(auth0Sub);
  const user = await prisma.user.update({
    where: { auth0Sub },
    data: patch,
  });
  return toSettings(user);
}

// Used server-side by the summarize flow to honor the user's preferred provider
// without requiring the frontend to resend it on every request.
export async function getPreferredProvider(auth0Sub: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { auth0Sub }, select: { preferredProvider: true } });
  return user?.preferredProvider ?? null;
}
