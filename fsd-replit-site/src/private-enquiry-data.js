export const PRIVATE_ENQUIRY_CATEGORIES = Object.freeze([
  Object.freeze({
    id: 'strategic-partnerships',
    label: 'Strategic Partnerships',
    description: 'Partnership proposals and joint opportunities.',
  }),
  Object.freeze({
    id: 'investor-corporate-relations',
    label: 'Investor & Corporate Relations',
    description: 'Investor and corporate matters.',
  }),
  Object.freeze({
    id: 'flagship-property-opportunities',
    label: 'Flagship & Property Opportunities',
    description: 'Flagship locations and property proposals.',
  }),
  Object.freeze({
    id: 'brand-collaborations',
    label: 'Brand Collaborations',
    description: 'Potential brand collaborations.',
  }),
  Object.freeze({
    id: 'other-private-business-matters',
    label: 'Other Private Business Matters',
    description: 'Other business enquiries.',
  }),
]);

export const EMPTY_PRIVATE_ENQUIRY = Object.freeze({
  category: '',
  fullName: '',
  organisation: '',
  email: '',
  country: '',
  subject: '',
  details: '',
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const MAX_LENGTHS = Object.freeze({
  fullName: 120,
  organisation: 160,
  email: 254,
  country: 80,
  subject: 160,
  details: 5000,
});

export function validatePrivateEnquiry(values = {}) {
  const errors = {};
  const categoryIsValid = PRIVATE_ENQUIRY_CATEGORIES.some(category => category.id === values.category);
  if (!categoryIsValid) errors.category = 'Choose an enquiry category.';

  const fullName = String(values.fullName ?? '').trim();
  if (fullName.length < 2) errors.fullName = 'Enter your full name.';
  else if (fullName.length > MAX_LENGTHS.fullName) errors.fullName = 'Use 120 characters or fewer.';

  const organisation = String(values.organisation ?? '').trim();
  if (organisation.length > MAX_LENGTHS.organisation) {
    errors.organisation = 'Use 160 characters or fewer.';
  }

  const email = String(values.email ?? '').trim();
  if (!email || !EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';
  else if (email.length > MAX_LENGTHS.email) errors.email = 'Use 254 characters or fewer.';

  const country = String(values.country ?? '').trim();
  if (country.length < 2) errors.country = 'Enter your country.';
  else if (country.length > MAX_LENGTHS.country) errors.country = 'Use 80 characters or fewer.';

  const subject = String(values.subject ?? '').trim();
  if (subject.length < 3) errors.subject = 'Enter a subject.';
  else if (subject.length > MAX_LENGTHS.subject) errors.subject = 'Use 160 characters or fewer.';

  const details = String(values.details ?? '').trim();
  if (details.length < 20) errors.details = 'Add a little more detail (at least 20 characters).';
  else if (details.length > MAX_LENGTHS.details) errors.details = 'Use 5,000 characters or fewer.';

  return errors;
}
