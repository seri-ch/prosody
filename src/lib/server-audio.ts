import type { AudioFeatures } from "./audio-analysis";

const DEFAULT_FEATURES: AudioFeatures = {
  pitchMean: 150,
  pitchVariance: 30,
  pitchRange: 80,
  volumeMean: 0.5,
  volumeVariance: 0.1,
  trailingOffCount: 0,
  pitchTimeline: [],
  volumeTimeline: [],
};

export function parseClientAudioFeatures(raw: string | null): AudioFeatures | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as AudioFeatures;
  } catch {
    return undefined;
  }
}

export async function extractAudioFeatures(_audioBuffer: ArrayBuffer): Promise<AudioFeatures> {
  // Server-side WebM decoding requires ffmpeg; delivery metrics from
  // transcript timestamps remain fully functional. Client-side extraction
  // provides pitch/volume features when available.
  return DEFAULT_FEATURES;
}
