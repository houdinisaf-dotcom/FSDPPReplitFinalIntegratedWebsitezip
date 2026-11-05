import { createRoot } from 'react-dom/client';
import { PrivateEnquiriesPage } from './components/PrivateEnquiriesPage.jsx';
import './style.css';
import './private-enquiries.css';
import './site-cta.css';
import './site-footer.css';
import './ui-interactions.css';
import './bag.css';

const root = document.getElementById('private-enquiries-root');
if (!root) throw new Error('FSD private enquiries page root is missing.');

createRoot(root).render(<PrivateEnquiriesPage />);
