// @vitest-environment node

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('institutional integration truth', () => {
  it('does not use learner profiles as Google Classroom connection records', () => {
    const page = read('apps/admin/app/integrations/google-classroom/page.tsx');
    expect(page).toContain("from('google_classroom_sync')");
    expect(page).toContain("from('integrations')");
    expect(page).not.toContain("from('profiles')");
    expect(page).not.toContain('Sync courses and grades with Google Classroom.');
    expect(page).toContain('/api/admin/integrations/google-classroom/authorize');
    expect(page).toContain('/api/admin/integrations/google-classroom/sync');
  });

  it('does not use learner profiles as partner LMS records', () => {
    const page = read('apps/admin/app/partners/lms-integrations/page.tsx');
    expect(page).toContain("from('lti_platforms')");
    expect(page).toContain("['edlink', 'google-classroom', 'lti']");
    expect(page).not.toContain("from('profiles')");
  });

  it('never reports a timestamp-only provider sync as successful', () => {
    const route = read('apps/admin/app/api/admin/integrations/route.ts');
    expect(route).toContain('No production sync adapter is registered');
    expect(route).toContain('status: 501');
    expect(route).not.toContain('Sync triggered for');
  });

  it('does not expose missing LTI handlers as implemented route files', () => {
    for (const endpoint of ['config', 'jwks', 'login', 'launch']) {
      expect(fs.existsSync(path.join(root, `apps/lms/app/api/lti/${endpoint}/route.ts`))).toBe(
        false,
      );
    }
  });

  it('ships bounded Google Classroom OAuth and synchronization handlers', () => {
    const authorize = read(
      'apps/admin/app/api/admin/integrations/google-classroom/authorize/route.ts',
    );
    const callback = read(
      'apps/admin/app/api/admin/integrations/google-classroom/callback/route.ts',
    );
    const sync = read('apps/admin/app/api/admin/integrations/google-classroom/sync/route.ts');
    expect(authorize).toContain('apiRequireAdmin');
    expect(authorize).toContain('google_classroom_oauth_state');
    expect(callback).toContain("provider: 'google-classroom'");
    expect(callback).toContain("onConflict: 'user_id,provider'");
    expect(sync).toContain('listGoogleClassroomCourses');
    expect(sync).toContain("onConflict: 'user_id,course_id'");
  });
});
