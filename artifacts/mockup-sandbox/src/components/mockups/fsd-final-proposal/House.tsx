import './_group.css';
import { ProposalFooter, ProposalHeader } from './_shared/ProposalShell';

type HouseItem = { title: string; href: string; gated?: boolean; status: string; disclosure: string };
type HouseGroup = { title: string; status: string; summary: string; items: HouseItem[] };
const groups: HouseGroup[] = [
  { title: 'OUR STORY', status: 'EDITORIAL / FOUNDER STORY', summary: 'Founder Story.', items: [{ title: 'Founder Story', href: '/story', gated: true, status: 'GATED', disclosure: 'Founder biography and replacement copy require verification.' }] },
  { title: 'FLAGSHIPS', status: 'CONTENT PENDING', summary: 'No approved location, operator, or service details are available for public use.', items: [
    ...[['Dublin', 'dublin'], ['Belfast', 'belfast'], ['Manchester', 'manchester'], ['Islamabad', 'islamabad'], ['Future Global Locations', 'future-global-locations']].map(([title, slug]) => ({ title, href: `/flagships/${slug}.html`, gated: true, status: 'GATED', disclosure: 'No approved location, operator, or service details are available for public use.' })),
  ] },
  { title: 'FIGHT PROMOTIONS', status: 'CONCEPTS / INITIATIVES', summary: 'Promotional concepts and initiatives retain their individual source disclosures.', items: [
    { title: 'Professional Fight Promotions', href: '/fight-promotions.html', status: 'CONCEPT', disclosure: 'Exploratory concept only. No event, location, or service is represented as operational.' },
    { title: 'Live Events', href: '/live-events.html', status: 'STRATEGIC', disclosure: 'Strategic initiative; not yet operational. No FSD location, event, or service is represented as live.' },
    { title: 'Broadcast & PPV', href: '/broadcast-ppv.html', status: 'STRATEGIC', disclosure: 'Strategic initiative; not yet operational. No FSD broadcast, PPV event, or service is represented as live.' },
    { title: 'Athlete Development', href: '/athlete-development.html', status: 'INITIATIVE', disclosure: 'Operating initiative covering athlete development and supervised recovery. No location or booking details are published here.' },
    { title: 'Academy & Grassroots Programmes', href: '/academy-grassroots.html', status: 'INITIATIVE', disclosure: 'Operating initiative supporting community mentorship and youth development. No schedule or registration details are published here.' },
  ] },
  { title: 'GLOBAL VISION & OPERATIONS', status: 'ACTIVE INITIATIVES / NOT OPERATIONAL', summary: 'The source descriptions distinguish active initiatives from live services and locations.', items: [
    { title: 'FSD Pods', href: '/fsd-pods.html', status: 'INITIATIVE', disclosure: 'Operating initiative developing modular, transportable training, retail, and community-learning infrastructure. No pod or location is currently operational.' },
    { title: 'Autonomous Pop-Ups & Predictive Stock', href: '/autonomous-popups.html', status: 'INITIATIVE', disclosure: 'Staffed flexible retail and demand-informed stock planning. No venue or stock service is live; “autonomous” refers to planning, not unstaffed or cashier-less retail.' },
    { title: 'Mobile Testing Labs', href: '/mobile-testing-labs.html', status: 'INITIATIVE', disclosure: 'Active initiative for mobile trials and consent-based feedback. No unit, venue, test, or data collection is live; biometric sensor tracking is not in confirmed scope.' },
    { title: 'Local Micro-Manufacturing', href: '/local-micro-manufacturing.html', status: 'INITIATIVE', disclosure: 'Active initiative assessing small-batch production. No partner, hub, site, or custom-order service is live; environmental benefits are not verified.' },
    { title: 'Genetic & Microbiome Personalisation', href: '/genetic-microbiome.html', status: 'INITIATIVE', disclosure: 'Long-horizon research with strict scientific and privacy gates. No testing, sample collection, data analysis, or personalised health guidance is available; no clinical partner is confirmed.' },
    { title: 'Security Provisions', href: '/security-vision.html', status: 'STRATEGIC', disclosure: 'Proposed event and venue security expansion. Not an active tender; deployment depends on corporate, licensing, insurance, and legal conditions.' },
  ] },
  { title: 'INVESTOR RELATIONS', status: 'CONTENT PENDING', summary: 'No public investor dossier is currently available.', items: [{ title: 'Investor Relations', href: '/investor.html', gated: true, status: 'GATED', disclosure: 'UK legal review and proposed investor figures remain outstanding.' }] },
  { title: 'COMMUNITY & CULTURE', status: 'INITIATIVES / DETAILS LIMITED', summary: 'Active House & Universe initiatives across co-creation, partnerships, reuse, and community safety.', items: [
    { title: 'Community Co-Creation', href: '/community-co-creation.html', status: 'INITIATIVE', disclosure: 'Operating initiative for structured feedback and co-creation. No workshops, trials, forums, portal, or submissions are open.' },
    { title: 'Performance-Linked Partnerships', href: '/performance-partnerships.html', status: 'INITIATIVE', disclosure: 'Operating partnership initiative. No specific partner or live testing programme is identified here.' },
    { title: 'Circular Trade-In Programme', href: '/circular-trade-in.html', status: 'INITIATIVE', disclosure: 'Operating circularity initiative assessing inspection, repair, reuse, resale, and recycling pathways. No trade-ins, eligibility, or credit terms are available.' },
    { title: 'Community First Aid & Safety Skills', href: '/community-first-aid.html', status: 'INITIATIVE', disclosure: 'Civic-resilience initiative covering first aid and personal-safety awareness. No provider or training programme is confirmed here.' },
  ] },
];
export function House() {
  return <main className="ffp-page"><ProposalHeader />
    <section className="ffp-house" id="the-house">
      <header className="ffp-house__intro"><p className="ffp-overline">FSD / THE HOUSE</p><h1>THE HOUSE</h1><p>The story, community initiatives, Bio-Lab, and active FSD Global programmes.</p></header>
      <div className="ffp-house__divisions">{groups.map((group) => <article key={group.title} className="ffp-house__division"><h2>{group.title}<span>{group.status}</span></h2><p>{group.summary}</p><ul>{group.items.map((item) => <li key={item.title}><div>{item.gated ? <span className="is-gated">{item.title}</span> : <a href={item.href}>{item.title}</a>}<p>{item.disclosure}</p></div><small>{item.status}</small></li>)}</ul></article>)}</div>
    </section><ProposalFooter />
  </main>;
}
