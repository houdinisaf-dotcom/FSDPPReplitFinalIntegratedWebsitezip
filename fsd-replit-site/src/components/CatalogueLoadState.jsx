import { Component } from 'react';
import './CatalogueLoadState.css';

export function CatalogueLoading() {
  return <div className="fsd-load-state" role="status" aria-live="polite">
    <img src="/favicon.svg" alt="" width="28" height="28" />
    <p>Preparing your FSD catalogue</p>
    <div className="fsd-load-state__skeletons" aria-hidden="true"><span /><span /><span /></div>
  </div>;
}
export class CatalogueErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('The FSD catalogue could not be loaded.', error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div className="fsd-load-state fsd-load-state--error" role="alert">
      <h3>The catalogue could not be loaded</h3>
      <p>Please check your connection and try again. Your saved shopping bag has not been changed.</p>
      <button type="button" data-catalogue-retry onClick={() => window.location.reload()}>Reload catalogue</button>
    </div>;
  }
}
