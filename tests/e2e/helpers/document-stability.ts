import type { Page } from '@playwright/test';

/** Track document replacement, separately from Next.js same-document history updates. */
export function observeDocumentStability(page: Page) {
  const documentRequests: string[] = [];
  page.on('request', request => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      documentRequests.push(request.url());
    }
  });
  return async () => ({
    documentRequests: [...documentRequests],
    documentUrl: page.url(),
    timeOrigin: await page.evaluate(() => performance.timeOrigin),
  });
}
