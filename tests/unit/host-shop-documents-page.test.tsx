import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
vi.mock('@/lib/partners/current-host-shop', () => ({ requireCurrentHostShopPartner: async () => ({ user: { id: 'host' }, partner: { name: 'Fixture Shop' }, isPlatformAdmin: false }) }));
vi.mock('@/lib/partner/board', () => ({ getHostShopBoard: async () => ({ requiredDocumentCount: 1, acceptedDocumentCount: 0, documentStatuses: [
 { document_type: 'salon_license', document_name: 'Salon license', is_required: true, status: 'missing' },
 { document_type: 'local_document', document_name: 'Local document', is_required: false, status: 'missing' },
] }) }));
vi.mock('@/apps/lms/app/host-shop/onboarding/documents/HostShopDocumentUploadForm', () => ({ default: () => null }));
import DocumentsPage from '@/apps/lms/app/host-shop/onboarding/documents/page';
it('distinguishes optional local paperwork from mandatory compliance documents', async () => {
 render(await DocumentsPage({ searchParams: Promise.resolve({}) }));
 expect(screen.getByText('If applicable')).toBeTruthy();
 expect(screen.getAllByText('Required')).toHaveLength(1);
 expect(screen.getByText(/0 of 1 required documents accepted/)).toBeTruthy();
});
