import { SafeImage } from './SafeImage.jsx';

export function WomensBanner() {
  return (
    <section className="fsd-modal-hero fsd-modal-hero--womens">
      <SafeImage
        className="fsd-womens-hero-image"
        src="/fsd-assets/womens-activewear-hero.png"
        alt=""
        aria-hidden="true"
        loading="eager"
        fetchPriority="high"
        fallbackLabel=""
      />
      <div className="fsd-womens-hero-copy">
        <span className="fsd-modal-kicker">FSD APPAREL <span>/</span> WOMEN’S COLLECTION</span>
        <h2>The Performance Edit</h2>
        <p>High-end activewear crafted for ultimate comfort, luxury, and peak performance.</p>
        <button className="fsd-womens-hero-cta" type="button" data-scroll-womens-products>
          Shop Women’s Collection <span aria-hidden="true">↓</span>
        </button>
      </div>
    </section>
  );
}
