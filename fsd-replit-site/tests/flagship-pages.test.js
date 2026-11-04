import test from 'node:test';
import assert from 'node:assert/strict';
import {
  flagshipPageDefinitions,
  renderFlagshipPlaceholderPages,
  renderInnovationHubIndex,
} from '../src/flagship-pages.js';
import { routeFromHash } from '../src/react-router.js';

test('every requested page and Bio-Lab concept has a direct route and visible page shell', () => {
  const html = renderFlagshipPlaceholderPages();
  const expectedTitles = [
    'Tactical Shield Membership',
    'FSD Pods',
    'Smart Apparel &amp; NFC Authentication',
    'Adaptive Technical Fabrics',
    'Performance-Linked Partnerships',
    'Bio-Weave™ ECG &amp; Hydration Compression Tops',
    'FSD Aware Band™',
    'Graphene-Infused Thermal Recovery Vests',
    'FSD Digital Pass™',
    'FSD VECTOR — Smartwatch',
    'FSD CORE — Heart Rate Sensor Strap',
  ];

  for (const page of flagshipPageDefinitions) {
    assert.match(html, new RegExp(`id="${page.id}"`));
    assert.equal(routeFromHash(`#${page.id}`).view, 'page');
    assert.equal(routeFromHash(`#${page.id}`).target, page.id);
  }
  for (const title of expectedTitles) assert.ok(html.includes(title), `${title} should be visible`);
  assert.equal(flagshipPageDefinitions.length, 11);
});

test('pending media uses labeled responsive placeholders rather than unapproved imagery', () => {
  const html = renderFlagshipPlaceholderPages();
  assert.equal((html.match(/class="fsd-asset-slot fsd-asset-slot--/g) || []).length, 44);
  assert.match(html, /FSD \/ PERFORMANCE/);
  assert.match(html, /FSD product and editorial imagery/);
  assert.match(html, /Illustrative portal mock-up only; no live member area is available/);
  assert.match(html, /Illustrative training imagery only; no class or provider is confirmed/);
  assert.match(html, /VIEW SMART APPAREL INITIATIVE/);
  assert.match(html, /href="#smart-apparel-nfc"/);
  assert.match(html, /FSD BIO-LAB™ \/ ACTIVE INITIATIVE/);
  assert.match(html, /Low-footprint modular training, retail, and community infrastructure/);
  assert.match(html, /href="\/fsd-pods\.html"/);
  assert.doesNotMatch(html, />\s*(?:CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING)\b/i);
  assert.doesNotMatch(html, /<img\b|data:image\//i);
});

test('Innovation Hub links to all concepts and keeps private proofs out of production markup', () => {
  const publicHtml = renderInnovationHubIndex();
  assert.equal((publicHtml.match(/class="fsd-innovation-card"/g) || []).length, 8);
  assert.match(publicHtml, /ACTIVE BIO-LAB INITIATIVE/);
  assert.match(publicHtml, /related concepts and design prototypes are for exploration, not current products or commitments/);
  assert.match(publicHtml, /href="#adaptive-technical-fabrics"/);
  assert.doesNotMatch(publicHtml, /__catalogue-preview/);

  const developmentHtml = renderInnovationHubIndex({ includePrivatePreviews: true });
  assert.match(developmentHtml, /\/__catalogue-preview\/fsd-alight\//);
  assert.match(developmentHtml, /\/__catalogue-preview\/fsd-motion\//);
  assert.match(developmentHtml, /\/__catalogue-preview\/fsd-nexus\//);
});

test('new page content does not enable membership sign-up, checkout, or unverified claims', () => {
  const html = renderFlagshipPlaceholderPages();
  assert.match(html, /REGISTRATION NOT OPEN/);
  assert.match(html, /Practical skills\. Greater confidence\. Stronger communities\./);
  assert.match(html, /Online Learning/);
  assert.match(html, /Practical Training/);
  assert.match(html, /Member Support/);
  assert.match(html, /Real-World Relevance/);
  assert.match(html, /POTENTIAL STRATEGIC VALUE/);
  assert.match(html, /04 \/ CONDITIONS BEFORE PROGRESSION/);
  assert.match(html, /Terms, benefits, providers, and access details are unconfirmed/);
  assert.match(html, /PARTNERSHIP ENQUIRIES NOT CONNECTED/);
  assert.match(html, /FSD \/ GLOBAL VISION &amp; OPERATIONS/);
  assert.match(html, /ACTIVE INITIATIVE · ROLLOUT UNDERWAY/);
  assert.match(html, /Related concepts and design prototypes are for exploration, not current products or commitments/);
  assert.doesNotMatch(html, /<form\b|ADD TO BAG|CHECKOUT|£\d/i);
  assert.match(html, /FSD Bio-Lab product information/i);
});
