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
      <section className="showroom-engineering-copy showroom-engineering-copy--hardware" aria-labelledby="hardware-editorial-title">
        <div className="showroom-engineering-copy__masthead">
          <span>FSD / DIVISION 03</span><span>LOAD · PRACTICE · RESET</span>
        </div>
        <p className="section-kicker">03 / FSD HARDWARE <span className="period">/</span> COMBAT SYSTEMS</p>
        <h2 id="hardware-editorial-title">
          ENGINEERED FOR<br />THE DEMANDS OF<br /><span>PERFORMANCE.</span>
        </h2>
        <p className="showroom-engineering-lede">A considered equipment range for strength work, combat practice and recovery. Product details remain subject to the approved catalogue.</p>
        <ol className="showroom-engineering-list">
          <li><span>01 / LOAD</span> Strength equipment · dumbbell collections</li>
          <li><span>02 / PRACTICE</span> Boxing and combat equipment</li>
          <li><span>03 / RESET</span> Recovery equipment</li>
        </ol>
        <button
          className="showroom-engineering-link"
          type="button"
          data-open-hardware
          onClick={onOpenHardware}
        >
          EXPLORE HARDWARE <span aria-hidden="true">↗</span>
        </button>
      <p className="showroom-engineering-copy__footnote">Product-specific approved imagery pending. Product details remain subject to the approved catalogue.</p>
      </section>
      <div className="showroom-engineering-media-wrap">
        <figure className="showroom-engineering-media" data-hardware-media={siteMedia.hardwareFeature?.src ? 'mapped' : 'pending'}>
          <span className="showroom-engineering-media__registration" aria-hidden="true">
            <span>FSD / DIVISION 03</span><span>RANGE STUDY</span>
          </span>
          <HardwareFeatureMedia />
          <figcaption>
            <span>FSD HARDWARE / RANGE OVERVIEW</span>
            <span>PRODUCT-SPECIFIC APPROVED IMAGERY PENDING</span>
          </figcaption>
        </figure>
        <span className="showroom-engineering-media__index" aria-hidden="true">03 / 06</span>
      </div>
    </>
  );
}
