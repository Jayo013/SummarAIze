import { prisma } from "../lib/prisma";
import { AppError } from "../utils/errors";
import { generateChatReply, type ChatTurn } from "./chatReply.service";
import { SUMMARY_MODE_LABELS, type SummaryMode } from "./summaryModes";

// Cap on messages returned/sent to the model per request. Keeps the read query and the
// in-memory history bounded even for a summary with a very long-running conversation.
const MAX_STORED_MESSAGES = 100;

export interface StoredChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

async function findOwnedSummary(auth0Sub: string, summaryId: string) {
  const user = await prisma.user.findUnique({ where: { auth0Sub } });
  if (!user) throw new AppError(404, "Summary not found.");
  const summary = await prisma.summary.findFirst({ where: { id: summaryId, userId: user.id } });
  if (!summary) throw new AppError(404, "Summary not found.");
  return summary;
}

function modeLabel(mode: string): string {
  return SUMMARY_MODE_LABELS[mode as SummaryMode] ?? mode;
}

export async function getChatHistory(auth0Sub: string, summaryId: string): Promise<StoredChatMessage[]> {
  await findOwnedSummary(auth0Sub, summaryId);
  return prisma.chatMessage.findMany({
    where: { summaryId },
    orderBy: { createdAt: "asc" },
    take: MAX_STORED_MESSAGES,
    select: { id: true, role: true, content: true, createdAt: true },
  });
}

export async function clearChatHistory(auth0Sub: string, summaryId: string): Promise<void> {
  await findOwnedSummary(auth0Sub, summaryId);
  await prisma.chatMessage.deleteMany({ where: { summaryId } });
}

export interface AskResult {
  reply: string;
  provider: string;
  model?: string;
  userMessage: StoredChatMessage;
  assistantMessage: StoredChatMessage;
}

export async function askAboutSummary(auth0Sub: string, summaryId: string, question: string): Promise<AskResult> {
  const summary = await findOwnedSummary(auth0Sub, summaryId);

  const priorMessages = await prisma.chatMessage.findMany({
    where: { summaryId },
    orderBy: { createdAt: "asc" },
    take: MAX_STORED_MESSAGES,
    select: { role: true, content: true },
  });
  const history: ChatTurn[] = priorMessages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  const result = await generateChatReply(
    { modeLabel: modeLabel(summary.mode), summaryText: summary.outputText },
    history,
    question
  );

  const [userMessage, assistantMessage] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: { summaryId, role: "user", content: question },
      select: { id: true, role: true, content: true, createdAt: true },
    }),
    prisma.chatMessage.create({
      data: { summaryId, role: "assistant", content: result.reply },
      select: { id: true, role: true, content: true, createdAt: true },
    }),
  ]);

  return { reply: result.reply, provider: result.provider, model: result.model, userMessage, assistantMessage };
}
