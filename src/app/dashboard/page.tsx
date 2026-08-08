"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Flame, Target, TrendingUp, Award, Clock, BarChart3,
  Loader2, Mic, Calendar,
} from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserId, getScoreColor, cn } from "@/lib/utils";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";

interface DashboardData {
  user: {
    id: string;
    name: string;
    streakCount: number;
    longestStreak: number;
    baselineMetrics: Record<string, number> | null;
    sessionCount: number;
  };
  sessions: Array<{
    id: string;
    mode: string;
    topic: string;
    durationSeconds: number;
    metrics: { overallScore: number; skillRadar: Record<string, number>; delivery: Record<string, number> } | null;
    feedback: { summary: string; focusPoint: string } | null;
    focusPoint: string;
    createdAt: string;
  }>;
  badges: Array<{ name: string; description: string; icon: string; earnedAt: string }>;
  dailyChallenge: {
    id: string;
    topic: string;
    primer: string;
    category: string;
    completed: boolean;
  };
  trendData: Array<{
    date: string;
    overall: number;
    wpm: number;
    fillers: number;
    clarity: number;
    confidence: number;
    structure: number;
  }>;
  skillRadar: Record<string, number>;
  stats: { avgOverall: number; totalSessions: number; totalMinutes: number };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const userId = getUserId();
        const res = await fetch(`/api/dashboard?userId=${userId}`);
        if (!res.ok) throw new Error("Failed to load dashboard");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-light" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
        <p className="text-muted">{error || "No data"}</p>
        <Link href="/practice">
          <Button>Start Practicing</Button>
        </Link>
      </div>
    );
  }

  const radarData = [
    { skill: "Clarity", value: data.skillRadar.clarity },
    { skill: "Confidence", value: data.skillRadar.confidence },
    { skill: "Structure", value: data.skillRadar.structure },
    { skill: "Pacing", value: data.skillRadar.pacing },
    { skill: "Vocabulary", value: data.skillRadar.vocabulary },
  ];

  const isEmpty = data.stats.totalSessions === 0;

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted mt-1">Your speaking progress at a glance</p>
          </div>
          <Link href="/practice">
            <Button>
              <Mic className="w-4 h-4" /> Practice Now
            </Button>
          </Link>
        </div>

        {isEmpty ? (
          <Card className="text-center py-16">
            <Mic className="w-12 h-12 text-muted mx-auto mb-4" />
            <CardTitle className="mb-2">No sessions yet</CardTitle>
            <CardDescription className="mb-6">
              Complete your first practice session to see your progress here
            </CardDescription>
            <Link href="/practice">
              <Button size="lg">Start Your First Session</Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Flame}
                label="Current Streak"
                value={`${data.user.streakCount} days`}
                accent="text-orange-400"
              />
              <StatCard
                icon={TrendingUp}
                label="Avg Score"
                value={String(data.stats.avgOverall)}
                accent="text-emerald-400"
              />
              <StatCard
                icon={Mic}
                label="Sessions"
                value={String(data.stats.totalSessions)}
                accent="text-accent-light"
              />
              <StatCard
                icon={Clock}
                label="Practice Time"
                value={`${data.stats.totalMinutes}m`}
                accent="text-purple-400"
              />
            </div>

            {/* Daily Challenge */}
            <Card className="mb-8 border-accent/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-accent-light" />
                    <span className="text-xs text-accent-light font-medium uppercase tracking-wider">
                      Daily Challenge
                    </span>
                    {data.dailyChallenge.completed && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg mb-1">{data.dailyChallenge.topic}</CardTitle>
                  <CardDescription>{data.dailyChallenge.primer}</CardDescription>
                </div>
                {!data.dailyChallenge.completed && (
                  <Link href="/practice">
                    <Button size="sm">Take Challenge</Button>
                  </Link>
                )}
              </div>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Trend Chart */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-accent-light" />
                  <CardTitle>Score Trend</CardTitle>
                </div>
                {data.trendData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data.trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="date" tick={{ fill: "#8888a0", fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "#8888a0", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#12121a",
                          border: "1px solid #ffffff10",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                      <Line type="monotone" dataKey="overall" stroke="#818cf8" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="clarity" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="confidence" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted text-center py-12">
                    Complete more sessions to see trends
                  </p>
                )}
              </Card>

              {/* Skill Radar */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-accent-light" />
                  <CardTitle>Skill Profile</CardTitle>
                </div>
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
            </div>

            {/* Delivery Trends */}
            {data.trendData.length > 1 && (
              <Card className="mb-8">
                <CardTitle className="mb-4">Delivery Metrics Over Time</CardTitle>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" tick={{ fill: "#8888a0", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#8888a0", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#12121a",
                        border: "1px solid #ffffff10",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Line type="monotone" dataKey="wpm" stroke="#a78bfa" strokeWidth={2} name="WPM" />
                    <Line type="monotone" dataKey="fillers" stroke="#ef4444" strokeWidth={2} name="Filler %" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Badges */}
            {data.badges.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl font-semibold">Badges</h2>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {data.badges.map((badge) => (
                    <Card key={badge.name} className="border-amber-500/20 bg-amber-500/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <Award className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{badge.name}</p>
                          <p className="text-xs text-muted">{badge.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Sessions */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
              <div className="space-y-3">
                {data.sessions.slice(0, 10).map((session, i) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card hover className="!p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase tracking-wider text-accent-light font-medium">
                              {session.mode}
                            </span>
                            <span className="text-[10px] text-muted">
                              {new Date(session.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium truncate">{session.topic}</p>
                          {session.focusPoint && (
                            <p className="text-xs text-muted mt-1 truncate">
                              Focus: {session.focusPoint}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <div className={cn(
                            "text-2xl font-bold",
                            getScoreColor(session.metrics?.overallScore ?? 0)
                          )}>
                            {session.metrics?.overallScore ?? "—"}
                          </div>
                          <div className="text-[10px] text-muted">
                            {Math.round(session.durationSeconds ?? 0)}s
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Baseline */}
            {data.user.baselineMetrics && (
              <Card className="mt-8">
                <CardTitle className="mb-3">Personal Baseline</CardTitle>
                <CardDescription className="mb-4">
                  Your natural speaking patterns, calibrated over {data.user.baselineMetrics.sampleCount} sessions
                </CardDescription>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <BaselineStat label="Natural WPM" value={String(Math.round(data.user.baselineMetrics.wpm))} />
                  <BaselineStat label="Filler Rate" value={`${(data.user.baselineMetrics.fillerRate * 100).toFixed(1)}%`} />
                  <BaselineStat label="Pitch Variance" value={String(Math.round(data.user.baselineMetrics.pitchVariance))} />
                  <BaselineStat label="Volume Var." value={data.user.baselineMetrics.volumeVariance.toFixed(3)} />
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <Icon className={cn("w-5 h-5", accent)} />
        <div>
          <p className="text-xs text-muted">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function BaselineStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-3 rounded-xl bg-white/3">
      <div className="text-lg font-mono font-medium">{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}
