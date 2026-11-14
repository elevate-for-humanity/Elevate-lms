export type ApplicationModalityPreference = 'in_person' | 'virtual' | 'hybrid';

const MODALITY_ALIASES: Readonly<Record<string, ApplicationModalityPreference>> = {
  in_person: 'in_person',
  inperson: 'in_person',
  onsite: 'in_person',
  on_site: 'in_person',
  classroom: 'in_person',
  virtual: 'virtual',
  online: 'virtual',
  remote: 'virtual',
  hybrid: 'hybrid',
  blended: 'hybrid',
};

export function normalizeApplicationModalityPreference(
  input: unknown,
): ApplicationModalityPreference | null {
  if (typeof input !== 'string' || input.trim() === '') return null;

  const normalized = input.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return MODALITY_ALIASES[normalized] ?? null;
}
