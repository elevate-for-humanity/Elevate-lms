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

describe('portal preview POST handoff contract', () => {
  it('keeps the signed handoff out of newly issued preview URLs', () => {
    expect(adminRoute).toContain("preview_url: 'https://app.elevateforhumanity.org/api/admin/preview'");
    expect(adminRoute).toContain('preview_handoff: createPortalPreviewHandoff');
    expect(adminRoute).not.toContain('preview?handoff=');
  });

  it('accepts a form POST and redirects with preview cookies', () => {
    expect(previewRoute).toContain('export async function POST(request: NextRequest)');
    expect(previewRoute).toContain("request.formData()");
    expect(previewRoute).toContain("NextResponse.redirect(`${appUrl}${portalPreviewDestination(target.role)}`, 303)");
    expect(previewRoute).toContain('PORTAL_PREVIEW_SESSION_COOKIE');
  });

  it('uses form POST navigation from both admin entry points', () => {
    for (const source of [impersonateForm, studentButton]) {
      expect(source).toContain("form.method = 'POST'");
      expect(source).toContain("handoff.name = 'handoff'");
      expect(source).toContain('form.submit()');
      expect(source).not.toContain('window.location.assign(data.preview_url)');
      expect(source).not.toContain('window.location.assign(result.preview_url)');
    }
  });
});
