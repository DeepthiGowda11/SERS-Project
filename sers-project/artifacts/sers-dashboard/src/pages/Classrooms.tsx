import { useState } from "react";
import { Link } from "wouter";
import { useListClassrooms, useCreateClassroom, getListClassroomsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Classrooms() {
  const { data: classrooms, isLoading } = useListClassrooms();
  const createClassroom = useCreateClassroom();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [teacherName, setTeacherName] = useState("");

  const handleCreate = async () => {
    if (!name.trim() || !teacherName.trim()) return;
    await createClassroom.mutateAsync({ data: { name: name.trim(), teacherName: teacherName.trim() } });
    queryClient.invalidateQueries({ queryKey: getListClassroomsQueryKey() });
    setName("");
    setTeacherName("");
    setOpen(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Classrooms</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all registered classrooms</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Classroom</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Classroom</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Classroom Name</Label>
                <Input placeholder="e.g. Grade 8 Science" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Teacher Name</Label>
                <Input placeholder="e.g. Ms. Ramirez" value={teacherName} onChange={e => setTeacherName(e.target.value)} />
              </div>
              <Button onClick={handleCreate} disabled={createClassroom.isPending} className="w-full">
                {createClassroom.isPending ? "Creating..." : "Create Classroom"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 bg-muted rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (!classrooms || classrooms.length === 0) && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No classrooms yet</p>
          <p className="text-sm mt-1">Create your first classroom to get started.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Array.isArray(classrooms) ? classrooms : classrooms?.classrooms || []).map((c) => (
          <Link key={c.id} href={`/classrooms/${c.id}`}>
            <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{c.name}</div>
              <div className="text-sm text-muted-foreground mt-1">{c.teacherName}</div>
              <div className="text-xs text-muted-foreground mt-3 opacity-60">Created {formatDate(c.createdAt)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
