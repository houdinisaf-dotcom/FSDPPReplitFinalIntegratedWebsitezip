export function HomeHero() {
  return (
    <section className="fsd-home-hero" aria-labelledby="fsd-home-title">
      <div className="fsd-home-hero__image" data-fsd-parallax aria-hidden="true" />
      <div className="fsd-home-hero__shade" aria-hidden="true" />
      <div className="fsd-home-hero__content">
        <p className="fsd-home-kicker"><span /> PERFORMANCE / DISCIPLINE / IDENTITY</p>
        <h1 id="fsd-home-title">Made to Move,<br /><em>Made to Belong.</em></h1>
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
