"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { getScoreColor, getScoreBg, cn } from "@/lib/utils";
import type { SessionMetrics, SessionFeedback } from "@/types";
import {
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageCircle,
  Award,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface SessionResultsProps {
  metrics: SessionMetrics;
  feedback: SessionFeedback;
  transcript: string;
  streak?: { streakCount: number; longestStreak: number };
  newBadges?: string[];
  onReflectionSubmit?: (reflection: string) => void;
}

export function SessionResults({
  metrics,
  feedback,
  transcript,
  streak,
  newBadges,
  onReflectionSubmit,
}: SessionResultsProps) {
  const [reflection, setReflection] = useState("");
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);

  const radarData = [
    { skill: "Clarity", value: metrics.skillRadar.clarity },
    { skill: "Confidence", value: metrics.skillRadar.confidence },
    { skill: "Structure", value: metrics.skillRadar.structure },
    { skill: "Pacing", value: metrics.skillRadar.pacing },
    { skill: "Vocabulary", value: metrics.skillRadar.vocabulary },
  ];

  const deliveryStats = [
    { label: "Words/min", value: metrics.delivery.wordsPerMinute, ideal: "130-160" },
    { label: "Filler words", value: `${(metrics.delivery.fillerWordRate * 100).toFixed(1)}%`, ideal: "<3%" },
    { label: "Pauses", value: metrics.delivery.pauseCount, ideal: "Strategic" },
    { label: "Pitch variance", value: metrics.delivery.pitchVariance, ideal: ">25" },
    { label: "Hesitations", value: metrics.delivery.hesitationPauses, ideal: "0-2" },
    { label: "Speaking time", value: `${Math.round(metrics.delivery.speakingTimeSeconds)}s`, ideal: "Maximize" },
  ];

  const handleReflection = () => {
    if (reflection.trim() && onReflectionSubmit) {
      onReflectionSubmit(reflection);
      setReflectionSubmitted(true);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Overall Score */}
      <div className="text-center">
        <div className={cn(
          "inline-flex items-center justify-center w-28 h-28 rounded-full border-2 text-4xl font-bold",
          getScoreBg(metrics.overallScore),
          getScoreColor(metrics.overallScore)
        )}>
          {metrics.overallScore}
        </div>
        <p className="text-muted mt-3">{feedback.summary}</p>
        {streak && (
          <p className="text-sm text-accent-light mt-2">
            🔥 {streak.streakCount} day streak
          </p>
        )}
      </div>

      {/* New Badges */}
      {newBadges && newBadges.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-400">Badge Earned!</p>
              <p className="text-sm">{newBadges.join(", ")}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Focus Point */}
      <Card className="gradient-border">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-accent-light shrink-0 mt-0.5" />
          <div>
            <CardTitle className="text-accent-light mb-1">Your Focus Point</CardTitle>
            <p className="text-sm leading-relaxed">{feedback.focusPoint}</p>
            {feedback.nextDrill && (
              <p className="text-xs text-muted mt-2">
                💡 Drill: {feedback.nextDrill}
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Skill Radar */}
        <Card>
          <CardTitle className="mb-4">Skill Profile</CardTitle>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#ffffff10" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: "#8888a0", fontSize: 12 }} />
              <Radar
                dataKey="value"
                stroke="#818cf8"
                fill="#6366f1"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Delivery Stats */}
        <Card>
          <CardTitle className="mb-4">Delivery Metrics</CardTitle>
          <div className="space-y-3">
            {deliveryStats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between">
                <span className="text-sm text-muted">{stat.label}</span>
                <div className="text-right">
                  <span className="text-sm font-mono font-medium">{stat.value}</span>
                  <span className="text-[10px] text-muted/60 ml-2">({stat.ideal})</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <CardTitle>Strengths</CardTitle>
          </div>
          <ul className="space-y-2">
            {[...feedback.strengths, ...feedback.deliveryNotes.filter(n => n.includes("good") || n.includes("strong") || n.includes("well"))].slice(0, 4).map((s, i) => (
              <li key={i} className="text-sm text-muted flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                {s}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <CardTitle>Areas to Improve</CardTitle>
          </div>
          <ul className="space-y-2">
            {[...feedback.weaknesses, ...feedback.deliveryNotes.filter(n => !n.includes("good") && !n.includes("strong"))].slice(0, 4).map((w, i) => (
              <li key={i} className="text-sm text-muted flex items-start gap-2">
                <span className="text-amber-400 mt-1">•</span>
                {w}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Timeline */}
      {metrics.timeline.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-accent-light" />
            <CardTitle>Speech Timeline</CardTitle>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {metrics.timeline.map((event, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="font-mono text-xs text-muted w-12">
                  {event.timestamp.toFixed(1)}s
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs",
                  event.type === "filler" && "bg-rose-500/20 text-rose-400",
                  event.type === "pause" && "bg-amber-500/20 text-amber-400",
                  event.type === "pace_spike" && "bg-orange-500/20 text-orange-400",
                  event.type === "pace_drop" && "bg-blue-500/20 text-blue-400",
                  event.type === "volume_drop" && "bg-purple-500/20 text-purple-400",
                  event.type === "pitch_flat" && "bg-gray-500/20 text-gray-400",
                )}>
                  {event.type.replace("_", " ")}
                </span>
                <span className="text-muted">{event.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Content Scores */}
      <Card>
        <CardTitle className="mb-4">Content Analysis</CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Structure", score: metrics.content.structureScore },
            { label: "Coherence", score: metrics.content.coherenceScore },
            { label: "Specificity", score: metrics.content.specificityScore },
            { label: "Vocabulary", score: metrics.content.vocabularyScore },
            { label: "Persuasion", score: metrics.content.persuasivenessScore },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className={cn("text-2xl font-bold", getScoreColor(item.score))}>
                {item.score}
              </div>
              <div className="text-xs text-muted mt-1">{item.label}</div>
            </div>
          ))}
        </div>
        {metrics.content.repetitiveWords.length > 0 && (
          <p className="text-xs text-muted mt-4">
            Overused words: {metrics.content.repetitiveWords.join(", ")}
          </p>
        )}
      </Card>

      {/* Transcript */}
      <Card>
        <CardTitle className="mb-3">Transcript</CardTitle>
        <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
          {transcript}
        </p>
      </Card>

      {/* Reflection */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-4 h-4 text-accent-light" />
          <CardTitle>Reflection</CardTitle>
        </div>
        {!reflectionSubmitted ? (
          <>
            <p className="text-sm text-muted mb-3">
              What do you think went well? What would you change?
            </p>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:border-accent/50"
              placeholder="I think my opening was strong, but I rushed through the middle section..."
            />
            <button
              onClick={handleReflection}
              disabled={!reflection.trim()}
              className="mt-3 text-sm text-accent-light hover:text-accent disabled:opacity-50"
            >
              Save reflection →
            </button>
          </>
        ) : (
          <p className="text-sm text-emerald-400">Reflection saved. Great job reflecting!</p>
        )}
      </Card>
    </div>
  );
}
