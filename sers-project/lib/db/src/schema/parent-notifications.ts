import { pgTable, serial, timestamp, integer, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";

export const parentNotificationsTable = pgTable("parent_notifications", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  message: text("message").notNull(),
  emotion: text("emotion").notNull(),
  emailSent: boolean("email_sent").notNull().default(false),
  emailAddress: text("email_address"),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertParentNotificationSchema = createInsertSchema(parentNotificationsTable).omit({ id: true, sentAt: true });
export type InsertParentNotification = z.infer<typeof insertParentNotificationSchema>;
export type ParentNotification = typeof parentNotificationsTable.$inferSelect;
