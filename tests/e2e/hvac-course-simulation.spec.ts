import { expect, test, type Locator, type Page } from '@playwright/test';
import { appOrigin } from './helpers/app-origins';
import { readFileSync } from 'node:fs';

const workbook = JSON.parse(readFileSync(new URL('../../lib/lms/hvac-workbook-content.json', import.meta.url), 'utf8')) as { chapters: Array<{ lesson_id: string }> };
import type { HvacSimulationResponse } from '../../lib/lms/hvac-simulation-types';

const base = appOrigin('lms');
const courseId = 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201';
const electricalLessonId = '5d54f2f0-08f3-4fd8-bdce-a222c76fa44a';
const lessonPath = '/lms/courses/' + courseId + '/lessons/' + electricalLessonId;
const simulationPath =
  '/api/learner/hvac-simulations?courseId=' + courseId + '&lessonId=' + electricalLessonId;
const practiceIds = [
  'e47bab32-5d13-5d53-b525-135c6ecd4d48',
  '6e9ae471-b744-5d73-ac6e-7664da9b9496',
  '9fe4ceb8-f11d-5737-b3a0-a1be0b403abd',
  'fbe3299c-027f-596f-938b-c934f39ea212',
];

async function readSaved(page: Page): Promise<HvacSimulationResponse> {
  const response = await page.request.get(base + simulationPath);
  expect(response.status(), 'Authenticated simulation storage must be ready').toBe(200);
  return response.json();
}

async function applySelect(lab: Locator, label: string, value: string) {
  await lab.getByLabel(label, { exact: true }).selectOption({ label: value });
  await lab.getByRole('button', { name: 'Apply ' + label, exact: true }).click();
  await expect(lab).toHaveAttribute('aria-busy', 'false');
}

async function decide(lab: Locator, label: string) {
  await lab.getByRole('button', { name: 'Run virtual check', exact: true }).click();
  await lab.getByRole('button', { name: label, exact: true }).click();
  await expect(lab).toHaveAttribute('aria-busy', 'false');
}

