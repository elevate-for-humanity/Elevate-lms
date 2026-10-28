import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StudentOnboardingLinks, { APPRENTICE_APPLICATION_URL } from '@/components/host-shop/StudentOnboardingLinks';
vi.mock('next/navigation', () => ({ redirect: vi.fn((url: string) => { throw new Error(`redirect:${url}`); }) }));
import ApplyPage from '@/apps/marketing/app/apply/page';
afterEach(cleanup);
describe('Host Shop and apprentice application entry', () => {
  it('offers Host Shop from the generic application entry', async () => {
    render(await ApplyPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole('link', { name: /Host Shop/ }).getAttribute('href')).toBe('/partners/host-shop/apply');
  });
  it('preserves student program and payment choices', async () => {
    await expect(ApplyPage({ searchParams: Promise.resolve({ program: 'cosmetology-apprenticeship', payment: 'plan' }) })).rejects.toThrow('redirect:/apply/student?program=cosmetology-apprenticeship&payment=plan');
  });
  it('opens the direct application and shares the shop instructions without assigning a student', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<StudentOnboardingLinks shopName="DBO Hair Studios" />);
    expect(screen.getByRole('link', { name: 'Onboard your students' }).getAttribute('href')).toBe(APPRENTICE_APPLICATION_URL);
    fireEvent.click(screen.getByRole('button', { name: 'Copy application link' }));
    expect(await screen.findByText('Application link copied. Send it to your apprentice.')).toBeTruthy();
    expect(writeText).toHaveBeenCalledWith(APPRENTICE_APPLICATION_URL);
    const email = decodeURIComponent(screen.getByRole('link', { name: 'Email application link' }).getAttribute('href') || '');
    expect(email).toContain('DBO Hair Studios');
    expect(email).toContain(APPRENTICE_APPLICATION_URL);
    expect(screen.getByText(/Applying does not automatically assign/)).toBeTruthy();
  });
  it('keeps a selectable link available when clipboard access fails', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    render(<StudentOnboardingLinks shopName="Shop" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy application link' }));
    expect(await screen.findByText('Select and copy the application link below.')).toBeTruthy();
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(APPRENTICE_APPLICATION_URL);
  });
});
