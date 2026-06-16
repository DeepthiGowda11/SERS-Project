import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, classroomsTable, studentsTable, sessionsTable, emotionRecordsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/overview", async (_req, res): Promise<void> => {
  const [[classroomCount], [studentCount], [activeSessionCount], [todayCount]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(classroomsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(studentsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(sessionsTable).where(sql`is_active = true`),
    db.select({ count: sql<number>`count(*)::int` }).from(emotionRecordsTable).where(sql`recorded_at >= current_date`),
  ]);

  const alertRows = await db
    .select({ alertLevel: emotionRecordsTable.alertLevel, count: sql<number>`count(*)::int` })
    .from(emotionRecordsTable)
    .where(sql`recorded_at >= current_date`)
    .groupBy(emotionRecordsTable.alertLevel);

  const alertCounts = { green: 0, yellow: 0, red: 0, total: 0 };
  for (const row of alertRows) {
    if (row.alertLevel === "green") alertCounts.green = row.count;
    else if (row.alertLevel === "yellow") alertCounts.yellow = row.count;
    else if (row.alertLevel === "red") alertCounts.red = row.count;
    alertCounts.total += row.count;
  }

  res.json({
    totalClassrooms: classroomCount?.count ?? 0,
    totalStudents: studentCount?.count ?? 0,
    activeSessions: activeSessionCount?.count ?? 0,
    todayRecords: todayCount?.count ?? 0,
    alertCounts,
  });
});

export default router;
