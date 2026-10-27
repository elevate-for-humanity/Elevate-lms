import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const audit: { findings: { file: string; finding: string }[] } = JSON.parse(readFileSync(
  new URL('../../docs/audits/design-repair-20261016/finding-dispositions.json', import.meta.url), 'utf8',
));
if (audit.findings.length !== 195 || new Set(audit.findings.map(finding => finding.finding)).size !== 195) {
  throw new Error('The public rendering inventory requires all 195 original finding records; entries must not be silently dropped.');
}

// Supplemental rendering inventory for original findings with public, static
// Marketing routes. Authenticated and parameterized routes need real identities
// and records; they are not substituted with decorative test pages.
const excluded = [
  '/staff', '/staff/attendance/export', '/onboarding/employer/hiring-needs', '/store/licenses/success',
  // Source explicitly requires an authenticated, enrolled apprentice.
  '/programs/cosmetology-apprenticeship/orientation',
];
const routes = [...new Set(audit.findings.map(finding => finding.file)
  .filter(file => file.startsWith('apps/marketing/app/') && file.endsWith('/page.tsx') && !file.includes('['))
  .map(file => '/' + file.replace('apps/marketing/app/', '').replace('/page.tsx', '').split('/').filter(part => !part.startsWith('(')).join('/')))]
  .filter(route => !excluded.includes(route));

function contrast(foreground: number[], background: number[]) {
  const luminance = (color: number[]) => color.map(value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }).reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('shared surfaces preserve nested foreground ownership', async ({ page }) => {
  await page.goto('/platform/pricing', { waitUntil: 'domcontentloaded' });
  const pairs = await page.evaluate(() => {
    const fixture = document.createElement('div');
    fixture.className = 'bg-white';
    fixture.innerHTML = `<div class="bg-slate-900 text-white">
      <p data-check class="text-slate-300">Dark surface paragraph</p>
      <div class="bg-white"><h2 data-check class="text-slate-900">Light card heading</h2><p data-check class="text-slate-600">Light card paragraph</p>
        <div class="bg-slate-900"><p data-check class="text-slate-300">Nested dark panel</p></div>
      </div>
      <button data-check class="bg-cyan-300 text-slate-950">Light control</button>
    </div>`;
    document.body.appendChild(fixture);
    const context = document.createElement('canvas').getContext('2d')!;
    const pixels = (color: string) => {
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
    };
    const result = Array.from(fixture.querySelectorAll('[data-check]')).map(element => {
      let surface: Element = element;
      while (getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)') surface = surface.parentElement!;
      return [pixels(getComputedStyle(element).color), pixels(getComputedStyle(surface).backgroundColor)];
    });
    fixture.remove();
    return result;
  });
  for (const pair of pairs) expect(contrast(pair[0], pair[1])).toBeGreaterThanOrEqual(4.5);
});

for (const route of routes) {
  test(`${route}: original audit public rendering`, async ({ page }, testInfo) => {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 90000 });
    expect(response?.status()).toBeLessThan(400);
    expect(new URL(page.url()).pathname).toBe(route);
    await expect(page.locator('h1').first()).toBeVisible();
    if (route === '/founder') {
      const portrait = page.getByRole('img', { name: 'Elizabeth Greene, Founder and CEO of Elevate for Humanity', exact: true });
      expect(decodeURIComponent(await portrait.getAttribute('src') ?? '')).toContain('/images/team/elizabeth-greene.webp');
    }
    if (['/platform/pricing', '/platform/standards', '/platform/employer-portal', '/platform/student-portal'].includes(route)) {
      const paragraph = page.locator('section').filter({ has: page.locator('h1') }).locator('p').first();
      const foreground = await paragraph.evaluate(element => {
        const context = document.createElement('canvas').getContext('2d')!;
        context.fillStyle = getComputedStyle(element).color;
        context.fillRect(0, 0, 1, 1);
        return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
      });
      // Verify against the lightest declared gradient stops rather than
      // assuming authored text wins over the shared cascade.
      const backgrounds = route === '/platform/student-portal' ? [[37, 99, 235]] : [[30, 41, 59], [30, 58, 138]];
      for (const background of backgrounds) expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
    if (route === '/platform/employer-portal') {
      const ongoing = page.getByRole('region', { name: 'Employer network highlights' }).getByText('Ongoing', { exact: true });
      const geometry = await ongoing.evaluate(element => ({ content: element.scrollWidth, available: element.clientWidth }));
      expect(geometry.content).toBeLessThanOrEqual(geometry.available);
    }
    if (route === '/community') {
      const colors = await page.getByRole('link', { name: 'Create your account' }).evaluate(element => {
        const context = document.createElement('canvas').getContext('2d')!;
        return [getComputedStyle(element).color, getComputedStyle(element).backgroundColor].map(color => {
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
        });
      });
      expect(contrast(colors[0], colors[1])).toBeGreaterThanOrEqual(4.5);
    }
    if (route === '/pricing') {
      const foreground = await page.getByRole('link', { name: 'Training Tuition', exact: true }).evaluate(element => {
        const context = document.createElement('canvas').getContext('2d')!;
        context.fillStyle = getComputedStyle(element).color;
        context.fillRect(0, 0, 1, 1);
        return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
      });
      expect(contrast(foreground, [255, 255, 255])).toBeGreaterThanOrEqual(4.5);
    }
    if (route === '/connect') {
      await page.getByRole('button', { name: /WordPress/ }).click();
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      const url = page.getByLabel(/Site URL/);
      await expect(url).toBeVisible();
      const colors = await url.evaluate(element => {
        const style = getComputedStyle(element);
        const context = document.createElement('canvas').getContext('2d')!;
        return [style.color, style.backgroundColor].map(color => {
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
        });
      });
      expect(contrast(colors[0], colors[1])).toBeGreaterThanOrEqual(4.5);
      await url.fill('https://example.com');
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'What Do You Want to Add?' })).toBeVisible();
      // Generate Integration is deliberately not clicked: this rendering test
      // must not create a site, API credential, subscription or database record.
      await page.getByRole('button', { name: 'Back', exact: true }).click();
      await page.getByRole('button', { name: 'Back', exact: true }).click();
    }
    for (const image of await page.locator('#main-content img').all()) {
      if (!(await image.isVisible())) continue;
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(element => {
        const img = element as HTMLImageElement;
        return img.complete ? img.naturalWidth : 0;
      })).toBeGreaterThan(0);
    }
    const geometry = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
    expect(geometry.content).toBeLessThanOrEqual(geometry.viewport + 1);
    await testInfo.attach('route-observation', { body: JSON.stringify({ requestedRoute: route, finalURL: page.url(), ...geometry }), contentType: 'application/json' });
    await page.locator('h1').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('render.png'), fullPage: true });
  });
}
