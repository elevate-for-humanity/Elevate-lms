import { describe, expect, it } from 'vitest';
import { GET as studio } from '@/apps/admin/app/manifest-dev-studio.json/route';
import { GET as courses } from '@/apps/admin/app/manifest-course-builder.json/route';

describe('separate workspace apps', () => {
  it('uses distinct app identities with direct same-origin session-preserving launch paths', async () => {
    const dev = await studio().json();
    const course = await courses().json();
    expect(dev.id).not.toBe(course.id);
    expect(dev.start_url).toBe('/studio');
    expect(course.start_url).toBe('/studio/courses');
    expect(dev.scope).toBe('/');
    expect(course.scope).toBe('/');
    expect(dev.background_color).toBe('#ffffff');
    expect(course.background_color).toBe('#ffffff');
  });
});
