"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, BookOpen, Swords, MessageSquare, Sparkles, Users, Flame,
  Loader2, ArrowLeft, ArrowRight, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { AudioRecorder } from "@/components/audio-recorder";
import { SessionResults } from "@/components/session-results";
import { getUserId, formatDuration } from "@/lib/utils";
import { extractClientAudioFeatures } from "@/lib/client-audio";
import { PRACTICE_MODES, TOPIC_CATEGORIES, type PracticeMode, type TopicResponse, type SessionMetrics, type SessionFeedback } from "@/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, BookOpen, Swords, MessageSquare, Sparkles, Users, Flame,
};

type Step = "mode" | "topic" | "prep" | "speak" | "analyzing" | "results";

export default function PracticePage() {
  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<PracticeMode>("impromptu");
  const [category, setCategory] = useState<string>("");
  const [topic, setTopic] = useState<TopicResponse | null>(null);
  const [prepTimeLeft, setPrepTimeLeft] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [results, setResults] = useState<{
    metrics: SessionMetrics;
    feedback: SessionFeedback;
    transcript: string;
    streak: { streakCount: number; longestStreak: number };
    newBadges: string[];
    sessionId: string;
  } | null>(null);

  const [conversationalResponse, setConversationalResponse] = useState<string | null>(null);
  const [interviewQuestion, setInterviewQuestion] = useState(0);

  const selectMode = (m: PracticeMode) => {
    setMode(m);
    setStep("topic");
  };

  const generateTopic = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, category: category || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate topic");
      }
      const data: TopicResponse = await res.json();
      setTopic(data);
      setPrepTimeLeft(data.prepTimeSeconds);
      setStep("prep");
      startPrepTimer(data.prepTimeSeconds);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate topic");
    } finally {
      setLoading(false);
    }
  };

  const startPrepTimer = (seconds: number) => {
    let remaining = seconds;
    setPrepTimeLeft(remaining);
    const interval = setInterval(() => {
      remaining -= 1;
      setPrepTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setStep("speak");
      }
    }, 1000);
  };

  const skipPrep = () => setStep("speak");

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    if (!topic) return;
    setStep("analyzing");
    setError(null);

    try {
      const audioFeatures = await extractClientAudioFeatures(blob);

      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      formData.append("userId", getUserId());
      formData.append("topic", topic.topic);
      formData.append("mode", mode);
      formData.append("primer", topic.primer);
      formData.append("audioFeatures", JSON.stringify(audioFeatures));

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }

      const data = await res.json();
      setResults({
        metrics: data.metrics,
        feedback: data.feedback,
        transcript: data.transcript,
        streak: data.streak,
        newBadges: data.newBadges || [],
        sessionId: data.sessionId,
      });

      if (mode === "debate") {
        const convRes = await fetch("/api/conversational", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "debate", topic: topic.topic, text: data.transcript }),
        });
        if (convRes.ok) {
          const conv = await convRes.json();
          setConversationalResponse(conv.response);
        }
      }

      if (mode === "interview") {
        const convRes = await fetch("/api/conversational", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "interview",
            topic: topic.topic,
            text: data.transcript,
            questionNumber: interviewQuestion + 1,
          }),
        });
        if (convRes.ok) {
          const conv = await convRes.json();
          setConversationalResponse(conv.response);
        }
      }

      setStep("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setStep("speak");
    }
  };

  const reset = () => {
    setStep("mode");
    setTopic(null);
    setResults(null);
    setConversationalResponse(null);
    setError(null);
    setInterviewQuestion(0);
  };

  const handleReflection = async (reflection: string) => {
    if (!results) return;
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: getUserId(),
        sessionId: results.sessionId,
        reflection,
      }),
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {/* Step: Mode Selection */}
          {step === "mode" && (
            <motion.div key="mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-3xl font-bold mb-2">Choose a Mode</h1>
              <p className="text-muted mb-8">Pick how you want to practice today</p>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {PRACTICE_MODES.map((m) => {
                  const Icon = iconMap[m.icon] || Zap;
                  return (
                    <Card
                      key={m.id}
                      hover
                      className="cursor-pointer"
                      onClick={() => selectMode(m.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-accent-light" />
                        </div>
                        <div>
                          <CardTitle>{m.name}</CardTitle>
                          <CardDescription>{m.description}</CardDescription>
                          <p className="text-[10px] text-muted/60 mt-2">
                            {m.prepTime}s prep · {m.speakTime}s speak
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step: Topic / Category */}
          {step === "topic" && (
            <motion.div key="topic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button onClick={() => setStep("mode")} className="flex items-center gap-1 text-sm text-muted hover:text-foreground mb-6">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <h1 className="text-3xl font-bold mb-2">Pick a Category</h1>
              <p className="text-muted mb-6">Optional — or leave blank for a surprise topic</p>

              <div className="flex flex-wrap gap-2 mb-8">
                {TOPIC_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(category === cat ? "" : cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                      category === cat
                        ? "bg-accent/15 border-accent/30 text-accent-light"
                        : "border-white/10 text-muted hover:border-white/20"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
                  {error}
                </div>
              )}

              <Button onClick={generateTopic} disabled={loading} size="lg" className="w-full">
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating topic...</>
                ) : (
                  <><RefreshCw className="w-4 h-4" /> Generate Topic</>
                )}
              </Button>
            </motion.div>
          )}

          {/* Step: Prep */}
          {step === "prep" && topic && (
            <motion.div key="prep" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-8">
                <div className="text-5xl font-mono font-bold text-accent-light mb-2">
                  {formatDuration(prepTimeLeft)}
                </div>
                <p className="text-sm text-muted">Prep time remaining</p>
              </div>

              <Card className="mb-6">
                <div className="text-xs text-accent-light font-medium mb-2 uppercase tracking-wider">
                  {topic.category}
                </div>
                <CardTitle className="text-xl mb-3">{topic.topic}</CardTitle>
                <p className="text-sm text-muted leading-relaxed">{topic.primer}</p>
              </Card>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={skipPrep} className="flex-1">
                  Skip Prep <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step: Speak */}
          {step === "speak" && topic && (
            <motion.div key="speak" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="mb-8">
                <div className="text-xs text-accent-light font-medium mb-2 uppercase tracking-wider">
                  Your Topic
                </div>
                <CardTitle className="text-lg">{topic.topic}</CardTitle>
              </Card>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
                  {error}
                </div>
              )}

              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                maxDuration={topic.speakTimeSeconds}
                isRecording={isRecording}
                onRecordingChange={setIsRecording}
              />
            </motion.div>
          )}

          {/* Step: Analyzing */}
          {step === "analyzing" && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <Loader2 className="w-12 h-12 animate-spin text-accent-light mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Analyzing your speech...</h2>
              <p className="text-muted text-sm">
                Transcribing, measuring delivery metrics, and generating feedback
              </p>
            </motion.div>
          )}

          {/* Step: Results */}
          {step === "results" && results && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Session Results</h1>
                <Button variant="secondary" onClick={reset}>
                  <RefreshCw className="w-4 h-4" /> New Session
                </Button>
              </div>

              {conversationalResponse && (
                <Card className="mb-6 border-accent/20 bg-accent/5">
                  <CardTitle className="text-accent-light mb-2">
                    {mode === "debate" ? "AI Counter-Argument" : "Follow-Up Question"}
                  </CardTitle>
                  <p className="text-sm leading-relaxed">{conversationalResponse}</p>
                  {mode === "interview" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setInterviewQuestion((q) => q + 1);
                        setConversationalResponse(null);
                        setStep("speak");
                      }}
                    >
                      Answer Follow-Up →
                    </Button>
                  )}
                </Card>
              )}

              <SessionResults
                metrics={results.metrics}
                feedback={results.feedback}
                transcript={results.transcript}
                streak={results.streak}
                newBadges={results.newBadges}
                onReflectionSubmit={handleReflection}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
