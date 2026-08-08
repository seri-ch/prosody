export type PracticeMode =
  | "impromptu"
  | "prepared"
  | "debate"
  | "interview"
  | "storytelling"
  | "smalltalk"
  | "rapidfire";

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface DeliveryMetrics {
  wordsPerMinute: number;
  wpmVariance: number;
  fillerWordCount: number;
  fillerWordRate: number;
  fillerWords: { word: string; timestamp: number }[];
  pauseCount: number;
  avgPauseDuration: number;
  strategicPauses: number;
  hesitationPauses: number;
  pitchMean: number;
  pitchVariance: number;
  pitchRange: number;
  monotoneScore: number;
  volumeMean: number;
  volumeVariance: number;
  trailingOffCount: number;
  articulationScore: number;
  speakingTimeSeconds: number;
  silenceRatio: number;
}

export interface ContentMetrics {
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
}

export interface SessionMetrics {
  delivery: DeliveryMetrics;
  content: ContentMetrics;
  overallScore: number;
  skillRadar: {
    clarity: number;
    confidence: number;
    structure: number;
    pacing: number;
    vocabulary: number;
  };
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  type: "filler" | "pause" | "pace_spike" | "pace_drop" | "volume_drop" | "pitch_flat";
  timestamp: number;
  duration?: number;
  label: string;
}

export interface SessionFeedback {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  focusPoint: string;
  deliveryNotes: string[];
  contentNotes: string[];
  nextDrill?: string;
}

export interface BaselineMetrics {
  wpm: number;
  fillerRate: number;
  pitchVariance: number;
  volumeVariance: number;
  sampleCount: number;
}

export interface TopicResponse {
  topic: string;
  primer: string;
  category: string;
  prepTimeSeconds: number;
  speakTimeSeconds: number;
}

export const PRACTICE_MODES: {
  id: PracticeMode;
  name: string;
  description: string;
  prepTime: number;
  speakTime: number;
  icon: string;
}[] = [
  {
    id: "impromptu",
    name: "Impromptu Speech",
    description: "30 seconds prep, then speak on a random topic",
    prepTime: 30,
    speakTime: 120,
    icon: "Zap",
  },
  {
    id: "prepared",
    name: "Prepared Speech",
    description: "Read the primer, take your time, deliver a structured response",
    prepTime: 120,
    speakTime: 180,
    icon: "BookOpen",
  },
  {
    id: "debate",
    name: "Debate Mode",
    description: "Take a position — the AI will push back with counter-arguments",
    prepTime: 60,
    speakTime: 120,
    icon: "Swords",
  },
  {
    id: "interview",
    name: "Interview Simulation",
    description: "Answer questions with contextual follow-ups",
    prepTime: 15,
    speakTime: 180,
    icon: "MessageSquare",
  },
  {
    id: "storytelling",
    name: "Storytelling",
    description: "Practice narrative structure, pacing, and delivery",
    prepTime: 45,
    speakTime: 180,
    icon: "Sparkles",
  },
  {
    id: "smalltalk",
    name: "Social Scenarios",
    description: "Practice real-world situations: networking, toasts, awkward moments",
    prepTime: 20,
    speakTime: 90,
    icon: "Users",
  },
  {
    id: "rapidfire",
    name: "Rapid Fire",
    description: "Topic changes every 45 seconds — trains adaptability",
    prepTime: 10,
    speakTime: 180,
    icon: "Flame",
  },
];

export const TOPIC_CATEGORIES = [
  "Technology & Innovation",
  "Philosophy & Ethics",
  "Current Events",
  "Personal Growth",
  "Creative & Arts",
  "Science & Nature",
  "Business & Leadership",
  "Social Issues",
  "History & Culture",
  "Random & Fun",
];
