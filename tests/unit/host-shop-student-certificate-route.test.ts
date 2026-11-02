import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ role: vi.fn(), records: vi.fn(), pdf: vi.fn() }));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: mocks.role }));
vi.mock('@/lib/certificates/host-shop-students', () => ({ getHostShopStudentCertificates: mocks.records }));
vi.mock('@/lib/certificates/host-shop-student-pdf', () => ({ hostStudentCertificatePdf: mocks.pdf }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_name: string, handler: unknown) => handler }));
import { GET } from '@/apps/lms/app/api/host-shop/student-certificates/[recordId]/route';

beforeEach(() => { vi.clearAllMocks(); mocks.role.mockResolvedValue({ user: { id: 'shop-owner' } }); mocks.records.mockResolvedValue({ certificates: [{ id: 'placement-own', reference: 'EFH-HS-OWN' }] }); mocks.pdf.mockResolvedValue(new Uint8Array([37, 80, 68, 70])); });
it('exports only a record resolved through the current owner board and prevents cache sharing', async () => {
  const response = await GET(new Request('https://app.elevateforhumanity.org/api/host-shop/student-certificates/placement-own'), { params: Promise.resolve({ recordId: 'placement-own' }) });
  expect(mocks.records).toHaveBeenCalledWith('shop-owner');
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe('application/pdf');
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(response.headers.get('content-disposition')).toContain('EFH-HS-OWN.pdf');
});
it('rejects a guessed certificate from another shop without generating its document', async () => {
  const response = await GET(new Request('https://app.elevateforhumanity.org/api/host-shop/student-certificates/placement-foreign'), { params: Promise.resolve({ recordId: 'placement-foreign' }) });
  expect(response.status).toBe(404);
  expect(mocks.pdf).not.toHaveBeenCalled();
});
it('requires authorization before looking up student data', async () => {
  mocks.role.mockRejectedValue(new Error('unauthorized'));
  await expect(GET(new Request('https://app.elevateforhumanity.org/api/host-shop/student-certificates/placement-own'), { params: Promise.resolve({ recordId: 'placement-own' }) })).rejects.toThrow('unauthorized');
  expect(mocks.records).not.toHaveBeenCalled();
});
