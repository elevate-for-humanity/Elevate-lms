import { test, expect, type Page } from '@playwright/test';

const subject = 'Device compatibility conversation';
const longValue = 'UnbrokenEmailContent'.repeat(30);
const thread = {
  id: 'device-conversation', subject, last_message_at: '2026-11-14T00:00:00Z',
  message_count: 1, unread: true, starred: false, folder: 'inbox',
  sender: 'Synthetic Applicant', preview: 'Browser test message',
};

async function noHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    width: innerWidth,
    content: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth),
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.width + 1);
}

async function insideViewport(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/communications/email*', async route => {
    const request = route.request();
    if (request.method() !== 'GET') {
      // Never send a real email or change a real mailbox from a layout test.
      await route.fulfill({ json: { success: true } });
      return;
    }
    const selected = new URL(request.url()).searchParams.has('threadId');
    await route.fulfill({ json: {
      mailboxes: [{ id: 'admissions', address: 'admissions@example.org', displayName: 'Admissions', mailboxKind: 'department', accessLevel: 'owner' }],
      selectedMailboxId: 'admissions', filters: [], folders: [], drafts: [], threads: [thread],
      selectedThread: selected ? { ...thread, messages: [{
        id: 'synthetic-message', direction: 'inbound', status: 'received',
        sender_email: `${longValue}@example.org`, sender_name: longValue,
        to_addresses: ['admissions@example.org'], subject, text_body: longValue,
        created_at: '2026-11-14T00:00:00Z',
        attachments: [{ id: 'synthetic-attachment', file_name: `${longValue}.pdf`, mime_type: 'application/pdf', size_bytes: 100 }],
      }] } : null,
    } });
  });
});

test('reader, conversation link, and orientation keep long messages within the screen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Synthetic Applicant Device compatibility conversation/ }).click();
  const reader = page.getByRole('region', { name: 'Email reading pane' });
  // The reading pane is a named section and therefore exposes a region role.
  await expect(reader).toBeVisible();
  await expect(page.getByRole('heading', { name: subject })).toBeVisible();
  await noHorizontalOverflow(page);
  const messageOverflow = await reader.locator('article').evaluateAll(nodes =>
    nodes.map(node => ({ visible: node.clientWidth, content: node.scrollWidth })),
  );
  for (const box of messageOverflow) expect(box.content).toBeLessThanOrEqual(box.visible + 1);
  await expect(page).toHaveURL(/threadId=device-conversation/);
  await page.reload();
  await expect(page.getByRole('heading', { name: subject })).toBeVisible();
  const viewport = page.viewportSize()!;
  await page.setViewportSize({ width: viewport.height, height: viewport.width });
  await noHorizontalOverflow(page);
  const pane = await reader.boundingBox();
  expect(pane!.width).toBeGreaterThan(0);
  if (page.viewportSize()!.width >= 768) {
    await expect(page.getByRole('textbox', { name: 'Search mail' })).toBeVisible();
    const search = await page.getByRole('textbox', { name: 'Search mail' }).boundingBox();
    expect(search!.x + search!.width).toBeLessThanOrEqual(pane!.x + 1);
  } else {
    await expect(page.getByRole('button', { name: 'Back to inbox' })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Reply', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Compose email' })).toBeVisible();
  await noHorizontalOverflow(page);
});

test('composer remains usable with a short viewport and can be closed without sending', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Compose', exact: true }).click();
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Synthetic device test; never sent.');
  const viewport = page.viewportSize()!;
  // Reduced content height simulates keyboard-driven layout changes, not the OS keyboard itself.
  await page.setViewportSize({ width: Math.min(viewport.width, 430), height: 320 });
  const send = page.getByRole('button', { name: 'Send email', exact: true });
  await send.scrollIntoViewIfNeeded();
  await insideViewport(page, '[role="dialog"] button[type="submit"]');
  await noHorizontalOverflow(page);
  const close = page.getByRole('button', { name: 'Close composer' });
  await close.scrollIntoViewIfNeeded();
  await close.click();
  await expect(page.getByRole('dialog', { name: 'Compose email' })).toHaveCount(0);

});

for (const width of [320, 375, 430, 768, 1024, 1440]) {
  test(`inbox and composer fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 720 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Compose', exact: true })).toBeVisible();
    await noHorizontalOverflow(page);
    await page.getByRole('button', { name: 'Compose', exact: true }).click();
    await page.getByRole('button', { name: 'Send email', exact: true }).scrollIntoViewIfNeeded();
    await noHorizontalOverflow(page);
    await insideViewport(page, '[role="dialog"] button[type="submit"]');
  });
}
