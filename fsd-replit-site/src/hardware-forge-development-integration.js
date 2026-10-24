import { renderHardwareForgePreview } from './hardware-forge-preview.js';
import './hardware-forge-preview.css';
export { registerHardwareForgeRoute, configureHardwareForgeMenu } from './hardware-forge-development-metadata.js';

export function mountHardwareForgePreview(root) {
  if (!root) return;
  root.innerHTML = renderHardwareForgePreview({ development: true });
}
