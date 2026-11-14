import { describe, expect, it, vi } from 'vitest';
import { STUDENT_SUPPORT_TOPICS, studentSupportTopicHref } from '@/lib/navigation/student-support';
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('not found'); }, permanentRedirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
import LegacySupportTopic from '@/apps/marketing/app/student-support/[service]/page';
import fs from 'node:fs';

describe('one complete Student Support page', () => {
  it('preserves every retired topic bookmark as a real section', async () => {
    const source = fs.readFileSync('apps/marketing/app/student-support/page.tsx', 'utf8');
    for (const service of STUDENT_SUPPORT_TOPICS) {
      expect(source).toContain(`id: '${service}'`);
      expect(studentSupportTopicHref(service)).toBe(`/student-support#${service}`);
      await expect(LegacySupportTopic({ params: Promise.resolve({ service }) })).rejects.toThrow(`redirect:/student-support#${service}`);
      expect(source).not.toContain(`href="/student-support/${service}"`);
    }
  });
  it('does not turn unknown URLs into success pages', async () => {
    await expect(LegacySupportTopic({ params: Promise.resolve({ service: 'not-a-service' }) })).rejects.toThrow('not found');
  });
});
