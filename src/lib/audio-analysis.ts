import type {
  DeliveryMetrics,
  SessionMetrics,
  TimelineEvent,
  WordTimestamp,
  ContentMetrics,
  BaselineMetrics,
} from "@/types";

const FILLER_WORDS = new Set([
  "um", "uh", "er", "ah", "like", "you know", "basically", "actually",
  "literally", "sort of", "kind of", "i mean", "right", "so yeah",
  "well", "okay so", "honestly",
]);

const HESITATION_PAUSE_MS = 800;
const STRATEGIC_PAUSE_MIN_MS = 400;
const STRATEGIC_PAUSE_MAX_MS = 1500;
const PACE_SPIKE_THRESHOLD = 1.4;
const PACE_DROP_THRESHOLD = 0.6;

export function analyzeDeliveryFromTranscript(
  words: WordTimestamp[],
  duration: number,
  audioFeatures?: AudioFeatures
): DeliveryMetrics {
  if (words.length === 0) {
    return emptyDeliveryMetrics(duration);
  }

  const fillers = detectFillerWords(words);
  const pauses = detectPauses(words);
  const wpmAnalysis = analyzeWPM(words, duration);

  const pitchMean = audioFeatures?.pitchMean ?? 150;
  const pitchVariance = audioFeatures?.pitchVariance ?? 30;
  const pitchRange = audioFeatures?.pitchRange ?? 80;
  const volumeMean = audioFeatures?.volumeMean ?? 0.5;
  const volumeVariance = audioFeatures?.volumeVariance ?? 0.1;
  const trailingOffCount = audioFeatures?.trailingOffCount ?? 0;

  const speakingTime = words.length > 0
    ? words[words.length - 1].end - words[0].start
    : 0;
  const silenceRatio = duration > 0 ? 1 - speakingTime / duration : 0;

  const monotoneScore = calculateMonotoneScore(pitchVariance);
  const articulationScore = calculateArticulationScore(words, wpmAnalysis.avgWpm);

  return {
    wordsPerMinute: wpmAnalysis.avgWpm,
    wpmVariance: wpmAnalysis.variance,
    fillerWordCount: fillers.length,
    fillerWordRate: words.length > 0 ? fillers.length / words.length : 0,
    fillerWords: fillers,
    pauseCount: pauses.length,
    avgPauseDuration: pauses.length > 0
      ? pauses.reduce((s, p) => s + p.duration, 0) / pauses.length
      : 0,
    strategicPauses: pauses.filter((p) => p.type === "strategic").length,
    hesitationPauses: pauses.filter((p) => p.type === "hesitation").length,
    pitchMean,
    pitchVariance,
    pitchRange,
    monotoneScore,
    volumeMean,
    volumeVariance,
    trailingOffCount,
    articulationScore,
    speakingTimeSeconds: speakingTime,
    silenceRatio,
  };
}

function emptyDeliveryMetrics(duration: number): DeliveryMetrics {
  return {
    wordsPerMinute: 0,
    wpmVariance: 0,
    fillerWordCount: 0,
    fillerWordRate: 0,
    fillerWords: [],
    pauseCount: 0,
    avgPauseDuration: 0,
    strategicPauses: 0,
    hesitationPauses: 0,
    pitchMean: 0,
    pitchVariance: 0,
    pitchRange: 0,
    monotoneScore: 50,
    volumeMean: 0,
    volumeVariance: 0,
    trailingOffCount: 0,
    articulationScore: 50,
    speakingTimeSeconds: 0,
    silenceRatio: duration > 0 ? 1 : 0,
  };
}

