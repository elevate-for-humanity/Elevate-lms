/** Fail closed: the phone host (or a wildcard covering it) must never be retired with legacy domains. */
const DOMAIN = 'elevateforhumanity.org';
export const PHONE = 'phone.' + DOMAIN;
const normalize = value => String(value).trim().toLowerCase().replace(/\\.$/, '');
const protectsPhone = host => [PHONE, '*.' + DOMAIN].includes(normalize(host));

export function assertNotPhoneRetirement(target, rootInventory = []) {
  const host = normalize(target);
  if (protectsPhone(host)) throw Error('Protected PBX domain registration: ' + host);
  if (host === DOMAIN && rootInventory.some(protectsPhone)) {
    throw Error('Protected PBX binding present in root-domain inventory; manual review required');
  }
}
