import { describe, expect, it, vi } from 'vitest';
import { generateMetadata } from '@/apps/lms/app/install/[portal]/page';
import { getProgramHeroImage } from '@/lib/images/programImages';
vi.mock('@/components/pwa/PwaInstallButton', () => ({ PwaInstallButton: () => null }));

describe('program install cover metadata', () => {
  it('uses the selected program photo while preserving the learner manifest', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ portal: 'learner' }), searchParams: Promise.resolve({ program: 'hvac-technician' }) });
    expect(metadata.manifest).toBe('/manifest-lms.json');
    expect(metadata.openGraph?.images).toEqual([{ url: getProgramHeroImage('hvac-technician'), alt: expect.any(String) }]);
  });
  it('does not let an unrecognized program replace the apprentice identity', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ portal: 'apprentice' }), searchParams: Promise.resolve({ program: 'https://untrusted.example/image.jpg' }) });
    expect(metadata.manifest).toBe('/manifest-apprentice.json');
    expect(JSON.stringify(metadata.openGraph)).not.toContain('untrusted.example');
  });
});
