
/**
 * Grant Eligibility Engine
 * Validates entity eligibility for federal grants using SAM.gov data
 */

import { getEntityByUEI, checkExclusions } from '@/lib/integrations/sam-gov';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface EligibilityCheck {
  entityId: string;
  entityName: string;
  uei: string;
  checks: {
    samRegistered: boolean;
    samActive: boolean;
    ueiValid: boolean;
    cageValid: boolean;
    notExcluded: boolean;
    repsAndCertsCurrent: boolean;
    registrationNotExpired: boolean;
  };
  issues: string[];
  warnings: string[];
  eligible: boolean;
  score: number;
  checkedAt: Date;
}

export interface GrantEligibilityResult {
  grantId: string;
  grantTitle: string;
  entityId: string;
  entityName: string;
  eligible: boolean;
  matchScore: number;
  eligibilityCheck: EligibilityCheck;
  naicsMatch: boolean;
  locationMatch: boolean;
  entityTypeMatch: boolean;
  reasons: string[];
}

/**
 * Run comprehensive eligibility check for an entity
 */
export async function checkEntityEligibility(
  entityId: string
): Promise<EligibilityCheck> {
  const { data: entity, error } = await supabaseAdmin
    .from('entities')
    .select('*')
    .eq('id', entityId)
    .single();

  if (error || !entity) {
    throw new Error(`Entity not found: ${entityId}`);
  }

  const issues: string[] = [];
  const warnings: string[] = [];
  const checks = {
    samRegistered: false,
    samActive: false,
    ueiValid: false,
    cageValid: false,
    notExcluded: false,
    repsAndCertsCurrent: false,
    registrationNotExpired: false,
  };

  if (!entity.uei) {
    issues.push('No UEI (Unique Entity Identifier) on file');
    return {
      entityId: entity.id,
      entityName: entity.name,
      uei: '',
      checks,
      issues,
      warnings,
      eligible: false,
      score: 0,
      checkedAt: new Date(),
    };
  }

  try {
    const samEntity = await getEntityByUEI(entity.uei);

    if (!samEntity) {
      issues.push('Entity not found in SAM.gov registry');
      return {
        entityId: entity.id,
        entityName: entity.name,
        uei: entity.uei,
        checks,
        issues,
        warnings,
        eligible: false,
        score: 0,
        checkedAt: new Date(),
      };
    }

    const reg = samEntity.entityRegistration;

    checks.samRegistered = reg.samRegistered === 'Yes';
    if (!checks.samRegistered) {
      issues.push('Entity is not registered in SAM.gov');
    }

    checks.samActive = reg.registrationStatus === 'Active';
    if (!checks.samActive) {
      issues.push(`SAM.gov registration status: ${reg.registrationStatus}`);
    }

    checks.ueiValid = reg.ueiStatus === 'Active';
    if (!checks.ueiValid) {
      issues.push(`UEI status: ${reg.ueiStatus}`);
    }

    checks.cageValid = !!reg.cageCode && reg.cageCode.length > 0;
    if (!checks.cageValid) {
      warnings.push('No CAGE code found');
    }

    const isExcluded = await checkExclusions({ uei: entity.uei });
    checks.notExcluded = !isExcluded;
    if (isExcluded) {
      issues.push('Entity is on federal exclusions list');
    }

    const expirationDate = new Date(reg.registrationExpirationDate);
    const now = new Date();
    const daysUntilExpiration = Math.floor(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    checks.registrationNotExpired = daysUntilExpiration > 0;
    if (!checks.registrationNotExpired) {
      issues.push(
        `SAM.gov registration expired on ${reg.registrationExpirationDate}`
      );
    } else if (daysUntilExpiration < 30) {
      warnings.push(
        `SAM.gov registration expires in ${daysUntilExpiration} days`
      );
    }

    checks.repsAndCertsCurrent = daysUntilExpiration > 0;
    if (daysUntilExpiration < 60 && daysUntilExpiration > 0) {
      warnings.push(
        'Representations and Certifications should be updated soon'
      );
    }

    const score = Object.values(checks).filter(Boolean).length * 14.3;
    const eligible = issues.length === 0;

    await supabaseAdmin.from('entity_eligibility_checks').upsert(
      {
        entity_id: entityId,
        uei: entity.uei,
        sam_registered: checks.samRegistered,
        sam_active: checks.samActive,
        uei_valid: checks.ueiValid,
        cage_valid: checks.cageValid,
        not_excluded: checks.notExcluded,
        reps_certs_current: checks.repsAndCertsCurrent,
        registration_not_expired: checks.registrationNotExpired,
        issues: issues,
        warnings: warnings,
        eligible: eligible,
        score: Math.round(score),
        checked_at: new Date().toISOString(),
        sam_data: samEntity,
      },
      { onConflict: 'entity_id' }
    );

    return {
      entityId: entity.id,
      entityName: entity.name,
      uei: entity.uei,
      checks,
      issues,
      warnings,
      eligible,
      score: Math.round(score),
      checkedAt: new Date(),
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    issues.push(`SAM.gov API error: ${(error as Error).message}`);

    return {
      entityId: entity.id,
      entityName: entity.name,
      uei: entity.uei || '',
      checks,
      issues,
      warnings,
      eligible: false,
      score: 0,
      checkedAt: new Date(),
    };
  }
}

/**
 * Check if entity is eligible for a specific grant
 */
export async function checkGrantEligibility(
  grantId: string,
  entityId: string
): Promise<GrantEligibilityResult> {
  const { data: grant, error: grantError } = await supabaseAdmin
    .from('grant_opportunities')
    .select('*')
    .eq('id', grantId)
    .single();

  if (grantError || !grant) {
    throw new Error(`Grant not found: ${grantId}`);
  }

  const { data: entity, error: entityError } = await supabaseAdmin
    .from('entities')
    .select('*')
    .eq('id', entityId)
    .single();

  if (entityError || !entity) {
    throw new Error(`Entity not found: ${entityId}`);
  }

  const eligibilityCheck = await checkEntityEligibility(entityId);
  const reasons: string[] = [];

  const entityNaics = (entity.naics_list || []) as string[];
  const grantNaics = (grant.naics_tags || []) as string[];
  const naicsMatch =
    grantNaics.length === 0 ||
    entityNaics.some((n) => grantNaics.includes(n));

  if (!naicsMatch && grantNaics.length > 0) {
    reasons.push(
      `NAICS mismatch: Grant requires ${grantNaics.join(', ')}, entity has ${entityNaics.join(', ')}`
    );
  } else if (naicsMatch && grantNaics.length > 0) {
    const matching = entityNaics.filter((n) => grantNaics.includes(n));
    reasons.push(`NAICS match: ${matching.join(', ')}`);
  }

  const locationLimit = grant.location_limit as string | null;
  const entityState = entity.state as string | null;
  const locationMatch =
    !locationLimit ||
    locationLimit === 'US' ||
    locationLimit === entityState;

  if (!locationMatch) {
    reasons.push(
      `Location mismatch: Grant limited to ${locationLimit}, entity in ${entityState}`
    );
  }

  const grantCategories = (grant.categories || []) as string[];
  const entityType = entity.entity_type as string;
  let entityTypeMatch = true;

  if (grantCategories.includes('nonprofit') && entityType !== 'nonprofit') {
    entityTypeMatch = false;
    reasons.push('Grant requires nonprofit status');
  }

  if (
    grantCategories.includes('small_business') &&
    entityType !== 'for_profit'
  ) {
    entityTypeMatch = false;
    reasons.push('Grant requires for-profit/small business status');
  }

  const eligible =
    eligibilityCheck.eligible &&
    naicsMatch &&
    locationMatch &&
    entityTypeMatch;

  let matchScore = 0;
  if (naicsMatch) matchScore += 40;
  if (locationMatch) matchScore += 20;
  if (entityTypeMatch) matchScore += 20;
  matchScore += eligibilityCheck.score * 0.2;

  if (!eligible) {
    reasons.push(...eligibilityCheck.issues);
  }

  await supabaseAdmin.from('grant_eligibility_results').upsert(
    {
      grant_id: grantId,
      entity_id: entityId,
      eligible: eligible,
      match_score: Math.round(matchScore),
      naics_match: naicsMatch,
      location_match: locationMatch,
      entity_type_match: entityTypeMatch,
      eligibility_check_id: eligibilityCheck.entityId,
      reasons: reasons,
      checked_at: new Date().toISOString(),
    },
    { onConflict: 'grant_id,entity_id' }
  );

  return {
    grantId: grant.id,
    grantTitle: grant.title,
    entityId: entity.id,
    entityName: entity.name,
    eligible,
    matchScore: Math.round(matchScore),
    eligibilityCheck,
    naicsMatch,
    locationMatch,
    entityTypeMatch,
    reasons,
  };
}

/**
 * Batch check eligibility for all entities against all active grants
 */
export async function batchCheckEligibility(): Promise<{
  checked: number;
  eligible: number;
  ineligible: number;
}> {
  const { data: entities } = await supabaseAdmin.from('entities').select('id');

  const { data: grants } = await supabaseAdmin
    .from('grant_opportunities')
    .select('id')
    .gte('due_date', new Date().toISOString().slice(0, 10));

  if (!entities || !grants) {
    return { checked: 0, eligible: 0, ineligible: 0 };
  }

  let checked = 0;
  let eligible = 0;
  let ineligible = 0;

  for (const entity of entities) {
    await checkEntityEligibility(entity.id);
  }

  for (const grant of grants) {
    for (const entity of entities) {
      const result = await checkGrantEligibility(grant.id, entity.id);
      checked++;
      if (result.eligible) {
        eligible++;
      } else {
        ineligible++;
      }
    }
  }

  return { checked, eligible, ineligible };
}
