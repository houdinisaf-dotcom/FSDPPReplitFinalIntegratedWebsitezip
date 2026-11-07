import { siteMedia } from '../data/site-media.js';

function HardwareFeatureMedia() {
  const feature = siteMedia.hardwareFeature;

  if (!feature?.src) {
    return (
      <span className="fsd-image-placeholder fsd-image-placeholder--banner showroom-engineering-image"
        role="img" aria-label="FSD Hardware [ASSET PENDING]">
        <span className="fsd-image-placeholder__mark" aria-hidden="true">FSD / banner media</span>
        <strong className="fsd-image-placeholder__title">FSD Hardware</strong>
        <small className="fsd-image-placeholder__note">[ASSET PENDING]</small>
      </span>
    );
  }

  return (
    <img
      className="showroom-engineering-image"
      src={feature.src}
      alt={feature.alt}
      data-fsd-image-fallback="true"
      data-fsd-image-title="FSD Hardware"
      data-fsd-image-kind="banner"
      loading="lazy"
      fetchPriority="low"
      width="1050"
      height="960"
    />
  );
}

export function HardwareEditorialSection({ onOpenHardware }) {
  return (
    <>
      <div className="showroom-engineering-copy">
        <p className="section-kicker">03 / FSD HARDWARE <span className="period">/</span> COMBAT SYSTEMS</p>
        <h2 id="hardware-editorial-title">
          ENGINEERED FOR<br />THE DEMANDS OF<br /><span>PERFORMANCE.</span>
        </h2>
        <p>Equipment that earns its place in your training.</p>
        <ol className="showroom-engineering-list">
          <li><span>01</span> Strength equipment · dumbbell collections</li>
          <li><span>02</span> Boxing and combat equipment</li>
          <li><span>03</span> Recovery equipment</li>
        </ol>
        <button
          className="showroom-engineering-link"
          type="button"
          data-open-hardware
          onClick={onOpenHardware}
        >
          EXPLORE HARDWARE <span aria-hidden="true">↗</span>
        </button>
      </div>
      <figure className="showroom-engineering-media">
        <HardwareFeatureMedia />
        <figcaption>
          <span>FSD HARDWARE / PRODUCT PRESENTATION</span>
          <span>APPROVED IMAGERY PENDING</span>
        </figcaption>
      </figure>
    </>
  );
}
