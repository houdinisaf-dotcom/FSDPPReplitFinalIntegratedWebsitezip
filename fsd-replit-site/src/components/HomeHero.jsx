import { SafeImage } from './SafeImage.jsx';
import { siteMedia } from '../data/site-media.js';

export function HomeHero({ headingTag = 'h1' }) {
  const Heading = headingTag === 'h2' ? 'h2' : 'h1';

  return (
    <section className="fsd-home-hero fsd-phase3-hero" aria-labelledby="fsd-home-title">
      <div className="fsd-home-hero__image" data-fsd-parallax aria-hidden="true" style={{ backgroundImage: 'none' }}>
        <SafeImage
          src={siteMedia.homeHero?.src}
          alt={siteMedia.homeHero?.alt || 'FSD performance'}
          placeholderTitle="FSD — Made to Move, Made to Belong"
          placeholderKind="hero"
          loading="eager"
          fetchPriority="high"
          className="fsd-home-hero__asset"
        />
      </div>
      <div className="fsd-home-hero__shade" aria-hidden="true" />
      <div className="fsd-phase3-hero__frame" aria-hidden="true">
        <span className="fsd-phase3-hero__frame-line" />
        <span className="fsd-phase3-hero__frame-mark" />
      </div>
      <div className="fsd-home-hero__content">
        <p className="fsd-home-kicker"><span /> 01 / PERFORMANCE / DISCIPLINE / IDENTITY</p>
        <Heading id="fsd-home-title">Made to Move,<br /><em>Made to Belong.</em></Heading>
        <p className="fsd-home-intro">Fitness &amp; Self-Defence.<br />A house for those who train with purpose.</p>
        <div className="fsd-home-actions">
          <a className="fsd-home-primary" href="#universe">
            Explore the collections <span aria-hidden="true">↗</span>
          </a>
        </div>
        <p className="fsd-home-signoff">FSD <span>/</span> FITNESS &amp; SELF-DEFENCE</p>
      </div>
      <p className="fsd-home-caption">MADE TO MOVE <span>—</span> MADE TO BELONG</p>
    </section>
  );
}
