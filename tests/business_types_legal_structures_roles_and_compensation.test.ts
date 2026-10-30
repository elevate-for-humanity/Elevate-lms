import { test } from '@playwright/test';

const lessonTitle = 'Business Types, Legal Structures, Roles, and Compensation';

// Regression test to ensure the specific failure is resolved
test(`Regression Test for ${lessonTitle}`, async ({ page }) => {
  // Navigate to the lesson
  await page.goto('/lessons/business-types-legal-structures-roles-and-compensation');

  // Verify the lesson title
  const title = await page.textContent('h1');
  expect(title).toContain(lessonTitle);

  // Add more specific checks based on the lesson content
  // Example: Check for specific elements or text
  // await expect(page).toHaveText(/expected text/);
});