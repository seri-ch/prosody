import { NextRequest, NextResponse } from "next/server";
import { prisma, getOrCreateUser } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    await getOrCreateUser(userId);

    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const parsed = sessions.map((s) => ({
      id: s.id,
      mode: s.mode,
      topic: s.topic,
      primer: s.primer,
      transcript: s.transcript,
      audioPath: s.audioPath,
      durationSeconds: s.durationSeconds,
      metrics: s.metrics ? JSON.parse(s.metrics) : null,
      feedback: s.feedback ? JSON.parse(s.feedback) : null,
      focusPoint: s.focusPoint,
      reflection: s.reflection,
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Sessions fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, sessionId, reflection } = body;

    if (!userId || !sessionId) {
      return NextResponse.json({ error: "userId and sessionId required" }, { status: 400 });
    }

    const session = await prisma.session.update({
      where: { id: sessionId, userId },
      data: { reflection },
    });

    return NextResponse.json({ success: true, sessionId: session.id });
  } catch (error) {
    console.error("Session update error:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
