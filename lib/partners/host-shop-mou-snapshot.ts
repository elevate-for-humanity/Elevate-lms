import { getHostShopMouMeta, getHostShopMouSections, type HostShopMouProgram } from './host-shop-mou-sections';

/** Preserve the terms shown to the signer, rather than only a typed name. */
export function hostShopMouSnapshot(input: {
  partnerId: string; organizationName: string; program: HostShopMouProgram;
  documentVersion: string; signerName: string; signerTitle: string; signedAt: string;
}) {
  const meta = getHostShopMouMeta(input.program);
  const sections = getHostShopMouSections(input.program);
  if (!sections.length || sections.some(section => !section.title.trim() || !section.content.trim())) {
    throw new Error('HOST_SHOP_MOU_CONTENT_UNAVAILABLE');
  }
  return { ...input, documentTitle: meta.title, registrationLabel: meta.registrationLabel, sections };
}
