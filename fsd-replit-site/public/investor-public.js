const dataRoom = document.querySelector('#dataroom');
if (dataRoom) {
  const heading = dataRoom.querySelector('h2');
  if (heading) heading.textContent = 'Investor Document Index';
  const note = dataRoom.querySelector('.wrap > p:not(.eyebrow)');
  if (note) note.textContent = 'This index shows the current status of supporting materials. Funding and financial tables are visible on this page; files not linked here are not hosted here.';
}

const accessSection = document.querySelector('#access');
if (accessSection) {
  const heading = accessSection.querySelector('h2');
  if (heading) heading.textContent = 'Public Investor Information';
  const lead = accessSection.querySelector('.wrap > p:not(.eyebrow)');
  if (lead) lead.textContent = 'Funding terms, financial assumptions, downside scenarios, and diligence information are visible in the sections above. No sign-in or access request is required to read this page.';
  accessSection.querySelector('form')?.remove();
}

