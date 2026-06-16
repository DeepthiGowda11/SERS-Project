import { useParams } from "wouter";
import { useGetSession, useListSessionRecords, getGetSessionQueryKey, getListSessionRecordsQueryKey } from "@workspace/api-client-react";
import { alertClass, emotionLabel, formatDateTime, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);

  const { data: session } = useGetSession(sessionId, { query: { enabled: !!sessionId, queryKey: getGetSessionQueryKey(sessionId) } });
  const { data: records, isLoading } = useListSessionRecords(sessionId, { query: { enabled: !!sessionId, queryKey: getListSessionRecordsQueryKey(sessionId) } });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Session #{sessionId}</h1>
        {session && (
          <p className="text-muted-foreground text-sm mt-1">
            {formatDateTime(session.startTime)}
            {session.endTime && ` — ${formatTime(session.endTime)}`}
            {session.isActive && <span className="ml-2 text-emerald-600 font-medium">Active</span>}
          </p>
        )}
      </div>

      <div className="mb-4 text-sm font-medium text-foreground">
        Emotion Records ({records?.length ?? 0})
      </div>

      {isLoading && (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && (!records || records.length === 0) && (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          <p className="font-medium">No records in this session</p>
        </div>
      )}

      <div className="space-y-2">
        {records?.map((r) => (
          <div key={r.id} className="bg-card border border-card-border rounded-lg px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", alertClass(r.alertLevel))}>
                {emotionLabel(r.emotion)}
              </span>
              <span className="text-sm text-muted-foreground">Student #{r.studentId}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {r.confidence && <span>{(r.confidence * 100).toFixed(0)}% confidence</span>}
              <span>{formatTime(r.recordedAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
