// supabase/functions/send-partner-enrollment-email/index.ts
// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type RequestBody = {
  to: string;
  studentName: string;
  courseName: string;
  partnerName: string;
  launchUrl: string;
  partnerLoginUrl: string;
  username: string;
};

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "no-reply@www.elevateforhumanity.org";
const APP_NAME = "Elevate For Humanity";

function buildSubject(data: RequestBody): string {
  return `You're enrolled in ${data.courseName} (${data.partnerName})`;
}

function buildTextBody(data: RequestBody): string {
  return `
Hi ${data.studentName},

You're officially enrolled in:

  ${data.courseName}
  Delivered through: ${data.partnerName}

Start your course now:
  ${data.launchUrl}

If the button/link above doesn't work, you can log in directly to the partner site:

  Partner login: ${data.partnerLoginUrl}
  Username: ${data.username}

This training is tracked in your ${APP_NAME} student dashboard for WIOA / WRG / Apprenticeship reporting.

If you didn't request this enrollment, please reply to this email or contact support.

– ${APP_NAME} Support
`.trim();
}

function buildHtmlBody(data: RequestBody): string {
  return `
  <html>
    <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #ffffff; padding: 24px;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 24px 24px 20px; border: 1px solid #e5e7eb;">
        <h1 style="font-size: 20px; margin: 0 0 8px; color: #111827;">
          You're enrolled in ${data.courseName}
        </h1>
        <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">
          Delivered through <strong>${data.partnerName}</strong>
        </p>

        <p style="margin: 16px 0 8px; font-size: 14px; color: #374151;">
          Hi ${data.studentName},
        </p>
        <p style="margin: 0 0 12px; font-size: 14px; color: #374151;">
          Great news – you've been automatically enrolled in
          <strong>${data.courseName}</strong> through our industry partner
          <strong>${data.partnerName}</strong>.
        </p>

        <div style="margin: 16px 0;">
          <a
            href="${data.launchUrl}"
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
            Start / Continue Course
          </a>
        </div>

        <p style="margin: 12px 0 8px; font-size: 13px; color: #6b7280;">
          If the button above doesn't work, you can log in directly to the partner site:
        </p>
        <ul style="margin: 0 0 12px 1.25rem; padding: 0; font-size: 13px; color: #374151;">
          <li>
            <strong>Partner login:</strong>
            <a href="${data.partnerLoginUrl}" style="color: #0ea5e9; text-decoration: none;">
              ${data.partnerLoginUrl}
            </a>
          </li>
          <li><strong>Username:</strong> ${data.username}</li>
        </ul>

        <p style="margin: 12px 0 8px; font-size: 13px; color: #6b7280;">
          Your progress and completion will be tracked in your
          <strong>${APP_NAME}</strong> student dashboard for WIOA / WRG / Apprenticeship records.
        </p>

        <p style="margin: 12px 0 8px; font-size: 12px; color: #9ca3af;">
          If you didn't request this enrollment, please reply to this email or contact support.
        </p>

        <p style="margin: 8px 0 0; font-size: 12px; color: #6b7280;">
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
    "launchUrl",
    "partnerLoginUrl",
    "username",
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
    launchUrl: payload.launchUrl,
    partnerLoginUrl: payload.partnerLoginUrl,
    username: payload.username,
  };

  return await sendEmail(body);
});



