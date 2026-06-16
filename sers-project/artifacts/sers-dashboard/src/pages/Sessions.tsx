import { Link, useParams } from "wouter";
import { useListClassroomSessions, useGetClassroom, getGetClassroomQueryKey, getListClassroomSessionsQueryKey } from "@workspace/api-client-react";
import { formatDate, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function Sessions() {
  const { id } = useParams<{ id: string }>();
  const classroomId = Number(id);

  const { data: classroom } = useGetClassroom(classroomId, { query: { enabled: !!classroomId, queryKey: getGetClassroomQueryKey(classroomId) } });
  const { data: sessions, isLoading } = useListClassroomSessions(classroomId, { query: { enabled: !!classroomId, queryKey: getListClassroomSessionsQueryKey(classroomId) } });

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-muted-foreground text-xs mb-1">
          <Link href="/classrooms" className="hover:underline">Classrooms</Link>
          {" / "}
          <Link href={`/classrooms/${id}`} className="hover:underline">{classroom?.name ?? "..."}</Link>
          {" / Sessions"}
        </div>
        <h1 className="text-2xl font-bold">Session History</h1>
      </div>

      {isLoading && (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && (!sessions || sessions.length === 0) && (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          <p className="font-medium">No sessions recorded</p>
          <p className="text-sm mt-1">Start a session from the classroom dashboard.</p>
        </div>
      )}

      <div className="space-y-2">
        {(Array.isArray(sessions) ? sessions : sessions?.sessions || []).map((s) => (
          <Link key={s.id} href={`/sessions/${s.id}`}>
            <div className="bg-card border border-card-border rounded-lg px-5 py-4 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer">
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", s.isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-300")} />
                  <span className="font-medium text-sm">
                    {formatDate(s.startTime)} &mdash; {formatTime(s.startTime)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 ml-4">
                  {s.isActive ? "Active" : `Ended at ${formatTime(s.endTime)}`}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Session #{s.id}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
