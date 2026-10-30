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

// The same real-input sequence with the whisper hidden is the native baseline.
async function freshFixture(page, hideWhisper) {
  await page.goto('/tests/fixture.html');
  await page.waitForFunction(() => window.review);
  if (hideWhisper) await page.addStyleTag({ content: '.review-whisper { display: none !important; }' });
}

test('precise Shift+ArrowDown crosses blocks past a visible whisper exactly as without it; F2 then label saves the full range', async ({ page }) => {
  async function run(hideWhisper) {
    await freshFixture(page, hideWhisper);
    await page.locator('.review-document p').first().focus();
    await page.keyboard.press('F2');
    if (!hideWhisper) await expect(page.locator('.review-whisper')).toBeVisible();
    const lengths = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Shift+ArrowDown');
      lengths.push(await page.evaluate(() => getSelection().toString().length));
    }
    await page.keyboard.press('F2');
    await page.keyboard.press('Alt+ArrowRight');
    const saved = await page.evaluate(() => review.read());
    return { lengths, quote: saved[0]?.quote };
  }
  const baseline = await run(true);
  const visible = await run(false);
  // Each Shift+ArrowDown must reach a new line: no dead keypresses at block boundaries.
  for (let i = 1; i < baseline.lengths.length; i++) expect(baseline.lengths[i]).toBeGreaterThan(baseline.lengths[i - 1]);
  expect(visible).toEqual(baseline);
});

test('a mouse drag across a visible whisper selects the same text as without it', async ({ page }) => {
  async function run(hideWhisper) {
    await freshFixture(page, hideWhisper);
    const paragraphs = page.locator('.review-document p');
    await paragraphs.first().click();
    if (!hideWhisper) await expect(page.locator('.review-whisper')).toBeVisible();
    const from = await paragraphs.nth(0).boundingBox(), to = await paragraphs.nth(1).boundingBox();
    await page.mouse.move(from.x + 45, from.y + 10);
    await page.mouse.down();
    await page.mouse.move(to.x + 120, to.y + 10, { steps: 12 });
    await page.mouse.up();
    await openActions(page);
    await page.getByRole('button', { name: 'Accept', exact: true }).click();
    return (await page.evaluate(() => review.read()))[0]?.quote;
  }
  const baseline = await run(true);
  expect(baseline).toContain('\n');
  expect(await run(false)).toBe(baseline);
});

// --- Plan 26: hierarchical clicks, Shift-append ranges, canceled labeling swipes ---

