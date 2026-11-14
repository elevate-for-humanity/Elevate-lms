/** Recruiting tools require an explicit recruiting assignment. */
export function hasRecruitingAssignment(features: any): boolean {
  return features?.recruiting_enabled === true;
}
