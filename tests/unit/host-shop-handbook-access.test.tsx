import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HostShopHandbook } from '@/components/partners/HostShopHandbook';

describe('Host Shop handbook access', () => {
  it('explains program structure and separates RTI from host responsibilities', () => {
    render(<HostShopHandbook />);
    expect(screen.getByRole('heading', { name: 'Host Shop operating handbook' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'How the registered apprenticeship works' }),
    ).toBeTruthy();
    expect(
      screen.getByText(/Host Shops do not create theory lessons, award RTI hours/),
    ).toBeTruthy();
    expect(
      screen.getByText(/Provide a qualified licensed supervisor and safe, hands-on instruction/),
    ).toBeTruthy();
  });

  it('offers the same handbook during onboarding without relaxing operational approval', () => {
    const onboarding = readFileSync('apps/lms/app/host-shop/onboarding/page.tsx', 'utf8');
    const resources = readFileSync('apps/lms/app/host-shop/dashboard/resources/page.tsx', 'utf8');
    const layout = readFileSync('apps/lms/app/host-shop/dashboard/layout.tsx', 'utf8');
    expect(onboarding).toContain('<HostShopHandbook />');
    expect(resources).toContain('<HostShopHandbook />');
    expect(onboarding).toContain('href="#handbook"');
    expect(layout).toContain("if (!partnerApproved) redirect('/host-shop/onboarding')");
  });
});
