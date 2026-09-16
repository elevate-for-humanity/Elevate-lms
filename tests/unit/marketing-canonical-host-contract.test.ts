import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const middleware = fs.readFileSync(path.resolve('apps/marketing/middleware.ts'), 'utf8');
const canonicalManifest = JSON.parse(
  fs.readFileSync(path.resolve('public/manifest-marketing.json'), 'utf8'),
) as { display?: string; start_url?: string };
const deployedManifest = JSON.parse(
  fs.readFileSync(path.resolve('apps/marketing/public/manifest-marketing.json'), 'utf8'),
) as { display?: string; start_url?: string };

describe('marketing canonical host contract', () => {
  it('permanently redirects the apex domain to the one public www origin', () => {
    expect(middleware).toContain("host === 'elevateforhumanity.org'");
    expect(middleware).toContain('https://www.elevateforhumanity.org${pathname}${search}');
    expect(middleware).toContain('308');
  });

  it('keeps deployment-provider copies out of search results', () => {
    expect(middleware).toContain("const DEPLOYMENT_HOST_SUFFIXES = ['.northflank.app']");
    expect(middleware).not.toContain("'.vercel.app'");
    expect(middleware).not.toContain("'.pages.dev'");
    expect(middleware).not.toContain("'.netlify.app'");
    expect(middleware).not.toContain("'.onrender.com'");
    expect(middleware).toContain("'X-Robots-Tag', 'noindex, nofollow, noarchive'");
    expect(middleware).toContain('rel="canonical"');
  });

  it('opens Marketing as the website instead of a separate standalone splash experience', () => {
    expect(canonicalManifest).toEqual(deployedManifest);
    expect(deployedManifest.display).toBe('browser');
    expect(deployedManifest.start_url).toBe('/');
  });
});
