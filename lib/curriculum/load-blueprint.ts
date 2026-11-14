import 'server-only';

/** Lazy blueprint loader. */
export async function loadBlueprint(programSlug: string) {
  switch (programSlug) {
    case 'hvac-epa608-v1':
    case 'hvac-technician':
      return null;
    case 'barber':
    case 'barber-apprenticeship': {
      const mod = await import('@/lib/curriculum/blueprints/barber-apprenticeship');
      return mod.barberApprenticeshipBlueprint ?? null;
    }
    case 'crs-indiana': {
      const mod = await import('@/lib/curriculum/blueprints/crs-indiana');
      return mod.crsIndianaBlueprint ?? null;
    }
    default: {
      try {
        const mod = await import(`@/lib/curriculum/blueprints/${programSlug}`) as Record<string, unknown>;
        return mod.default ?? Object.values(mod)[0] ?? null;
      } catch {
        return null;
      }
    }
  }
}

export async function loadAllBlueprints() {
  const { getAllBlueprints } = await import('@/lib/curriculum/blueprints');
  return getAllBlueprints();
}
