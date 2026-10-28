// @vitest-environment node
import { expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import JSZip from 'jszip';
import { JOB_READY_MODULES } from '@/lib/career/job-ready';

it('packages every learner module with unchanged vendor runtime files and the SCORM 2004 manifest', async () => {
  for (const lesson of JOB_READY_MODULES) {
    const directory = resolve('apps/lms/public/scorm/job-ready', lesson.slug);
    const zip = await JSZip.loadAsync(readFileSync(resolve(directory, 'package.zip')));
    const manifest = await zip.file('imsmanifest.xml')!.async('string');
    expect(manifest).toContain('2004 3rd Edition');
    expect(manifest).toContain('href="dispatch.html"');
    for (const filename of [
      'configuration.js',
      'dispatch.html',
      'utils.js',
      'blank.html',
      'goodbye.html',
    ]) {
      expect(readFileSync(resolve(directory, filename))).toEqual(
        await zip.file(filename)!.async('nodebuffer'),
      );
    }
    const config = await zip.file('configuration.js')!.async('string');
    expect(config).toContain('https://employindy.contentcontroller.com/');
  }
  expect(existsSync(resolve('public/scorm/job-ready'))).toBe(false);
  expect(existsSync(resolve('apps/lms/public/scorm/job-ready/facilitation-resources'))).toBe(false);
});
