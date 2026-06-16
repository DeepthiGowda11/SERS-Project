import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, classroomsTable, studentsTable, sessionsTable, emotionRecordsTable } from "@workspace/db";
import {
  CreateClassroomBody,
  GetClassroomParams,
  ListClassroomStudentsParams,
  ListClassroomSessionsParams,
  CreateSessionParams,
  GetClassroomDashboardParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/classrooms", async (_req, res): Promise<void> => {
  const classrooms = await db.select().from(classroomsTable).orderBy(desc(classroomsTable.createdAt));
  res.json(classrooms);
});

router.post("/classrooms", async (req, res): Promise<void> => {
  const parsed = CreateClassroomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [classroom] = await db.insert(classroomsTable).values(parsed.data).returning();
  res.status(201).json(classroom);
});

router.get("/classrooms/:id", async (req, res): Promise<void> => {
  const params = GetClassroomParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [classroom] = await db.select().from(classroomsTable).where(eq(classroomsTable.id, params.data.id));
  if (!classroom) {
    res.status(404).json({ error: "Classroom not found" });
    return;
  }
  res.json(classroom);
});

router.get("/classrooms/:id/students", async (req, res): Promise<void> => {
  const params = ListClassroomStudentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const students = await db.select().from(studentsTable).where(eq(studentsTable.classroomId, params.data.id)).orderBy(studentsTable.name);
  res.json(students);
});

router.get("/classrooms/:id/sessions", async (req, res): Promise<void> => {
  const params = ListClassroomSessionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const sessions = await db.select().from(sessionsTable).where(eq(sessionsTable.classroomId, params.data.id)).orderBy(desc(sessionsTable.startTime));
  res.json(sessions);
});

router.post("/classrooms/:id/sessions", async (req, res): Promise<void> => {
  const params = CreateSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [session] = await db.insert(sessionsTable).values({ classroomId: params.data.id, isActive: true }).returning();
  res.status(201).json(session);
});

router.get("/classrooms/:id/dashboard", async (req, res): Promise<void> => {
  const params = GetClassroomDashboardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const classroomId = params.data.id;

  const [activeSession] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.classroomId, classroomId))
    .orderBy(desc(sessionsTable.startTime))
    .limit(1);

  const students = await db.select().from(studentsTable).where(eq(studentsTable.classroomId, classroomId)).orderBy(studentsTable.name);

  const studentStates = await Promise.all(
    students.map(async (student) => {
      if (!activeSession) {
        return { student, latestEmotion: null, alertLevel: null, lastUpdated: null };
      }
      const [latest] = await db
        .select()
        .from(emotionRecordsTable)
        .where(eq(emotionRecordsTable.studentId, student.id))
        .orderBy(desc(emotionRecordsTable.recordedAt))
        .limit(1);
      return {
        student,
        latestEmotion: latest?.emotion ?? null,
        alertLevel: latest?.alertLevel ?? null,
        lastUpdated: latest?.recordedAt?.toISOString() ?? null,
      };
    })
  );

  const emotionSummary = studentStates.reduce(
    (acc, s) => {
      if (s.alertLevel === "green") acc.green++;
      else if (s.alertLevel === "yellow") acc.yellow++;
      else if (s.alertLevel === "red") acc.red++;
      acc.total++;
      return acc;
    },
    { green: 0, yellow: 0, red: 0, total: 0 }
  );

  res.json({
    classroomId,
    activeSession: activeSession ?? null,
    studentStates,
    emotionSummary,
  });
});

export default router;
