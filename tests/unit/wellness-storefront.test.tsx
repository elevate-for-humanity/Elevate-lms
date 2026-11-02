import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WellnessStorefront } from '@/components/tenant/WellnessStorefront';
import type { PublishedTenantSite } from '@/lib/tenant/site-types';

const site = {
  id: 'wellness-test', subdomain: 'meri-gold-round', siteName: 'Meri-Gold-Round', organizationId: null,
  config: { products: [{ name: 'Botanical oil', href: '/products/oil', price: '45.00', image: '/oil.webp' }], contact: { email: 'shop@example.com' }, footer: {} },
} as PublishedTenantSite;
const show = () => render(<WellnessStorefront site={site} pathname="/shop" basePath="/sites/meri-gold-round"><p>Contact content</p></WellnessStorefront>);
beforeEach(() => {
  localStorage.clear();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Curvature shopping flow', () => {
  it('adds products, restores the bag across navigation and updates quantities and subtotal', async () => {
    const { unmount } = show();
    fireEvent.click(screen.getByRole('button', { name: /add to bag/i }));
    expect(screen.getByRole('button', { name: 'Shopping bag, 1 items' })).toBeTruthy();
    unmount(); show();
    fireEvent.click(screen.getByRole('button', { name: 'Shopping bag, 1 items' }));
    fireEvent.click(screen.getByRole('button', { name: 'Increase Botanical oil' }));
    expect(screen.getByText('$90.00')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.getByText('Your next ritual is waiting.')).toBeTruthy();
  });
  it('does not accept malformed saved quantities or unknown products', () => {
    localStorage.setItem('wellness-cart:wellness-test', JSON.stringify({ '/products/oil': -1, '/products/unknown': 4 }));
    show();
    expect(screen.getByRole('button', { name: 'Shopping bag, 0 items' })).toBeTruthy();
  });
  it('keeps the cart on request failure and only acknowledges a saved invoice request', async () => {
    const request = vi.fn().mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Try again' }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal('fetch', request);
    show();
    fireEvent.click(screen.getByRole('button', { name: /add to bag/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Shopping bag, 1 items' }));
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Shopper' } });
    fireEvent.change(screen.getByLabelText('Email for your invoice'), { target: { value: 'shopper@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Request invoice' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Try again'));
    expect(screen.getByRole('button', { name: 'Shopping bag, 1 items' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Request invoice' }));
    await waitFor(() => expect(screen.getByText(/Your invoice request was saved/)).toBeTruthy());
    const payload = JSON.parse(request.mock.calls[1][1].body);
    expect(payload.message).toContain('1 × Botanical oil');
    expect(payload.message).toContain('not a payment');
  });
});

it('filters the shopping collection and restores it after an empty search',()=>{
 show();
 fireEvent.change(screen.getByRole('searchbox',{name:'Search products'}),{target:{value:'not in this catalog'}});
 expect(screen.getByText('No matching products')).toBeTruthy();
 expect(screen.queryByRole('button',{name:/add to bag/i})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Show all products'}));
 expect(screen.getByRole('button',{name:/add to bag/i})).toBeTruthy();
});
