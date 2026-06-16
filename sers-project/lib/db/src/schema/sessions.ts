import { pgTable, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classroomsTable } from "./classrooms";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  classroomId: integer("classroom_id").notNull().references(() => classroomsTable.id),
  startTime: timestamp("start_time", { withTimezone: true }).notNull().defaultNow(),
  endTime: timestamp("end_time", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, startTime: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
