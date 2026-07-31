import { NextRequest, NextResponse } from "next/server";
import { requireAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const AGENT_MAP: Record<string, string> = {
  "course-orchestrator": "Course Orchestrator",
  "instructional-designer": "Instructional Designer",
  "qa-designer": "QA Designer",
  "marketing-content": "Marketing Content Creator",
  "marketing-social": "Social Media Manager",
  "marketing-video": "Video Script Writer",
  "workforce-agent": "Workforce Agent Manager",
  "admissions-agent": "Admissions Agent",
  "media-designer": "Media Designer",
};

const AGENT_DESCRIPTIONS: Record<string, string> = {
  "course-orchestrator": "You are a Course Orchestrator for Elevate LMS. Help admins create and manage training programs, set up curricula, manage enrollments, and coordinate instructional resources.",
  "instructional-designer": "You are an Instructional Designer for Elevate LMS. Create effective learning objectives, design engaging activities, build assessments, and ensure curriculum alignment with industry standards.",
  "qa-designer": "You are a QA Designer for Elevate LMS. Review course content for quality, check accessibility, validate quiz questions, and ensure all materials meet educational standards.",
  "marketing-content": "You are a Marketing Content Creator for Elevate LMS. Write compelling copy for program pages, create hero banners, craft CTAs, and optimize content for SEO and conversions.",
  "marketing-social": "You are a Social Media Manager for Elevate LMS. Create engaging social posts, write LinkedIn and Twitter content, and build community engagement campaigns.",
  "marketing-video": "You are a Video Script Writer for Elevate LMS. Write compelling video scripts with hooks, structure, and strong CTAs for training program promotions.",
  "workforce-agent": "You are a Workforce Agent Manager for Elevate LMS. Manage apprenticeship programs, coordinate host shops, track competency records, and ensure DOL compliance.",
  "admissions-agent": "You are an Admissions Agent for Elevate LMS. Review applications, check eligibility, schedule interviews, manage enrollment steps, and guide students through the admission process.",
  "media-designer": "You are a Media Designer for Elevate LMS. Create visual assets, optimize images for web, generate alt text for accessibility, and design thumbnails and promotional graphics.",
};

export async function POST(req: NextRequest) {
  const db = await requireAdminClient();

  const { agentType, command, context } = await req.json();

  if (!command || typeof command !== "string") {
    return NextResponse.json({ success: false, message: "command is required" }, { status: 400 });
  }

  const agentName = AGENT_MAP[agentType] ?? "PARS AI";
  const systemPrompt = AGENT_DESCRIPTIONS[agentType] ?? "You are PARS, the Professional Automation and Reasoning System for Elevate LMS. Help admins with course creation, marketing content, student admissions, workforce management, and system operations.";

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    // Fall back to structured response without real AI
    return NextResponse.json({
      success: true,
      message: `PARS ${agentName} received: "${command}". Configure OPENAI_API_KEY to enable AI responses.`,
      actions: [`Command acknowledged: ${command.slice(0, 50)}`],
      data: { agent: agentType, mode: "no-api-key" },
    });
  }

  try {
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + openaiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: command },
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!completion.ok) {
      return NextResponse.json({
        success: false,
        message: "AI service error: " + completion.status,
      }, { status: 500 });
    }

    const data = await completion.json();
    const message = data.choices?.[0]?.message?.content ?? "No response received.";

    // Log to ai_tasks table
    await db.from("ai_tasks").insert({
      agent_id: agentType,
      task_type: "paris_command",
      command,
      status: "completed",
      result: { message } as any,
      quality_score: null,
    });

    return NextResponse.json({ success: true, message, agent: agentName });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message: "Error: " + msg }, { status: 500 });
  }
}
