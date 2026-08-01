import { prisma } from "../lib/prisma";

export interface DashboardStats {
  totalSummaries: number;
  totalWordsProcessed: number;
  avgCompressionRatio: number | null; // outputWords / inputWords, e.g. 0.18 = summaries are ~18% of original length
  mostUsedModel: string | null;
  recentActivity: {
    id: string;
    mode: string;
    provider: string;
    model: string | null;
    inputWordCount: number;
    outputWordCount: number;
    createdAt: Date;
  }[];
}

const EMPTY_STATS: DashboardStats = {
  totalSummaries: 0,
  totalWordsProcessed: 0,
  avgCompressionRatio: null,
  mostUsedModel: null,
  recentActivity: [],
};

export async function getDashboardStats(auth0Sub: string): Promise<DashboardStats> {
  const user = await prisma.user.findUnique({ where: { auth0Sub } });
  if (!user) return EMPTY_STATS;

  const [totals, modelGroups, recentActivity] = await Promise.all([
    prisma.summary.aggregate({
      where: { userId: user.id },
      _count: { _all: true },
      _sum: { inputWordCount: true, outputWordCount: true },
    }),
    prisma.summary.groupBy({
      by: ["provider", "model"],
      where: { userId: user.id },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    }),
    prisma.summary.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        mode: true,
        provider: true,
        model: true,
        inputWordCount: true,
        outputWordCount: true,
        createdAt: true,
      },
    }),
  ]);

  const totalInputWords = totals._sum.inputWordCount ?? 0;
  const totalOutputWords = totals._sum.outputWordCount ?? 0;
  const top = modelGroups[0];

  return {
    totalSummaries: totals._count._all,
    totalWordsProcessed: totalInputWords,
    avgCompressionRatio: totalInputWords > 0 ? totalOutputWords / totalInputWords : null,
    mostUsedModel: top ? top.model ?? top.provider : null,
    recentActivity,
  };
}
