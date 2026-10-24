import { createElement } from 'react';
import { getVerifiedProductSpecifications } from './catalogue-data.js';

const technicalLabels = [
  ['composition', 'Fabric'],
  ['fit', 'Fit profile'],
  ['care', 'Maintenance'],
];

function renderList(items) {
  if (!items.length) return null;
  return createElement(
    'ul',
    { className: 'product-specifications__list' },
    ...items.map((item, index) => createElement(
      'li',
      { key: `${index}-${item}` },
      createElement('span', { 'aria-hidden': 'true' }, '—'),
      createElement('span', null, item),
    )),
  );
}

function renderCard(title, content, key) {
  if (!content) return null;
  return createElement(
    'article',
    { className: 'product-specifications__card', key },
    createElement('h4', null, title),
    content,
  );
}

export function ProductSpecificationsPanel({ specifications }) {
  if (!specifications) return null;
  const cards = [
    renderCard('Material composition', renderList(specifications.materials), 'materials'),
    renderCard('Performance benefits', renderList(specifications.benefits), 'benefits'),
  ];

  const technicalRows = technicalLabels
    .filter(([key]) => specifications.technicalSpecs?.[key])
    .map(([key, label]) => createElement(
      'p',
      { key },
      createElement('strong', null, `${label}: `),
      specifications.technicalSpecs[key],
    ));

  if (technicalRows.length) {
    cards.push(renderCard(
      'Technical details',
      createElement('div', { className: 'product-specifications__technical' }, ...technicalRows),
      'technical',
    ));
  }

  const visibleCards = cards.filter(Boolean);
  if (!visibleCards.length) return null;

  return createElement(
    'section',
    {
      className: 'product-specifications',
      'aria-labelledby': 'catalogue-product-specifications-heading',
    },
    createElement(
      'h3',
      { id: 'catalogue-product-specifications-heading' },
      'ENGINEERING & SPECIFICATIONS',
    ),
    createElement('div', { className: 'product-specifications__grid' }, ...visibleCards),
  );
}

export function ProductSpecificationsView({ productId }) {
  const specifications = getVerifiedProductSpecifications(productId);
  return createElement(ProductSpecificationsPanel, { specifications });
}
