import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function getOrCreateUser(userId: string, name?: string) {
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    user = await prisma.user.create({
      data: { id: userId, name: name || "Speaker" },
    });
  }
  return user;
}

export async function seedBadges() {
  const badges = [
    { slug: "first-session", name: "First Words", description: "Complete your first practice session", icon: "Mic", metric: null, threshold: null },
    { slug: "filler-ninja", name: "Filler Word Ninja", description: "Keep filler words under 2% in a session", icon: "Shield", metric: "fillerRate", threshold: 0.02 },
    { slug: "steady-hand", name: "Steady Hand", description: "Maintain consistent pitch variance", icon: "TrendingUp", metric: "pitchVariance", threshold: 50 },
    { slug: "marathoner", name: "Marathoner", description: "Maintain a 7-day practice streak", icon: "Flame", metric: "streak", threshold: 7 },
    { slug: "speed-demon", name: "Pace Master", description: "Hit the ideal WPM range (130-160)", icon: "Gauge", metric: "wpm", threshold: 145 },
    { slug: "structured-thinker", name: "Structured Thinker", description: "Score 80+ on structure in a session", icon: "Layout", metric: "structure", threshold: 80 },
    { slug: "debate-champion", name: "Debate Champion", description: "Complete 5 debate mode sessions", icon: "Swords", metric: "debateCount", threshold: 5 },
    { slug: "daily-warrior", name: "Daily Warrior", description: "Complete the daily challenge", icon: "Target", metric: "dailyChallenge", threshold: 1 },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: {},
      create: badge,
    });
  }
}
