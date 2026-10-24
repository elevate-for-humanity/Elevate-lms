export function isLearnerRosterProfile(profile: {
  id?: unknown;
  role?: unknown;
  email?: unknown;
}): boolean {
  return typeof profile.id === 'string' && profile.id.length > 0 &&
    ['student', 'learner', 'apprentice', 'barber_apprentice', 'cosmetology_apprentice'].includes(String(profile.role || '').toLowerCase()) &&
    !String(profile.email || '').toLowerCase().endsWith('@qa.invalid');
}

