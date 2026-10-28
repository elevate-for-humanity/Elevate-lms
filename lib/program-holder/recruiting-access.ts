/** Recruiting tools require an explicit assignment; a holder role alone is insufficient. */
export function hasRecruitingAssignment(features: any): boolean {
  return (
    features?.recruiting_enabled === true ||
    features?.regional_assignment?.all_programs_in_region === true ||
    (Array.isArray(features?.cdl_dashboard_instructions) &&
      features.cdl_dashboard_instructions.length > 0)
  );
}
