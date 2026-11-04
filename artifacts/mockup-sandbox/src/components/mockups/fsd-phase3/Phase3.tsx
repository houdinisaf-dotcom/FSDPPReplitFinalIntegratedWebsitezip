import { useState } from 'react';
import './_group.css';
import './Phase3.css';

const heroImage = '/__mockup/images/fsd-home-hero.webp';

export function Phase3() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section className="fsd-home-hero fsd-phase3-hero" aria-labelledby="fsd-home-title">
      <div className="fsd-home-hero__image fsd-phase3-hero__image" aria-hidden="true">
        {!imageFailed && (
          <img
            src={heroImage}
            alt=""
            className="fsd-home-hero__asset"
            loading="eager"
            fetchPriority="high"
            onError={() => setImageFailed(true)}
          />
        )}
        {imageFailed && (
          <span className="fsd-home-image-fallback">
            <span>FSD / hero media</span>
            <strong>FSD — Made to Move, Made to Belong</strong>
            <small>Image to be added</small>
          </span>
        )}
      </div>
      <div className="fsd-home-hero__shade fsd-phase3-hero__shade" aria-hidden="true" />
      <div className="fsd-phase3-hero__frame" aria-hidden="true">
        <span className="fsd-phase3-hero__frame-line" />
        <span className="fsd-phase3-hero__frame-mark" />
      </div>
      <div className="fsd-home-hero__content fsd-phase3-hero__content">
        <p className="fsd-home-kicker"><span /> PERFORMANCE / DISCIPLINE / IDENTITY</p>
        <h1 id="fsd-home-title">Made to Move,<br /><em>Made to Belong.</em></h1>
        <p className="fsd-home-intro">Fitness &amp; Self-Defence.<br />A house for those who train with purpose.</p>
        <div className="fsd-home-actions">
          <a className="fsd-home-primary fsd-phase3-hero__cta" href="#universe">
            Explore the collections <span aria-hidden="true">↗</span>
          </a>
        </div>
        <p className="fsd-home-signoff">FSD <span>/</span> FITNESS &amp; SELF-DEFENCE</p>
      </div>
      <p className="fsd-home-caption fsd-phase3-hero__caption">MADE TO MOVE <span>—</span> MADE TO BELONG</p>
    </section>
  );
}
