import { NextRequest, NextResponse } from "next/server";
import { generateDebateRebuttal, generateInterviewFollowUp } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, topic, text, question, questionNumber } = body;

    if (type === "debate") {
      const rebuttal = await generateDebateRebuttal(topic, text);
      return NextResponse.json({ response: rebuttal });
    }

    if (type === "interview") {
      const followUp = await generateInterviewFollowUp(
        question || topic,
        text,
        questionNumber || 1
      );
      return NextResponse.json({ response: followUp });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Conversational API error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
