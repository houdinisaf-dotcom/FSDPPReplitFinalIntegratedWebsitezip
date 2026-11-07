window.configureFSDInnovationRoutes = (P, M) => {
  const groups = window.FSDInnovationInitiatives;
  if (!groups || !Array.isArray(M) || !P) return;

  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
  const hero = P['global/innovation']?.bn || P.global?.bn || '';
  const activeStatus = 'ACTIVE INITIATIVE · ROLLOUT UNDERWAY';
  const toPage = (item, groupId, kicker) => {
    const capabilities = Array.isArray(item.capabilities) ? item.capabilities : [];
    const body = [
      `<strong>Delivery scope:</strong> ${escape(item.scope)}`,
      ...(capabilities.length ? ['<strong>Functional ecosystem &amp; features:</strong>'] : []),
      `<strong>${escape(item.valueLabel || 'Value pillars')}:</strong> ${item.valuePillars.map(escape).join(' · ')}`,
      `<strong>${escape(item.rolloutLabel || 'Rollout framework')}:</strong> ${item.rollout.map(escape).join(' → ')}`,
    ];
    const noteParts = [
      ...(item.safeguards || []),
      item.note,
      item.statusLabel
        ? 'This is a proposed concept; no unverified owners, partners, locations, operations, or milestone dates are represented.'
        : 'Specific owners, partners, locations and milestone dates are not listed where they have not been supplied.',
    ].filter(Boolean);

    return {
      kicker: item.kicker || kicker,
      title: item.title,
      tag: item.heroSubtitle
        ? `${escape(item.heroSubtitle)}<br><span style="font-size:14px;color:#ddd">${escape(item.summary)}</span>`
        : escape(item.summary),
      status: item.statusLabel || activeStatus,
      body,
      bul: capabilities.length
        ? capabilities.map(capability => `<strong>${escape(capability.title)}:</strong> ${escape(capability.description)}`)
        : item.safeguards.map(escape),
      note: noteParts.map(escape).join(' · '),
      gid: groupId,
      group: false,
      bn: hero,
    };
  };
  const toGroupPage = (groupId, title, kicker, items, summary) => ({
    kicker,
    title,
    tag: 'Initiatives and proposed concepts',
    status: 'INDIVIDUAL STATUS SHOWN ON EACH PAGE',
    body: [escape(summary)],
    bul: items.map(item => `<strong>${escape(item.title)}</strong> — ${escape(item.summary)}`),
    note: 'Each page states its own status and availability; no unverified operations or partnerships are implied.',
    gid: groupId,
    group: true,
    subs: items.map(item => [item.id, item.title, item.summary]),
    bn: hero,
  });
  const addGroup = (groupId, menuTitle, index, title, kicker, items, summary) => {
    const record = toGroupPage(groupId, title, kicker, items, summary);
    P[groupId] = record;
    M.splice(index, 0, [
      groupId,
      String(index + 1).padStart(2, '0'),
      menuTitle,
      items.map(item => [item.id, item.title]),
    ]);
    for (const item of items) {
      P[`${groupId}/${item.id}`] = toPage(item, groupId, kicker);
    }
  };

  const globalMenu = M.find(group => group[0] === 'global');
  const existingInnovation = globalMenu?.[3]?.find(item => item[0] === 'innovation');
  if (globalMenu) globalMenu[2] = 'Global Vision & Operations';
  const legacyPartnershipMenu = M.find(group => group[0] === 'partnerships');
  if (legacyPartnershipMenu) legacyPartnershipMenu[2] = 'Partnerships & Security';
  if (P.partnerships) P.partnerships.title = 'Partnerships & Security';
  if (existingInnovation) {
    existingInnovation[1] = 'Innovation & Operations';
    existingInnovation[2] = 'Proposed infrastructure concepts.';
  }

  const globalInitiatives = groups.global || [];
  if (P.global) {
    P.global.title = 'Global Vision & Operations';
    P.global.tag = 'Proposed infrastructure concepts.';
    P.global.status = 'STRATEGIC CONCEPTS · NOT OPERATIONAL';
    P.global.body = ['Proposed concepts covering modular retail, demand-informed stock planning, mobile testing, local production, and long-horizon research.'];
    P.global.bul = globalInitiatives.map(item => `<strong>${escape(item.title)}</strong> — ${escape(item.summary)}`);
    P.global.note = 'No operating locations, partners, or milestone dates are represented as confirmed.';
  }
  if (globalMenu && Array.isArray(globalMenu[3])) {
    for (const item of globalInitiatives) {
      if (!globalMenu[3].some(entry => entry[0] === item.id)) {
        globalMenu[3].push([item.id, item.title, item.summary]);
      }
      P[`global/${item.id}`] = toPage(item, 'global', 'FSD / GLOBAL VISION & OPERATIONS');
    }
  }

  const globalOverview = P['global/innovation'];
  if (globalOverview) {
    globalOverview.kicker = 'FSD / GLOBAL VISION & OPERATIONS';
    globalOverview.title = 'Innovation & Operations';
    globalOverview.tag = 'Proposed infrastructure concepts.';
    globalOverview.status = 'STRATEGIC CONCEPTS · NOT OPERATIONAL';
    globalOverview.body = [
      'FSD Global Vision maps proposed concepts for modular retail, demand-informed stock planning, mobile testing, and local production.',
      `<strong>Rollout framework:</strong> ${globalInitiatives.map(item => `${escape(item.title)} — ${item.rollout.map(escape).join(' → ')}`).join(' | ')}`,
    ];
    globalOverview.bul = globalInitiatives.map(item =>
      `<strong>${escape(item.title)}</strong> — ${escape(item.summary)} Value pillars: ${item.valuePillars.map(escape).join(' · ')}`);
    globalOverview.note = 'No owners, partners, operating locations, or milestone dates are represented as confirmed.';
  }

  const bioLab = groups.bioLab || [];
  const community = groups.community || [];
  addGroup(
    'bio-lab',
    'Bio-Lab™ / Materials & Connected Apparel',
    Math.max(0, M.findIndex(group => group[0] === 'partnerships')),
    'Bio-Lab™ Initiatives',
    'FSD BIO-LAB™ / MATERIAL SCIENCE & CONNECTED APPAREL',
    bioLab,
    'Material science, connected apparel, and responsible personalisation research frameworks.',
  );
  addGroup(
    'community',
    'Community & Culture',
    Math.max(0, M.findIndex(group => group[0] === 'global')),
    'The House & Universe / Community & Culture',
    'FSD / THE HOUSE & UNIVERSE',
    community,
    'Social impact, community resilience, creator workshops and sustainable reuse frameworks.',
  );

  M.forEach((group, index) => { group[1] = String(index + 1).padStart(2, '0'); });
};
