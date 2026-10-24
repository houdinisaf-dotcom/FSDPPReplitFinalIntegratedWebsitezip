import { registerFsdHashRoute } from './react-router.js';

export function registerHardwareForgeRoute() {
  registerFsdHashRoute('#hardware-forge-preview', {
    view: 'page',
    target: 'hardware-forge-preview',
  });
}

export function configureHardwareForgeMenu(menus) {
  const hardware = menus.find(menu => menu.id === 'hardware');
  const strength = hardware?.groups.find(group => group.id === 'strength-equipment');
  if (!strength) return;
  strength.items.push({
    id: 'hardware-forge-review',
    title: 'THE FORGE / COLLECTION REVIEW',
    kind: 'destination',
    href: '#hardware-forge-preview',
    description: 'FSD strength-training equipment and accessories.',
  });
}
