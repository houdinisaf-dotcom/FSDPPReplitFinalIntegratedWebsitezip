import { getHousePageRecord } from '../data/house-page-readiness.js';
import './house-page-enrichment.css';

const content = {
  'fight-promotions': {
    format: 'fight-promotion',
    label: 'Exploratory framework',
    title: 'Technical mastery. Discipline. Athletic standards.',
    intro: 'No event, venue, fighter affiliation, or partnership is confirmed.',
    points: [
      ['Technical mastery', 'The framework centres technical craft in combat sport.'],
      ['Athletic standards', 'Discipline and uncompromising athletic standards guide the concept.'],
      ['Sport presentation', 'The concept explores ways to elevate the presentation of combat sports.'],
    ],
    notice: 'Exploratory concept only. No location, event, or service is operational.',
  },
  'live-events': {
    format: 'field-notes',
    label: 'Strategic framework',
    title: 'Staging. Athletic governance. Spectator experience.',
    intro: 'No event date, venue, partner, booking, or service availability is confirmed.',
    points: [
      ['01', 'Staging', 'High-impact event staging is part of the strategic framework.'],
      ['02', 'Athletic governance', 'Strict athletic governance is a central consideration.'],
      ['03', 'Spectator experience', 'A curated spectator experience is being considered.'],
    ],
    notice: '',
  },
  'broadcast-ppv': {
    format: 'broadcast',
    label: 'Media architecture',
    title: 'Production. Fighter storytelling. Stream architecture.',
    intro: 'No broadcast, PPV event, stream, or media partnership is operating or confirmed.',
    points: [
      ['Production', 'High-definition media production is within the initiative framework.'],
      ['Story', 'Fighter storytelling is part of the work in development.'],
      ['Distribution', 'Stream architecture is being considered; no service is available.'],
    ],
    notice: '',
  },
  'athlete-development': {
    format: 'practice',
    label: 'Operating initiative',
    title: 'Training methodologies. Nutritional guidance. Supervised recovery.',
    intro: 'Operating status describes the initiative, not availability at a particular location; no appointment, treatment detail, or outcome is confirmed.',
    points: [
      ['Training', 'Training methodologies are within the initiative scope.'],
      ['Guidance', 'Nutritional guidance forms part of the programme scope.'],
      ['Recovery', 'Supervised recovery protocols include Cryo-Zero and Red Light therapy.'],
    ],
    notice: 'Operating initiative. Specific locations and booking details are not listed here; Cryo-Zero booking details remain pending confirmation.',
  },
  'academy-grassroots': {
    format: 'three-principles',
    label: 'Operating initiative',
    title: 'Community mentorship. Self-defence fundamentals. Youth sports development.',
    intro: 'Operating status describes the initiative; no location, schedule, age-range, or registration details are stated here.',
    points: [
      ['Mentorship', 'Community mentorship.'],
      ['Fundamentals', 'Accessible self-defence training fundamentals.'],
      ['Development', 'Youth sports development.'],
    ],
    notice: '',
  },
  'fsd-pods': {
    format: 'infrastructure',
    label: 'Operating or rollout underway',
    title: 'Modular, transportable infrastructure.',
    intro: 'The initiative is active, but no physical Pod, location, or related service is live.',
    points: [
      ['Training', 'A potential use under consideration.'],
      ['Apparel display', 'Limited apparel display is a potential use.'],
      ['Product testing', 'A potential use under consideration.'],
      ['Community education', 'A potential use under consideration.'],
    ],
    notice: 'No physical Pod, location, or service is live. Any progression remains subject to premises, planning and applicable local permissions, safety, security, insurance, operating model, and local demand.',
  },
  'performance-partnerships': {
    format: 'partnership',
    label: 'Operating or rollout underway',
    title: 'Training facilities. Martial-arts coaches. Representative settings.',
    intro: 'No named facility, coach, written agreement, or live testing programme is confirmed.',
    points: [
      ['Written agreement', 'Any testing would be subject to written agreements.'],
      ['Safety', 'Agreed safety protocols are required.'],
      ['Consent', 'Appropriate participant consent is required.'],
    ],
    notice: '',
  },
  'community-first-aid': {
    format: 'civic',
    label: 'Operating or rollout underway',
    title: 'First aid education. Personal-safety awareness. Practical skills training.',
    intro: 'No training provider, course, venue, or registration is represented as available.',
    points: [
      ['First aid', 'First aid education is within the initiative framework.'],
      ['Awareness', 'Personal-safety awareness is within the initiative framework.'],
      ['Practical skills', 'Practical skills training is within the initiative framework.'],
    ],
    notice: '',
  },
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function makeExpansion(page, spec) {
  const section = element('section', `fsd-house-expansion is-${spec.format}`);
  section.dataset.fsdHouseExpansion = page.id;
  section.setAttribute('aria-labelledby', `${page.id}-expansion-title`);

  const heading = element('div', 'fsd-house-expansion__heading');
  heading.append(
    element('p', 'fsd-house-expansion__label', spec.label),
    element('h2', '', spec.title),
  );
  heading.querySelector('h2').id = `${page.id}-expansion-title`;
  section.append(heading);

  if (spec.intro) {
    section.append(element('p', 'fsd-house-expansion__intro', spec.intro));
  }

  const list = element('div', 'fsd-house-expansion__points');
  spec.points.forEach((point, index) => {
    const item = element('article', 'fsd-house-expansion__point');
    item.dataset.pointIndex = String(index + 1).padStart(2, '0');
    if (spec.format === 'field-notes') {
      item.append(element('span', 'fsd-house-expansion__index', point[0]));
      item.append(element('h3', '', point[1]), element('p', '', point[2]));
    } else if (spec.format === 'broadcast') {
      item.append(element('span', 'fsd-house-expansion__index', `0${index + 1}`));
      item.append(element('h3', '', point[0]), element('p', '', point[1]));
    } else if (spec.format === 'three-principles') {
      item.append(element('span', 'fsd-house-expansion__index', point[0]));
      item.append(element('p', '', point[1]));
    } else if (spec.format === 'infrastructure') {
      item.append(element('span', 'fsd-house-expansion__index', point[0]));
      item.append(element('h3', '', point[0]), element('p', '', point[1]));
    } else if (spec.format === 'partnership') {
      item.append(element('h3', '', point[0]), element('p', '', point[1]));
    } else {
      item.append(element('span', 'fsd-house-expansion__index', `0${index + 1}`));
      item.append(element('h3', '', point[0]), element('p', '', point[1]));
    }
    list.append(item);
  });
  section.append(list);

  if (spec.notice) {
    const notice = element('aside', 'fsd-house-expansion__notice');
    notice.setAttribute('role', 'note');
    notice.append(element('span', '', 'Status boundary'), element('p', '', spec.notice));
    section.append(notice);
  }
  return section;
}

export function mountHousePageEnrichment(pathname = globalThis.location?.pathname) {
  const page = getHousePageRecord(pathname);
  const spec = content[page?.id];
  const main = document.querySelector('main.fsd');
  if (!spec || page.readiness !== 'PUBLIC' || !main || main.querySelector('[data-fsd-house-expansion]')) {
    return () => {};
  }
  const section = makeExpansion(page, spec);
  const footer = main.querySelector('.page-footer');
  if (footer) main.insertBefore(section, footer);
  else main.append(section);
  return () => section.remove();
}
