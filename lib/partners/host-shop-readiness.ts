export type HostShopReadinessItem = {
  key: string;
  title: string;
  detail: string;
  href: string;
  severity: 'required' | 'review';
};

type ReadinessBoard = {
  partner?: {
    verification_status?: string | null;
    mou_signed?: boolean | null;
    onboarding_completed?: boolean | null;
  } | null;
  onboardingPaths: { signMou: string; documents: string };
  missingDocuments: Array<{ document_name?: string; document_type?: string }>;
  pendingDocuments: Array<{ document_name?: string; document_type?: string }>;
  documentsComplete: boolean;
  unconfiguredPrograms: Array<{ programSlug?: string | null }>;
};

export function getHostShopReadinessItems(board: ReadinessBoard): HostShopReadinessItem[] {
  const items: HostShopReadinessItem[] = [];
  if (board.partner?.verification_status !== 'verified') {
    items.push({ key: 'verification', title: 'Business verification pending', detail: 'Elevate must finish reviewing the approved Host Shop record.', href: '/host-shop/dashboard/profile', severity: 'review' });
  }
  if (!board.partner?.mou_signed) {
    items.push({ key: 'mou', title: 'Host Shop MOU must be signed', detail: 'Review and electronically sign the Host Shop agreement.', href: board.onboardingPaths.signMou, severity: 'required' });
  }
  for (const document of board.missingDocuments) {
    items.push({ key: `document:${document.document_type || document.document_name}`, title: `Missing: ${document.document_name || 'required document'}`, detail: 'Upload a current readable file for compliance review.', href: board.onboardingPaths.documents, severity: 'required' });
  }
  for (const document of board.pendingDocuments) {
    items.push({ key: `review:${document.document_type || document.document_name}`, title: `In review: ${document.document_name || 'required document'}`, detail: 'The file is uploaded and awaiting Elevate review.', href: '/host-shop/dashboard/documents', severity: 'review' });
  }
  if (board.unconfiguredPrograms.length) {
    items.push({ key: 'standards', title: 'Registered-program standard needs configuration', detail: `Regulated progress is blocked for ${board.unconfiguredPrograms.map((item) => item.programSlug || 'the assigned occupation').join(', ')}.`, href: '/host-shop/dashboard/programs', severity: 'review' });
  }
  if (board.documentsComplete && !board.partner?.onboarding_completed) {
    items.push({ key: 'orientation', title: 'Required orientation is incomplete', detail: 'Complete and sign the current Host Shop operating orientation.', href: '/host-shop/orientation', severity: 'required' });
  }
  return items;
}
