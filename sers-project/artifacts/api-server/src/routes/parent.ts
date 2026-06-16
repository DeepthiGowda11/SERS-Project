import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, studentsTable, emotionRecordsTable, parentNotificationsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/parent/:token", async (req, res): Promise<void> => {
  const { token } = req.params;

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.parentToken, token));

  if (!student) {
    res.status(404).json({ error: "Invalid or expired link." });
    return;
  }

  const recentRecords = await db
    .select()
    .from(emotionRecordsTable)
    .where(eq(emotionRecordsTable.studentId, student.id))
    .orderBy(desc(emotionRecordsTable.recordedAt))
    .limit(50);

  const notifications = await db
    .select()
    .from(parentNotificationsTable)
    .where(eq(parentNotificationsTable.studentId, student.id))
    .orderBy(desc(parentNotificationsTable.sentAt))
    .limit(20);

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

  const alertLevel = dominantEmotion ? emotionMap.get(dominantEmotion)?.alertLevel ?? null : null;

  res.json({
    student: {
      id: student.id,
      name: student.name,
      parentEmail: student.parentEmail,
    },
    recentRecords: recentRecords.map((r) => ({
      ...r,
      recordedAt: r.recordedAt.toISOString(),
    })),
    notifications: notifications.map((n) => ({
      ...n,
      sentAt: n.sentAt.toISOString(),
    })),
    emotionCounts,
    dominantEmotion,
    alertLevel,
  });
});

export default router;
