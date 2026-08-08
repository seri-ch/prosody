import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { prisma, getOrCreateUser, seedBadges } from "@/lib/db";
import {
  transcribeAudio,
  analyzeContent,
  synthesizeFeedback,
} from "@/lib/openai";
import {
  analyzeDeliveryFromTranscript,
  computeSessionMetrics,
} from "@/lib/audio-analysis";
import { parseClientAudioFeatures } from "@/lib/server-audio";
import {
  checkAndAwardBadges,
  updateUserStreak,
  updateUserBaseline,
} from "@/lib/badges";
import type { PracticeMode } from "@/types";

export async function POST(req: NextRequest) {
  try {
    await seedBadges();

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const userId = formData.get("userId") as string;
    const topic = formData.get("topic") as string;
    const mode = (formData.get("mode") as PracticeMode) || "impromptu";
    const primer = formData.get("primer") as string | null;
    const reflection = formData.get("reflection") as string | null;

    if (!audioFile || !userId || !topic) {
      return NextResponse.json(
        { error: "Missing required fields: audio, userId, topic" },
        { status: 400 }
      );
    }

    await getOrCreateUser(userId);

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const sessionId = uuidv4();

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const audioFilename = `${sessionId}.webm`;
    const audioPath = path.join(uploadsDir, audioFilename);
    await writeFile(audioPath, audioBuffer);

    const clientFeatures = parseClientAudioFeatures(
      formData.get("audioFeatures") as string | null
    );

    const [transcription] = await Promise.all([
      transcribeAudio(audioBuffer, audioFilename),
    ]);

    const audioFeatures = clientFeatures;

    const delivery = analyzeDeliveryFromTranscript(
      transcription.words,
      transcription.duration,
      audioFeatures
    );

    const content = await analyzeContent(transcription.text, topic, mode);

    const sessionMetrics = computeSessionMetrics(
      delivery,
      content,
      transcription.words,
      transcription.duration
    );

    const feedback = await synthesizeFeedback(
      transcription.text,
      topic,
      mode,
      delivery as unknown as Record<string, unknown>,
      content as unknown as Record<string, unknown>
    );

    const [streakResult, newBadges] = await Promise.all([
      updateUserStreak(userId),
      checkAndAwardBadges(userId, sessionMetrics, 0, mode),
      updateUserBaseline(userId, delivery),
    ]);

    const session = await prisma.session.create({
      data: {
        id: sessionId,
        userId,
        mode,
        topic,
        primer,
        transcript: transcription.text,
        audioPath: `/uploads/${audioFilename}`,
        durationSeconds: transcription.duration,
        metrics: JSON.stringify(sessionMetrics),
        feedback: JSON.stringify(feedback),
        focusPoint: feedback.focusPoint,
        reflection,
      },
    });

    const badgesAfterStreak = await checkAndAwardBadges(
      userId,
      sessionMetrics,
      streakResult.streakCount,
      mode
    );

    return NextResponse.json({
      sessionId: session.id,
      transcript: transcription.text,
      metrics: sessionMetrics,
      feedback,
      streak: streakResult,
      newBadges: [...new Set([...newBadges, ...badgesAfterStreak])],
    });
  } catch (error) {
    console.error("Analysis error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const maxDuration = 60;
