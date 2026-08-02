import { prisma } from "../lib/prisma";
import { countWords } from "../utils/text";

async function upsertUser(auth0Sub: string) {
  return prisma.user.upsert({
    where: { auth0Sub },
    update: {},
    create: { auth0Sub },
  });
}

export async function saveSummary(params: {
  id: string;
  auth0Sub: string;
  inputText: string;
  outputText: string;
  provider: string;
  model?: string;
  mode: string;
  promptVersion?: string;
  qualityScore?: number;
  qualityFlags?: string[];
}) {
  const user = await upsertUser(params.auth0Sub);
  return prisma.summary.create({
    data: {
      id: params.id,
      userId: user.id,
      inputText: params.inputText,
      outputText: params.outputText,
      provider: params.provider,
      model: params.model,
      mode: params.mode,
      promptVersion: params.promptVersion,
      qualityScore: params.qualityScore,
      qualityFlags: params.qualityFlags ?? [],
      inputWordCount: countWords(params.inputText),
      outputWordCount: countWords(params.outputText),
    },
  });
}
