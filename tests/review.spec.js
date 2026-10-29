import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/fixture.html');
  await page.waitForFunction(() => window.review);
});

// Label, history and export buttons live in the ••• action strip, as a mouse user finds them.
async function openActions(page) {
  const toggle = page.getByRole('button', { name: 'Annotation actions' });
  if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
}

test('block click, shared buttons, history, and independent overlapping annotation chooser', async ({ page }) => {
  await page.locator('.review-document p').first().click();
  expect(await page.evaluate(() => review.read())).toHaveLength(0);
  await openActions(page);
  await page.getByRole('button', { name: 'Accept', exact: true }).click();
  expect(await page.evaluate(() => review.read())).toHaveLength(1);
  await page.evaluate(() => { review.select(15, 45); });
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  expect(await page.evaluate(() => review.read())).toHaveLength(2);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(await page.evaluate(() => review.read())).toHaveLength(1);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  expect(await page.evaluate(() => review.read())).toHaveLength(2);
});

test('exact native selection crosses formatting and canonical anchors survive reflow', async ({ page }) => {
  const result = await page.evaluate(() => {
    const p = document.querySelector('.review-document p');
    const r = document.createRange(); r.setStart(p.firstChild, 5); r.setEnd(p.querySelector('strong').firstChild, 4);
    const selection = getSelection(); selection.removeAllRanges(); selection.addRange(r);
    document.dispatchEvent(new Event('selectionchange'));
    return r.toString();
  });
  await page.waitForTimeout(50);
  await openActions(page);
  await page.getByRole('button', { name: 'Accept', exact: true }).click();
  expect((await page.evaluate(() => review.read()))[0].quote).toBe(result);
  const before = await page.evaluate(() => review.export());
  await page.setViewportSize({ width: 480, height: 600 });
  expect(await page.evaluate(() => review.export())).toEqual(before);
});

test('a mouse drag starting on pending text adjusts the native selection and never labels', async ({ page }) => {
  const block = page.locator('.review-document p').first();
  await block.click();
  const box = await block.boundingBox();
  const x = box.x + 45, y = box.y + 10;
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 95, y, { steps: 8 }); await page.mouse.up();
  expect(await page.evaluate(() => review.read())).toHaveLength(0);
  const dragged = await page.evaluate(() => getSelection().toString());
  expect(dragged.length).toBeGreaterThan(0);
  // The pending range now mirrors the dragged text, not the clicked paragraph.
  await openActions(page);
  await page.getByRole('button', { name: 'Accept', exact: true }).click();
  expect((await page.evaluate(() => review.read()))[0].quote).toBe(dragged);
});

test('browser-generated horizontal wheel over pending text labels once; vertical wheel does not', async ({ page }) => {
  const block = page.locator('.review-document p').first();
  await block.click();
  const box = await block.boundingBox();
  await page.mouse.move(box.x + 45, box.y + 10);
  await page.mouse.wheel(0, 40);
  expect(await page.evaluate(() => review.read())).toHaveLength(0);
  // Re-read geometry: the vertical wheel may have scrolled the document.
  const moved = await block.boundingBox();
  await page.mouse.move(moved.x + 45, moved.y + 10);
  await page.mouse.wheel(-40, 0);
  await page.mouse.wheel(-40, 0);
  const annotations = await page.evaluate(() => review.read());
  expect(annotations).toHaveLength(1); expect(annotations[0].labelId).toBe('accept');
});

test('clicks select list items and code blocks; keyboard navigation reaches both', async ({ page }) => {
  await openActions(page);
  await page.locator('.review-document li').first().click();
  expect(await page.evaluate(() => review.read())).toHaveLength(0);
  await page.getByRole('button', { name: 'Accept', exact: true }).click();
  expect((await page.evaluate(() => review.read()))[0].quote).toBe('First list entry');
  await page.locator('.review-document pre code').click();
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  expect((await page.evaluate(() => review.read()))[1].quote).toBe('const value = 42;\n');
  await page.locator('.review-document li').nth(1).focus();
  await page.keyboard.press('Enter'); await page.keyboard.press('Alt+ArrowLeft');
  expect((await page.evaluate(() => review.read())).some(a => a.quote === 'Second list entry')).toBe(true);
});

for (const platform of ['Win32', 'Linux x86_64', 'MacIntel']) {
  test(`modifier routing for ${platform} (simulated platform detection)`, async ({ page }) => {
    // userAgentData is cleared so detection falls back to the simulated navigator.platform.
    await page.addInitScript(value => {
      Object.defineProperty(navigator, 'platform', { configurable: true, value });
      Object.defineProperty(navigator, 'userAgentData', { configurable: true, value: undefined });
    }, platform);
    await page.goto('/tests/fixture.html'); await page.waitForFunction(() => window.review);
    await openActions(page);
    await page.locator('.review-document li').first().click();
    await page.getByRole('button', { name: 'Accept', exact: true }).click();
    await page.locator('.review-document').focus();
    const mod = platform === 'MacIntel' ? 'Meta' : 'Control';
    await page.keyboard.press(`${mod}+z`); expect(await page.evaluate(() => review.read())).toHaveLength(0);
    await page.keyboard.press(`${mod}+Shift+z`); expect(await page.evaluate(() => review.read())).toHaveLength(1);
    if (platform !== 'MacIntel') {
      await page.keyboard.press('Control+z'); await page.keyboard.press('Control+y');
      expect(await page.evaluate(() => review.read())).toHaveLength(1);
    }
  });
}

