import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

export async function reportTenantUsage() {
  const supabase = await createClient();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("*")
    .not("stripe_account_id", "is", null)
    .not("stripe_price_id", "is", null);

  if (!tenants || tenants.length === 0) {
    return;
  }

  for (const t of tenants) {
    // Count active learners in last 30 days
    const { count: activeCount } = await supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", t.id)
      .eq("status", "in_progress")
      .gte(
        "updated_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (!activeCount || activeCount === 0) {
      continue;
    }

    try {
      // Report usage to Stripe
      await stripe.billing.meterEvents.create({
        event_name: "active_learner",
        payload: {
          stripe_customer_id: t.stripe_customer_id,
          value: activeCount.toString(),
        },
        timestamp: Math.floor(Date.now() / 1000),
      });

      console.log(
        `Tenant ${t.name}: Reported ${activeCount} active learners`
      );
    } catch (error) {
    }
  }
}

// Run if called directly
if (require.main === module) {
  reportTenantUsage()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      process.exit(1);
    });
}
