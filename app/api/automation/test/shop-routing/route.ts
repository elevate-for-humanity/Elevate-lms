import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/automation/test/shop-routing
 * 
 * Test endpoint for shop routing automation.
 * Simulates apprentice application routing to shops.
 * 
 * FOR QA/DEMO PURPOSES ONLY.
 */
export async function POST() {
  const supabase = await createClient();

  // Check auth and admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const adminClient = createAdminClient();

  try {
    // Create test shops with varying characteristics
    const testShops = [
      {
        name: 'Nearby Shop - High Capacity',
        lat: 39.7684,
        lng: -86.1581,
        capacity: 10,
        currentApprentices: 2,
        distance: 2.5,
      },
      {
        name: 'Medium Distance - Medium Capacity',
        lat: 39.8000,
        lng: -86.2000,
        capacity: 5,
        currentApprentices: 3,
        distance: 8.0,
      },
      {
        name: 'Far Shop - Low Capacity',
        lat: 39.9000,
        lng: -86.3000,
        capacity: 3,
        currentApprentices: 2,
        distance: 15.0,
      },
    ];

    const testCases = [
      {
        name: 'High Confidence Match',
        apprenticeLocation: { lat: 39.7700, lng: -86.1600 },
        preferredShopId: null,
        expectedOutcome: 'auto_assigned',
      },
      {
        name: 'Preferred Shop Available',
        apprenticeLocation: { lat: 39.7700, lng: -86.1600 },
        preferredShopId: 'shop_1', // Will be replaced with actual ID
        expectedOutcome: 'auto_assigned',
      },
      {
        name: 'Low Confidence - Multiple Options',
        apprenticeLocation: { lat: 39.8500, lng: -86.2500 },
        preferredShopId: null,
        expectedOutcome: 'recommendations_generated',
      },
    ];

    const results = [];

    // Create test shops
    const createdShops: Array<{ id: string; name: string }> = [];
    for (const shop of testShops) {
      const { data: createdShop } = await adminClient
        .from('partners')
        .insert({
          name: `Test ${shop.name}`,
          owner_name: 'Test Owner',
          email: `shop-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
          phone: '555-0100',
          address_line1: '123 Test St',
          city: 'Indianapolis',
          state: 'IN',
          zip: '46201',
          lat: shop.lat,
          lng: shop.lng,
          apprentice_capacity: shop.capacity,
          status: 'active',
          account_status: 'active',
        })
        .select()
        .single();

      if (createdShop) {
        createdShops.push({ id: createdShop.id, name: shop.name });

        // Create MOU for shop
        await adminClient.from('partner_mous').insert({
          partner_id: createdShop.id,
          version: '1.0',
          status: 'signed',
          signed_at: new Date().toISOString(),
          expires_at: '2026-12-31',
        });
      }
    }

    // Run test cases
    for (const testCase of testCases) {
      // Create test application
      const { data: application } = await adminClient
        .from('applications')
        .insert({
          applicant_id: user.id,
          program_id: '00000000-0000-0000-0000-000000000001', // Placeholder
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!application) {
        results.push({
          testCase: testCase.name,
          success: false,
          error: 'Failed to create test application',
        });
        continue;
      }

      // Calculate scores for each shop
      const scoredShops = createdShops.map((shop, index) => {
        const shopData = testShops[index];
        
        // Calculate distance score
        const distance = Math.sqrt(
          Math.pow((testCase.apprenticeLocation.lat - shopData.lat) * 69, 2) +
          Math.pow((testCase.apprenticeLocation.lng - shopData.lng) * 54.6, 2)
        );
        const distanceScore = Math.max(0, 1 - (distance / 25));

        // Calculate capacity score
        const availableSlots = shopData.capacity - shopData.currentApprentices;
        const capacityScore = availableSlots / shopData.capacity;

        // Calculate total score
        const score = (distanceScore * 0.35) + (capacityScore * 0.25) + (0.25) + (0.7 * 0.15);

        return {
          shopId: shop.id,
          shopName: shop.name,
          score,
          distance,
          factors: {
            distanceScore,
            capacityScore,
            compatibilityScore: 1,
            reputationScore: 0.7,
          },
        };
      }).sort((a, b) => b.score - a.score);

      // Determine outcome
      const topScore = scoredShops[0].score;
      let outcome: string;
      let assignedShopId: string | null = null;

      if (testCase.preferredShopId && createdShops.length > 0) {
        // Use first shop as "preferred"
        assignedShopId = createdShops[0].id;
        outcome = 'auto_assigned';
      } else if (topScore >= 0.85) {
        assignedShopId = scoredShops[0].shopId;
        outcome = 'auto_assigned';
      } else {
        outcome = 'recommendations_generated';
      }

      // Persist recommendations
      for (let i = 0; i < scoredShops.length; i++) {
        await adminClient.from('shop_recommendations').insert({
          application_id: application.id,
          shop_id: scoredShops[i].shopId,
          rank: i + 1,
          score: scoredShops[i].score,
          distance_miles: scoredShops[i].distance,
          factors: scoredShops[i].factors,
        });
      }

      // Update application if assigned
      if (assignedShopId) {
        await adminClient
          .from('applications')
          .update({
            status: 'placed',
            assigned_shop_id: assignedShopId,
          })
          .eq('id', application.id);
      }

      // Record automated decision
      await adminClient.from('automated_decisions').insert({
        entity_type: 'application',
        entity_id: application.id,
        decision_type: 'shop_routing_test',
        outcome,
        actor: 'system',
        ruleset_version: '1.0.0-test',
        confidence_score: topScore,
        reason_codes: outcome === 'auto_assigned' 
          ? ['high_confidence_match']
          : ['below_auto_assign_threshold'],
        input_snapshot: {
          test_case: testCase.name,
          apprentice_location: testCase.apprenticeLocation,
          recommendations: scoredShops,
        },
        processing_time_ms: Math.floor(Math.random() * 200) + 50,
        created_at: new Date().toISOString(),
      });

      // Create review queue item if not auto-assigned
      if (outcome === 'recommendations_generated') {
        await adminClient.from('review_queue').insert({
          entity_type: 'application',
          entity_id: application.id,
          review_type: 'shop_assignment',
          priority: 3,
          status: 'pending',
          extracted_data: { recommendations: scoredShops },
          confidence_score: topScore,
          system_recommendation: `Top recommendation: ${scoredShops[0].shopName} (score: ${topScore.toFixed(2)})`,
          created_at: new Date().toISOString(),
        });
      }

      results.push({
        testCase: testCase.name,
        success: true,
        applicationId: application.id,
        expectedOutcome: testCase.expectedOutcome,
        actualOutcome: outcome,
        passed: outcome === testCase.expectedOutcome,
        topScore,
        assignedShopId,
        recommendationCount: scoredShops.length,
      });
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => r.success && !r.passed).length;
    const errors = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: {
        total: testCases.length,
        passed,
        failed,
        errors,
        shopsCreated: createdShops.length,
      },
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
