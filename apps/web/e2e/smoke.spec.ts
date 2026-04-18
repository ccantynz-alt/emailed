// TODO: Add @playwright/test to apps/web devDependencies, then run: bunx playwright install chromium
//
// Minimal happy-path E2E smoke test for the AlecRae web app.
// Covers:
//   1. Landing page (/) loads and contains brand text "AlecRae"
//   2. /admin preview route loads (the iPad-friendly admin surface on apps/web)
//
// No /api/health route exists on apps/web at time of authoring — skipped.
//
// Run (after adding the dep):
//   bunx playwright test apps/web/e2e/smoke.spec.ts
//
// Requires PLAYWRIGHT_BASE_URL (e.g. http://localhost:3000) or a Playwright
// config with `use.baseURL` set. Until then, this file is a skeleton.

import { expect, test } from '@playwright/test';

test.describe('AlecRae web — smoke', () => {
  test('landing page loads and shows brand', async ({ page }) => {
    const response = await page.goto('/');
    expect(response, 'navigation response').not.toBeNull();
    expect(response!.status(), 'GET / status').toBeLessThan(400);

    // Brand text must appear somewhere on the landing page.
    await expect(page.getByText(/AlecRae/i).first()).toBeVisible();
  });

  test('/admin preview route loads', async ({ page }) => {
    const response = await page.goto('/admin');
    expect(response, 'navigation response').not.toBeNull();
    // Admin is robots-disallowed but must still render for Craig on iPad.
    expect(response!.status(), 'GET /admin status').toBeLessThan(400);

    // Sanity check — page isn't blank.
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length, '/admin body has content').toBeGreaterThan(0);
  });
});
