import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for the Program Holder application (marketing app, :3000).
 *
 * The application form lives ONLY here, at /apply/program-holder
 * (apps/marketing/app/apply/program-holder/ProgramHolderForm.tsx, posting
 * to /api/program-holder/apply). There is no /program-holder/apply route
 * in the LMS app — the old program-holder.spec.ts tested that fictional
 * route with fictional field names, so its Application Flow block was
 * removed and replaced by this spec, written against the real form:
 * - Fields are orgName / contactName / email / phone / address / city /
 *   state / zip / requestedProgram / program-type checkboxes / consent.
 *   There are no organizationName / contactEmail / contactPhone /
 *   estimatedStudents / additionalInfo fields, and state is a text input
 *   (default "Indiana"), not a select.
 * - Validation has no "required" error text: required inputs use native
 *   HTML validation, and the form's own checks are "Select at least one
 *   program or service type." and "Confirm the Program Holder
 *   certification before submitting."
 * - Success shows "Application Received" and then redirects to
 *   /apply/success?type=program-holder.
 * - The duplicate-application contract (409 + "already pending" for a
 *   second submission of the same organization + email) is covered by the
 *   "Application Flow" block in tests/e2e/program-holder.spec.ts, against
 *   the guard added in this branch (see the
 *   guard_pending_program_holder_applications migration). It is not
 *   repeated here.
 */

const FORM = 'form:has(input[name="orgName"])';

async function fillRequiredFields(page: Page, email: string) {
  await page.fill('input[name="orgName"]', 'Test Training Center');
  await page.fill('input[name="contactName"]', 'John Doe');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="phone"]', '317-555-0100');
  await page.fill('input[name="address"]', '123 Main St');
  await page.fill('input[name="city"]', 'Indianapolis');
  await page.fill('input[name="state"]', 'Indiana');
  await page.fill('input[name="zip"]', '46204');
  // First option is the "Select a program" placeholder; index 1 is the
  // first real program from the registry.
  await page.selectOption('select[name="requestedProgram"]', { index: 1 });
}

test.describe('Program Holder application', () => {
  test('should submit program holder application', async ({ page }) => {
    await page.goto('/apply/program-holder');

    await fillRequiredFields(page, `ph-apply-${Date.now()}@example.com`);

    // Program-type checkboxes carry no value attribute; check them by
    // their wrapping label text.
    await page.getByLabel('Healthcare Training', { exact: true }).check();
    await page.getByLabel('Technology', { exact: true }).check();
    await page.getByLabel(/I certify that I am authorized/i).check();

    await page.locator(FORM).getByRole('button', { name: 'Submit Program Holder Application' }).click();

    await expect(
      page.getByRole('heading', { name: 'Application Received' }),
    ).toBeVisible({ timeout: 15000 });
  });

  test('should require a program type before submitting', async ({ page }) => {
    await page.goto('/apply/program-holder');

    await fillRequiredFields(page, `ph-apply-${Date.now()}@example.com`);
    await page.getByLabel(/I certify that I am authorized/i).check();

    await page.locator(FORM).getByRole('button', { name: 'Submit Program Holder Application' }).click();

    await expect(page.locator('text=Select at least one program or service type.')).toBeVisible();
  });

  test('should require certification consent before submitting', async ({ page }) => {
    await page.goto('/apply/program-holder');

    await fillRequiredFields(page, `ph-apply-${Date.now()}@example.com`);
    await page.getByLabel('Healthcare Training', { exact: true }).check();

    await page.locator(FORM).getByRole('button', { name: 'Submit Program Holder Application' }).click();

    await expect(
      page.locator('text=Confirm the Program Holder certification before submitting.'),
    ).toBeVisible();
  });

  test('should block an empty submission with native required validation', async ({ page }) => {
    await page.goto('/apply/program-holder');

    await page.locator(FORM).getByRole('button', { name: 'Submit Program Holder Application' }).click();

    // Native required-field validation blocks the submit: no success
    // state appears and the page does not navigate away.
    await expect(
      page.getByRole('heading', { name: 'Application Received' }),
    ).toHaveCount(0);
    await expect(page).toHaveURL(/\/apply\/program-holder$/);
  });
});
