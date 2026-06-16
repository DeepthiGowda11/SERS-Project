import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, studentsTable, emotionRecordsTable } from "@workspace/db";
import { CreateStudentBody, GetStudentParams, GetStudentTrendsParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/students", async (req, res): Promise<void> => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [student] = await db.insert(studentsTable).values(parsed.data).returning();
  res.status(201).json(student);
});

router.get("/students/:id", async (req, res): Promise<void> => {
  const params = GetStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, params.data.id));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.json(student);
});

router.get("/students/:id/trends", async (req, res): Promise<void> => {
  const params = GetStudentTrendsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const studentId = params.data.id;

  const recentRecords = await db
    .select()
    .from(emotionRecordsTable)
    .where(eq(emotionRecordsTable.studentId, studentId))
    .orderBy(desc(emotionRecordsTable.recordedAt))
    .limit(50);

  const emotionMap = new Map<string, { count: number; alertLevel: string }>();
  for (const r of recentRecords) {
    const existing = emotionMap.get(r.emotion);
    if (existing) {
      existing.count++;
    } else {
      emotionMap.set(r.emotion, { count: 1, alertLevel: r.alertLevel });
    }
  }

  const emotionCounts = Array.from(emotionMap.entries()).map(([emotion, v]) => ({
    emotion,
    count: v.count,
    alertLevel: v.alertLevel,
  }));

  const dominantEmotion = emotionCounts.length > 0
    ? emotionCounts.reduce((a, b) => (a.count >= b.count ? a : b)).emotion
    : null;

  const alertLevel = dominantEmotion
    ? emotionMap.get(dominantEmotion)?.alertLevel ?? null
    : null;

  res.json({
    studentId,
    emotionCounts,
    recentRecords: recentRecords.map((r) => ({
      ...r,
      recordedAt: r.recordedAt.toISOString(),
    })),
    dominantEmotion,
    alertLevel,
  });
});

export default router;
