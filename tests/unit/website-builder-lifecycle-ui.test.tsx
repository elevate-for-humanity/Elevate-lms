import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { WebsiteConfigProvider } from '@/components/website-builder/WebsiteConfigProvider';
import { AutonomousWebsiteBuilder } from '@/components/website-builder/AutonomousWebsiteBuilder';
import { WebsiteLifecyclePanel } from '@/components/website-builder/WebsiteLifecyclePanel';
import { DomainPanel } from '@/components/website-builder/DomainPanel';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';

vi.mock('@/components/tenant/PublicTenantComposableSite', () => ({ PublicTenantComposableSite: () => <p>Draft preview</p> }));
vi.mock('@/components/website-builder/TenantDraftViewport', () => ({ TenantDraftViewport: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/voice/useNaturalVoice', () => ({ useNaturalVoice: () => ({ stop: vi.fn(), play: vi.fn() }) }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function editor(published = false, confirmStatus = true) {
  const config = buildDefaultSiteConfig({ organizationName: 'Test website' });
  const mutations: Array<Record<string, unknown>> = [];
  vi.stubGlobal('confirm', vi.fn(() => true));
  vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
    if (url.endsWith('/revisions')) return { ok: true, json: async () => ({ revisions: [] }) };
    if (url.endsWith('/domains')) return { ok: true, json: async () => ({
      configured: true, customDomainAllowed: true, plan: 'enterprise',
      domains: [{ id: 'local-domain', hostname: 'example.com', status: 'active', mode: 'connect' }],
    }) };
    const body = JSON.parse(String(options?.body));
    mutations.push(body);
    return { ok: true, json: async () => ({ website: { site_config: config, subdomain: 'test-site', ...(confirmStatus ? { is_published: body.publish ?? published } : {}) } }) };
  }));
  render(<WebsiteConfigProvider initialConfig={config} initiallyPublished={published}>
    <WebsiteLifecyclePanel websiteId="test" isPublished={published} />
    <AutonomousWebsiteBuilder websiteId="test" initialConfig={config} initialSiteName="Test website" initialSubdomain="test-site" initiallyPublished={published} />
    <DomainPanel websiteId="test" isPublished={published} />
  </WebsiteConfigProvider>);
  return mutations;
}

describe('website publication and domain workflow', () => {
  it('asks for the address before publishing and synchronizes publish/unpublish across every panel', async () => {
    const mutations = editor();
    await screen.findByText('Domain connected · SSL active · website unpublished');
    fireEvent.click(screen.getByRole('button', { name: 'Publish', exact: true }));
    expect(screen.getByRole('heading', { name: 'Choose your website address' })).toBeTruthy();
    expect(mutations).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Publish to this address' }));
    await screen.findByRole('button', { name: 'Unpublish', exact: true });
    expect(mutations[0].publish).toBe(true);
    expect(screen.getByRole('link', { name: 'Live', exact: true })).toHaveAttribute('href', '/sites/test-site');
    expect(screen.getByRole('button', { name: 'I own a domain' })).toBeTruthy();
    expect(screen.getByText('Website published · domain connected · SSL active')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Unpublish', exact: true }));
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Live', exact: true })).toBeNull());
    expect(mutations.at(-1)?.publish).toBe(false);
    expect(screen.getByText('Domain connected · SSL active · website unpublished')).toBeTruthy();
  });

  it('does not claim publication when the server omits confirmation', async () => {
    editor(false, false);
    fireEvent.click(screen.getByRole('button', { name: 'Publish', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Publish to this address' }));
    await screen.findByText(/server did not confirm the requested publish status/);
    expect(screen.queryByRole('button', { name: 'Unpublish', exact: true })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Live', exact: true })).toBeNull();
  });

  it('keeps Save separate from publishing and never changes the live URL from an unsaved address', async () => {
    const mutations = editor(true);
    fireEvent.change(screen.getByLabelText('Website address'), { target: { value: 'not-saved' } });
    expect(screen.getByRole('link', { name: 'Live', exact: true })).toHaveAttribute('href', '/sites/test-site');
    fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
    await screen.findByText('Website saved.');
    expect(mutations[0]).not.toHaveProperty('publish');
  });
});