function detectFillerWords(words: WordTimestamp[]): { word: string; timestamp: number }[] {
  const fillers: { word: string; timestamp: number }[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i].word.toLowerCase().replace(/[.,!?;:'"]/g, "");

    if (FILLER_WORDS.has(w)) {
      fillers.push({ word: w, timestamp: words[i].start });
      continue;
    }

    if (i < words.length - 1) {
      const bigram = `${w} ${words[i + 1].word.toLowerCase().replace(/[.,!?;:'"]/g, "")}`;
      if (FILLER_WORDS.has(bigram)) {
        fillers.push({ word: bigram, timestamp: words[i].start });
        i++;
      }
    }
  }

  return fillers;
}

function detectPauses(words: WordTimestamp[]): { duration: number; timestamp: number; type: "strategic" | "hesitation" }[] {
  const pauses: { duration: number; timestamp: number; type: "strategic" | "hesitation" }[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    const gap = words[i + 1].start - words[i].end;
    const gapMs = gap * 1000;

    if (gapMs >= STRATEGIC_PAUSE_MIN_MS) {
      const type = gapMs >= HESITATION_PAUSE_MS ? "hesitation" : "strategic";
      pauses.push({ duration: gap, timestamp: words[i].end, type });
    }
  }

  return pauses;
}

function analyzeWPM(words: WordTimestamp[], duration: number): {
  avgWpm: number;
  variance: number;
  segments: { start: number; wpm: number }[];
} {
  if (words.length < 2 || duration <= 0) {
    return { avgWpm: 0, variance: 0, segments: [] };
  }

  const totalWords = words.length;
  const speakingDuration = words[words.length - 1].end - words[0].start;
  const avgWpm = speakingDuration > 0 ? (totalWords / speakingDuration) * 60 : 0;

  const segmentSize = 15;
  const segments: { start: number; wpm: number }[] = [];

  for (let i = 0; i < words.length; i += segmentSize) {
    const chunk = words.slice(i, i + segmentSize);
    if (chunk.length < 2) continue;
    const chunkDuration = chunk[chunk.length - 1].end - chunk[0].start;
    if (chunkDuration > 0) {
      segments.push({
        start: chunk[0].start,
        wpm: (chunk.length / chunkDuration) * 60,
      });
    }
  }

  const wpms = segments.map((s) => s.wpm);
  const mean = wpms.length > 0 ? wpms.reduce((a, b) => a + b, 0) / wpms.length : avgWpm;
  const variance = wpms.length > 1
    ? wpms.reduce((s, w) => s + (w - mean) ** 2, 0) / wpms.length
    : 0;

  return { avgWpm: Math.round(avgWpm), variance: Math.round(variance), segments };
}

function calculateMonotoneScore(pitchVariance: number): number {
  if (pitchVariance >= 40) return 90;
  if (pitchVariance >= 25) return 70;
  if (pitchVariance >= 15) return 50;
  return 30;
}

function calculateArticulationScore(words: WordTimestamp[], wpm: number): number {
  let score = 80;

  if (wpm > 180) score -= 20;
  else if (wpm > 160) score -= 10;
  if (wpm < 100) score -= 15;

  const avgWordDuration = words.length > 1
    ? (words[words.length - 1].end - words[0].start) / words.length
    : 0.3;

  if (avgWordDuration < 0.15) score -= 15;

  return Math.max(0, Math.min(100, score));
}

export interface AudioFeatures {
  pitchMean: number;
  pitchVariance: number;
  pitchRange: number;
  volumeMean: number;
  volumeVariance: number;
  trailingOffCount: number;
  pitchTimeline: { time: number; pitch: number }[];
  volumeTimeline: { time: number; volume: number }[];
}

export function buildTimeline(
  words: WordTimestamp[],
  delivery: DeliveryMetrics,
  wpmSegments: { start: number; wpm: number }[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const filler of delivery.fillerWords) {
    events.push({
      type: "filler",
      timestamp: filler.timestamp,
      label: `Filler: "${filler.word}"`,
    });
  }

  if (wpmSegments.length > 1) {
    const avgWpm = wpmSegments.reduce((s, seg) => s + seg.wpm, 0) / wpmSegments.length;
    for (const seg of wpmSegments) {
      if (seg.wpm > avgWpm * PACE_SPIKE_THRESHOLD) {
        events.push({
          type: "pace_spike",
          timestamp: seg.start,
          label: `Pace spike: ${Math.round(seg.wpm)} WPM`,
        });
      } else if (seg.wpm < avgWpm * PACE_DROP_THRESHOLD) {
        events.push({
          type: "pace_drop",
          timestamp: seg.start,
          label: `Pace drop: ${Math.round(seg.wpm)} WPM`,
        });
      }
    }
  }

  events.sort((a, b) => a.timestamp - b.timestamp);
  return events;
}

export function computeSessionMetrics(
  delivery: DeliveryMetrics,
  content: ContentMetrics,
  words: WordTimestamp[],
  duration: number
): SessionMetrics {
  const wpmAnalysis = analyzeWPM(words, duration);

  const clarity = Math.round(
    delivery.articulationScore * 0.4 +
    (100 - delivery.fillerWordRate * 500) * 0.3 +
    content.specificityScore * 0.3
  );

  const confidence = Math.round(
    delivery.monotoneScore * 0.3 +
    (100 - delivery.hesitationPauses * 10) * 0.3 +
    (100 - delivery.trailingOffCount * 5) * 0.2 +
    content.coherenceScore * 0.2
  );

  const pacing = Math.round(
    (delivery.wordsPerMinute >= 120 && delivery.wordsPerMinute <= 170 ? 80 : 50) * 0.5 +
    (100 - delivery.wpmVariance) * 0.3 +
    delivery.strategicPauses * 5 * 0.2
  );

  const overallScore = Math.round(
    clarity * 0.25 +
    confidence * 0.2 +
    content.structureScore * 0.2 +
    pacing * 0.15 +
    content.vocabularyScore * 0.1 +
    content.coherenceScore * 0.1
  );

  return {
    delivery,
    content,
    overallScore: Math.min(100, Math.max(0, overallScore)),
    skillRadar: {
      clarity: Math.min(100, Math.max(0, clarity)),
      confidence: Math.min(100, Math.max(0, confidence)),
      structure: content.structureScore,
      pacing: Math.min(100, Math.max(0, pacing)),
      vocabulary: content.vocabularyScore,
    },
    timeline: buildTimeline(words, delivery, wpmAnalysis.segments),
  };
}

export function calibrateAgainstBaseline(
  metrics: DeliveryMetrics,
  baseline: BaselineMetrics | null
): DeliveryMetrics {
  if (!baseline || baseline.sampleCount < 3) return metrics;
  return metrics;
}

export function updateBaseline(
  current: BaselineMetrics | null,
  metrics: DeliveryMetrics
): BaselineMetrics {
  const count = (current?.sampleCount ?? 0) + 1;
  const weight = 1 / count;

  return {
    wpm: (current?.wpm ?? metrics.wordsPerMinute) * (1 - weight) + metrics.wordsPerMinute * weight,
    fillerRate: (current?.fillerRate ?? metrics.fillerWordRate) * (1 - weight) + metrics.fillerWordRate * weight,
    pitchVariance: (current?.pitchVariance ?? metrics.pitchVariance) * (1 - weight) + metrics.pitchVariance * weight,
    volumeVariance: (current?.volumeVariance ?? metrics.volumeVariance) * (1 - weight) + metrics.volumeVariance * weight,
    sampleCount: count,
  };
}