test('keyboard block/precise selection, context guards, remapping, and help', async ({ page }) => {
  await page.locator('.review-document h1').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Alt+ArrowLeft');
  expect(await page.evaluate(() => review.read())).toHaveLength(1);
  await page.locator('.review-document p').first().focus();
  await page.keyboard.press('F2');
  for (let i = 0; i < 8; i++) await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('F2'); await page.keyboard.press('Alt+ArrowRight');
  expect((await page.evaluate(() => review.read()))[1].quote).toBe('Keep thi');
  await page.getByRole('textbox', { name: 'Host input' }).fill('host');
  await page.keyboard.press('Control+z');
  expect(await page.evaluate(() => review.read())).toHaveLength(2);
  await page.getByRole('button', { name: 'Shortcut help' }).click();
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('sanitization, atomic restore, save failure retry, and lifecycle', async ({ page }) => {
  const result = await page.evaluate(async () => {
    review.destroy();
    let attempts = 0;
    window.review = mountReview(document.querySelector('#fixture'), {
      ...fixtureOptions,
      document: { ...fixtureOptions.document, markdown: '# Safe\n\n<script>window.attacked=true</script>\n\n<a href="javascript:alert(1)" onclick="alert(1)">link</a>' },
      onFinish: async () => { if (++attempts === 1) throw new Error('Save failed'); },
    });
    review.select(0, 4); document.querySelector('[data-command="left"]').click();
    const before = review.export(); const wrong = structuredClone(before); wrong.document.version = 'wrong';
    let rejected = false; try { review.restore(wrong); } catch { rejected = true; }
    let failed = false; try { await review.finish(); } catch { failed = true; }
    const intact = JSON.stringify(before) === JSON.stringify(review.export());
    await review.finish();
    const unsafe = !!document.querySelector('.review-document script, .review-document [onclick], .review-document [href^="javascript:"]');
    review.destroy(); review.destroy();
    return { rejected, failed, intact, unsafe, attacked: !!window.attacked, empty: document.querySelector('#fixture').childNodes.length === 0 };
  });
  expect(result).toEqual({ rejected: true, failed: true, intact: true, unsafe: false, attacked: false, empty: true });
});

test('a local Markdown file produces both downloadable label files and can restore them', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Markdown file').setInputFiles('tests/fixtures/review.md');
  await page.getByRole('button', { name: 'Start review' }).click();
  await page.locator('.review-document p').first().click();
  await openActions(page);
  await page.getByRole('button', { name: 'Accept', exact: true }).click();
  const downloads = [];
  page.on('download', d => downloads.push(d));
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('#downloads a')).toHaveCount(2);
  await expect(page.locator('#downloads a').nth(0)).toHaveAttribute('download', 'review_Accept.json');
  await expect(page.locator('#downloads a').nth(1)).toHaveAttribute('download', 'review_Reject.json');
  for (const link of await page.locator('#downloads a').all()) {
    const received = page.waitForEvent('download');
    await link.click();
    await received;
  }
  expect(downloads).toHaveLength(2);
  const { readFile } = await import('node:fs/promises');
  const payloads = [];
  for (const download of downloads) payloads.push(JSON.parse(await readFile(await download.path(), 'utf8')));
  expect(payloads.flatMap(p => Object.values(p.selections).flat())).toHaveLength(1);
  expect(payloads.find(p => p.selections.right).selections.right).toEqual([]);
  for (const p of payloads) for (const a of Object.values(p.selections).flat()) expect(p.document.text.slice(a.start, a.end)).toBe(a.quote);
  await page.locator('.review-document p').nth(1).click();
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  await expect(page.locator('#downloads a')).toHaveCount(0);
  page.on('dialog', dialog => dialog.accept());
  await page.getByLabel('Restore label JSON files').setInputFiles(payloads.map((payload, i) => ({ name: `label-${i}.json`, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(payload)) })));
  await expect(page.getByRole('status').first()).toContainText('Restored 1 annotations');
  await expect(page.locator('#downloads a')).toHaveCount(0);
});

test('••• swap keeps navbar and document still; real Escape collapses first; Export files, Mod+Shift+E, icon and F1 help', async ({ page }) => {
  const navbar = page.locator('.review-navbar'), surface = page.locator('.review-document'), whisper = page.locator('.review-whisper');
  await page.evaluate(() => { window.exports = 0; document.querySelector('#fixture').addEventListener('review:export', () => window.exports++); });
  await page.locator('.review-document p').first().click();
  await expect(whisper).toBeVisible();
  const before = [await navbar.boundingBox(), await surface.boundingBox()];
  expect(before[0].height).toBe(62);
  await page.getByRole('button', { name: 'Annotation actions' }).click();
  const exportButton = page.getByRole('button', { name: 'Export files', exact: true });
  await expect(exportButton).toBeVisible();
  expect([await navbar.boundingBox(), await surface.boundingBox()]).toEqual(before);
  await exportButton.click();
  // Shortcuts apply while focus is inside the annotator (WebKit does not focus clicked buttons).
  await surface.focus();
  await page.keyboard.press('ControlOrMeta+Shift+E');
  expect(await page.evaluate(() => window.exports)).toBe(2);
  await page.getByRole('button', { name: 'Annotation actions' }).focus();
  await page.keyboard.press('Escape');
  await expect(exportButton).toBeHidden();
  await expect(whisper).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(whisper).toBeHidden();
  const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  await page.getByRole('button', { name: 'Shortcut help' }).click();
  await expect(dialog).toBeVisible();
  const viaIcon = await dialog.textContent();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await surface.focus();
  await page.keyboard.press('F1');
  await expect(dialog).toBeVisible();
  expect(await dialog.textContent()).toBe(viaIcon);
});
