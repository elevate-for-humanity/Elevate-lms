import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workspace = fs.readFileSync(
  path.resolve('components/program-holder/ProgramHolderWorkspaceView.tsx'),
  'utf8',
);
const guard = fs.readFileSync(path.resolve('lib/auth/require-program-holder.ts'), 'utf8');
const payment = fs.readFileSync(path.resolve('lib/program-holder/release-payment.ts'), 'utf8');
const mou = fs.readFileSync(path.resolve('apps/lms/app/program-holder/sign-mou/page.tsx'), 'utf8');

describe('program-holder dashboard hero', () => {
  it('uses the account image before a program-specific fallback', () => {
    expect(workspace).toContain(
      'if (avatarUrl?.trim()) return { src: avatarUrl.trim(), isPortrait: true }',
    );
    expect(workspace).toContain("getProgramCardImage(programSlug || 'business-administration')");
  });

  it('uses Jozanna George for Mesmerized by Beauty', () => {
    expect(workspace).toContain(
      "'4bc589d3-bd39-4a50-a724-73e50506c1f1': '/images/jozanna-george.jpg'",
    );
  });

  it('does not force the HVAC image onto unrelated dashboards', () => {
    expect(workspace).not.toContain("'/images/trades/hero-program-hvac.jpg'");
    expect(workspace).not.toContain('isCarlinaBanner');
    expect(guard).toContain('avatar_url?: string | null');
  });

  it('scopes HVAC requirements and payout copy to the assigned program', () => {
    expect(workspace).toContain("...(isHvac ? [{ label: 'HVAC program assignment'");
    expect(payment).not.toContain('David must finish');
    expect(payment).not.toContain('HVAC training payment');
    expect(mou).not.toContain('INDY ON DEMAND SERVICES LLC');
    expect(mou).toContain("from('program_holder_programs')");
  });
});
