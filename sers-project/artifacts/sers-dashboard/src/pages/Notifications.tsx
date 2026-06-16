import { useState } from "react";
import {
  useListParentNotifications,
  useCreateParentNotification,
  getListParentNotificationsQueryKey,
  useListClassrooms,
  useListClassroomStudents,
  getListClassroomStudentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateTime, emotionLabel, alertClass } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const EMOTIONS = ["happy", "sad", "anxious", "angry", "fearful", "disgusted", "surprised", "neutral"];

function SendNotificationDialog() {
  const [open, setOpen] = useState(false);
  const [classroomId, setClassroomId] = useState<number | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [emotion, setEmotion] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const { data: classrooms } = useListClassrooms();
  const { data: students } = useListClassroomStudents(classroomId!, {
    query: { enabled: !!classroomId, queryKey: getListClassroomStudentsQueryKey(classroomId!) },
  });
  const selectedStudent = students?.find((s) => s.id === studentId);
  const createNotification = useCreateParentNotification();
  const queryClient = useQueryClient();

  const handleSend = async () => {
    if (!studentId || !emotion || !message.trim()) return;
    const result = await createNotification.mutateAsync({ data: { studentId, emotion, message: message.trim() } });
    queryClient.invalidateQueries({ queryKey: getListParentNotificationsQueryKey() });
    if ((result as any).emailSent) setSent(true);
    else {
      setOpen(false);
      setStudentId(null);
      setClassroomId(null);
      setEmotion("");
      setMessage("");
      setSent(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStudentId(null);
    setClassroomId(null);
    setEmotion("");
    setMessage("");
    setSent(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button>Send Notification</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Parent Notification</DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="font-semibold text-gray-800">Email sent!</p>
            <p className="text-sm text-muted-foreground">
              An alert was emailed to {selectedStudent?.parentEmail}.
            </p>
            <Button onClick={handleClose} className="w-full mt-2">Done</Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Classroom</Label>
              <Select onValueChange={(v) => { setClassroomId(Number(v)); setStudentId(null); }}>
                <SelectTrigger><SelectValue placeholder="Select classroom" /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(classrooms) ? classrooms : classrooms?.classrooms || []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Student</Label>
              <Select onValueChange={(v) => setStudentId(Number(v))} disabled={!classroomId}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}{s.parentEmail ? ` — ${s.parentEmail}` : " (no parent email)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStudent && !selectedStudent.parentEmail && (
                <p className="text-xs text-amber-600">This student has no parent email — notification will be logged only.</p>
              )}
              {selectedStudent?.parentEmail && (
                <p className="text-xs text-emerald-600">Email will be sent to {selectedStudent.parentEmail}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Emotion Trigger</Label>
              <Select onValueChange={setEmotion}>
                <SelectTrigger><SelectValue placeholder="Select emotion" /></SelectTrigger>
                <SelectContent>
                  {EMOTIONS.map((e) => (
                    <SelectItem key={e} value={e}>{emotionLabel(e)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Message to Parent</Label>
              <Textarea placeholder="Write a message to the parent..." value={message} onChange={e => setMessage(e.target.value)} rows={4} />
            </div>
            <Button onClick={handleSend} disabled={createNotification.isPending || !studentId || !emotion || !message.trim()} className="w-full">
              {createNotification.isPending ? "Sending..." : "Send to Parent"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Notifications() {
  const { data: notifications, isLoading } = useListParentNotifications({});

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Parent Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Log of all parent alerts sent</p>
        </div>
        <SendNotificationDialog />
      </div>

      {isLoading && (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (!notifications || notifications.length === 0) && (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          <p className="font-medium">No notifications sent yet</p>
          <p className="text-sm mt-1">Send a parent notification to see it here.</p>
        </div>
      )}

      <div className="space-y-3">
        {(Array.isArray(notifications) ? notifications : notifications?.notifications || []).map((n) => (
          <div key={n.id} className="bg-card border border-card-border rounded-xl px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", alertClass("red"))}>
                    {emotionLabel(n.emotion)}
                  </span>
                  <span className="text-xs text-muted-foreground">Student #{n.studentId}</span>
                  {n.emailSent ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Email sent{n.emailAddress ? ` to ${n.emailAddress}` : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/60">Logged only</span>
                  )}
                </div>
                <p className="text-sm text-foreground">{n.message}</p>
              </div>
              <div className="text-xs text-muted-foreground shrink-0">{formatDateTime(n.sentAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
