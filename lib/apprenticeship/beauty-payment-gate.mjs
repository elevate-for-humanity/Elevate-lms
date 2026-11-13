/**
 * Read-only, application-scoped access gate for the four paid beauty apprenticeships.
 * Never mutate an existing enrollment or treat a requested funding source as approval.
 * This preserves enrolled learners, including historical tuition plans and funded learners.
 */
const BEAUTY_SLUGS = new Set([
  'barber-apprenticeship',
  'cosmetology-apprenticeship',
  'esthetician-apprenticeship',
  'nail-technician-apprenticeship',
  'nail-tech-apprenticeship',
]);

export function canonicalBeautyApprenticeshipSlug(slug) {
  const value = String(slug || '').trim().toLowerCase();
  if (value.startsWith('barber-apprenticeship')) return 'barber-apprenticeship';
  if (value.startsWith('cosmetology-apprenticeship')) return 'cosmetology-apprenticeship';
  if (value.startsWith('esthetician-apprenticeship')) return 'esthetician-apprenticeship';
  if (value.startsWith('nail-technician-apprenticeship') || value === 'nail-tech-apprenticeship')
    return 'nail-technician-apprenticeship';
  return null;
}

export function isBeautyApprenticeshipSlug(slug) {
  return BEAUTY_SLUGS.has(String(slug || '').trim().toLowerCase()) ||
    canonicalBeautyApprenticeshipSlug(slug) !== null;
}

const normalize = value => String(value || '').trim().toLowerCase();
const isActive = row =>
  !row.revoked_at && ['active', 'enrolled', 'in_progress', 'confirmed'].includes(normalize(row.status)) &&
  ['active', 'enrolled', 'onboarding', 'orientation', 'confirmed'].includes(normalize(row.enrollment_state || row.status));
const isVerifiedAgencyFunding = app =>
  (app.funding_verified === true || app.has_workone_approval === true) &&
  ['wioa', 'workone', 'wrg', 'workforce_ready_grant'].includes(normalize(app.funding_type || app.funding_source));

/**
 * A lock is only an application payment gate, not revocation of an existing
 * approved enrollment. Full lesson/API authorization must still be enforced
 * independently on the server.
 */
export function evaluateBeautyPaymentGate(applications, enrollments, targetSlug = null) {
  const active = (enrollments || []).filter(isActive);
  // A learner with another active program must retain their normal dashboard.
  if (!targetSlug && active.some(row => !isBeautyApprenticeshipSlug(row.program_slug)))
    return null;
  const applied = (applications || []).filter(app =>
    isBeautyApprenticeshipSlug(app.program_slug || app.program_interest) &&
    (!targetSlug || canonicalBeautyApprenticeshipSlug(app.program_slug || app.program_interest) === canonicalBeautyApprenticeshipSlug(targetSlug)));
  for (const app of applied) {
    const slug = canonicalBeautyApprenticeshipSlug(app.program_slug || app.program_interest);
    if (active.some(row => canonicalBeautyApprenticeshipSlug(row.program_slug) === slug))
      continue;
    if (isVerifiedAgencyFunding(app)) continue;
    // Application payment_status or client flags alone are NOT authoritative.
    return { locked: true, programSlug: slug };
  }
  return null;
}

/** Use only against a server-side admin DB after the session's user ID is verified. */
export async function loadBeautyPaymentGate(db, userId, email, targetSlug = null) {
  const enrolled = await db.from('program_enrollments')
    .select('program_slug,status,enrollment_state,revoked_at')
    .or(`user_id.eq.${userId},student_id.eq.${userId}`)
    .limit(100);
  if (enrolled.error) throw new Error('APPRENTICESHIP_ENROLLMENT_GATE_UNAVAILABLE');
  let applications = await db.from('applications')
    .select('program_slug,program_interest,funding_type,funding_source,funding_verified,has_workone_approval,payment_status')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
  if (applications.error) throw new Error('APPRENTICESHIP_APPLICATION_GATE_UNAVAILABLE');
  // Check both links. A legacy, email-only beauty application can coexist with
  // a newer account-linked application for an unrelated program.
  let linkedApplications = applications.data || [];
  if (email) {
    const emailApplications = await db.from('applications')
      .select('program_slug,program_interest,funding_type,funding_source,funding_verified,has_workone_approval,payment_status')
      .ilike('email', email).order('created_at', { ascending: false }).limit(50);
    if (emailApplications.error) throw new Error('APPRENTICESHIP_APPLICATION_GATE_UNAVAILABLE');
    linkedApplications = [...linkedApplications, ...(emailApplications.data || [])];
  }
  return evaluateBeautyPaymentGate(linkedApplications, enrolled.data, targetSlug);
}
