import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Regression: the Admin sign-in form rendered <label> and <input> as siblings
 * without an `htmlFor`/`id` pair. Live Playwright inspection at
 * https://admin.elevateforhumanity.org/login reported `inputsNoLabel: 2` —
 * both the Email and Password fields had `input.labels.length === 0`, so a
 * screen reader announced them only by placeholder and clicking the visible
 * label did not focus the field.
 *
 * These assertions read the real component source so the association cannot
 * silently regress back to a bare sibling pair.
 */

const LOGIN_FORM = path.join(process.cwd(), 'apps/admin/app/login/LoginForm.tsx');

function source(): string {
  return fs.readFileSync(LOGIN_FORM, 'utf8');
}

describe('admin login form label association', () => {
  it('associates every rendered input with a label', () => {
    const src = source();
    // <input ... /> elements in this file are self-closing and always contain
    // type=; capture each tag body to assert it carries an id.
    const inputTags = src.match(/<input\b[\s\S]*?\/>/g) ?? [];
    expect(inputTags.length).toBeGreaterThanOrEqual(3);
    for (const tag of inputTags) {
      expect(tag, `input without id: ${tag.replace(/\s+/g, ' ').slice(0, 120)}`).toMatch(/\bid="[^"]+"/);
    }
  });

  it('points every label at a real input id', () => {
    const src = source();
    const labelFors = [...src.matchAll(/<label\b[^>]*\bhtmlFor="([^"]+)"/g)].map((m) => m[1]);
    const inputIds = [...src.matchAll(/<input\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);

    // Every visible field label must be associated.
    expect(labelFors.length).toBeGreaterThanOrEqual(3);
    for (const target of labelFors) {
      expect(inputIds, `label htmlFor="${target}" has no matching input id`).toContain(target);
    }
  });

  it('keeps the sign-in email and password fields addressable by name', () => {
    const src = source();
    expect(src).toMatch(/htmlFor="admin-login-email"[\s\S]*?id="admin-login-email"/);
    expect(src).toMatch(/htmlFor="admin-login-password"[\s\S]*?id="admin-login-password"/);
  });

  it('does not ship a label with no htmlFor for a form field', () => {
    const src = source();
    // A bare <label ...> (no htmlFor) must not be immediately followed by a
    // form control, which is the exact shape that produced the live defect.
    const bareLabelThenInput = /<label\b(?![^>]*\bhtmlFor=)[^>]*>\s*[\s\S]{0,200}?<input\b/;
    expect(bareLabelThenInput.test(src)).toBe(false);
  });
});
