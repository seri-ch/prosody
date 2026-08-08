import { NextRequest, NextResponse } from "next/server";
import { prisma, getOrCreateUser, seedBadges } from "@/lib/db";
import { getOrCreateDailyChallenge } from "@/lib/badges";

export async function GET(req: NextRequest) {
  try {
    await seedBadges();

    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const user = await getOrCreateUser(userId);

    const [sessions, badges, dailyChallenge, sessionCount] = await Promise.all([
      prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      }),
      getOrCreateDailyChallenge(),
      prisma.session.count({ where: { userId } }),
    ]);

    const challengeCompleted = await prisma.challengeCompletion.findUnique({
      where: {
        userId_challengeId: {
          userId,
          challengeId: dailyChallenge.id,
        },
      },
    });

    const parsedSessions = sessions.map((s) => ({
      id: s.id,
      mode: s.mode,
      topic: s.topic,
      durationSeconds: s.durationSeconds,
      metrics: s.metrics ? JSON.parse(s.metrics) : null,
      feedback: s.feedback ? JSON.parse(s.feedback) : null,
      focusPoint: s.focusPoint,
      createdAt: s.createdAt.toISOString(),
    }));

    const trendData = parsedSessions
      .slice()
      .reverse()
      .map((s) => ({
        date: new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        overall: s.metrics?.overallScore ?? 0,
        wpm: s.metrics?.delivery?.wordsPerMinute ?? 0,
        fillers: Math.round((s.metrics?.delivery?.fillerWordRate ?? 0) * 100),
        clarity: s.metrics?.skillRadar?.clarity ?? 0,
        confidence: s.metrics?.skillRadar?.confidence ?? 0,
        structure: s.metrics?.skillRadar?.structure ?? 0,
      }));

    const latestMetrics = parsedSessions[0]?.metrics;
    const skillRadar = latestMetrics?.skillRadar ?? {
      clarity: 50,
      confidence: 50,
      structure: 50,
      pacing: 50,
      vocabulary: 50,
    };

    const avgOverall =
      parsedSessions.length > 0
        ? Math.round(
            parsedSessions.reduce((s, sess) => s + (sess.metrics?.overallScore ?? 0), 0) /
              parsedSessions.length
          )
        : 0;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        streakCount: user.streakCount,
        longestStreak: user.longestStreak,
        baselineMetrics: user.baselineMetrics ? JSON.parse(user.baselineMetrics) : null,
        sessionCount,
      },
      sessions: parsedSessions,
      badges: badges.map((ub) => ({
        name: ub.badge.name,
        description: ub.badge.description,
        icon: ub.badge.icon,
        earnedAt: ub.earnedAt.toISOString(),
      })),
      dailyChallenge: {
        ...dailyChallenge,
        completed: !!challengeCompleted,
      },
      trendData,
      skillRadar,
      stats: {
        avgOverall,
        totalSessions: sessionCount,
        totalMinutes: Math.round(
          parsedSessions.reduce((s, sess) => s + (sess.durationSeconds ?? 0), 0) / 60
        ),
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
