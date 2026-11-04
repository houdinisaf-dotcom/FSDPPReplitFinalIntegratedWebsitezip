import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EMPTY_PRIVATE_ENQUIRY,
  PRIVATE_ENQUIRY_CATEGORIES,
  validatePrivateEnquiry,
} from '../src/private-enquiry-data.js';

test('private enquiry categories match the approved five and exclude Fight Promotions', () => {
  assert.deepEqual(
    PRIVATE_ENQUIRY_CATEGORIES.map(({ label }) => label),
    [
      'Strategic Partnerships',
      'Investor & Corporate Relations',
      'Flagship & Property Opportunities',
      'Brand Collaborations',
      'Other Private Business Matters',
    ],
  );
  assert.equal(
    PRIVATE_ENQUIRY_CATEGORIES.some(({ label }) => /fight promotions/i.test(label)),
    false,
  );
});

test('private enquiry validation requires valid core details and preserves optional organisation', () => {
  assert.deepEqual(validatePrivateEnquiry(EMPTY_PRIVATE_ENQUIRY), {
    category: 'Choose an enquiry category.',
    fullName: 'Enter your full name.',
    email: 'Enter a valid email address.',
    country: 'Enter your country.',
    subject: 'Enter a subject.',
    details: 'Add a little more detail (at least 20 characters).',
  });

  const complete = {
    ...EMPTY_PRIVATE_ENQUIRY,
    category: 'strategic-partnerships',
    fullName: 'Alex Example',
    email: 'alex@example.com',
    country: 'United Kingdom',
    subject: 'Partnership proposal',
    details: 'I would like to discuss a potential strategic partnership with FSD.',
  };
  assert.deepEqual(validatePrivateEnquiry(complete), {});
});

test('private enquiry validation rejects malformed email and excessive field lengths', () => {
  const errors = validatePrivateEnquiry({
    category: 'brand-collaborations',
    fullName: 'A'.repeat(121),
    organisation: 'O'.repeat(161),
    email: 'not-an-email',
    country: 'C'.repeat(81),
    subject: 'S'.repeat(161),
    details: 'D'.repeat(5001),
  });
  assert.equal(errors.fullName, 'Use 120 characters or fewer.');
  assert.equal(errors.organisation, 'Use 160 characters or fewer.');
  assert.equal(errors.email, 'Enter a valid email address.');
  assert.equal(errors.country, 'Use 80 characters or fewer.');
  assert.equal(errors.subject, 'Use 160 characters or fewer.');
  assert.equal(errors.details, 'Use 5,000 characters or fewer.');
});
