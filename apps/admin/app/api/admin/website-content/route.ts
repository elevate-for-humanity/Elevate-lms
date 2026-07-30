import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WebsiteContentInput = {
  route: string;
  title: string;
  eyebrow?: string;
  headline: string;
  summary: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  heroImage?: string;
  status?: "draft" | "published";
};

function configuration() {
  const url = process.env.SUPABASE_URL;
  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return {
    url,
    serviceRole,
  };
}

function headers(serviceRole: string) {
  return {
    apikey: serviceRole,
    Authorization: `Bearer ${serviceRole}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

export async function GET(
  request: NextRequest,
) {
  try {
    const { url, serviceRole } =
      configuration();

    const route =
      request.nextUrl.searchParams.get("route");

    const query = route
      ? `?route=eq.${encodeURIComponent(route)}&limit=1`
      : "?order=updated_at.desc";

    const response = await fetch(
      `${url}/rest/v1/website_pages${query}`,
      {
        headers: headers(serviceRole),
        cache: "no-store",
      },
    );

    const body = await response.json();

    return NextResponse.json(body, {
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
            : "Unable to load website content",
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
      (await request.json()) as WebsiteContentInput;

    if (
      !input.route ||
      !input.title ||
      !input.headline ||
      !input.summary
    ) {
      return NextResponse.json(
        {
          error:
            "route, title, headline, and summary are required",
        },
        {
          status: 400,
        },
      );
    }

    const { url, serviceRole } =
      configuration();

    const record = {
      route: input.route,
      title: input.title,
      eyebrow: input.eyebrow ?? null,
      headline: input.headline,
      summary: input.summary,
      primary_cta_label:
        input.primaryCtaLabel ?? null,
      primary_cta_href:
        input.primaryCtaHref ?? null,
      secondary_cta_label:
        input.secondaryCtaLabel ?? null,
      secondary_cta_href:
        input.secondaryCtaHref ?? null,
      hero_image: input.heroImage ?? null,
      status: input.status ?? "draft",
      updated_at: new Date().toISOString(),
    };

    const response = await fetch(
      `${url}/rest/v1/website_pages?on_conflict=route`,
      {
        method: "POST",
        headers: {
          ...headers(serviceRole),
          Prefer:
            "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(record),
        cache: "no-store",
      },
    );

    const body = await response.json();

    return NextResponse.json(body, {
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
            : "Unable to save website content",
      },
      {
        status: 500,
      },
    );
  }
}
