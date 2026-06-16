import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, parentNotificationsTable, studentsTable } from "@workspace/db";
import { CreateParentNotificationBody, ListParentNotificationsQueryParams } from "@workspace/api-zod";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const APP_URL = process.env.REPLIT_DOMAINS
  ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
  : "http://localhost:80";

const router: IRouter = Router();

router.get("/parent-notifications", async (req, res): Promise<void> => {
  const query = ListParentNotificationsQueryParams.safeParse(req.query);
  let results;
  if (query.success && query.data.studentId) {
    results = await db
      .select()
      .from(parentNotificationsTable)
      .where(eq(parentNotificationsTable.studentId, query.data.studentId))
      .orderBy(desc(parentNotificationsTable.sentAt));
  } else {
    results = await db.select().from(parentNotificationsTable).orderBy(desc(parentNotificationsTable.sentAt));
  }
  res.json(results);
});

router.post("/parent-notifications", async (req, res): Promise<void> => {
  const parsed = CreateParentNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, parsed.data.studentId));

  let emailSent = false;
  let emailAddress: string | null = null;

  if (resend && student?.parentEmail) {
    emailAddress = student.parentEmail;
    const portalUrl = `${APP_URL}/parent/${student.parentToken}`;

    try {
      await resend.emails.send({
        from: "SERS <notifications@sers.app>",
        to: emailAddress,
        subject: `Wellbeing update for ${student.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: linear-gradient(135deg, #f9a8d4, #c084fc); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
              <h1 style="color: white; margin: 0; font-size: 22px;">SERS — Student Wellbeing Update</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">System for Emotional Response and Analysis</p>
            </div>

            <p style="color: #374151; font-size: 16px;">Dear Parent/Guardian,</p>

            <p style="color: #374151;">Your child's teacher has sent you a wellbeing update regarding <strong>${student.name}</strong>.</p>

            <div style="background: #fdf2f8; border: 1px solid #f0abfc; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="color: #86198f; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Teacher's Message</p>
              <p style="color: #374151; margin: 0;">${parsed.data.message}</p>
            </div>

            <p style="color: #374151;">You can view ${student.name}'s full emotion history and all teacher messages using the private link below:</p>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${portalUrl}" style="background: linear-gradient(135deg, #ec4899, #a855f7); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                View ${student.name}'s Dashboard
              </a>
            </div>

            <p style="color: #6b7280; font-size: 13px;">This link is private to you. Please do not share it. If you have concerns, contact your child's teacher directly.</p>

            <hr style="border: none; border-top: 1px solid #f3e8ff; margin: 24px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">SERS — Emotion Intelligence Platform</p>
          </div>
        `,
      });
      emailSent = true;
      req.log.info({ studentId: student.id, emailAddress }, "Parent notification email sent");
    } catch (err) {
      req.log.error({ err }, "Failed to send parent notification email");
    }
  } else if (!resend) {
    req.log.info("RESEND_API_KEY not set — email not sent (demo mode)");
  }

  const [notification] = await db
    .insert(parentNotificationsTable)
    .values({
      ...parsed.data,
      emailSent,
      emailAddress,
    })
    .returning();

  res.status(201).json(notification);
});

export default router;
