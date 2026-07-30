import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CourseInput = {
  title: string;
  slug: string;
  description: string;
  programId?: string;
  status?: "draft" | "published";
};

function getConfiguration() {
  const url = process.env.SUPABASE_URL;
  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error(
      "Missing Supabase server configuration",
    );
  }

  return {
    url,
    serviceRole,
  };
}

export async function GET() {
  try {
    const { url, serviceRole } =
      getConfiguration();

    const response = await fetch(
      `${url}/rest/v1/courses?select=*&order=updated_at.desc`,
      {
        headers: {
          apikey: serviceRole,
          Authorization: `Bearer ${serviceRole}`,
        },
        cache: "no-store",
      },
    );

    const result = await response.json();

    return NextResponse.json(result, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load courses",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const input =
      (await request.json()) as CourseInput;

    if (
      !input.title ||
      !input.slug ||
      !input.description
    ) {
      return NextResponse.json(
        {
          error:
            "title, slug, and description are required",
        },
        {
          status: 400,
        },
      );
    }

    const { url, serviceRole } =
      getConfiguration();

    const response = await fetch(
      `${url}/rest/v1/courses`,
      {
        method: "POST",
        headers: {
          apikey: serviceRole,
          Authorization: `Bearer ${serviceRole}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          title: input.title,
          slug: input.slug,
          description: input.description,
          program_id: input.programId || null,
          status: input.status ?? "draft",
          updated_at: new Date().toISOString(),
        }),
        cache: "no-store",
      },
    );

    const result = await response.json();

    return NextResponse.json(result, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create course",
      },
      {
        status: 500,
      },
    );
  }
}
