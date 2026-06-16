import { pgTable, serial, timestamp, integer, text, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { sessionsTable } from "./sessions";

export const emotionRecordsTable = pgTable("emotion_records", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id),
  emotion: text("emotion").notNull(),
  alertLevel: text("alert_level").notNull(),
  confidence: real("confidence"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEmotionRecordSchema = createInsertSchema(emotionRecordsTable).omit({ id: true, recordedAt: true });
export type InsertEmotionRecord = z.infer<typeof insertEmotionRecordSchema>;
export type EmotionRecord = typeof emotionRecordsTable.$inferSelect;
