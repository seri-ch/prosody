import { NextRequest, NextResponse } from "next/server";
import { generateTopic } from "@/lib/openai";
import type { PracticeMode } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = (body.mode || "impromptu") as PracticeMode;
    const category = body.category as string | undefined;

    const topic = await generateTopic(mode, category);
    return NextResponse.json(topic);
  } catch (error) {
    console.error("Topic generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate topic";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
