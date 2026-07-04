import 'server-only';

/**
 * Lazy blueprint loader.
 *
 * Replaces top-level blueprint imports so each blueprint module is only
 * loaded when actually needed, keeping them out of the shared bundle.
 */
export async function loadBlueprint(programSlug: string): Promise<unknown> {
  switch (programSlug) {
    case 'hvac-epa608-v1':
    case 'hvac-technician': {
      // Blueprint migrated to DB — no static file
      return null;
    }
    case 'barber':
    case 'barber-apprenticeship': {
      const mod = await import('@/lib/curriculum/blueprints/barber-apprenticeship') as { barberApprenticeshipBlueprint?: unknown };
      return mod.barberApprenticeshipBlueprint ?? null;
    }
    case 'crs-indiana': {
      const mod = await import('@/lib/curriculum/blueprints/crs-indiana') as { crsIndianaBlueprint?: unknown };
      return mod.crsIndianaBlueprint ?? null;
    }
    default: {
      // Try dynamic import by slug as fallback
      try {
        const mod = await import(`@/lib/curriculum/blueprints/${programSlug}`);
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
