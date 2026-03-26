
import { NextResponse } from "next/server";
import { matchFundingPrograms } from "@/lib/funding/match";
import { createClient } from "@/lib/supabase/server";
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai-client";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: "AI features not configured. Please set OPENAI_API_KEY." },
      { status: 503 }
    );
  }

  const client = getOpenAIClient();
  if (!client) {
    return NextResponse.json(
      { error: "AI service unavailable" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    programTitle,
    cipCode,
    targetPopulation,
    hasApprenticeship,
    sector,
  } = await req.json();

  if (!programTitle) {
    return NextResponse.json(
      { error: "Program title required" },
      { status: 400 }
    );
  }

  // Get matching funding programs
  const matches = matchFundingPrograms({
    programTitle,
    cipCode,
    targetPopulation,
    hasApprenticeship,
    sector,
  });

  // Generate AI narrative if OpenAI is configured
  let narrative = "";

  if (process.env.OPENAI_API_KEY && matches.length > 0) {
    const summaryPrompt = `
Program: ${programTitle}
CIP Code: ${cipCode || "N/A"}
Target populations: ${(targetPopulation || []).join(", ") || "General"}
Has apprenticeship pathway: ${hasApprenticeship ? "Yes" : "No"}
Sector: ${sector || "N/A"}

Matching funding programs:
${matches
  .slice(0, 5)
  .map(
    (m) =>
      `- ${m.name} (${m.category}): ${m.description}
   Tags: ${m.tags.join(", ")}
   Eligibility: ${m.eligibility || "See program details"}
   Funding: ${m.fundingAmount || "Varies"}`
  )
  .join("\n\n")}

Write a strategic 2-3 paragraph explanation covering:
1. Why these funding programs align with this training program
2. How a workforce board, training provider, or educational institution could position Elevate for Humanity as an ideal provider
3. Any special considerations for the target populations (youth, adult, apprenticeship, reentry, etc.)
4. Specific action steps to pursue these funding opportunities

Be specific and actionable. Focus on practical next steps.
`;

    try {
      const completion = await client.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: summaryPrompt }],
        temperature: 0.7,
        max_tokens: 800,
      });

      narrative = completion.choices[0].message.content || "";
    } catch (error) { 
      logger.error("Failed to generate funding narrative:", error);
      narrative =
        "Unable to generate detailed recommendations at this time. Please review the matching programs above.";
    }
  } else if (matches.length === 0) {
    narrative =
      "No direct funding matches found. Consider broadening your program description or target populations. General workforce development funding (WIOA Adult/Youth) may still be applicable.";
  }

  return NextResponse.json({
    matches: matches.slice(0, 10), // Return top 10 matches
    narrative,
  });
}
export const POST = withApiAudit('/api/funding/recommend', _POST);
