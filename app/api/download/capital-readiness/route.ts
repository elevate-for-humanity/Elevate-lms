import { logger } from '@/lib/logger';
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from '@/lib/supabase/admin';
import { getSignedDownload } from "@/lib/storage/getSignedDownload";
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check entitlement
  const { data: entitlement, error: entitlementError } = await db
    .from("store_entitlements")
    .select("id, revoked_at")
    .eq("user_id", user.id)
    .eq("entitlement_code", "capital_readiness")
    .is("revoked_at", null)
    .single();

  if (entitlementError || !entitlement) {
    return NextResponse.json(
      { error: "No valid entitlement found" },
      { status: 403 }
    );
  }

  // Generate signed URL for private file
  try {
    const url = await getSignedDownload("capital-readiness-guide-v1.pdf");
    return NextResponse.json({ url });
  } catch (err) {
    logger.error("Error generating signed URL:", err);
    return NextResponse.json(
      { error: "Failed to generate download link" },
      { status: 500 }
    );
  }
}
