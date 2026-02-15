import { logger } from '@/lib/logger';
/**
 * Shop Routing Engine
 * Matches apprentices to shops based on location, capacity, specialties, and preferences
 */

import { createClient } from '@supabase/supabase-js';

// Types
export interface ShopProfile {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  current_apprentices: number;
  specialties: string[];
  mou_status: string;
  active: boolean;
}

export interface ApplicantProfile {
  id: string;
  user_id: string;
  preferred_location?: string;
  preferred_zip?: string;
  latitude?: number;
  longitude?: number;
  schedule_preference?: string;
  specialty_interest?: string[];
  max_commute_miles?: number;
  program_id: string;
}

export interface RoutingScore {
  shop_id: string;
  shop_name: string;
  total_score: number;
  distance_score: number;
  capacity_score: number;
  specialty_score: number;
  preference_score: number;
  distance_miles?: number;
  available_capacity: number;
  score_breakdown: Record<string, any>;
}

export interface RoutingResult {
  success: boolean;
  recommendations: RoutingScore[];
  auto_assigned?: string;
  decision_id?: string;
  review_queue_id?: string;
  error?: string;
}

/**
 * Get Supabase admin client
 */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate distance score (0-1, higher is better/closer)
 */
function calculateDistanceScore(
  distanceMiles: number,
  maxDistance: number
): number {
  if (distanceMiles <= 0) return 1;
  if (distanceMiles >= maxDistance) return 0;
  return 1 - distanceMiles / maxDistance;
}

/**
 * Calculate capacity score (0-1, higher means more availability)
 */
function calculateCapacityScore(
  capacity: number,
  currentApprentices: number
): number {
  const available = capacity - currentApprentices;
  if (available <= 0) return 0;
  if (available >= 3) return 1;
  return available / 3;
}

/**
 * Calculate specialty match score (0-1)
 */
function calculateSpecialtyScore(
  shopSpecialties: string[],
  applicantInterests: string[]
): number {
  if (!applicantInterests || applicantInterests.length === 0) return 0.5;
  if (!shopSpecialties || shopSpecialties.length === 0) return 0.5;
  
  const matches = applicantInterests.filter((interest) =>
    shopSpecialties.some(
      (specialty) =>
        specialty.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(specialty.toLowerCase())
    )
  );
  
  return matches.length / applicantInterests.length;
}

/**
 * Get routing recommendations for an application
 */
