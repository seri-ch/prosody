import { prisma } from "./db";
import type { BaselineMetrics, DeliveryMetrics, SessionMetrics } from "@/types";

export async function checkAndAwardBadges(
  userId: string,
  metrics: SessionMetrics,
  streakCount: number,
  mode: string
) {
  const badges = await prisma.badge.findMany();
  const earned = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const earnedIds = new Set(earned.map((b) => b.badgeId));
  const newlyEarned: string[] = [];

  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;

    let qualifies = false;

    switch (badge.slug) {
      case "first-session":
        qualifies = true;
        break;
      case "filler-ninja":
        qualifies = metrics.delivery.fillerWordRate <= (badge.threshold ?? 0.02);
        break;
      case "steady-hand":
        qualifies = metrics.delivery.pitchVariance >= (badge.threshold ?? 50);
        break;
      case "marathoner":
        qualifies = streakCount >= (badge.threshold ?? 7);
        break;
      case "speed-demon":
        qualifies =
          metrics.delivery.wordsPerMinute >= 130 &&
          metrics.delivery.wordsPerMinute <= 160;
        break;
      case "structured-thinker":
        qualifies = metrics.content.structureScore >= (badge.threshold ?? 80);
        break;
      case "debate-champion": {
        const debateCount = await prisma.session.count({
          where: { userId, mode: "debate" },
        });
        qualifies = debateCount >= (badge.threshold ?? 5);
        break;
      }
    }

    if (qualifies) {
      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });
      newlyEarned.push(badge.name);
    }
  }

  return newlyEarned;
}

export async function updateUserStreak(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { streakCount: 0, longestStreak: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let newStreak = user.streakCount;
  let longestStreak = user.longestStreak;

  if (user.lastPracticeDate) {
    const last = new Date(user.lastPracticeDate);
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day, no change
    } else if (diffDays === 1) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  longestStreak = Math.max(longestStreak, newStreak);

  await prisma.user.update({
    where: { id: userId },
    data: {
      streakCount: newStreak,
      longestStreak,
      lastPracticeDate: new Date(),
    },
  });

  return { streakCount: newStreak, longestStreak };
}

export async function updateUserBaseline(
  userId: string,
  delivery: DeliveryMetrics
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const current: BaselineMetrics | null = user.baselineMetrics
    ? JSON.parse(user.baselineMetrics)
    : null;

  const count = (current?.sampleCount ?? 0) + 1;
  const weight = 1 / count;

  const updated: BaselineMetrics = {
    wpm: Math.round(
      ((current?.wpm ?? delivery.wordsPerMinute) * (1 - weight) +
        delivery.wordsPerMinute * weight) *
        10
    ) / 10,
    fillerRate:
      Math.round(
        ((current?.fillerRate ?? delivery.fillerWordRate) * (1 - weight) +
          delivery.fillerWordRate * weight) *
          1000
      ) / 1000,
    pitchVariance: Math.round(
      (current?.pitchVariance ?? delivery.pitchVariance) * (1 - weight) +
        delivery.pitchVariance * weight
    ),
    volumeVariance:
      Math.round(
        ((current?.volumeVariance ?? delivery.volumeVariance) * (1 - weight) +
          delivery.volumeVariance * weight) *
          10000
      ) / 10000,
    sampleCount: count,
  };

  await prisma.user.update({
    where: { id: userId },
    data: { baselineMetrics: JSON.stringify(updated) },
  });
}

export async function getOrCreateDailyChallenge() {
  const today = new Date().toISOString().split("T")[0];

  let challenge = await prisma.dailyChallenge.findUnique({
    where: { date: today },
  });

  if (!challenge) {
    const topics = [
      {
        topic: "Should social media platforms be regulated like utilities?",
        primer: "Social media has become essential infrastructure for communication, news, and commerce. Some argue it should be treated like a public utility with government oversight, while others say regulation would stifle innovation and free speech.",
        category: "Social Issues",
      },
      {
        topic: "Describe a time you changed your mind about something important",
        primer: "Growth often comes from reconsidering our beliefs. Think about a moment when new evidence, experience, or perspective shifted your thinking on a meaningful topic.",
        category: "Personal Growth",
      },
      {
        topic: "Is remote work better for productivity than office work?",
        primer: "The great remote work experiment of 2020-2024 produced conflicting data. Some companies report higher productivity, others insist innovation requires in-person collaboration.",
        category: "Business & Leadership",
      },
      {
        topic: "What would you tell your younger self?",
        primer: "Hindsight offers clarity that the moment never provides. Consider what wisdom you've gained that would have been most valuable earlier in your journey.",
        category: "Personal Growth",
      },
      {
        topic: "Should AI-generated content be labeled?",
        primer: "As AI tools produce increasingly convincing text, images, and video, the line between human and machine-created content blurs. Transparency advocates push for mandatory labeling.",
        category: "Technology & Innovation",
      },
    ];

    const dayIndex = new Date().getDay() % topics.length;
    const selected = topics[dayIndex];

    challenge = await prisma.dailyChallenge.create({
      data: {
        date: today,
        topic: selected.topic,
        primer: selected.primer,
        category: selected.category,
      },
    });
  }

  return challenge;
}
