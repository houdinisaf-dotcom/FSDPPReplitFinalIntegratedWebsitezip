import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  SIZE_GUIDE_SECTIONS,
  renderSizeGuideTable,
} from '../src/size-guide-data.js';

test('delivery, privacy, terms, and contact pages are public root assets with placeholders', async () => {
  const files = ['delivery-returns.html', 'privacy.html', 'terms.html', 'contact.html'];
  const pages = await Promise.all(files.map(file => readFile(new URL(`../public/${file}`, import.meta.url), 'utf8')));
  for (const html of pages) {
    assert.match(html, /lang="en-GB"/u);
    assert.match(html, /policy-pages\.css/u);
    assert.match(html, /Website design prototype/u);
    assert.match(html, /href="\/privacy\.html"/u);
    assert.match(html, /href="\/terms\.html"/u);
    assert.match(html, /href="\/contact\.html"/u);
  }
  assert.match(pages[0], /International delivery/u);
  assert.match(pages[0], /Damaged or faulty items/u);
  assert.match(pages[0], /statutory consumer rights/u);
  assert.match(pages[1], /\[TO CONFIRM - LEGAL REVIEW\]/u);
  assert.match(pages[2], /\[TO CONFIRM - LEGAL REVIEW\]/u);
});

test('size guide shares labelled sections and keeps unapproved measurements blank', async () => {
  const page = await readFile(new URL('../size-guide.html', import.meta.url), 'utf8');
  assert.deepEqual(SIZE_GUIDE_SECTIONS.map(section => section.id), ['mens', 'womens', 'headwear']);
  assert.deepEqual(SIZE_GUIDE_SECTIONS[1].sizes, ['XS', 'S', 'M', 'L', 'XL', 'XXL']);
  assert.match(page, /data-size-guide-content/u);
  assert.match(page, /size-guide-page\.js/u);
  assert.match(renderSizeGuideTable(SIZE_GUIDE_SECTIONS[1]), /\[TO CONFIRM\]/u);
});
