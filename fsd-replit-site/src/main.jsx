import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const root = document.getElementById('app');
if (!root) throw new Error('FSD storefront root is missing.');

const reactRoot = import.meta.hot?.data?.reactRoot ?? createRoot(root);
if (import.meta.hot) {
  import.meta.hot.dispose(data => {
    data.reactRoot = reactRoot;
  });
}

const hardwareForgeExtensionPromise = import.meta.env.DEV
  ? import('./hardware-forge-development-integration.js')
  : Promise.resolve(null);

hardwareForgeExtensionPromise.then(hardwareForgeExtension => {
  hardwareForgeExtension?.registerHardwareForgeRoute();
  reactRoot.render(<App hardwareForgeExtension={hardwareForgeExtension} />);
});