export async function getRoutingRecommendations(
  applicationId: string
): Promise<RoutingResult> {
  const supabase = getSupabaseAdmin();
  
  try {
    // 1. Get application details
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        *,
        user:profiles!applications_user_id_fkey(
          id, full_name, email
        )
      `)
      .eq('id', applicationId)
      .single();
    
    if (appError || !application) {
      return { success: false, recommendations: [], error: 'Application not found' };
    }
    
    // 2. Get routing ruleset
    const { data: ruleset } = await supabase
      .from('automation_rulesets')
      .select('rules, version')
      .eq('rule_type', 'shop_routing')
      .eq('is_active', true)
      .single();
    
    const rules = ruleset?.rules || {
      max_distance_miles: 25,
      min_capacity: 1,
      weights: { distance: 0.3, capacity: 0.2, specialty: 0.3, preference: 0.2 },
      auto_assign_threshold: 0.85,
    };
    
    // 3. Get eligible shops
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select('*')
      .eq('active', true)
      .eq('mou_status', 'fully_executed');
    
    if (shopsError || !shops || shops.length === 0) {
      return { success: false, recommendations: [], error: 'No eligible shops found' };
    }
    
    // 4. Get applicant location (from application or profile)
    const applicantLat = application.latitude || application.user?.latitude;
    const applicantLon = application.longitude || application.user?.longitude;
    const applicantInterests = application.specialty_interest || [];
    const maxCommute = application.max_commute_miles || rules.max_distance_miles;
    
    // 5. Score each shop
    const scores: RoutingScore[] = [];
    
    for (const shop of shops) {
      const availableCapacity = (shop.capacity || 0) - (shop.current_apprentices || 0);
      
      // Skip if no capacity
      if (availableCapacity < rules.min_capacity) continue;
      
      // Skip shops without geocoded coordinates - they can't be distance-scored
      if (!shop.latitude || !shop.longitude) continue;
      
      // Calculate distance
      let distanceMiles: number | undefined;
      let distanceScore = 0.5; // Default if no applicant location data
      
      if (applicantLat && applicantLon) {
        distanceMiles = calculateDistance(
          applicantLat,
          applicantLon,
          shop.latitude,
          shop.longitude
        );
        distanceScore = calculateDistanceScore(distanceMiles, maxCommute);
        
        // Skip if too far
        if (distanceMiles > maxCommute) continue;
      }
      
      // Calculate other scores
      const capacityScore = calculateCapacityScore(
        shop.capacity || 0,
        shop.current_apprentices || 0
      );
      
      const specialtyScore = calculateSpecialtyScore(
        shop.specialties || [],
        applicantInterests
      );
      
      // Preference score (could be based on applicant preferences matching shop attributes)
      const preferenceScore = 0.5; // Default, can be enhanced
      
      // Calculate weighted total
      const weights = rules.weights;
      const totalScore =
        distanceScore * weights.distance +
        capacityScore * weights.capacity +
        specialtyScore * weights.specialty +
        preferenceScore * weights.preference;
      
      scores.push({
        shop_id: shop.id,
        shop_name: shop.name,
        total_score: Math.round(totalScore * 100) / 100,
        distance_score: Math.round(distanceScore * 100) / 100,
        capacity_score: Math.round(capacityScore * 100) / 100,
        specialty_score: Math.round(specialtyScore * 100) / 100,
        preference_score: Math.round(preferenceScore * 100) / 100,
        distance_miles: distanceMiles ? Math.round(distanceMiles * 10) / 10 : undefined,
        available_capacity: availableCapacity,
        score_breakdown: {
          distance: { score: distanceScore, miles: distanceMiles, max: maxCommute },
          capacity: { score: capacityScore, available: availableCapacity, total: shop.capacity },
          specialty: { score: specialtyScore, shop: shop.specialties, applicant: applicantInterests },
          preference: { score: preferenceScore },
        },
      });
    }
    
    // 6. Sort by score and take top 5
    scores.sort((a, b) => b.total_score - a.total_score);
    const recommendations = scores.slice(0, 5);
    
    // 7. Store scores in database
    for (let i = 0; i < recommendations.length; i++) {
      const rec = recommendations[i];
      await supabase.from('shop_routing_scores').insert({
        application_id: applicationId,
        shop_id: rec.shop_id,
        total_score: rec.total_score,
        distance_score: rec.distance_score,
        capacity_score: rec.capacity_score,
        specialty_score: rec.specialty_score,
        preference_score: rec.preference_score,
        score_breakdown: rec.score_breakdown,
        rank: i + 1,
        status: 'recommended',
      });
    }
    
    // 8. Create automated decision
    const topScore = recommendations[0]?.total_score || 0;
    const decision = topScore >= rules.auto_assign_threshold ? 'recommended' : 'needs_review';
    
    const { data: decisionRecord } = await supabase
      .from('automated_decisions')
      .insert({
        subject_type: 'routing',
        subject_id: applicationId,
        decision,
        reason_codes: topScore >= rules.auto_assign_threshold
          ? ['HIGH_CONFIDENCE_MATCH']
          : ['MANUAL_REVIEW_REQUIRED'],
        input_snapshot: {
          applicant_location: { lat: applicantLat, lon: applicantLon },
          applicant_interests: applicantInterests,
          max_commute: maxCommute,
          top_recommendations: recommendations.slice(0, 3),
        },
        ruleset_version: ruleset?.version || '1.0.0',
        actor: 'system',
      })
      .select()
      .single();
    
    // 9. Add to review queue if needed
    let reviewQueueId: string | undefined;
    if (decision === 'needs_review') {
      const { data: queueItem } = await supabase
        .from('review_queue')
        .insert({
          queue_type: 'routing_review',
          subject_type: 'application',
          subject_id: applicationId,
          priority: 5,
          reasons: ['ROUTING_REVIEW_REQUIRED'],
          metadata: {
            top_score: topScore,
            recommendations_count: recommendations.length,
          },
        })
        .select()
        .single();
      
      reviewQueueId = queueItem?.id;
    }
    
    // 10. Log to audit
    await supabase.from('audit_logs').insert({
      actor_id: null,
      event_type: 'routing_calculated',
      resource_type: 'application',
      resource_id: applicationId,
      metadata: {
        recommendations_count: recommendations.length,
        top_score: topScore,
        decision,
      },
    });
    
    return {
      success: true,
      recommendations,
      decision_id: decisionRecord?.id,
      review_queue_id: reviewQueueId,
    };
  } catch (error) {
    logger.error('Routing error:', error);
    return {
      success: false,
      recommendations: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Assign apprentice to shop
 */
export async function assignToShop(
  applicationId: string,
  shopId: string,
  assignedBy?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  
  try {
    // 1. Update routing score status
    await supabase
      .from('shop_routing_scores')
      .update({ status: 'assigned', assigned_at: new Date().toISOString() })
      .eq('application_id', applicationId)
      .eq('shop_id', shopId);
    
    // 2. Mark other recommendations as expired
    await supabase
      .from('shop_routing_scores')
      .update({ status: 'expired' })
      .eq('application_id', applicationId)
      .neq('shop_id', shopId)
      .eq('status', 'recommended');
    
    // 3. Update application with shop assignment
    await supabase
      .from('applications')
      .update({ assigned_shop_id: shopId, assigned_at: new Date().toISOString() })
      .eq('id', applicationId);
    
    // 4. Increment shop's current apprentices
    await supabase.rpc('increment_shop_apprentices', { shop_id: shopId });
    
    // 5. Resolve any review queue items
    await supabase
      .from('review_queue')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: assignedBy,
        resolution: `Assigned to shop ${shopId}`,
      })
      .eq('subject_type', 'application')
      .eq('subject_id', applicationId)
      .eq('queue_type', 'routing_review');
    
    // 6. Log decision
    await supabase.from('automated_decisions').insert({
      subject_type: 'routing',
      subject_id: applicationId,
      decision: 'assigned',
      reason_codes: ['MANUAL_ASSIGNMENT'],
      input_snapshot: { shop_id: shopId, assigned_by: assignedBy },
      actor: assignedBy || 'system',
    });
    
    // 7. Audit log
    await supabase.from('audit_logs').insert({
      actor_id: assignedBy,
      event_type: 'apprentice_assigned',
      resource_type: 'application',
      resource_id: applicationId,
      metadata: { shop_id: shopId },
    });
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
