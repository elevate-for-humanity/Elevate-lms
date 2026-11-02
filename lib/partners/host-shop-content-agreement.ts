export const HOST_SHOP_CONTENT_AGREEMENT_VERSION = '2026-11-02-v1';
export const HOST_SHOP_CONTENT_AGREEMENT_TITLE =
  'Host Shop Copyright, Confidentiality and Restricted-Use Agreement';
export const HOST_SHOP_CONTENT_AGREEMENT_SECTIONS = [
  [
    'Ownership and limited permission',
    'Elevate materials identified as proprietary or copyrighted remain the property of Elevate for Humanity or their respective licensors. Access gives the Host Shop limited permission to use assigned materials to support its authorized Elevate apprentices. General professional knowledge, public information, the shop’s pre-existing materials, and independently developed work are not transferred to Elevate.',
  ],
  [
    'No unauthorized screenshots or copying',
    'Do not screenshot, screen-record, photograph, scrape, download, reproduce, or distribute protected lessons, videos, assessment questions, workbooks, or private dashboards without Elevate’s written permission. Downloads and printing expressly provided by Elevate for authorized training, accessibility accommodations, and legally required recordkeeping remain permitted. Keep copyright notices intact.',
  ],
  [
    'No passing off or competing use of materials',
    'Do not remove branding, claim Elevate materials as your own, sell or sublicense them, upload them into another course builder or AI service, or use them to develop or deliver an unauthorized competing training product. This restriction concerns misuse of protected materials; it does not prohibit ordinary salon work, lawful employment, independently developed training, or use of general skills. Any broader non-compete requires a separate, specifically scoped agreement and legal review.',
  ],
  [
    'Account and student privacy',
    'Use individual authorized accounts. Do not share passwords, permit unapproved access, or publish learner records, client identities, attendance, payroll, financial, medical, or compliance documents. Share only portfolio media you have permission to use, with appropriate client and student consent. Never post protected course screenshots in the Barber & Beauty Network.',
  ],
  [
    'Shop responsibilities',
    'The authorized signer will explain these rules to shop staff and apprentices who receive access, use the assigned syllabus and operating guide, maintain accurate attendance and supervised-work records, and promptly report suspected unauthorized use or access through Elevate’s secure communications.',
  ],
  [
    'End of access and retained records',
    'When access ends, stop using protected course materials and remove unauthorized copies. Retain only records required by law or expressly permitted by Elevate, protect them, and do not use retained records to operate another training product. Copyright and confidentiality duties continue for as long as the applicable rights or confidentiality obligations continue.',
  ],
  [
    'Agreement and limits',
    'The signer confirms authority to bind the named Host Shop and agrees to these terms electronically. These terms supplement the existing Host Shop agreement without changing verified student hours, earned progress, wage obligations, or legally protected reporting and other rights. No new signature is created for another person. Enforceability and any remedy remain subject to applicable law.',
  ],
] as const;
export const HOST_SHOP_CONTENT_AGREEMENT_TEXT = HOST_SHOP_CONTENT_AGREEMENT_SECTIONS.map(
  ([title, text]) => `${title}\n${text}`,
).join('\n\n');
