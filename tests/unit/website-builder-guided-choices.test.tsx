import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { TenantChoiceSection } from '@/components/tenant/TenantChoiceSection';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';
import { TenantPreviewProvider } from '@/components/tenant/TenantPreviewContext';
import { sanitizeSection } from '@/lib/tenant/site-composition';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const content = {
  title: 'What do you need?', choicesLabel: 'Choose your next step',
  items: [
    { label: 'Develop a plan', description: 'Turn your goals into a plan.', href: '/planning', buttonText: 'Explore planning' },
    { label: 'Build a team', description: 'Help your people lead.', href: '/team', buttonText: 'Explore teams' },
  ],
  buttonText: 'Start a conversation', buttonHref: '/contact',
};
describe('shared subscriber guided choices', () => {
  it('changes explanatory content and the tenant link without navigating or sending requests', () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    render(<TenantChoiceSection content={content} primary="#173b2b" basePath="/sites/customer" />);
    expect(screen.getByRole('radio', { name: 'Develop a plan' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: 'Build a team' }));
    expect(screen.getByRole('radio', { name: 'Build a team' })).toBeChecked();
    expect(screen.queryByText('Turn your goals into a plan.')).toBeNull();
    expect(screen.getByText('Help your people lead.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Explore teams' })).toHaveAttribute('href', '/sites/customer/team');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('round trips saved choices through normalization and renders for an unrelated subscriber', () => {
    const section = sanitizeSection(JSON.parse(JSON.stringify({ id: 'choices', type: 'cta', settings: { layout: 'choices' }, content })))!;
    const config = buildDefaultSiteConfig({ organizationName: 'Another customer' });
    config.pages = [{ id: 'home', title: 'Home', slug: '/', sections: [section] }];
    const { container } = render(<PublicTenantComposableSite site={{ id: 'customer', subdomain: 'customer', siteName: 'Another customer', organizationId: null, config }} />);
    expect(screen.getByRole('group', { name: 'Choose your next step' })).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(container.querySelector('.legacy83-premium')).toBeNull();
  });
  it('keeps multiple choice sections independent with unique input groups and live regions', () => {
    render(<><TenantChoiceSection content={content} primary="#173b2b" /><TenantChoiceSection content={{...content,title:'Second question'}} primary="#173b2b" /></>);
    const sections = screen.getAllByRole('region');
    const first = within(sections[0]), second = within(sections[1]);
    fireEvent.click(first.getByRole('radio', { name: 'Build a team' }));
    expect(second.getByRole('radio', { name: 'Develop a plan' })).toBeChecked();
    const firstInput = first.getByRole('radio', { name: 'Develop a plan' });
    const secondInput = second.getByRole('radio', { name: 'Develop a plan' });
    expect(firstInput.getAttribute('name')).not.toBe(secondInput.getAttribute('name'));
    expect(firstInput.getAttribute('aria-controls')).not.toBe(secondInput.getAttribute('aria-controls'));
  });
  it('suppresses external actions and analytics in a private saved-version preview', () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    render(<TenantPreviewProvider websiteId="site-a" readOnly><TenantChoiceSection content={{ ...content, items: [{ label:'External',description:'Details',href:'https://checkout.example/pay' }], secondaryButtonText:'Call', secondaryButtonHref:'tel:+15133351978' }} primary="#173b2b" basePath="/review?revision=rev&page=" /></TenantPreviewProvider>);
    expect(screen.queryByRole('link', { name: 'Explore this option' })).toBeNull();
    expect(screen.getByText('Explore this option')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('link', { name: 'Call' })).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: 'Start a conversation' }));
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Start a conversation' })).toHaveAttribute('href', '/review?revision=rev&page=%2Fcontact');
  });
  it('supports plain conversational CTAs and ignores malformed items and unsafe destinations', () => {
    render(<TenantChoiceSection content={{title:'A question',items:[null,[],{label:''}],buttonText:'Unsafe',buttonHref:'javascript:alert(1)'}} primary="#173b2b" />);
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.queryByText('Unsafe')).toBeNull();
    expect(screen.getByRole('heading', {name:'A question'})).toBeTruthy();
  });
});
