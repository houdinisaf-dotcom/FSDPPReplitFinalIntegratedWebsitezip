import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bioLabConceptVerification,
  flagshipPageDefinitions,
  renderFlagshipPlaceholderPages,
  renderInnovationHubIndex,
  renderStrategicConceptDetail,
} from '../src/flagship-pages.js';
import { routeFromHash } from '../src/react-router.js';

test('every requested page and Bio-Lab concept has a direct route and visible page shell', () => {
  const html = renderFlagshipPlaceholderPages();
  const expectedTitles = [
    'Tactical Shield Membership',
    'Civic Response Auxiliary',
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
  assert.equal(flagshipPageDefinitions.length, 12);
});

test('pending media uses labeled responsive placeholders rather than unapproved imagery', () => {
  const html = renderFlagshipPlaceholderPages();
  assert.equal((html.match(/class="fsd-asset-slot fsd-asset-slot--/g) || []).length, 49);
  assert.match(html, /FSD \/ PERFORMANCE/);
  assert.match(html, /FSD product and editorial imagery/);
  assert.match(html, /Illustrative portal mock-up only; no live member area is available/);
  assert.match(html, /Illustrative training imagery only; no class or provider is confirmed/);
  assert.match(html, /VIEW SMART APPAREL INITIATIVE/);
  assert.match(html, /href="#smart-apparel-nfc"/);
  assert.match(html, /FSD BIO-LAB™ \/ PROPOSED CONCEPT/);
  assert.match(html, /Modular fitness\. Retail\. Education\. Community\./);
  assert.match(html, /href="\/fsd-pods\.html"/);
  assert.doesNotMatch(html, />\s*(?:CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING)\b/i);
  assert.doesNotMatch(html, /<img\b|data:image\//i);
});

test('Innovation Hub links to all concepts and keeps private proofs out of production markup', () => {
  const publicHtml = renderInnovationHubIndex();
  assert.equal((publicHtml.match(/class="fsd-innovation-card"/g) || []).length, 8);
  assert.match(publicHtml, /PROPOSED BIO-LAB CONCEPT/);
  assert.match(publicHtml, /related concepts and design prototypes are for exploration, not current products or commitments/);
  assert.match(publicHtml, /href="#adaptive-technical-fabrics"/);
  assert.doesNotMatch(publicHtml, /__catalogue-preview/);

  const developmentHtml = renderInnovationHubIndex({ includePrivatePreviews: true });
  assert.match(developmentHtml, /\/__catalogue-preview\/fsd-alight\//);
  assert.match(developmentHtml, /\/__catalogue-preview\/fsd-motion\//);
  assert.match(developmentHtml, /\/__catalogue-preview\/fsd-nexus\//);
});

test('seven Bio-Lab concepts retain approved holding copy and per-page evidence status', () => {
  assert.equal(bioLabConceptVerification.length, 7);
  assert.equal(new Set(bioLabConceptVerification.map(record => record.id)).size, 7);

  for (const record of bioLabConceptVerification) {
    assert.ok(record.approvedHoldingCopy, `${record.title} needs holding copy`);
    assert.ok(record.evidenceStatus, `${record.title} needs a recorded evidence status`);
    assert.ok(record.pending.includes('Technical specifications and material composition, including any graphene claim'));
    assert.ok(record.pending.includes('ECG, heart-rate, hydration, thermal, recovery, and other health or biometric claims'));
    assert.ok(record.pending.includes('Compatibility, privacy, security, and data-handling statements where relevant'));
  }

  const html = renderFlagshipPlaceholderPages();
  assert.equal((html.match(/DETAILS PENDING VERIFICATION/g) || []).length, 6);
  assert.match(html, /FSD BIO-LAB™ \/ CONCEPT FOR EXPLORATION/);
  assert.match(html, /Named Bio-Lab concept only/);
  assert.match(html, /proposed Bio-Lab concept exploring possible NFC garment authentication/i);
  assert.match(html, /NFC does not measure biometrics/);
  assert.doesNotMatch(html, /FSD BIO-LAB™ \/ PRODUCT RANGE|FSD PRODUCT · DETAILS/);
  assert.doesNotMatch(html, /<form\b|ADD TO BAG|CHECKOUT|BUY NOW|JOIN NOW/i);
});

test('new page content does not enable membership sign-up, checkout, or unverified claims', () => {
  const html = renderFlagshipPlaceholderPages();
  const partnerships = flagshipPageDefinitions.find(page => page.id === 'performance-linked-partnerships-security');

  assert.match(html, /REGISTRATION NOT OPEN/);
  assert.match(html, /Practical skills\. Greater confidence\. Stronger communities\./);
  assert.match(html, /Online Learning/);
  assert.match(html, /Practical Training/);
  assert.match(html, /Member Support/);
  assert.match(html, /Real-World Relevance/);
  assert.match(html, /POTENTIAL STRATEGIC VALUE/);
  assert.match(html, /04 \/ CONDITIONS BEFORE PROGRESSION/);
  assert.match(html, /Terms, benefits, providers, and access details are unconfirmed/);
  assert.match(html, /NO PARTNER APPLICATION OR SIGN-UP/);
  assert.match(partnerships.summary, /No named partner, facility, written agreement, live testing programme, participation eligibility, or application process is confirmed/);
  assert.match(partnerships.modules.join(' '), /potential apparel and recovery-equipment evaluation/i);
  assert.match(partnerships.modules.join(' '), /written agreements, safety protocols, and participant consent/i);
  assert.match(html, /FSD \/ GLOBAL VISION &amp; OPERATIONS/);
  assert.match(html, /PROPOSED CONCEPT/);
  assert.match(html, /Related concepts and design prototypes are for exploration, not current products or commitments/);
  assert.doesNotMatch(html, /<form\b|ADD TO BAG|CHECKOUT|£\d/i);
  assert.doesNotMatch(html, /partner application form|partnership sign-up form|collect(?:s|ing)? (?:partner|participant) (?:data|details)/i);
  assert.match(html, /Specifications, supporting evidence, and availability are pending verification/);
});

test('Civic Response is a complete proposed page with honest pending imagery', () => {
  const civic = renderStrategicConceptDetail('civic-response-auxiliary');
  assert.match(civic, /Civic Response Auxiliary/);
  assert.match(civic, /No programme, emergency-response service, training schedule, or partnership is represented as available/);
  assert.match(civic, /approved community-preparedness editorial photography is required/i);
  assert.match(civic, /\[ASSET PENDING\]/);
});
