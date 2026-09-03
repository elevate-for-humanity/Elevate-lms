import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Application {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  program_interest: string;
  reference_number: string;
  status: string;
  created_at: string;
}

function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = Deno.env.get("SENDGRID_API_KEY")!;
  const data = JSON.stringify({
    personalizations: [{ to: [{ email: to }] }],
    from: { email: "paris@elevateforhumanity.org", name: "Paris - Elevate AI Advisor" },
    subject,
    content: [{ type: "text/html", value: html }],
  });
  return fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: data,
  }).then((r) => r.ok);
}

function parseIntent(text: string): "interested" | "not_interested" | "question" | "unknown" {
  const lower = text.toLowerCase();
  if (/no[t\s]interested|not interested|i\s*don'?t\s*want|withdraw|cancel/i.test(lower)) return "not_interested";
  if (/interested|yes|let'?s\s*do\s*it|move\s*forward|enroll|start|begin|schedule|call\s*you|counting\s*me/i.test(lower)) return "interested";
  if (/\?|how|what|can\s*i|tell\s*me|explain|want\s*to\s*know|unsure|confused/i.test(lower)) return "question";
  return "unknown";
}

function getProgramName(program: string): string {
  const programs: Record<string, string> = {
    "cna": "Certified Nursing Assistant (CNA)",
    "hvac-technician": "HVAC Technician",
    "barber-apprenticeship": "Barber Apprenticeship",
    "cdl-training": "CDL Training",
    "phlebotomy": "Phlebotomy Technician",
    "cosmetology-apprenticeship": "Cosmetology Apprenticeship",
    "forklift": "Forklift Certification",
    "nha-ekg-technician": "NHA EKG Technician",
    "dental-assistant": "Dental Assistant",
    "nha-phlebotomy": "NHA Phlebotomy",
    "welding": "Welding",
    "cybersecurity": "Cybersecurity",
    "emt-apprenticeship": "EMT Apprenticeship",
    "customer-service-pro": "Customer Service Professional",
    "peer-recovery-specialist": "Peer Recovery Specialist",
    "home-health-aide": "Home Health Aide",
    "it-help-desk": "IT Help Desk",
    "employer-partnership": "Employer Partnership",
    "drug-alcohol-specimen-collector": "Drug & Alcohol Specimen Collector",
  };
  return programs[program] || program;
}

function buildInterestedEmail(app: Application): string {
  const programName = getProgramName(app.program_interest);
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#f97316;color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;"><h1 style="margin:0;">You're Ready to Move Forward!</h1></div><div style="padding:30px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;"><p>Hi ${app.first_name},</p><p>I'm so excited you're ready to take the next step toward your new career in <strong>${programName}</strong>!</p><p><strong>Here's what happens next:</strong></p><div style="background:#fff;padding:20px;border-radius:8px;margin:16px 0;border:1px solid #e5e7eb;"><p style="margin:0 0 12px 0;"><strong>Step 1: Complete Your Enrollment Interview</strong></p><p style="margin:0 0 16px 0;">Visit <a href="https://www.elevateforhumanity.org/interview">elevateforhumanity.org/interview</a> to complete your quick enrollment interview.</p><p style="margin:0 0 12px 0;"><strong>Step 2: WorkOne Orientation</strong></p><p style="margin:0 0 16px 0;">Schedule your WorkOne orientation at <a href="https://workoneindy.com/locations">workoneindy.com/locations</a>. When you meet your Career Navigator, tell them:</p><p style="background:#f3f4f6;padding:12px;border-left:4px solid #f97316;margin:0 0 16px 0;">"I am interested in Elevate for Humanity through 2Exclusive LLC-S for the <strong>${programName}</strong> program."</p><p style="margin:0 0 12px 0;"><strong>Step 3: Confirm Your Appointment</strong></p><p style="margin:0;">Reply to this email or call <a href="tel:317-314-3757">317-314-3757</a> once you have your WorkOne appointment!</p></div><div style="background:#fef9c3;border:1px solid #fde047;padding:12px;border-radius:8px;margin:16px 0;"><p style="margin:0;"><strong>Important:</strong> Funding is limited and available on a first-come, first-served basis. The sooner you complete Steps 1-3, the better your chances!</p></div><p><strong>Questions?</strong> Reply to this email or call us at <a href="tel:317-314-3757">317-314-3757</a>.</p><p style="margin-top:24px;">Reference: <strong>${app.reference_number}</strong></p></div><div style="text-align:center;padding:20px;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;"><p style="margin:0;">Paris 🦜 | AI Career Advisor | Elevate for Humanity</p><p style="margin:4px 0 0 0;">📞 317-314-3757 | 🌐 www.elevateforhumanity.org</p></div></div>`;
}

function buildNotInterestedEmail(app: Application): string {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#6b7280;color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;"><h1 style="margin:0;">Application Update</h1></div><div style="padding:30px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;"><p>Hi ${app.first_name},</p><p>Thank you for letting us know. We have updated your application status to reflect that you are no longer interested at this time.</p><p>If you change your mind in the future, we would love to help you achieve your career goals. Simply visit <a href="https://www.elevateforhumanity.org">elevateforhumanity.org</a> or call us at <a href="tel:317-314-3757">317-314-3757</a>.</p><p>Wishing you all the best in your journey!</p><p style="margin-top:24px;">Reference: <strong>${app.reference_number}</strong></p></div><div style="text-align:center;padding:20px;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;"><p style="margin:0;">Paris 🦜 | AI Career Advisor | Elevate for Humanity</p></div></div>`;
}

function buildQuestionEmail(app: Application, question: string): string {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#f97316;color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;"><h1 style="margin:0;">Great Question!</h1></div><div style="padding:30px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;"><p>Hi ${app.first_name},</p><p>Thanks for reaching out! You asked:</p><p style="background:#fff;padding:12px;border-left:4px solid #f97316;font-style:italic;">"${question}"</p><p>A member of our admissions team will review your question and get back to you shortly!</p><p>In the meantime, visit <a href="https://www.elevateforhumanity.org">elevateforhumanity.org</a> or call <a href="tel:317-314-3757">317-314-3757</a>.</p><p style="margin-top:24px;">Reference: <strong>${app.reference_number}</strong></p></div><div style="text-align:center;padding:20px;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;"><p style="margin:0;">Paris 🦜 | AI Career Advisor | Elevate for Humanity</p></div></div>`;
}

function buildFollowUpEmail(app: Application): string {
  const programName = getProgramName(app.program_interest);
  const date = new Date(app.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#f97316;color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;"><h1 style="margin:0;">Action Required: Your Enrollment Next Steps</h1></div><div style="padding:30px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;"><p>Hi ${app.first_name},</p><p>I wanted to follow up regarding your application for <strong>${programName}</strong> submitted on ${date}.</p><p><strong>Here's what you need to do next:</strong></p><div style="background:#fff7ed;border:1px solid #fed7aa;padding:16px;border-radius:8px;margin:16px 0;"><p style="margin:0 0 8px 0;"><strong>Step 1:</strong> Visit <a href="https://workoneindy.com/locations">workoneindy.com/locations</a> to find your nearest WorkOne office</p><p style="margin:8px 0 8px 0;"><strong>Step 2:</strong> Schedule your orientation appointment</p><p style="margin:8px 0 0 0;"><strong>Step 3:</strong> Call us at <a href="tel:317-314-3757">317-314-3757</a> to let us know your appointment date!</p></div><p>When you meet with your Career Navigator, please say:</p><p style="background:#f3f4f6;padding:12px;border-left:4px solid #f97316;margin:12px 0;">"I am interested in Elevate for Humanity through 2Exclusive LLC-S for the <strong>${programName}</strong> program."</p><div style="background:#fef9c3;border:1px solid #fde047;padding:12px;border-radius:8px;margin:16px 0;"><p style="margin:0;"><strong>Funding is limited!</strong> Available on a first-come, first-served basis.</p></div><p>Reference: <strong>${app.reference_number}</strong></p><p>Questions? Reply to this email or call <a href="tel:317-314-3757">317-314-3757</a>.</p></div><div style="text-align:center;padding:20px;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;"><p style="margin:0;">Paris 🦜 | AI Career Advisor | Elevate for Humanity</p><p style="margin:4px 0 0 0;">📞 317-314-3757 | 🌐 www.elevateforhumanity.org</p></div></div>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    const { email, text, reply_subject } = body;

    if (!email) {
      const { data: apps } = await supabase.from("applications").select("*").in("status", ["submitted", "pending_workone"]).neq("email", "").order("created_at", { ascending: false }).limit(100);
      let sent = 0, failed = 0;
      for (const app of apps || []) {
        const success = await sendEmail(app.email, `Action Required: Your Enrollment Next Steps [Ref: ${app.reference_number}]`, buildFollowUpEmail(app));
        if (success) { await supabase.from("applications").update({ status: "pending_workone" }).eq("id", app.id); sent++; } else failed++;
        await new Promise(r => setTimeout(r, 250));
      }
      return new Response(JSON.stringify({ sent, failed, total: apps?.length || 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: app } = await supabase.from("applications").select("*").eq("email", email.toLowerCase()).single();
    if (!app) return new Response(JSON.stringify({ error: "Application not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const intent = parseIntent(text || reply_subject || "");
    let subject = "", html = "", newStatus = app.status;
    switch (intent) {
      case "not_interested": subject = `Application Update - Elevate for Humanity [Ref: ${app.reference_number}]`; html = buildNotInterestedEmail(app); newStatus = "withdrawn"; break;
      case "interested": subject = `You're Ready to Move Forward! [Ref: ${app.reference_number}]`; html = buildInterestedEmail(app); newStatus = "under_review"; break;
      case "question": subject = `Thanks for Your Question - Elevate for Humanity [Ref: ${app.reference_number}]`; html = buildQuestionEmail(app, text || reply_subject || "Your question"); newStatus = "under_review"; break;
      default: subject = `Thanks for Your Response - Elevate for Humanity [Ref: ${app.reference_number}]`; html = buildFollowUpEmail(app);
    }
    const success = await sendEmail(email, subject, html);
    if (success) await supabase.from("applications").update({ status: newStatus }).eq("id", app.id);
    return new Response(JSON.stringify({ success, intent, email, subject, status: newStatus }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
