import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  useListClassroomStudents,
  useGetClassroom,
  useCreateStudent,
  getGetClassroomQueryKey,
  getListClassroomStudentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

function copyParentLink(token: string | null | undefined, name: string, toast: ReturnType<typeof useToast>["toast"]) {
  if (!token) return;
  const base = window.location.origin + (import.meta.env.BASE_URL || "/");
  const url = `${base}parent/${token}`;
  navigator.clipboard.writeText(url).then(() => {
    toast({ title: "Link copied!", description: `Parent link for ${name} copied to clipboard.` });
  });
}

export default function Students() {
  const { id } = useParams<{ id: string }>();
  const classroomId = Number(id);
  const { toast } = useToast();

  const { data: classroom } = useGetClassroom(classroomId, { query: { enabled: !!classroomId, queryKey: getGetClassroomQueryKey(classroomId) } });
  const { data: students, isLoading } = useListClassroomStudents(classroomId, { query: { enabled: !!classroomId, queryKey: getListClassroomStudentsQueryKey(classroomId) } });
  const createStudent = useCreateStudent();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [parentEmail, setParentEmail] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createStudent.mutateAsync({
      data: {
        classroomId,
        name: name.trim(),
        studentCode: studentCode.trim() || undefined,
        parentEmail: parentEmail.trim() || undefined,
      },
    });
    queryClient.invalidateQueries({ queryKey: getListClassroomStudentsQueryKey(classroomId) });
    setName("");
    setStudentCode("");
    setParentEmail("");
    setOpen(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-muted-foreground text-xs mb-1">
            <Link href="/classrooms" className="hover:underline">Classrooms</Link>
            {" / "}
            <Link href={`/classrooms/${id}`} className="hover:underline">{classroom?.name ?? "..."}</Link>
            {" / Students"}
          </div>
          <h1 className="text-2xl font-bold">Students</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input placeholder="e.g. Alex Johnson" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Student Code (optional)</Label>
                <Input placeholder="e.g. S2024001" value={studentCode} onChange={e => setStudentCode(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Parent Email (optional)</Label>
                <p className="text-xs text-muted-foreground">Used to email alerts directly to the guardian.</p>
                <Input type="email" placeholder="parent@example.com" value={parentEmail} onChange={e => setParentEmail(e.target.value)} />
              </div>
              <Button onClick={handleCreate} disabled={createStudent.isPending} className="w-full">
                {createStudent.isPending ? "Adding..." : "Add Student"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (!students || students.length === 0) && (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          <p className="font-medium">No students enrolled</p>
          <p className="text-sm mt-1">Add the first student to this classroom.</p>
        </div>
      )}

      <div className="space-y-2">
        {(Array.isArray(students) ? students : students?.students || []).map((s) => (
          <div key={s.id} className="bg-card border border-card-border rounded-xl px-5 py-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{s.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                {s.studentCode && <span>Code: {s.studentCode}</span>}
                {s.parentEmail ? (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    {s.parentEmail}
                  </span>
                ) : (
                  <span className="text-muted-foreground/60 italic">No parent email</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              {s.parentToken && (
                <button
                  onClick={() => copyParentLink(s.parentToken, s.name, toast)}
                  title="Copy parent portal link"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  Copy parent link
                </button>
              )}
              <Link href={`/students/${s.id}/trends`}>
                <Button variant="ghost" size="sm">View Trends</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
