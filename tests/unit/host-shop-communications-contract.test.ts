import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const communicationsPage = readFileSync(
  'apps/lms/app/host-shop/dashboard/communications/page.tsx',
  'utf8',
);
const phonePage = readFileSync(
  'apps/lms/app/host-shop/dashboard/phone/page.tsx',
  'utf8',
);
const phoneApi = readFileSync(
  'apps/lms/app/api/program-holder/phone/route.ts',
  'utf8',
);
const callbackApi = readFileSync(
  'apps/lms/app/api/program-holder/phone/inbox/[id]/route.ts',
  'utf8',
);
const recordingApi = readFileSync(
  'apps/lms/app/api/program-holder/phone/inbox/[id]/recording/route.ts',
  'utf8',
);
const hostShopPreview = readFileSync(
  'apps/lms/app/api/admin/select-host-shop/route.ts',
  'utf8',
);
const hostShopDashboard = readFileSync(
  'apps/lms/app/host-shop/dashboard/HostShopDashboardView.tsx',
  'utf8',
);
const hostShopEmail = readFileSync(
  'apps/lms/app/host-shop/email/page.tsx',
  'utf8',
);
const emailWorkspace = readFileSync(
  'components/communications/EmailWorkspace.tsx',
  'utf8',
);

describe('Host Shop communications contract', () => {
  it('keeps Host Shop users inside Host Shop phone and scheduling routes', () => {
    expect(communicationsPage).toContain("href: '/host-shop/dashboard/phone'");
    expect(communicationsPage).toContain("href: '/host-shop/dashboard/schedule'");
    expect(communicationsPage).not.toContain("href: '/program-holder/phone'");
    expect(communicationsPage).not.toContain("href: '/program-holder/meetings'");
  });

  it('renders the shared phone with Host Shop authorization and training language', () => {
    expect(phonePage).toContain('await requireRole(HOST_SHOP_ROLES)');
    expect(phonePage).toContain('<ProgramHolderPhone roleLabel="Host Shop" />');
    expect(phoneApi).toContain("'host_shop'");
    expect(phoneApi).toContain("'host_shop_admin'");
    expect(phoneApi).toContain("'partner'");
  });

  it('scopes callback updates and recordings through the communications actor', () => {
    expect(callbackApi).toContain('requireCommunicationActor');
    expect(callbackApi).toContain(".eq('assigned_profile_id', ctx.user.id)");
    expect(recordingApi).toContain('requireCommunicationActor');
    expect(recordingApi).toContain(".eq('assigned_profile_id', ctx.user.id)");
  });

  it('previews phone and email as the selected Host Shop account', () => {
    expect(hostShopPreview).toContain("from('partner_users')");
    expect(hostShopPreview).toContain('PORTAL_PREVIEW_SESSION_COOKIE');
    expect(hostShopPreview).toContain(
      'createPortalPreviewHandoff(previewActorId, previewUserId',
    );
    expect(hostShopDashboard).toContain('HOST_SHOP_PREVIEW_SESSION_COOKIE');
    expect(hostShopDashboard).toContain('PORTAL_PREVIEW_SESSION_COOKIE');
  });

  it('uses Host Shop language in mailbox previews', () => {
    expect(hostShopEmail).toContain('<EmailWorkspace roleLabel="Host Shop" />');
    expect(emailWorkspace).toContain("roleLabel = 'Program Holder'");
    expect(emailWorkspace).toContain('selected {roleLabel} mailbox');
    expect(emailWorkspace).not.toContain('selected Program Holder’s mailbox');
  });
});
