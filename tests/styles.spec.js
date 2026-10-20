import { test, expect } from '@playwright/test';

test('instance style configuration preserves isolation, defaults, anchors and lifecycle', async ({ page }) => {
  await page.goto('/tests/style-check.html');
  await expect(page.locator('#summary')).toHaveText('PASS: 4/4 style checks');
});
