/**
 * Employer-Apprentice Matching Service
 * Matches apprentices to host shops based on preferences, location, and availability
 */

import type { SupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface MatchCriteria {
  programId: string;
  zipCode?: string;
  maxDistance?: number; // miles
  preferredSchedule?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  hasTransportation?: boolean;
  certifications?: string[];
}

export interface EmployerMatch {
  employerId: string;
  employerName: string;
  shopName: string;
  address: string;
  distance?: number;
  score: number;
  reasons: string[];
  openSlots: number;
  rating?: number;
}

interface Employer {
  id: string;
  business_name: string;
  shop_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  available_slots?: number;
  programs?: string[];
}

interface Apprentice {
  id: string;
  user_id: string;
  program_id: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  schedule_preference?: string;
  has_transportation?: boolean;
  certifications?: string[];
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Score a match between apprentice and employer
 */
function scoreMatch(apprentice: Apprentice, employer: Employer, criteria: MatchCriteria): {
  score: number;
  reasons: string[];
} {
  let score = 50; // Base score
  const reasons: string[] = [];

  // Program match (required)
  if (employer.programs?.includes(criteria.programId)) {
    score += 20;
    reasons.push('Program match');
  } else {
    return { score: 0, reasons: ['No program match'] };
  }

  // Distance scoring (closer = better)
  if (apprentice.latitude && apprentice.longitude && employer.latitude && employer.longitude) {
    const distance = calculateDistance(
      apprentice.latitude, apprentice.longitude,
      employer.latitude, employer.longitude
    );
    
    if (distance <= 10) {
      score += 15;
      reasons.push(`Very close (${Math.round(distance)} miles)`);
    } else if (distance <= 25) {
      score += 10;
      reasons.push(`Nearby (${Math.round(distance)} miles)`);
    } else if (distance <= 50) {
      score += 5;
      reasons.push(`Within 50 miles`);
    }

    // If has transportation, reduce distance penalty
    if (criteria.hasTransportation && distance > 25) {
      score += 5;
      reasons.push('Transportation available');
    }
  }

  // Schedule preference match
  if (criteria.preferredSchedule && employer.available_slots) {
    if (criteria.preferredSchedule === 'flexible') {
      score += 5;
      reasons.push('Flexible schedule');
    }
  }

  // Certifications match
  if (criteria.certifications?.length && employer.available_slots) {
    const certMatch = criteria.certifications.filter(c => 
      employer.available_slots && employer.available_slots > 0
    ).length;
    if (certMatch > 0) {
      score += certMatch * 3;
      reasons.push(`${certMatch} relevant certifications`);
    }
  }

  // Rating bonus
  if (employer.rating && employer.rating >= 4.5) {
    score += 5;
    reasons.push('Highly rated');
  } else if (employer.rating && employer.rating >= 4.0) {
    score += 3;
    reasons.push('Good rating');
  }

  // Availability bonus
  if (employer.available_slots && employer.available_slots >= 3) {
    score += 3;
    reasons.push('Multiple openings');
  }

  return { score: Math.min(100, score), reasons };
}

/**
 * Find best employer matches for an apprentice
 */
export async function findEmployerMatches(
  supabase: SupabaseClient,
  apprenticeId: string,
  criteria: MatchCriteria,
  limit = 5
): Promise<EmployerMatch[]> {
  // Get apprentice profile
  const { data: apprentice } = await supabase
    .from('apprentices')
    .select('*')
    .eq('id', apprenticeId)
    .single();

  if (!apprentice) {
    logger.warn('[matching] Apprentice not found', { apprenticeId });
    return [];
  }

  // Query employers with matching programs
  const { data: employers } = await supabase
    .from('employers')
    .select('*')
    .gt('available_slots', 0)
    .eq('status', 'active');

  if (!employers?.length) {
    logger.info('[matching] No employers with availability');
    return [];
  }

  // Score each employer
  const scored: EmployerMatch[] = [];
  
  for (const employer of employers) {
    const { score, reasons } = scoreMatch(apprentice as Apprentice, employer as Employer, criteria);
    
    if (score > 30) { // Minimum threshold
      scored.push({
        employerId: employer.id,
        employerName: employer.business_name,
        shopName: employer.shop_name || employer.business_name,
        address: [employer.address, employer.city, employer.state, employer.zip].filter(Boolean).join(', '),
        score,
        reasons,
        openSlots: employer.available_slots || 0,
        rating: employer.rating,
      });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

/**
 * Create a match proposal
 */
export async function createMatchProposal(
  supabase: SupabaseClient,
  apprenticeId: string,
  employerId: string,
  proposedBy: string
): Promise<{ success: boolean; matchId?: string; error?: string }> {
  // Check if match already exists
  const { data: existing } = await supabase
    .from('host_shop_match_requests')
    .select('id')
    .eq('apprentice_id', apprenticeId)
    .eq('host_shop_id', employerId)
    .single();

  if (existing) {
    return { success: false, error: 'Match already exists' };
  }

  // Create match proposal
  const { data: match, error } = await supabase
    .from('host_shop_match_requests')
    .insert({
      apprentice_id: apprenticeId,
      host_shop_id: employerId,
      status: 'pending',
      admin_notes: `Proposed by ${proposedBy}`,
    })
    .select('id')
    .single();

  if (error) {
    logger.error('[matching] Failed to create proposal', error);
    return { success: false, error: error.message };
  }

  logger.info('[matching] Match proposal created', { apprenticeId, employerId, matchId: match.id });
  return { success: true, matchId: match.id };
}

/**
 * Accept a match proposal
 */
export async function acceptMatch(
  supabase: SupabaseClient,
  matchId: string,
  acceptedBy: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('host_shop_match_requests')
    .update({
      status: 'active',
      responded_by: acceptedBy,
      responded_at: new Date().toISOString(),
    })
    .eq('id', matchId);

  if (error) {
    return { success: false, error: error.message };
  }

  logger.info('[matching] Match accepted', { matchId });
  return { success: true };
}
