import { prisma } from "../lib/prisma";

async function upsertUser(auth0Sub: string) {
  return prisma.user.upsert({
    where: { auth0Sub },
    update: {},
    create: { auth0Sub },
  });
}

export async function saveSummary(params: {
  auth0Sub: string;
  inputText: string;
  outputText: string;
  provider: string;
  model?: string;
  mode: string;
}) {
  const user = await upsertUser(params.auth0Sub);
  return prisma.summary.create({
    data: {
      userId: user.id,
      inputText: params.inputText,
      outputText: params.outputText,
      provider: params.provider,
      model: params.model,
      mode: params.mode,
    },
  });
}
