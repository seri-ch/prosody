"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mic,
  Brain,
  TrendingUp,
  Zap,
  MessageSquare,
  Swords,
  BarChart3,
  Target,
  ArrowRight,
  Volume2,
  Timer,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const features = [
  {
    icon: Volume2,
    title: "Delivery Analysis",
    description:
      "Real audio signal processing — pitch tracking, pace measurement, pause detection, and filler word analysis. Not just transcript commentary.",
  },
  {
    icon: Brain,
    title: "Content Intelligence",
    description:
      "LLM-powered analysis of structure, coherence, specificity, and vocabulary. Know if your argument actually holds up.",
  },
  {
    icon: Target,
    title: "One Focus Point",
    description:
      "Every session gives you one specific, actionable thing to work on next. No wall of criticism — just clear direction.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description:
      "Trend graphs, skill radar charts, and personal baseline calibration so improvement is visible, not just felt.",
  },
  {
    icon: Swords,
    title: "Debate & Interview Modes",
    description:
      "AI pushes back in debate mode and asks contextual follow-ups in interview simulations. Real conversational pressure.",
  },
  {
    icon: Award,
    title: "Habit Building",
    description:
      "Streaks, daily challenges, and achievement badges tied to real metrics. Practice becomes a daily ritual.",
  },
];

const modes = [
  { icon: Zap, name: "Impromptu", desc: "30s prep, speak on anything" },
  { icon: MessageSquare, name: "Interview", desc: "Behavioral Q&A with follow-ups" },
  { icon: Swords, name: "Debate", desc: "AI takes the counter-position" },
  { icon: Mic, name: "Storytelling", desc: "Narrative structure & pacing" },
];

const metrics = [
  { label: "Filler Words", value: "↓ 42%", sub: "avg. reduction in 30 days" },
  { label: "Speech Rate", value: "145 WPM", sub: "ideal conversational pace" },
  { label: "Confidence Score", value: "+34pts", sub: "avg. improvement" },
  { label: "Daily Streak", value: "21 days", sub: "median active streak" },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/8 rounded-full blur-[120px]" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent-light text-sm mb-8">
              <Mic className="w-3.5 h-3.5" />
              AI-powered speech coaching
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
            {...fadeUp}
            transition={{ delay: 0.1 }}
          >
            Speak with{" "}
            <span className="gradient-text">confidence</span>
            <br />
            when it matters
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
            {...fadeUp}
            transition={{ delay: 0.2 }}
          >
            Train everyday speaking and social skills with AI that analyzes
            both <em>what</em> you say and <em>how</em> you say it — pace,
            pauses, pitch, filler words, and more.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            {...fadeUp}
            transition={{ delay: 0.3 }}
          >
            <Link href="/practice">
              <Button size="lg" className="glow">
                Start Practicing
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg">
                View Dashboard
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Waveform visual */}
      <section className="pb-20 px-6">
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="gradient-border glow p-8">
            <div className="flex items-end justify-center gap-1 h-24 mb-6">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-accent/60 rounded-full waveform-bar"
                  style={{
                    height: `${20 + Math.sin(i * 0.4) * 30 + Math.random() * 20}%`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics.map((m) => (
                <div key={m.label} className="text-center">
                  <div className="text-2xl font-bold text-accent-light">{m.value}</div>
                  <div className="text-xs text-muted mt-1">{m.label}</div>
                  <div className="text-[10px] text-muted/60">{m.sub}</div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Problem */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">The gap nobody fills</h2>
          <p className="text-muted text-lg leading-relaxed">
            Most AI speaking tools transcribe your speech and comment on your
            argument. They almost entirely ignore <strong className="text-foreground">delivery</strong> —
            pace, pauses, pitch, filler words, confidence signals. That&apos;s
            the harder problem and the part people care most about.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How Prosody works</h2>
            <p className="text-muted text-lg max-w-xl mx-auto">
              Record, analyze, improve. Every session builds your personal speaking profile.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card hover className="h-full">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-accent-light" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{f.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Practice Modes */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">7 practice modes</h2>
            <p className="text-muted">From impromptu speeches to debate sparring</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {modes.map((m) => (
              <Card key={m.name} hover className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <m.icon className="w-6 h-6 text-accent-light" />
                </div>
                <div>
                  <h3 className="font-semibold">{m.name}</h3>
                  <p className="text-sm text-muted">{m.desc}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted">
              Plus: Prepared Speech, Social Scenarios, and Rapid Fire modes
            </p>
          </div>
        </div>
      </section>

      {/* Core Loop */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">The core loop</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Get a Topic", desc: "AI generates a topic with a primer paragraph", icon: Brain },
              { step: "2", title: "Prep & Speak", desc: "Read, think, then record yourself speaking", icon: Timer },
              { step: "3", title: "Deep Analysis", desc: "Delivery metrics + content analysis combined", icon: BarChart3 },
              { step: "4", title: "Improve", desc: "One focus point, streak tracking, repeat", icon: TrendingUp },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-5 h-5 text-accent-light" />
                </div>
                <div className="text-xs text-accent-light font-mono mb-1">Step {s.step}</div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to find your voice?
          </h2>
          <p className="text-muted mb-8">
            Start with a free impromptu speech. No account needed — your progress saves locally.
          </p>
          <Link href="/practice">
            <Button size="lg" className="glow">
              <Mic className="w-5 h-5" />
              Start Your First Session
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Prosody
          </div>
          <p>Train how you speak, not just what you say.</p>
        </div>
      </footer>
    </div>
  );
}
