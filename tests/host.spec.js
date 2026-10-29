import { test, expect } from '@playwright/test';

test('host export, atomic saved-review opening and complete edit/reopen workflow', async ({ page }) => {
  await page.goto('/');
  await page.addScriptTag({ type: 'module', url: '/tests/host-check.js' });
  await expect(page.locator('#host-check-summary')).toHaveText('PASS: 9/9 host checks');
});

test('system theme changes, manual persistence and native keyboard toggle work', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Night theme', exact: true });
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await page.emulateMedia({ colorScheme: 'light' }); await expect(button).toHaveAttribute('aria-pressed', 'false');
  await button.focus(); await page.keyboard.press('Enter'); await expect(button).toHaveAttribute('aria-pressed', 'true');
  await page.emulateMedia({ colorScheme: 'light' }); await expect(button).toHaveAttribute('aria-pressed', 'true');
  await page.reload(); await expect(button).toHaveAttribute('aria-pressed', 'true');
});

test('unavailable preference storage still permits theming, loading and export', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('Storage disabled'); } });
  });
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Night theme', exact: true });
  const before = await button.getAttribute('aria-pressed'); await button.click(); await expect(button).toHaveAttribute('aria-pressed', String(before !== 'true'));
  await page.addScriptTag({ type: 'module', url: '/tests/host-check.js' });
  await expect(page.locator('#host-check-summary')).toHaveText('PASS: 9/9 host checks');
});

test('all core acceptance checks pass on this browser and operating system', async ({ page, browser, browserName }) => {
  console.info(`Acceptance environment: ${process.platform}; ${browserName} ${browser.version()}; Node ${process.version}`);
  await page.goto('/tests/browser-check.html');
  await expect(page.locator('#summary')).toHaveText('PASS: 41/41 real-browser checks');
});

for (const format of ['grouped', 'split']) {
  test(`fresh saved ${format} review edits and downloads both complete updated label files`, async ({ page }) => {
    const { readFile } = await import('node:fs/promises');
    const { readDocument } = await import('../src/files.js');
    const { ReviewSession } = await import('../src/model.js');
    const source = await readDocument({ name: 'review.md', text: () => readFile('tests/fixtures/review.md', 'utf8') });
    const fixture = JSON.parse(await readFile('tests/artifacts/browser-left.json', 'utf8'));
    const labels = [{ id: 'keep-id', name: 'Keep me', direction: 'left' }, { id: 'reject-id', name: 'À revoir', direction: 'right' }];
    const saved = new ReviewSession({ document: source, text: fixture.document.text, labels });
    saved.select(15, 30); saved.classify('keep-id'); saved.select(64, 75); saved.classify('reject-id');
    const original = saved.read();
    const input = saved.export(format);
    const payloads = Array.isArray(input) ? input.slice().reverse() : [input];
    const open = async payloads => {
      await page.goto('/');
      await page.getByLabel('Original Markdown', { exact: true }).setInputFiles('tests/fixtures/review.md');
      await page.getByLabel('Saved annotation JSON').setInputFiles(payloads.map((payload, index) => ({ name: `unrelated-${index}.json`, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(payload)) })));
      await page.getByRole('button', { name: 'Open saved review', exact: true }).click();
      await expect(page.locator('#host-status')).toContainText('Reopened');
    };
    const download = async () => {
      const payloads = [];
      for (const [index, name] of ['review_Keep me.json', 'review_À revoir.json'].entries()) {
        const received = page.waitForEvent('download'); await page.locator('#downloads a').nth(index).click();
        const file = await received; expect(file.suggestedFilename().normalize('NFC')).toBe(name);
        payloads.push(JSON.parse(await readFile(await file.path(), 'utf8')));
      }
      return payloads;
    };
    page.on('dialog', dialog => dialog.accept());
    await open(payloads); await expect(page.locator('.review-saved-item')).toHaveCount(2);
    const openActions = () => page.getByRole('button', { name: 'Annotation actions' }).click();
    await page.locator('.review-saved-item').first().click(); await openActions(); await page.getByRole('button', { name: 'À revoir', exact: true }).click();
    await page.locator('.review-document li').last().click(); await page.getByRole('button', { name: 'Keep me', exact: true }).click();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    const updated = await download(); const annotations = updated.flatMap(payload => Object.values(payload.selections).flat());
    expect(annotations).toHaveLength(3);
    expect(annotations.find(annotation => annotation.id === original[0].id).labelId).toBe('reject-id');
    expect(annotations.find(annotation => annotation.id === original[1].id)).toEqual(original[1]);
    await open(updated.slice().reverse()); await openActions(); await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.locator('.review-saved-item')).toHaveCount(3);
    await page.getByRole('button', { name: 'Export files', exact: true }).click(); expect(await download()).toEqual(updated);
  });
}
