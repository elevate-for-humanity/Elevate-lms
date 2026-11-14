import { normalizeHostShopProgram } from './host-shop-onboarding';

const SLUGS = {
  barber: 'barber-apprenticeship',
  cosmetology: 'cosmetology-apprenticeship',
  esthetician: 'esthetician-apprenticeship',
  nail_technician: 'nail-technician-apprenticeship',
};

export function hostShopStudentPrograms(partner: {
  programs?: string[] | null;
  program_type?: string | null;
  partner_type?: string | null;
}) {
  const assigned = partner.programs?.length
    ? partner.programs
    : [partner.program_type || partner.partner_type];
  return [
    ...new Set(
      assigned.flatMap((value) => {
        const program = normalizeHostShopProgram(value);
        return program ? [SLUGS[program]] : [];
      }),
    ),
  ];
}

export function hostShopStudentApplicationUrl(program: string, partnerId: string) {
  return `https://www.elevateforhumanity.org/apply/student/form?${new URLSearchParams({
    program,
    host_shop: partnerId,
  })}`;
}
