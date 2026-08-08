import OpenAI from "openai";
import type { PracticeMode, TopicResponse } from "@/types";

let openaiClient: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured. Add it to your .env file.");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function generateTopic(
  mode: PracticeMode,
  category?: string
): Promise<TopicResponse> {
  const openai = getOpenAI();

  const modeContext: Record<PracticeMode, string> = {
    impromptu: "a thought-provoking topic suitable for a 2-minute impromptu speech",
    prepared: "a nuanced topic that rewards preparation and structured argument",
    debate: "a debatable proposition with clear pro/con sides",
    interview: "a common behavioral interview question",
    storytelling: "a storytelling prompt that invites a personal narrative",
    smalltalk: "a specific social scenario (networking event, meeting someone's parents, making a toast, declining plans gracefully, etc.)",
    rapidfire: "a quick, fun topic that can be discussed briefly",
  };

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You generate speaking practice topics. Return valid JSON only with keys: topic (string), primer (string, 2-3 sentences of background), category (string).`,
      },
      {
        role: "user",
        content: `Generate ${modeContext[mode]}${category ? ` in the category "${category}"` : ""}. Make it engaging and specific, not generic.`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.9,
  });

  const parsed = JSON.parse(response.choices[0].message.content || "{}");

  const prepTimes: Record<PracticeMode, number> = {
    impromptu: 30,
    prepared: 120,
    debate: 60,
    interview: 15,
    storytelling: 45,
    smalltalk: 20,
    rapidfire: 10,
  };

  const speakTimes: Record<PracticeMode, number> = {
    impromptu: 120,
    prepared: 180,
    debate: 120,
    interview: 180,
    storytelling: 180,
    smalltalk: 90,
    rapidfire: 180,
  };

  return {
    topic: parsed.topic || "The future of remote work",
    primer: parsed.primer || "Remote work has transformed how we think about offices, collaboration, and work-life balance.",
    category: parsed.category || category || "General",
    prepTimeSeconds: prepTimes[mode],
    speakTimeSeconds: speakTimes[mode],
  };
}

export async function analyzeContent(
  transcript: string,
  topic: string,
  mode: PracticeMode
): Promise<{
  structureScore: number;
  coherenceScore: number;
  specificityScore: number;
  vocabularyScore: number;
  persuasivenessScore: number;
  hasIntro: boolean;
  hasConclusion: boolean;
  repetitiveWords: string[];
  strengths: string[];
  weaknesses: string[];
}> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert speech coach analyzing spoken content. Score each dimension 0-100. Return JSON with:
- structureScore (intro/body/conclusion organization)
- coherenceScore (logical flow, each point supports the topic)
- specificityScore (concrete examples vs vague platitudes)
- vocabularyScore (word choice variety and strength)
- persuasivenessScore (rhetorical effectiveness)
- hasIntro (boolean)
- hasConclusion (boolean)
- repetitiveWords (array of overused words, max 5)
- strengths (array of 2-3 specific strengths)
- weaknesses (array of 2-3 specific weaknesses)

Be honest but constructive. Mode: ${mode}.`,
      },
      {
        role: "user",
        content: `Topic: "${topic}"\n\nTranscript:\n"${transcript}"`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");

  return {
    structureScore: result.structureScore ?? 50,
    coherenceScore: result.coherenceScore ?? 50,
    specificityScore: result.specificityScore ?? 50,
    vocabularyScore: result.vocabularyScore ?? 50,
    persuasivenessScore: result.persuasivenessScore ?? 50,
    hasIntro: result.hasIntro ?? false,
    hasConclusion: result.hasConclusion ?? false,
    repetitiveWords: result.repetitiveWords ?? [],
    strengths: result.strengths ?? [],
    weaknesses: result.weaknesses ?? [],
  };
}

export async function synthesizeFeedback(
  transcript: string,
  topic: string,
  mode: PracticeMode,
  deliveryMetrics: Record<string, unknown>,
  contentMetrics: Record<string, unknown>
): Promise<{
  summary: string;
  strengths: string[];
  weaknesses: string[];
  focusPoint: string;
  deliveryNotes: string[];
  contentNotes: string[];
  nextDrill?: string;
}> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a supportive but honest speech coach. Synthesize delivery metrics and content analysis into actionable feedback.

Rules:
- Give ONE specific focus point for the next session (not a wall of criticism)
- Reference actual numbers from delivery metrics when relevant
- Be encouraging but precise
- Suggest a specific drill if a weakness is detected

Return JSON with: summary (2-3 sentences), strengths (array, max 3), weaknesses (array, max 3), focusPoint (single sentence, the ONE thing to work on next), deliveryNotes (array of 2-3 delivery-specific observations), contentNotes (array of 2-3 content-specific observations), nextDrill (optional string describing a 5-min drill).`,
      },
      {
        role: "user",
        content: `Topic: "${topic}" | Mode: ${mode}

Transcript: "${transcript.slice(0, 2000)}"

Delivery Metrics: ${JSON.stringify(deliveryMetrics, null, 2)}

Content Metrics: ${JSON.stringify(contentMetrics, null, 2)}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");

  return {
    summary: result.summary || "Good effort! Keep practicing to build confidence.",
    strengths: result.strengths || [],
    weaknesses: result.weaknesses || [],
    focusPoint: result.focusPoint || "Focus on reducing filler words in your next session.",
    deliveryNotes: result.deliveryNotes || [],
    contentNotes: result.contentNotes || [],
    nextDrill: result.nextDrill,
  };
}

export async function generateDebateRebuttal(
  topic: string,
  userArgument: string
): Promise<string> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a skilled debater taking the opposing position. Give a concise 2-3 sentence counter-argument that challenges the speaker's points. Be respectful but push them to think on their feet.",
      },
      {
        role: "user",
        content: `Topic: "${topic}"\n\nSpeaker's argument: "${userArgument}"\n\nGive your counter-argument.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  return response.choices[0].message.content || "That's an interesting perspective, but have you considered the opposing view?";
}

export async function generateInterviewFollowUp(
  question: string,
  answer: string,
  questionNumber: number
): Promise<string> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a professional interviewer. Based on the candidate's answer, ask ONE specific follow-up question that probes deeper — like a real interviewer would. Keep it concise (1-2 sentences).",
      },
      {
        role: "user",
        content: `Original question: "${question}"\nAnswer: "${answer}"\nThis is follow-up #${questionNumber}. Ask your next question.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 150,
  });

  return response.choices[0].message.content || "Can you tell me more about that experience?";
}

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<{
  text: string;
  words: { word: string; start: number; end: number }[];
  duration: number;
}> {
  const openai = getOpenAI();

  const uint8 = new Uint8Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.byteLength).slice();
  const file = new File([uint8], filename, { type: "audio/webm" });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["word"],
  });

  const words = (transcription.words || []).map((w) => ({
    word: w.word,
    start: w.start,
    end: w.end,
  }));

  return {
    text: transcription.text,
    words,
    duration: transcription.duration || 0,
  };
}