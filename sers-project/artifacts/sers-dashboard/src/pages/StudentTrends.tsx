import { useParams } from "wouter";
import { useGetStudentTrends, useGetStudent, getGetStudentQueryKey, getGetStudentTrendsQueryKey } from "@workspace/api-client-react";
import { alertClass, alertDot, emotionLabel, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const EMOTION_ORDER = ["happy", "neutral", "surprised", "anxious", "sad", "angry", "fearful", "disgusted"];

export default function StudentTrends() {
  const { id } = useParams<{ id: string }>();
  const studentId = Number(id);

  const { data: student } = useGetStudent(studentId, { query: { enabled: !!studentId, queryKey: getGetStudentQueryKey(studentId) } });
  const { data: trends, isLoading } = useGetStudentTrends(studentId, { query: { enabled: !!studentId, queryKey: getGetStudentTrendsQueryKey(studentId) } });

  const sortedCounts = trends?.emotionCounts?.slice().sort((a, b) => b.count - a.count) ?? [];
  const maxCount = sortedCounts[0]?.count ?? 1;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{student?.name ?? "Student"} — Trends</h1>
        {trends?.dominantEmotion && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">Dominant emotion:</span>
            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", alertClass(trends.alertLevel))}>
              {emotionLabel(trends.dominantEmotion)}
            </span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-48 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Emotion frequency chart */}
          <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
            <h2 className="text-sm font-semibold mb-4">Emotion Frequency</h2>
            {sortedCounts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No records available.</p>
            ) : (
              <div className="space-y-3">
                {sortedCounts.map(({ emotion, count, alertLevel }) => (
                  <div key={emotion} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-right shrink-0">{emotionLabel(emotion)}</div>
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", alertDot(alertLevel))}
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 text-xs text-muted-foreground tabular-nums text-right">{count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent records */}
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4">Recent Records</h2>
            {trends?.recentRecords?.length === 0 && (
              <p className="text-muted-foreground text-sm">No records yet.</p>
            )}
            <div className="space-y-2">
              {trends?.recentRecords?.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", alertClass(r.alertLevel))}>
                      {emotionLabel(r.emotion)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {r.confidence && <span>{(Number(r.confidence) * 100).toFixed(0)}%</span>}
                    <span>{formatDateTime(r.recordedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
