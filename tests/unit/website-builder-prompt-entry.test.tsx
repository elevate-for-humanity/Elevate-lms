import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PromptWebsiteCreator } from '@/components/website-builder/PromptWebsiteCreator';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function enterBrief() {
  fireEvent.change(screen.getByLabelText('Business or website name'), {
    target: { value: 'Curvature Body Sculpting' },
  });
  fireEvent.change(screen.getByLabelText('What should your website do?'), {
    target: {
      value:
        'Create a store for our real body oils with complete product images, an about page and contact details.',
    },
  });
  fireEvent.submit(screen.getByRole('button', { name: 'Create my website' }).closest('form')!);
}

describe('prompt-first website creation', () => {
  it('sends a customer brief to the existing generator and exposes generation errors', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Generation unavailable. No draft saved.' }),
      });
    vi.stubGlobal('fetch', fetch);
    render(<PromptWebsiteCreator />);
    enterBrief();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('No draft saved'));
    const payload = JSON.parse(fetch.mock.calls[0][1].body);
    expect(payload.businessName).toBe('Curvature Body Sculpting');
    expect(payload.brief).toContain('complete product images');
    expect(payload.answers).toBeUndefined();
    expect(screen.getByRole('button', { name: 'Create my website' })).not.toBeDisabled();
  });

  it('rejects successful HTTP responses that have no saved draft', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ generated: true }) }),
    );
    render(<PromptWebsiteCreator />);
    enterBrief();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('not saved'));
  });
});
