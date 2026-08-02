import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { getOrSetCache } from "../utils/cache";

const PROVIDERS_CACHE_TTL_MS = 120_000;

export interface HistoryQuery {
  auth0Sub: string;
  search?: string;
  mode?: string;
  provider?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  limit: number;
}

export interface HistoryItem {
  id: string;
  mode: string;
  provider: string;
  model: string | null;
  inputWordCount: number;
  outputWordCount: number;
  preview: string;
  createdAt: Date;
  promptVersion: string | null;
  qualityScore: number | null;
  qualityFlags: string[];
}

const PREVIEW_LENGTH = 240;

function toPreview(outputText: string): string {
  return outputText.length > PREVIEW_LENGTH ? `${outputText.slice(0, PREVIEW_LENGTH)}…` : outputText;
}

export interface HistoryResult {
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const EMPTY_RESULT = (page: number, limit: number): HistoryResult => ({
  items: [],
  total: 0,
  page,
  limit,
  totalPages: 0,
});

export function buildHistoryWhere(
  userId: string,
  filters: Pick<HistoryQuery, "mode" | "provider" | "dateFrom" | "dateTo" | "search">
): Prisma.SummaryWhereInput {
  const where: Prisma.SummaryWhereInput = { userId };

  if (filters.mode) where.mode = filters.mode;
  if (filters.provider) where.provider = filters.provider;

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
      ...(filters.dateTo ? { lte: filters.dateTo } : {}),
    };
  }

  if (filters.search) {
    where.OR = [
      { inputText: { contains: filters.search, mode: "insensitive" } },
      { outputText: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function getSummaryHistory(query: HistoryQuery): Promise<HistoryResult> {
  const user = await prisma.user.findUnique({ where: { auth0Sub: query.auth0Sub } });
  if (!user) return EMPTY_RESULT(query.page, query.limit);

  const where = buildHistoryWhere(user.id, query);
  const skip = (query.page - 1) * query.limit;

  const [total, rows] = await Promise.all([
    prisma.summary.count({ where }),
    prisma.summary.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
      select: {
        id: true,
        mode: true,
        provider: true,
        model: true,
        inputWordCount: true,
        outputWordCount: true,
        outputText: true,
        createdAt: true,
        promptVersion: true,
        qualityScore: true,
        qualityFlags: true,
      },
    }),
  ]);

  const items: HistoryItem[] = rows.map(({ outputText, ...rest }) => ({
    ...rest,
    preview: toPreview(outputText),
  }));

  return {
    items,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function getDistinctProviders(auth0Sub: string): Promise<string[]> {
  return getOrSetCache(`providers:${auth0Sub}`, PROVIDERS_CACHE_TTL_MS, async () => {
    const user = await prisma.user.findUnique({ where: { auth0Sub } });
    if (!user) return [];
    const rows = await prisma.summary.findMany({
      where: { userId: user.id },
      distinct: ["provider"],
      select: { provider: true },
      orderBy: { provider: "asc" },
    });
    return rows.map((r) => r.provider);
  });
}
