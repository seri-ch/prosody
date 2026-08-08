"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, Square, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  maxDuration?: number;
  isRecording: boolean;
  onRecordingChange: (recording: boolean) => void;
}

export function AudioRecorder({
  onRecordingComplete,
  maxDuration = 180,
  isRecording,
  onRecordingChange,
}: AudioRecorderProps) {
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [paused, setPaused] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

  const updateLevel = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    setAudioLevel(avg / 255);
    animFrameRef.current = requestAnimationFrame(updateLevel);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;
        onRecordingComplete(blob, elapsed);
        stream.getTracks().forEach((t) => t.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;
      setDuration(0);
      setPaused(false);
      onRecordingChange(true);
      updateLevel();

      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;
        setDuration(elapsed);
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 100);
    } catch {
      alert("Microphone access is required. Please allow microphone permissions and try again.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    onRecordingChange(false);
    setPaused(false);
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (paused) {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now();
      setPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      pausedDurationRef.current += Date.now() - startTimeRef.current;
      setPaused(true);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = (duration / maxDuration) * 100;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Visualizer */}
      <div className="relative">
        <div
          className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center transition-all",
            isRecording
              ? "bg-danger/10 border-2 border-danger/30"
              : "bg-accent/10 border-2 border-accent/30"
          )}
        >
          {isRecording && (
            <div
              className="absolute inset-0 rounded-full border-2 border-danger/20 pulse-ring"
              style={{ transform: `scale(${1 + audioLevel * 0.3})` }}
            />
          )}
          <div className="flex items-end gap-0.5 h-12">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-75",
                  isRecording ? "bg-danger/70" : "bg-accent/40"
                )}
                style={{
                  height: isRecording
                    ? `${8 + audioLevel * 40 * (0.5 + Math.sin(i * 0.8 + Date.now() / 200) * 0.5)}px`
                    : "8px",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="text-center">
        <div className="text-3xl font-mono font-bold tabular-nums">
          {formatTime(duration)}
        </div>
        <div className="text-xs text-muted mt-1">
          {isRecording ? (paused ? "Paused" : "Recording...") : "Ready to record"}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent/60 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <Button onClick={startRecording} size="lg" className="rounded-full w-16 h-16 !p-0">
            <Mic className="w-6 h-6" />
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={togglePause}
              className="rounded-full w-12 h-12 !p-0"
            >
              {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </Button>
            <Button
              variant="danger"
              onClick={stopRecording}
              className="rounded-full w-16 h-16 !p-0"
            >
              <Square className="w-6 h-6" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
