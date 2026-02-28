// supabase/functions/send-partner-completion-email/index.ts
// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type RequestBody = {
  to: string;
  studentName: string;
  courseName: string;
  partnerName: string;
  certificateUrl: string;
  certificateNumber?: string;
  verificationUrl?: string;
};

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const EMAIL_FROM =
  Deno.env.get("EMAIL_FROM") ?? "no-reply@www.elevateforhumanity.org";
const APP_NAME = "Elevate For Humanity";

function buildSubject(data: RequestBody): string {
  return `You completed ${data.courseName}! 🎓`;
}

function buildTextBody(data: RequestBody): string {
  return `
Hi ${data.studentName},

Congratulations! You have successfully completed:

  ${data.courseName}
  Delivered through: ${data.partnerName}

You can download your certificate here:
  ${data.certificateUrl}

${
  data.certificateNumber
    ? `Certificate Number: ${data.certificateNumber}\n`
    : ""
}${
    data.verificationUrl
      ? `Verify your credential here: ${data.verificationUrl}\n`
      : ""
  }

Your completion is recorded in your ${APP_NAME} student dashboard for WIOA / WRG / Apprenticeship reporting.

Keep this email and your certificate for your records.

– ${APP_NAME} Support
`.trim();
}

function buildHtmlBody(data: RequestBody): string {
  const certNumberBlock = data.certificateNumber
    ? `<p style="margin: 4px 0 0; font-size: 13px; color: #374151;">
        Certificate Number:
        <strong>${data.certificateNumber}</strong>
      </p>`
    : "";

  const verifyBlock = data.verificationUrl
    ? `<p style="margin: 8px 0 0; font-size: 13px; color: #374151;">
        Verify your credential:
        <a href="${data.verificationUrl}" style="color: #0ea5e9; text-decoration: none;">
          ${data.verificationUrl}
        </a>
      </p>`
    : "";

  return `
  <html>
    <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #ffffff; padding: 24px;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 24px 24px 20px; border: 1px solid #e5e7eb;">
        <h1 style="font-size: 20px; margin: 0 0 8px; color: #111827;">
          🎉 Congratulations, ${data.studentName}!
        </h1>
        <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">
          You've completed your training.
        </p>

        <p style="margin: 16px 0 8px; font-size: 14px; color: #374151;">
          You successfully completed:
        </p>
        <p style="margin: 0 0 8px; font-size: 14px; color: #111827;">
          <strong>${data.courseName}</strong>
        </p>
        <p style="margin: 0 0 12px; font-size: 13px; color: #6b7280;">
          Delivered through <strong>${data.partnerName}</strong>.
        </p>

        <div style="margin: 16px 0 12px;">
          <a
            href="${data.certificateUrl}"
            style="
              display: inline-block;
              background: #ea580c;
              color: #ffffff;
              padding: 10px 20px;
              border-radius: 999px;
              font-size: 13px;
              font-weight: 600;
              text-decoration: none;
            "
          >
            Download Your Certificate
          </a>
        </div>

        ${certNumberBlock}
        ${verifyBlock}

        <p style="margin: 16px 0 8px; font-size: 13px; color: #6b7280;">
          Your completion is recorded in your
          <strong>${APP_NAME}</strong> student dashboard for WIOA / WRG / Apprenticeship reporting.
        </p>

        <p style="margin: 8px 0 0; font-size: 12px; color: #6b7280;">
          Keep this email and your certificate for your records. Employers may ask for your certificate or number during hiring or onboarding.
        </p>

        <p style="margin: 12px 0 0; font-size: 12px; color: #9ca3af;">
          – ${APP_NAME} Support
        </p>
      </div>
    </body>
  </html>
  `.trim();
}

async function sendEmail(body: RequestBody): Promise<Response> {
  const subject = buildSubject(body);
  const text = buildTextBody(body);
  const html = buildHtmlBody(body);

  // Try SendGrid first, fall back to Resend
  if (SENDGRID_API_KEY) {
    const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: body.to }],
            subject,
          },
        ],
        from: {
          email: EMAIL_FROM,
          name: APP_NAME,
        },
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
      }),
    });

    if (sgRes.ok) {
      return new Response(
        JSON.stringify({ success: true, provider: "sendgrid" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const errText = await sgRes.text();
  }

  // Fall back to Resend
  if (RESEND_API_KEY) {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${APP_NAME} <${EMAIL_FROM}>`,
        to: [body.to],
        subject,
        html,
        text,
      }),
    });

    if (resendRes.ok) {
      return new Response(
        JSON.stringify({ success: true, provider: "resend" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const errText = await resendRes.text();
  }

  return new Response("Email service not configured", { status: 500 });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch (error) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const required: (keyof RequestBody)[] = [
    "to",
    "studentName",
    "courseName",
    "partnerName",
    "certificateUrl",
  ];

  for (const key of required) {
    if (!payload[key]) {
      return new Response(`Missing field: ${key}`, { status: 400 });
    }
  }

  const body: RequestBody = {
    to: payload.to,
    studentName: payload.studentName,
    courseName: payload.courseName,
    partnerName: payload.partnerName,
    certificateUrl: payload.certificateUrl,
    certificateNumber: payload.certificateNumber,
    verificationUrl: payload.verificationUrl,
  };

  return await sendEmail(body);
});
