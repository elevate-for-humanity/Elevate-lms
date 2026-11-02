import { Children, isValidElement, type ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  admin: false,
  member: true,
  receipt: null as any,
  error: null as any,
  insert: vi.fn(),
}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'user-agent': 'test', 'x-forwarded-for': '192.0.2.1' }),
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error('REDIRECT:' + url);
  },
}));
vi.mock('@/lib/partners/current-host-shop', () => ({
  requireCurrentHostShopPartner: async () => ({
    user: { id: 'owner', email: 'owner@example.com' },
    partner: { id: 'shop', name: 'Verified Shop' },
    isPlatformAdmin: state.admin,
    db: {
      from: (table: string) => {
        const q: any = {};
        for (const m of ['select', 'eq', 'in']) q[m] = () => q;
        q.maybeSingle = async () => ({
          data:
            table === 'partner_users' ? (state.member ? { role: 'owner' } : null) : state.receipt,
          error: null,
        });
        q.insert = (data: any) => {
          state.insert(data);
          return Promise.resolve({ error: state.error });
        };
        return q;
      },
    },
  }),
}));
import Page from '@/apps/lms/app/host-shop/onboarding/content-agreement/page';
import {
  HOST_SHOP_CONTENT_AGREEMENT_VERSION as VERSION,
  HOST_SHOP_CONTENT_AGREEMENT_TEXT as TEXT,
} from '@/lib/partners/host-shop-content-agreement';
function nodes(root: ReactNode): any[] {
  if (Array.isArray(root)) return root.flatMap(nodes);
  if (!isValidElement<{ children?: ReactNode }>(root)) return [];
  return [root, ...Children.toArray(root.props.children).flatMap(nodes)];
}
async function action() {
  const root = await Page({ searchParams: Promise.resolve({}) });
  return nodes(root).find((n) => n.type === 'form')?.props.action;
}
function form() {
  const f = new FormData();
  for (const [k, v] of Object.entries({
    signerName: 'Real Owner',
    signerTitle: 'Owner',
    authority: 'yes',
    agreed: 'yes',
    version: VERSION,
  }))
    f.set(k, v);
  return f;
}
beforeEach(() => {
  state.admin = false;
  state.member = true;
  state.receipt = null;
  state.error = null;
  state.insert.mockClear();
});
it('saves the authenticated shop, exact terms, version and fingerprint', async () => {
  await expect((await action())(form())).rejects.toThrow('?signed=1');
  expect(state.insert).toHaveBeenCalledWith(
    expect.objectContaining({
      partner_id: 'shop',
      signed_by: 'owner',
      agreement_text: TEXT,
      version: VERSION,
      content_sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    }),
  );
});
it('does not display a signing form to administrators', async () => {
  state.admin = true;
  expect(await action()).toBeUndefined();
});
it('rechecks admin identity at submission time', async () => {
  const sign = await action();
  state.admin = true;
  await expect(sign(form())).rejects.toThrow('owner_required');
  expect(state.insert).not.toHaveBeenCalled();
});
it('rejects a member without signing authority', async () => {
  state.member = false;
  await expect((await action())(form())).rejects.toThrow('owner_required');
  expect(state.insert).not.toHaveBeenCalled();
});
it.each(['authority', 'agreed', 'version'])(
  'rejects missing %s before writing a signature',
  async (field) => {
    const f = form();
    f.delete(field);
    await expect((await action())(f)).rejects.toThrow('signature_required');
    expect(state.insert).not.toHaveBeenCalled();
  },
);
it('does not claim success when saving fails', async () => {
  state.error = { code: 'database_unavailable' };
  await expect((await action())(form())).rejects.toThrow('HOST_SHOP_CONTENT_AGREEMENT_SAVE_FAILED');
});
it('shows the saved terms rather than substituting a new text for a signed receipt', async () => {
  state.receipt = {
    signer_name: 'Owner',
    signer_title: 'Owner',
    signed_at: '2026-11-02T00:00:00Z',
    agreement_text: 'Original signed wording',
    content_sha256: 'a'.repeat(64),
  };
  const root = await Page({ searchParams: Promise.resolve({}) });
  expect(nodes(root).some((n) => n.props.children === 'Original signed wording')).toBe(true);
  expect(await action()).toBeUndefined();
});
