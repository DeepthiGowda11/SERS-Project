import { Router, type IRouter } from "express";
import { db, emotionRecordsTable } from "@workspace/db";
import { CreateEmotionRecordBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/emotion-records", async (req, res): Promise<void> => {
  const parsed = CreateEmotionRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [record] = await db.insert(emotionRecordsTable).values(parsed.data).returning();
  res.status(201).json(record);
});

export default router;
