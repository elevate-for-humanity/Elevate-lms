import fs from 'node:fs';
import path from 'node:path';

describe('Ultimate Course Builder Envato acquisition bridge', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'lib/ultimate-course-builder/adapters/platform-media.ts'),
    'utf8',
  );

  it('acquires only approved missing Envato media and persists it before attachment', () => {
    expect(source).toContain("String(match.status ?? '') === 'approved'");
    expect(source).toContain('canAutoApproveLicensedMediaMatch(match, courseId)');
    expect(source).toContain('licensedMediaBelongsToCourse(metadata, courseId)');
    expect(source).toContain('await this.acquireApprovedEnvatoMatch(match, courseId)');
    expect(source).toContain("storage_bucket: 'course_videos'");
    expect(source).toContain("storage_path: storagePath");
    expect(source).toContain('await attachStoredLicensedMedia');
    expect(source.indexOf('await this.acquireApprovedEnvatoMatch(match, courseId)'))
      .toBeLessThan(source.indexOf('await attachStoredLicensedMedia'));
  });

  it('preserves entitlement and acquisition evidence instead of manufacturing approval', () => {
    expect(source).toContain("license_evidence_url");
    expect(source).toContain("acquisition: acquired.licenseEvidence");
    expect(source).toContain("String(match.status ?? '') === 'approved'");
    expect(source).toContain('canAutoApproveLicensedMediaMatch(match, courseId)');
    expect(source).toContain('licensedMediaBelongsToCourse(metadata, courseId)');
    expect(source).toContain('metadata.licenseObserved === true');
    expect(source).toContain(".eq('status', 'suggested')");
  });
});
