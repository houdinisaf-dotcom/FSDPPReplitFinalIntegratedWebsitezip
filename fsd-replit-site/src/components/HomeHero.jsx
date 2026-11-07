import { useRef, useState } from 'react';
import { SafeImage } from './SafeImage.jsx';
import { siteMedia } from '../data/site-media.js';
import { homeHeroExperiences } from '../data/home-hero-experiences.js';

export function HomeHero({ headingTag = 'h1' }) {
  const Heading = headingTag === 'h2' ? 'h2' : 'h1';
  const [activeExperience, setActiveExperience] = useState(0);
  const switcherRef = useRef(null);
  const active = homeHeroExperiences[activeExperience];

  const handleSwitcherKeyDown = event => {
    const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    const edge = event.key === 'Home' ? 0 : event.key === 'End' ? homeHeroExperiences.length - 1 : -1;
    if (!direction && edge < 0) return;
    event.preventDefault();
    const focusedExperience = homeHeroExperiences.findIndex(
      experience => experience.id === event.target?.dataset?.heroTheme,
    );
    const current = focusedExperience >= 0 ? focusedExperience : activeExperience;
    const next = edge >= 0
      ? edge
      : (current + direction + homeHeroExperiences.length) % homeHeroExperiences.length;
    setActiveExperience(next);
    switcherRef.current?.querySelector(`[data-hero-theme="${homeHeroExperiences[next].id}"]`)?.focus();
  };

  return (
    <section
      className={`fsd-home-hero fsd-phase3-hero fsd-phase3-hero--${active.id}`}
      aria-labelledby="fsd-home-title"
      data-hero-theme={active.id}
    >
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
        <p className="fsd-home-kicker"><span /> FITNESS &amp; SELF-DEFENCE</p>
        <p className="fsd-home-theme-label" aria-live="polite">
          <span>{String(activeExperience + 1).padStart(2, '0')}</span>
          {active.label}
        </p>
        <Heading id="fsd-home-title">MADE TO MOVE,<br />MADE TO <em>BELONG.</em></Heading>
        <p className="fsd-home-intro">Fitness &amp; Self-Defence.<br />A house for those who train with purpose.</p>
        <div className="fsd-home-actions">
          <a className="fsd-home-primary" href={active.href} data-hero-primary-action>
            {active.action} <span aria-hidden="true">↗</span>
          </a>
          <a className="fsd-home-secondary" href="/the-house.html">THE HOUSE</a>
        </div>
      </div>
      <div
        className="fsd-home-switcher"
        ref={switcherRef}
        role="group"
        aria-label="Choose a homepage experience"
        onKeyDown={handleSwitcherKeyDown}
      >
        {homeHeroExperiences.map((experience, index) => (
          <button
            type="button"
            key={experience.id}
            data-hero-theme={experience.id}
            aria-pressed={activeExperience === index}
            aria-label={`Show ${experience.label} homepage experience`}
            onClick={() => setActiveExperience(index)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{experience.label}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
