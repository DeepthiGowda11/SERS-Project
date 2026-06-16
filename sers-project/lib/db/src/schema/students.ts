import { pgTable, text, serial, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classroomsTable } from "./classrooms";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  classroomId: integer("classroom_id").notNull().references(() => classroomsTable.id),
  name: text("name").notNull(),
  studentCode: text("student_code"),
  parentEmail: text("parent_email"),
  parentToken: uuid("parent_token").notNull().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true, parentToken: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
