import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const adminRoute = readFileSync(
  'apps/admin/app/api/admin/impersonate/route.ts',
  'utf8',
);
const previewRoute = readFileSync(
  'apps/lms/app/api/admin/preview/route.ts',
  'utf8',
);
const impersonateForm = readFileSync(
  'apps/admin/app/impersonate/ImpersonateForm.tsx',
  'utf8',
);
const studentButton = readFileSync(
  'components/admin/students/OpenLearnerPortalButton.tsx',
  'utf8',
);
const sharedPortalButton = readFileSync(
  'components/admin/OpenPortalPreviewButton.tsx',
  'utf8',
);
const partnersPage = readFileSync('apps/admin/app/partners/page.tsx', 'utf8');

describe('portal preview POST handoff contract', () => {
  it('keeps the signed handoff out of newly issued preview URLs', () => {
    expect(adminRoute).toContain("'https://app.elevateforhumanity.org/api/admin/preview'");
    expect(adminRoute).toContain("'https://app.elevateforhumanity.org/api/admin/select-host-shop'");
    expect(adminRoute).toContain('preview_handoff: createPortalPreviewHandoff');
    expect(adminRoute).not.toContain('preview?handoff=');
  });

  it('accepts a form POST and redirects with preview cookies', () => {
    expect(previewRoute).toContain('export async function POST(request: NextRequest)');
    expect(previewRoute).toContain("request.formData()");
    expect(previewRoute).toContain("NextResponse.redirect(\`${appUrl}${portalPreviewDestination(target.role)}\`, 303)");
    expect(previewRoute).toContain('PORTAL_PREVIEW_SESSION_COOKIE');
  });

  it('uses the exact partner-scoped handoff for Host Shop previews', () => {
    expect(sharedPortalButton).toContain('host_shop_partner_id: hostShopPartnerId');
    expect(adminRoute).toContain(".from('partner_users')");
    expect(adminRoute).toContain('hostShopPartnerId || target_user_id');
    expect(partnersPage).toContain('hostShopPartnerId={partner.id}');
  });

  it('uses form POST navigation from every admin entry point', () => {
    for (const source of [impersonateForm, studentButton, sharedPortalButton]) {
      expect(source).toContain("form.method = 'POST'");
      expect(source).toContain("handoff.name = 'handoff'");
      expect(source).toContain('form.submit()');
      expect(source).not.toContain('window.location.assign(data.preview_url)');
      expect(source).not.toContain('window.location.assign(result.preview_url)');
    }
  });
});
