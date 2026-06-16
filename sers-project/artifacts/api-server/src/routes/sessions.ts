import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, sessionsTable, emotionRecordsTable } from "@workspace/db";
import { GetSessionParams, UpdateSessionParams, UpdateSessionBody, ListSessionRecordsParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/sessions/:id", async (req, res): Promise<void> => {
  const params = GetSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, params.data.id));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(session);
});

router.patch("/sessions/:id", async (req, res): Promise<void> => {
  const params = UpdateSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateSessionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Partial<{ isActive: boolean; endTime: Date }> = {};
  if (body.data.isActive !== undefined) updateData.isActive = body.data.isActive;
  if (body.data.endTime !== undefined) updateData.endTime = new Date(body.data.endTime);

  const [session] = await db.update(sessionsTable).set(updateData).where(eq(sessionsTable.id, params.data.id)).returning();
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(session);
});

router.get("/sessions/:id/records", async (req, res): Promise<void> => {
  const params = ListSessionRecordsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const records = await db
    .select()
    .from(emotionRecordsTable)
    .where(eq(emotionRecordsTable.sessionId, params.data.id))
    .orderBy(desc(emotionRecordsTable.recordedAt));
  res.json(records);
});

export default router;
