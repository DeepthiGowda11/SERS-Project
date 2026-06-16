import { useParams } from "wouter";
import { useGetParentPortal } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

function alertDot(level: string | null) {
  if (level === "green") return "bg-emerald-400";
  if (level === "yellow") return "bg-amber-400";
  if (level === "red") return "bg-rose-400";
  return "bg-gray-300";
}

function alertBadge(level: string | null) {
  if (level === "green") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (level === "yellow") return "bg-amber-50 text-amber-700 border border-amber-200";
  if (level === "red") return "bg-rose-50 text-rose-700 border border-rose-200";
  return "bg-gray-50 text-gray-500 border border-gray-200";
}

function emotionLabel(e: string | null) {
  if (!e) return "Unknown";
  return e.charAt(0).toUpperCase() + e.slice(1);
}

function formatTime(str: string | null | undefined) {
  if (!str) return "—";
  return new Date(str).toLocaleString([], {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function ParentPortal() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError } = useGetParentPortal(token!, {
    query: { enabled: !!token, queryKey: ["parent-portal", token] },
  });

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #fdf2f8 0%, #faf5ff 50%, #f0fdf4 100%)" }}>
      {/* Header */}
      <div className="border-b border-pink-100" style={{ background: "linear-gradient(135deg, #f9a8d4 0%, #c084fc 100%)" }}>
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-white text-lg leading-none">SERS Parent Dashboard</div>
            <div className="text-white/80 text-xs mt-0.5">Your child's wellbeing at a glance</div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-white/60 rounded-2xl" />
            <div className="h-48 bg-white/60 rounded-2xl" />
            <div className="h-64 bg-white/60 rounded-2xl" />
          </div>
        )}

        {isError && (
          <div className="bg-white rounded-2xl p-8 text-center border border-rose-100 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-800">Invalid or expired link</p>
            <p className="text-sm text-gray-500 mt-1">Please contact your child's teacher for a new link.</p>
          </div>
        )}

        {data && (
          <>
            {/* Student card */}
            <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-sm"
                  style={{ background: "linear-gradient(135deg, #f9a8d4, #c084fc)" }}>
                  {data.student.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-gray-900">{data.student.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {data.dominantEmotion && (
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", alertBadge(data.alertLevel ?? null))}>
                        Mostly {emotionLabel(data.dominantEmotion)}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">{data.recentRecords.length} records tracked</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn("w-3 h-3 rounded-full", alertDot(data.alertLevel ?? null))} />
                  <span className="text-sm font-medium text-gray-600 capitalize">{data.alertLevel ?? "No data"}</span>
                </div>
              </div>
            </div>

            {/* Emotion breakdown */}
            {data.emotionCounts.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-purple-100 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-800 mb-4">Emotion Breakdown</h2>
                <div className="space-y-3">
                  {data.emotionCounts
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .map(({ emotion, count, alertLevel }) => {
                      const max = Math.max(...data.emotionCounts.map((e) => e.count));
                      const barColor =
                        alertLevel === "green" ? "#10b981" :
                        alertLevel === "yellow" ? "#f59e0b" : "#f43f5e";
                      const safeAlertLevel: string | null = alertLevel ?? null;
                      return (
                        <div key={emotion} className="flex items-center gap-3">
                          <div className="w-20 text-sm text-right text-gray-600 shrink-0">{emotionLabel(emotion)}</div>
                          <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${(count / max) * 100}%`, backgroundColor: barColor }}
                            />
                          </div>
                          <div className="w-6 text-xs text-gray-400 tabular-nums text-right">{count}</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Teacher messages */}
            {data.notifications.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-800 mb-4">Messages from Teacher</h2>
                <div className="space-y-3">
                  {data.notifications.map((n) => (
                    <div key={n.id} className="border border-purple-100 rounded-xl p-4 bg-purple-50/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", alertBadge(null))}>
                          {emotionLabel(n.emotion)}
                        </span>
                        <span className="text-xs text-gray-400">{formatTime(n.sentAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent records */}
            {data.recentRecords.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-800 mb-4">Recent Emotion Records</h2>
                <div className="space-y-2">
                  {data.recentRecords.slice(0, 15).map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full shrink-0", alertDot(r.alertLevel))} />
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", alertBadge(r.alertLevel))}>
                          {emotionLabel(r.emotion)}
                        </span>
                        {r.confidence != null && (
                          <span className="text-xs text-gray-400">{(r.confidence * 100).toFixed(0)}%</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{formatTime(r.recordedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.recentRecords.length === 0 && data.notifications.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <p className="text-gray-500 text-sm">No records yet. Check back after your child's next class session.</p>
              </div>
            )}

            {/* Footer */}
            <p className="text-center text-xs text-gray-400 pb-4">
              This page is private to you. Powered by SERS — Emotion Intelligence Platform.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
