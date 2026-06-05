/**
 * Official addresses — headquarters vs instructional sites.
 * Use on footers, structured data, and contact pages (not per-program hardcoding).
 */

export const ORG_HEADQUARTERS = {
  label: 'Administrative Headquarters',
  street: '8888 Keystone Crossing, Suite 1300',
  city: 'Indianapolis',
  state: 'IN',
  zip: '46240',
  note: 'Enrollment, compliance, and administrative support — not an instructional facility.',
} as const;

export const ORG_TRAINING_SITES = [
  {
    label: 'Indianapolis Training & Testing',
    city: 'Indianapolis',
    state: 'IN',
    note: 'Hands-on labs, EPA 608 proctoring, Certiport testing, and clinical rotations by program.',
  },
] as const;

export function formatHeadquartersLine(): string {
  return `${ORG_HEADQUARTERS.street}, ${ORG_HEADQUARTERS.city}, ${ORG_HEADQUARTERS.state} ${ORG_HEADQUARTERS.zip}`;
}