test.describe('heading sections and nested lists (sections.md)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixture.html?doc=sections');
    await page.waitForFunction(() => window.review);
  });

  const pendingCount = page => page.evaluate(() => [...CSS.highlights].find(([name]) => name.endsWith('-pending'))[1].size);
  const documentText = page => page.evaluate(() => review.export().document.text);
  // The canonical slice from the start of `first` to the end of `last` (exclusive end).
  function slice(text, first, last) {
    return text.slice(text.indexOf(first), last === null ? text.length : text.indexOf(last) + last.length);
  }
  const block = (page, tag, text) => page.locator(`.review-document ${tag}`, { hasText: text }).first();
  // Click near the start of a block's first line, so the pointer rests on its text.
  const AT_TEXT = { position: { x: 12, y: 8 } };
  async function reload(page) {
    await page.reload();
    await page.waitForFunction(() => window.review);
  }
  async function label(page, direction = 'Left') {
    await page.keyboard.press(`Alt+Arrow${direction}`);
    return page.evaluate(() => review.read().map(a => a.quote));
  }
  // Record whether each wheel event reaching the window was canceled by the annotator.
  async function recordWheels(page) {
    await page.evaluate(() => { window.wheels = []; addEventListener('wheel', event => wheels.push(event.defaultPrevented)); });
  }
  // Dispatch a synthetic wheel event at the centre of the first element matching `selector`; returns defaultPrevented.
  function dispatchWheel(page, selector, init) {
    return page.evaluate(({ selector, init }) => {
      const target = document.querySelector(selector);
      target.scrollIntoView({ block: 'center' });
      const rect = target.getBoundingClientRect();
      const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: rect.left + 12, clientY: rect.top + rect.height / 2, ...init });
      document.elementFromPoint(event.clientX, event.clientY).dispatchEvent(event);
      return event.defaultPrevented;
    }, { selector, init });
  }

  test('a heading click selects its whole section up to the next heading of the same or higher rank', async ({ page }) => {
    const text = await documentText(page);
    await block(page, 'h2', 'Second section').click();
    expect(await label(page)).toEqual([slice(text, 'Second section', 'Nested topic closing.')]);
    // A plain click inside a saved annotation would activate it; start over.
    await reload(page);
    await block(page, 'h3', 'Nested topic').click();
    await block(page, 'h2', 'Third section').click({ modifiers: ['Shift'] });
    const quotes = await label(page, 'Right');
    expect(quotes).toContain(slice(text, 'Nested topic', 'Nested topic closing.'));
    expect(quotes).toContain(slice(text, 'Third section', null));
  });

  test('a list item click selects its nested subtree; a nested item selects only its own', async ({ page }) => {
    const text = await documentText(page);
    await block(page, 'li', 'Parent item').click(AT_TEXT);
    expect(await label(page)).toEqual([slice(text, 'Parent item', 'Second child')]);
    await reload(page);
    await page.locator('.review-document li li').first().click(AT_TEXT);
    expect(await label(page)).toContain(slice(text, 'Child item', 'Grandchild item'));
  });

  test('a drag inside a heading keeps its exact range instead of the section', async ({ page }) => {
    const heading = block(page, 'h2', 'Second section');
    const box = await heading.boundingBox();
    await page.mouse.move(box.x + 4, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 70, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    const dragged = await page.evaluate(() => getSelection().toString());
    expect(dragged.length).toBeGreaterThan(0);
    expect('Second section'.startsWith(dragged)).toBe(true);
    expect(await label(page)).toEqual([dragged]);
  });

  test('Shift+click appends ranges, Escape clears them all, and a label commits each', async ({ page }) => {
    await block(page, 'p', 'Section intro').click(AT_TEXT);
    await block(page, 'p', 'Final paragraph').click({ ...AT_TEXT, modifiers: ['Shift'] });
    expect(await pendingCount(page)).toBe(2);
    // No browser Shift+click extension: nothing between the two paragraphs is natively selected.
    expect(await page.evaluate(() => getSelection().toString())).toBe('');
    await page.keyboard.press('Escape');
    expect(await pendingCount(page)).toBe(0);
    await block(page, 'p', 'Section intro').click(AT_TEXT);
    await block(page, 'p', 'Final paragraph').click({ ...AT_TEXT, modifiers: ['Shift'] });
    expect(await label(page)).toEqual(['Section intro paragraph.', 'Final paragraph.']);
    // A plain click replaces the set again.
    await block(page, 'p', 'Section intro').click({ modifiers: ['Shift'] });
    await block(page, 'p', 'Nested topic closing').click();
    expect(await pendingCount(page)).toBe(1);
  });

  test('Shift+drag appends an exact range to a clicked block', async ({ page }) => {
    await block(page, 'p', 'Section intro').click(AT_TEXT);
    // Centre the target: a drag near the viewport edge autoscrolls and extends the range.
    await block(page, 'p', 'Final paragraph').evaluate(node => node.scrollIntoView({ block: 'center' }));
    const target = await block(page, 'p', 'Final paragraph').boundingBox();
    await page.keyboard.down('Shift');
    await page.mouse.move(target.x + 2, target.y + target.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x + 50, target.y + target.height / 2, { steps: 8 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    expect(await pendingCount(page)).toBe(2);
    const quotes = await label(page);
    expect(quotes[0]).toBe('Section intro paragraph.');
    expect(quotes[1].length).toBeGreaterThan(0);
    expect(quotes[1].length).toBeLessThan('Final paragraph.'.length);
    expect('Final paragraph.'.startsWith(quotes[1])).toBe(true);
  });

  test('overlapping appended ranges merge into one contiguous range', async ({ page }) => {
    const text = await documentText(page);
    await page.locator('.review-document li li').first().click(AT_TEXT);
    await block(page, 'li', 'Parent item').click({ ...AT_TEXT, modifiers: ['Shift'] });
    expect(await pendingCount(page)).toBe(1);
    expect(await label(page)).toEqual([slice(text, 'Parent item', 'Second child')]);
  });

  test('one swipe over any pending range labels all of them as one undo step', async ({ page }) => {
    await recordWheels(page);
    await block(page, 'p', 'Section intro').click(AT_TEXT);
    await block(page, 'p', 'Final paragraph').click({ ...AT_TEXT, modifiers: ['Shift'] });
    await page.mouse.wheel(-40, 0);
    await expect.poll(() => page.evaluate(() => review.read().length)).toBe(2);
    const saved = await page.evaluate(() => review.read());
    expect(saved.map(a => [a.quote, a.labelId])).toEqual([['Section intro paragraph.', 'accept'], ['Final paragraph.', 'accept']]);
    expect(await page.evaluate(() => wheels)).toEqual([true]);
    await page.locator('.review-document').focus();
    await page.keyboard.press('ControlOrMeta+z');
    expect(await page.evaluate(() => review.read())).toHaveLength(0);
    await page.keyboard.press('ControlOrMeta+Shift+z');
    expect(await page.evaluate(() => review.read())).toHaveLength(2);
  });

  test('labeling swipes in both directions are canceled so the browser cannot navigate history', async ({ page }) => {
    await recordWheels(page);
    await block(page, 'p', 'Section intro').click(AT_TEXT);
    await page.mouse.wheel(-40, 0);
    await expect.poll(() => page.evaluate(() => review.read().length)).toBe(1);
    // Wait out the continuation window so the next swipe is a new gesture.
    await page.waitForTimeout(300);
    await block(page, 'p', 'Final paragraph').click(AT_TEXT);
    await page.mouse.wheel(40, 0);
    await expect.poll(() => page.evaluate(() => review.read().length)).toBe(2);
    expect(await page.evaluate(() => review.read().map(a => a.labelId))).toEqual(['accept', 'reject']);
    expect(await page.evaluate(() => wheels)).toEqual([true, true]);
  });

  test('vertical, zoom, mixed, no-pending and outside wheel input is never canceled', async ({ page }) => {
    await recordWheels(page);
    await block(page, 'p', 'Section intro').click(AT_TEXT);
    await page.mouse.wheel(0, 40);
    await expect.poll(() => page.evaluate(() => wheels)).toEqual([false]);
    const intro = '.review-document h2 + p';
    expect(await dispatchWheel(page, intro, { deltaX: 30, deltaY: 0, ctrlKey: true })).toBe(false);
    expect(await dispatchWheel(page, intro, { deltaX: 30, deltaY: 0, metaKey: true })).toBe(false);
    expect(await dispatchWheel(page, intro, { deltaX: 30, deltaY: 4 })).toBe(false);
    expect(await dispatchWheel(page, '.review-document h1', { deltaX: 30, deltaY: 0 })).toBe(false);
    await page.keyboard.press('Escape');
    expect(await dispatchWheel(page, intro, { deltaX: 30, deltaY: 0 })).toBe(false);
    expect(await page.evaluate(() => review.read())).toHaveLength(0);
  });

  test('a swipe continuation is canceled but never labels a newly made selection', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const text = review.export().document.text;
      const range = quote => [text.indexOf(quote), text.indexOf(quote) + quote.length];
      const wheel = selector => {
        const target = document.querySelector(selector);
        target.scrollIntoView({ block: 'center' });
        const rect = target.getBoundingClientRect();
        const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: -30, deltaY: 0, clientX: rect.left + 12, clientY: rect.top + rect.height / 2 });
        document.elementFromPoint(event.clientX, event.clientY).dispatchEvent(event);
        return event.defaultPrevented;
      };
      review.select(...range('Section intro paragraph.'));
      const first = wheel('.review-document h2 + p');
      // Late momentum of the same gesture lands on a selection made right after the commit.
      review.select(...range('Final paragraph.'));
      const continuation = wheel('.review-document > p:last-child');
      const afterContinuation = review.read().length;
      await new Promise(resolve => setTimeout(resolve, 300));
      const fresh = wheel('.review-document > p:last-child');
      return { first, continuation, afterContinuation, fresh, quotes: review.read().map(a => a.quote) };
    });
    expect(result).toEqual({ first: true, continuation: true, afterContinuation: 1, fresh: true, quotes: ['Section intro paragraph.', 'Final paragraph.'] });
  });

  // Every block's position within the document surface, plus the surface size. Rounded to
  // 0.01px: Firefox reports ~1e-5px float noise under subpixel scrolling; real shifts are whole lines.
  function blockGeometry(page) {
    return page.evaluate(() => {
      const round = value => Math.round(value * 100) / 100;
      const surface = document.querySelector('.review-document');
      const origin = surface.getBoundingClientRect();
      const blocks = [...surface.querySelectorAll(':is(p, h1, h2, h3, li, pre, blockquote)')].map(node => {
        const rect = node.getBoundingClientRect();
        return [rect.left - origin.left, rect.top - origin.top, rect.width, rect.height].map(round);
      });
      return [[origin.width, origin.height].map(round), ...blocks];
    });
  }

  test('selection, append, label and undo never move document text', async ({ page }) => {
    const baseline = await blockGeometry(page);
    const steps = [
      ['plain click', () => block(page, 'p', 'Section intro').click(AT_TEXT)],
      ['plain click below', () => block(page, 'p', 'Nested topic closing').click(AT_TEXT)],
      ['Shift+click below', () => block(page, 'p', 'Final paragraph').click({ ...AT_TEXT, modifiers: ['Shift'] })],
      ['Shift+click above', () => block(page, 'p', 'Opening paragraph').click({ ...AT_TEXT, modifiers: ['Shift'] })],
      ['label', () => page.keyboard.press('Alt+ArrowLeft')],
      ['undo', () => page.keyboard.press('ControlOrMeta+z')],
    ];
    for (const [name, step] of steps) {
      await step();
      // Undo hides the whisper by design; every other step shows it.
      if (name !== 'undo') await expect(page.locator('.review-whisper'), name).toBeVisible();
      expect(await blockGeometry(page), name).toEqual(baseline);
    }
  });

  test('click, then swipe without moving the pointer: labels and cancels in both directions', async ({ page }) => {
    await recordWheels(page);
    await block(page, 'p', 'Section intro').click(AT_TEXT);
    await block(page, 'p', 'Nested topic closing').click(AT_TEXT);
    await page.mouse.wheel(-40, 0);
    await expect.poll(() => page.evaluate(() => review.read().map(a => [a.quote, a.labelId]))).toEqual([['Nested topic closing.', 'accept']]);
    await page.waitForTimeout(300);
    // Build a Shift selection top to bottom, then swipe right where the last click landed.
    await block(page, 'p', 'Section intro').click(AT_TEXT);
    await block(page, 'p', 'Final paragraph').click({ ...AT_TEXT, modifiers: ['Shift'] });
    await page.mouse.wheel(40, 0);
    await expect.poll(() => page.evaluate(() => review.read().length)).toBe(3);
    expect(await page.evaluate(() => review.read().map(a => a.labelId))).toEqual(['reject', 'accept', 'reject']);
    expect(await page.evaluate(() => wheels)).toEqual([true, true]);
  });

  test('a section ends at the last content before the next heading, even without a separator', async ({ page }) => {
    await page.evaluate(() => {
      review.destroy();
      window.review = mountReview(document.querySelector('#fixture'), { ...fixtureOptions, document: { ...fixtureOptions.document, markdown: '## A\n\n- item\n  ## B\n\n## C\n\nz\n' } });
    });
    await block(page, 'h2', 'A').click();
    expect(await label(page)).toEqual(['A\nitem']);
  });
});
