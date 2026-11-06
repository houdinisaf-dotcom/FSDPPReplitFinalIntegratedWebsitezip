const questions = Object.freeze([
  {
    question: 'What does FSD stand for?',
    answer: 'FSD stands for Fitness &amp; Self-Defence.',
  },
  {
    question: 'Where can I browse the collections?',
    answer: 'Use SHOP in the main navigation, or browse the collection panels on this page.',
    link: { href: '#collections', label: 'Browse collections' },
  },
  {
    question: 'Where can I check product options and availability?',
    answer: 'Each product page shows its listed options and current purchase status. Add to Bag appears only when the product details and stock are confirmed.',
  },
  {
    question: 'Can I book membership or training here?',
    answer: 'This website does not currently accept membership, training, or club bookings.',
  },
]);

export function renderHomepageFaq() {
  const entries = questions.map((entry, index) => `
    <details class="fsd-home-faq__item">
      <summary>
        <span class="fsd-home-faq__index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
        <span>${entry.question}</span>
        <span class="fsd-home-faq__toggle" aria-hidden="true"></span>
      </summary>
      <div class="fsd-home-faq__answer">
        <p>${entry.answer}</p>
        ${entry.link ? `<a href="${entry.link.href}">${entry.link.label} <span aria-hidden="true">↗</span></a>` : ''}
      </div>
    </details>`).join('');

  return `<section class="fsd-home-faq" id="fsd-home-faq" aria-labelledby="fsd-home-faq-title">
    <header class="fsd-home-faq__intro">
      <p class="fsd-home-faq__eyebrow">FSD / QUICK ANSWERS</p>
      <h2 id="fsd-home-faq-title">FREQUENTLY<br/><em>ASKED.</em></h2>
      <p>Clear information about the current site, product options, and what is available today.</p>
    </header>
    <div class="fsd-home-faq__list">${entries}</div>
  </section>`;
}
