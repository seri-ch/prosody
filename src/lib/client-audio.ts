"use client";

import type { AudioFeatures } from "@/lib/audio-analysis";

export async function extractClientAudioFeatures(blob: Blob): Promise<AudioFeatures> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));

    const channelData = decoded.getChannelData(0);
    const sampleRate = decoded.sampleRate;
    const windowSize = Math.floor(sampleRate * 0.03);
    const hopSize = Math.floor(sampleRate * 0.015);

    const pitches: number[] = [];
    const volumes: number[] = [];
    const pitchTimeline: { time: number; pitch: number }[] = [];
    const volumeTimeline: { time: number; volume: number }[] = [];

    for (let i = 0; i + windowSize < channelData.length; i += hopSize) {
      const window = channelData.slice(i, i + windowSize);
      const time = i / sampleRate;

      const rms = Math.sqrt(window.reduce((s, v) => s + v * v, 0) / window.length);
      volumes.push(rms);
      volumeTimeline.push({ time, volume: rms });

      if (rms > 0.01) {
        const pitch = autocorrelatePitch(window, sampleRate);
        if (pitch > 50 && pitch < 500) {
          pitches.push(pitch);
          pitchTimeline.push({ time, pitch });
        }
      }
    }

    const pitchMean = pitches.length > 0 ? pitches.reduce((a, b) => a + b, 0) / pitches.length : 150;
    const pitchVariance = pitches.length > 1
      ? pitches.reduce((s, p) => s + (p - pitchMean) ** 2, 0) / pitches.length
      : 0;
    const pitchRange = pitches.length > 0 ? Math.max(...pitches) - Math.min(...pitches) : 0;

    const volumeMean = volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;
    const volumeVariance = volumes.length > 1
      ? volumes.reduce((s, v) => s + (v - volumeMean) ** 2, 0) / volumes.length
      : 0;

    let trailingOffCount = 0;
    for (let i = 1; i < volumeTimeline.length; i++) {
      if (volumeTimeline[i].volume < volumeTimeline[i - 1].volume * 0.5 && volumeTimeline[i].volume < volumeMean * 0.3) {
        trailingOffCount++;
      }
    }

    await audioContext.close();

    return {
      pitchMean: Math.round(pitchMean),
      pitchVariance: Math.round(pitchVariance),
      pitchRange: Math.round(pitchRange),
      volumeMean,
      volumeVariance,
      trailingOffCount,
      pitchTimeline,
      volumeTimeline,
    };
  } catch {
    return {
      pitchMean: 150,
      pitchVariance: 30,
      pitchRange: 80,
      volumeMean: 0.5,
      volumeVariance: 0.1,
      trailingOffCount: 0,
      pitchTimeline: [],
      volumeTimeline: [],
    };
  }
}

function autocorrelatePitch(buffer: Float32Array, sampleRate: number): number {
  const minPeriod = Math.floor(sampleRate / 500);
  const maxPeriod = Math.floor(sampleRate / 50);

  let bestCorrelation = 0;
  let bestPeriod = 0;

  for (let period = minPeriod; period < maxPeriod && period < buffer.length / 2; period++) {
    let correlation = 0;
    for (let i = 0; i < buffer.length - period; i++) {
      correlation += buffer[i] * buffer[i + period];
    }
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = period;
    }
  }

  return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
}
