import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("prosody_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("prosody_user_id", id);
  }
  return id;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-rose-400";
}

export function getScoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500/20 border-emerald-500/30";
  if (score >= 60) return "bg-amber-500/20 border-amber-500/30";
  return "bg-rose-500/20 border-rose-500/30";
}

export function calculateStreak(lastDate: Date | null, currentStreak: number): {
  newStreak: number;
  isNewDay: boolean;
} {
  if (!lastDate) return { newStreak: 1, isNewDay: true };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(lastDate);
  last.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { newStreak: currentStreak, isNewDay: false };
  if (diffDays === 1) return { newStreak: currentStreak + 1, isNewDay: true };
  return { newStreak: 1, isNewDay: true };
}
