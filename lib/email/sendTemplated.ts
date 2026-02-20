import { getEmailTemplate, renderTemplate, renderSubject } from "./templates";
import sgMail from "@sendgrid/mail";
import { logger } from "@/lib/logger";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function sendTenantTemplatedEmail(params: {
  key: string;
  tenantId?: string | null;
  to: string;
  variables: Record<string, string>;
}) {
  const tmpl = await getEmailTemplate(params.key, params.tenantId);

  if (!tmpl) {
    logger.warn("Missing email template for key", { key: params.key, tenantId: params.tenantId });
    return;
  }

  const html = renderTemplate(tmpl.html, params.variables);
  const subject = renderSubject(tmpl.subject, params.variables);

  if (!process.env.SENDGRID_API_KEY) {
    logger.info("SendGrid not configured, would send email", {
      to: params.to,
      subject,
      htmlPreview: html.substring(0, 100)
    });
    return;
  }

  try {
    await sgMail.send({
      to: params.to,
      from: process.env.SENDGRID_FROM || "noreply@elevateforhumanity.org",
      subject,
      html,
    });
  } catch (error) { /* Error handled silently */ 
    logger.error("Failed to send templated email", error as Error, {
      to: params.to,
      subject,
      key: params.key
    });
    throw error;
  }
}

// Convenience functions for common email types
export async function sendWelcomeEmail(params: {
  tenantId?: string | null;
  studentName: string;
  studentEmail: string;
  platformName?: string;
}) {
  await sendTenantTemplatedEmail({
    key: "welcome_student",
    tenantId: params.tenantId,
    to: params.studentEmail,
    variables: {
      student_name: params.studentName,
      platform_name: params.platformName || "Elevate for Humanity",
    },
  });
}

export async function sendEnrollmentConfirmation(params: {
  tenantId?: string | null;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  startDate: string;
}) {
  await sendTenantTemplatedEmail({
    key: "enrollment_confirmation",
    tenantId: params.tenantId,
    to: params.studentEmail,
    variables: {
      student_name: params.studentName,
      course_title: params.courseTitle,
      start_date: params.startDate,
    },
  });
}

export async function sendCourseReminder(params: {
  tenantId?: string | null;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  progress: number;
}) {
  await sendTenantTemplatedEmail({
    key: "course_reminder",
    tenantId: params.tenantId,
    to: params.studentEmail,
    variables: {
      student_name: params.studentName,
      course_title: params.courseTitle,
      progress: params.progress.toString(),
    },
  });
}

export async function sendCertificateEarned(params: {
  tenantId?: string | null;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
}) {
  await sendTenantTemplatedEmail({
    key: "certificate_earned",
    tenantId: params.tenantId,
    to: params.studentEmail,
    variables: {
      student_name: params.studentName,
      course_title: params.courseTitle,
    },
  });
}