test.describe('Authenticated HVAC course simulations', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  test('changes readings, retains scored history and restores the real learner course', async ({
    page,
  }, info) => {
    const email = process.env.E2E_LEARNER_EMAIL || '';
    const password = process.env.E2E_LEARNER_PASSWORD || '';
    const expectedSha = process.env.EXPECTED_LMS_SHA || '';
    expect(email, 'Only a per-run disposable learner may write acceptance progress').toMatch(
      /^qa-portal-e2e-.+-learner@qa\.invalid$/,
    );
    expect(password, 'The provisioned QA password is mandatory').toBeTruthy();
    expect(expectedSha, 'Acceptance must target the exact serving LMS release').toMatch(
      /^[a-f0-9]{40}$/,
    );
    const healthResponse = await page.request.get(base + '/api/health');
    expect(healthResponse.status()).toBe(200);
    const health = await healthResponse.json();
    expect(health.ready).toBe(true);
    expect(health.commit).toBe(expectedSha);

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base + '/login');
    await page.locator('input[type="email"], input[name="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.locator('button[type="submit"]').first().click();
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 50_000 })
      .not.toMatch(/\/login(?:\/|$)/);

    const lessonResponse = await page.goto(base + lessonPath + '#hvac-simulation');
    expect(lessonResponse?.status()).toBe(200);
    const lab = page.getByRole('region', { name: 'HVAC interactive simulation', exact: true });
    await expect(
      lab.getByRole('heading', { name: 'Operate the virtual meter bench', exact: true }),
    ).toBeVisible({ timeout: 30_000 });
    let saved = await readSaved(page);
    // Device runs share only this disposable learner. The workflow uses one
    // worker so each restart retains the previous device's attempt evidence.
    // A null feedback value is the untouched initial state, including after
    // the previous device's final restart. Do not reset an empty attempt.
    if (saved.simulation.feedback !== null) {
      await lab
        .getByRole('button', {
          name: saved.simulation.finished ? 'Practice again' : 'Restart this practice',
          exact: true,
        })
        .click();
      await expect(lab).toHaveAttribute('aria-busy', 'false');
      await expect(lab.getByText('Progress saved to your course.', { exact: true })).toBeVisible();
    }
    await expect(
      lab.getByRole('heading', { name: 'Observe an open circuit', exact: true }),
    ).toBeVisible();
    const expectedAttempts = Math.max(1, (await readSaved(page)).progress.attemptCount);
    await expect(lab.locator('[data-meter-id="meter"]')).toHaveAttribute('data-reading-value', '0');
    await decide(lab, '2 A because the supply label says 24 V');
    await expect(lab.getByText('Review and try again', { exact: true })).toBeVisible();
    await expect(
      lab.getByRole('heading', { name: 'Observe an open circuit', exact: true }),
    ).toBeVisible();
    await decide(lab, '0 A through the open path');
    await expect(
      lab.getByRole('heading', { name: 'Measure a complete circuit', exact: true }),
    ).toBeVisible();

    await applySelect(lab, 'Virtual switch', 'Closed');
    await expect(lab.locator('[data-meter-id="meter"]')).toHaveAttribute('data-reading-value', '2');
    saved = await readSaved(page);
    const revisionBeforeReload = saved.progress.revision;
    expect(saved.simulation.controls.find((control) => control.id === 'switch')?.value).toBe(
      'closed',
    );
    await page.reload();
    await expect(lab.getByText('Saved progress restored.', { exact: true })).toBeVisible();
    await expect(
      lab.getByRole('heading', { name: 'Measure a complete circuit', exact: true }),
    ).toBeVisible();
    await expect(lab.locator('[data-meter-id="meter"]')).toHaveAttribute('data-reading-value', '2');
    expect((await readSaved(page)).progress.revision).toBe(revisionBeforeReload);
    await decide(lab, '2 A, from 24 ÷ 12');

    await expect(
      lab.getByRole('heading', { name: 'Change one variable', exact: true }),
    ).toBeVisible();
    await lab.getByRole('slider', { name: 'Load resistance (Ω)', exact: true }).press('End');
    await lab.getByRole('button', { name: 'Apply Load resistance', exact: true }).click();
    await expect(lab.locator('[data-meter-id="meter"]')).toHaveAttribute('data-reading-value', '1');
    await decide(lab, 'Current falls to 1 A');

    await expect(
      lab.getByRole('heading', { name: 'Detect a misleading setup', exact: true }),
    ).toBeVisible();
    await applySelect(lab, 'Clamp position', 'Both outgoing and return conductors');
    await expect(lab.locator('[data-meter-id="meter"]')).toHaveAttribute('data-reading-value', '0');
    await expect(lab.locator('[data-meter-id="actual-current"]')).toHaveAttribute(
      'data-reading-value',
      '1',
    );
    await decide(lab, 'The opposing fields cancel; the circuit still carries 1 A');
    await expect(
      lab.getByRole('heading', { name: 'Simulation mastered', exact: true }),
    ).toBeVisible();
    saved = await readSaved(page);
    expect(saved.simulation.score).toBe(90);
    expect(saved.progress.mastered).toBe(true);
    expect(saved.progress.bestScore).toBeGreaterThanOrEqual(90);
    expect(saved.progress.attemptCount).toBe(expectedAttempts);

    await lab.getByRole('button', { name: 'Practice again', exact: true }).click();
    await expect(
      lab.getByRole('heading', { name: 'Observe an open circuit', exact: true }),
    ).toBeVisible();
    const restarted = await readSaved(page);
    expect(restarted.progress.mastered).toBe(true);
    expect(restarted.progress.bestScore).toBe(saved.progress.bestScore);
    expect(restarted.progress.attemptCount).toBe(saved.progress.attemptCount + 1);
    expect(restarted.progress.revision).toBeGreaterThan(saved.progress.revision);
    expect(
      await lab.evaluate((element) => element.scrollWidth - element.clientWidth),
    ).toBeLessThanOrEqual(2);

    const courseResponse = await page.goto(base + '/programs/hvac-technician/course');
    expect(courseResponse?.status()).toBe(200);
    await expect(page.getByText('17 interactive simulation labs', { exact: true })).toBeVisible();
    await expect(page.getByText('1 of 17 simulations mastered', { exact: true })).toBeVisible();
    for (const id of practiceIds) {
      await expect(
        page.locator('a[href="/lms/courses/' + courseId + '/lessons/' + id + '"]'),
      ).toHaveCount(1);
    }
    // Leave Chapter 1 untouched and create a saved, unmastered later lab.
    // The electrical lab above retains mastery across device runs, so it is
    // deliberately excluded from the continuation candidate.
    const resumeLessonId = workbook.chapters[4].lesson_id;
    const resumeApi =
      base + '/api/learner/hvac-simulations?courseId=' + courseId + '&lessonId=' + resumeLessonId;
    const beforeResume = (await (
      await page.request.get(resumeApi)
    ).json()) as HvacSimulationResponse;
    const observed = await page.request.post(base + '/api/learner/hvac-simulations', {
      data: {
        courseId,
        lessonId: resumeLessonId,
        simulationId: beforeResume.simulation.id,
        expectedRevision: beforeResume.progress.revision,
        requestId: await page.evaluate(() => crypto.randomUUID()),
        action: { type: 'observe' },
      },
    });
    expect(observed.status()).toBe(200);
    const resumeState = (await observed.json()) as HvacSimulationResponse;
    await page.goto(base + '/programs/hvac-technician/course');
    const resumeLink = page.getByRole('link', {
      name: 'Continue simulation practice',
      exact: true,
    });
    await expect(resumeLink).toHaveAttribute(
      'href',
      '/lms/courses/' + courseId + '/lessons/' + resumeLessonId + '#hvac-simulation',
    );
    await resumeLink.click();
    await expect(lab).toBeVisible();
    await page.reload();
    await expect(lab.getByText('Saved progress restored.', { exact: true })).toBeVisible();
    expect((await (await page.request.get(resumeApi)).json()).progress.revision).toBe(
      resumeState.progress.revision,
    );

    // Read every canonical lab on each configured device without creating extra
    // attempts or rewriting any existing learner's evidence.
    for (const chapter of workbook.chapters) {
      await page.goto(
        base + '/lms/courses/' + courseId + '/lessons/' + chapter.lesson_id + '#hvac-simulation',
      );
      await expect(lab).toBeVisible({ timeout: 30_000 });
      await expect(
        lab.getByRole('button', { name: 'Run virtual check', exact: true }),
      ).toBeVisible();
      expect(
        await lab.evaluate((element) => element.scrollWidth - element.clientWidth),
      ).toBeLessThanOrEqual(2);
      for (const control of await lab.locator('input, select').all()) {
        await expect(control).toHaveAccessibleName(/.+/);
      }
      const stored = await page.request.get(
        base +
          '/api/learner/hvac-simulations?courseId=' +
          courseId +
          '&lessonId=' +
          chapter.lesson_id,
      );
      expect(stored.status()).toBe(200);
      expect((await stored.json()).simulation.lessonId).toBe(chapter.lesson_id);
    }
    expect(errors, 'Course practice must not produce unhandled browser errors').toEqual([]);
    await info.attach('hvac-simulation-acceptance', {
      contentType: 'application/json',
      body: JSON.stringify({
        deployedSha: expectedSha,
        device: info.project.name,
        revisionBeforeReload,
        score: saved.simulation.score,
        bestScore: restarted.progress.bestScore,
        attemptCount: restarted.progress.attemptCount,
        canonicalPracticeLinks: practiceIds.length,
        errors,
      }),
    });
  });
});
