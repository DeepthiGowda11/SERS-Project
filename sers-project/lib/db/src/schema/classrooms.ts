import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const classroomsTable = pgTable("classrooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teacherName: text("teacher_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClassroomSchema = createInsertSchema(classroomsTable).omit({ id: true, createdAt: true });
export type InsertClassroom = z.infer<typeof insertClassroomSchema>;
export type Classroom = typeof classroomsTable.$inferSelect;
