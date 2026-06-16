import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function alertClass(level: string | null | undefined) {
  if (level === "green") return "alert-green";
  if (level === "yellow") return "alert-yellow";
  if (level === "red") return "alert-red";
  return "alert-none";
}

export function alertDot(level: string | null | undefined) {
  if (level === "green") return "bg-emerald-500";
  if (level === "yellow") return "bg-amber-400";
  if (level === "red") return "bg-red-500";
  return "bg-gray-300";
}

export function emotionLabel(emotion: string | null | undefined) {
  if (!emotion) return "Unknown";
  return emotion.charAt(0).toUpperCase() + emotion.slice(1);
}

export function formatTime(date: string | Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
