import fs from 'node:fs';
import path from 'node:path';

describe('Ultimate Course Builder Envato acquisition bridge', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'lib/ultimate-course-builder/adapters/platform-media.ts'),
    'utf8',
  );

  it('acquires governed approved or eligible licensed Envato media and persists it before attachment', () => {
    expect(source).toContain(".in('status', ['suggested', 'approved'])");
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
    expect(source).toContain(".in('status', ['suggested', 'approved'])");
    expect(source).toContain('canAutoApproveLicensedMediaMatch(match, courseId)');
    expect(source).toContain(".eq('status', 'suggested')");
    expect(source).toContain('licensedMediaBelongsToCourse(metadata, courseId)');
  });
});
