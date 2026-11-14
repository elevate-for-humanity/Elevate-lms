/** Server query projections: omitted contact fields cannot reach the dashboard payload. */
export function studentContactProjection(namesOnly: boolean, hasNonCompete: boolean) {
  const granted = !namesOnly && hasNonCompete;
  return {
    granted,
    enrollment: granted ? ',email,phone' : '',
    applicant: granted ? ',applicant_email,applicant_phone' : '',
    notes: namesOnly ? '' : ',call_notes',
  };
}
