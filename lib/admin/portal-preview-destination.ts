const HOST_SHOP_ROLES = new Set(['partner', 'host_shop', 'host_shop_admin']);
const PROGRAM_HOLDER_ROLES = new Set(['program_holder', 'programholder']);
const APPRENTICE_ROLES = new Set(['apprentice', 'barber_apprentice', 'cosmetology_apprentice']);

export function portalPreviewDestination(role: unknown) {
  const value = String(role || '');
  if (PROGRAM_HOLDER_ROLES.has(value)) return '/program-holder/dashboard';
  if (HOST_SHOP_ROLES.has(value)) return '/host-shop/dashboard';
  if (APPRENTICE_ROLES.has(value)) return '/apprentice';
  return '/lms/dashboard';
}
