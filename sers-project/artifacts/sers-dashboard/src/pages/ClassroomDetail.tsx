import { Link, useParams } from "wouter";
import {
  useGetClassroom,
  useGetClassroomDashboard,
  useListClassroomStudents,
  useCreateSession,
  useUpdateSession,
  getGetClassroomQueryKey,
  getGetClassroomDashboardQueryKey,
  getListClassroomStudentsQueryKey,
  getListClassroomSessionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn, alertClass, alertDot, emotionLabel, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import WebcamDetector from "@/components/WebcamDetector";

export default function ClassroomDetail() {
  const { id } = useParams<{ id: string }>();
  const classroomId = Number(id);

  const { data: classroom } = useGetClassroom(classroomId, { query: { enabled: !!classroomId, queryKey: getGetClassroomQueryKey(classroomId) } });
  const { data: dashboard, isLoading } = useGetClassroomDashboard(classroomId, { query: { enabled: !!classroomId, queryKey: getGetClassroomDashboardQueryKey(classroomId) } });
  const { data: students } = useListClassroomStudents(classroomId, { query: { enabled: !!classroomId, queryKey: getListClassroomStudentsQueryKey(classroomId) } });
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const queryClient = useQueryClient();

  const activeSession = dashboard?.activeSession;
  const isSessionActive = activeSession?.isActive === true;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetClassroomDashboardQueryKey(classroomId) });
    queryClient.invalidateQueries({ queryKey: getListClassroomSessionsQueryKey(classroomId) });
  };

  const handleStartSession = async () => {
    await createSession.mutateAsync({ id: classroomId });
    invalidate();
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    await updateSession.mutateAsync({
      id: activeSession.id,
      data: { isActive: false, endTime: new Date().toISOString() },
    });
    invalidate();
  };

  const summary = dashboard?.emotionSummary;
  const studentList = students ?? [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-muted-foreground text-xs mb-1">
            <Link href="/classrooms" className="hover:underline">Classrooms</Link>
            {" / "}
            <span>{classroom?.name ?? "..."}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{classroom?.name ?? "Loading..."}</h1>
          {classroom && <p className="text-muted-foreground text-sm mt-0.5">{classroom.teacherName}</p>}
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Link href={`/classrooms/${id}/students`}>
            <Button variant="outline" size="sm">Manage Students</Button>
          </Link>
          <Link href={`/classrooms/${id}/sessions`}>
            <Button variant="outline" size="sm">Session History</Button>
          </Link>
          {isSessionActive ? (
            <Button variant="destructive" size="sm" onClick={handleEndSession} disabled={updateSession.isPending}>
              End Session
            </Button>
          ) : (
            <Button size="sm" onClick={handleStartSession} disabled={createSession.isPending}>
              Start Session
            </Button>
          )}
        </div>
      </div>

      {/* Session Status Bar */}
      {activeSession && (
        <div className={cn(
          "mb-6 px-4 py-3 rounded-lg text-sm flex items-center gap-2",
          isSessionActive
            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
            : "bg-muted border border-border text-muted-foreground"
        )}>
          <span className={cn("w-2 h-2 rounded-full", isSessionActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400")} />
          {isSessionActive
            ? `Session active — started at ${formatTime(activeSession.startTime)}`
            : `Last session ended at ${formatTime(activeSession.endTime)}`}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Webcam Detector */}
        <div>
          {isSessionActive && activeSession ? (
            <WebcamDetector
              sessionId={activeSession.id}
              students={studentList}
              onEmotionLogged={invalidate}
            />
          ) : (
            <div className="bg-card border border-card-border rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 h-full min-h-48">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm">Webcam detection is inactive</p>
                <p className="text-xs text-muted-foreground mt-1">Start a session to enable live emotion detection</p>
              </div>
              <Button size="sm" onClick={handleStartSession} disabled={createSession.isPending}>
                Start Session
              </Button>
            </div>
          )}
        </div>

        {/* Right column — summary + student grid */}
        <div className="space-y-4">
          {/* Emotion summary */}
          {summary && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "green", label: "Engaged", count: summary.green },
                { key: "yellow", label: "At Risk", count: summary.yellow },
                { key: "red", label: "Distressed", count: summary.red },
              ].map(({ key, label, count }) => (
                <div key={key} className="bg-card border border-card-border rounded-lg p-4 flex items-center gap-3">
                  <span className={cn("w-3 h-3 rounded-full shrink-0", alertDot(key))} />
                  <div>
                    <div className="text-2xl font-bold tabular-nums">{count}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Student grid */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Student Emotion States</h2>

            {isLoading && (
              <div className="grid grid-cols-2 gap-2 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-xl" />
                ))}
              </div>
            )}

            {!isLoading && (!dashboard?.studentStates || dashboard.studentStates.length === 0) && (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                <p className="text-sm font-medium">No students enrolled</p>
                <Link href={`/classrooms/${id}/students`}>
                  <Button className="mt-3" size="sm">Add Students</Button>
                </Link>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {dashboard?.studentStates?.map(({ student, latestEmotion, alertLevel, lastUpdated }) => (
                <Link key={student.id} href={`/students/${student.id}/trends`}>
                  <div className="bg-card border border-card-border rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", alertDot(alertLevel))} />
                      <span className="font-medium text-sm truncate">{student.name}</span>
                    </div>
                    <div className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", alertClass(alertLevel))}>
                      {emotionLabel(latestEmotion)}
                    </div>
                    {lastUpdated && (
                      <div className="text-xs text-muted-foreground mt-1.5 opacity-60">{formatTime(lastUpdated)}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
