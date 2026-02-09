import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase configuration missing');
  }
  return createClient(url, key);
}

export async function revokeEntitlement(userId: string, entitlementCode: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("store_entitlements")
    .update({ 
      revoked_at: new Date().toISOString(),
      revoke_reason: "refund"
    })
    .eq("user_id", userId)
    .eq("entitlement_code", entitlementCode);

  if (error) {
    console.error("Error revoking entitlement:", error);
    throw error;
  }

  return { success: true };
}

export async function revokeLmsAccess(userId: string, courseId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("course_enrollments")
    .update({ 
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoke_reason: "refund"
    })
    .eq("user_id", userId)
    .eq("course_id", courseId);

  if (error) {
    console.error("Error revoking LMS access:", error);
    throw error;
  }

  return { success: true };
}

export async function revokeAllAccessForPayment(userId: string, paymentIntentId: string) {
  const supabase = getSupabaseAdmin();
  // Revoke all entitlements tied to this payment
  const { error: entitlementError } = await supabase
    .from("store_entitlements")
    .update({ 
      revoked_at: new Date().toISOString(),
      revoke_reason: "refund"
    })
    .eq("user_id", userId)
    .eq("stripe_payment_intent_id", paymentIntentId);

  if (entitlementError) {
    console.error("Error revoking entitlements:", entitlementError);
  }

  // Revoke any enrollments tied to this payment
  const { error: enrollmentError } = await supabase
    .from("enrollments")
    .update({ 
      status: "refunded",
      refunded_at: new Date().toISOString()
    })
    .eq("user_id", userId)
    .eq("stripe_payment_intent_id", paymentIntentId);

  if (enrollmentError) {
    console.error("Error revoking enrollments:", enrollmentError);
  }

  return { success: true };
}
