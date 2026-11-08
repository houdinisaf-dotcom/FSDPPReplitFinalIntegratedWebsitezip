import { useEffect, useRef, useState } from 'react';
import { SafeImage } from './SafeImage.jsx';
import { siteMedia } from '../data/site-media.js';
import { homeHeroExperiences } from '../data/home-hero-experiences.js';
import approvedFsdShield from '../../brand-review/shield-refined-matte/assets/website-shield-lockup-defence.png';
import { animateElement } from '../motion-runtime.js';

const sceneIdFor = experience => `home-campaign-${experience.id}`;

export function HomeHero({ headingTag = 'h1' }) {
  const Heading = headingTag === 'h2' ? 'h2' : 'h1';
  const [activeExperience, setActiveExperience] = useState(0);
  const headlineRef = useRef(null);
  const sceneRefs = useRef(new Map());
  const previousScene = useRef(homeHeroExperiences[0]?.id);
  const active = homeHeroExperiences[activeExperience];

  useEffect(() => {
    if (previousScene.current === active.id) return;
    previousScene.current = active.id;
    void animateElement(headlineRef.current, {
      opacity: [0.68, 1],
      y: [12, 0],
      filter: ['blur(3px)', 'blur(0px)'],
    }, { duration: 0.42 });
  }, [active.id]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(entries => {
      const visibleScene = entries
        .filter(entry => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
      if (!visibleScene) return;
      const nextIndex = homeHeroExperiences.findIndex(
        experience => sceneIdFor(experience) === visibleScene.target.id,
      );
      if (nextIndex >= 0) setActiveExperience(nextIndex);
    }, { threshold: [0.25, 0.5, 0.7] });

    sceneRefs.current.forEach(scene => observer.observe(scene));
    return () => observer.disconnect();
  }, []);

  const goToScene = index => {
    const experience = homeHeroExperiences[index];
    const target = experience && sceneRefs.current.get(sceneIdFor(experience));
    if (!target) return;
    setActiveExperience(index);
    target.scrollIntoView({
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };

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
    event.currentTarget.querySelector(`[data-hero-theme="${homeHeroExperiences[next].id}"]`)?.focus();
    goToScene(next);
  };

  const renderSceneNavigation = className => (
    <nav
      className={className}
      aria-label={className === 'fsd-home-switcher'
        ? 'Homepage campaign scene navigation'
        : 'Choose a homepage campaign scene'}
      data-sequence={className === 'fsd-home-switcher' ? 'campaigns' : undefined}
      onKeyDown={handleSwitcherKeyDown}
    >
      {homeHeroExperiences.map((experience, index) => (
        <button
          type="button"
          key={experience.id}
          data-hero-theme={experience.id}
          aria-pressed={activeExperience === index}
          aria-current={activeExperience === index ? 'step' : undefined}
          aria-label={`Go to ${experience.label} campaign scene`}
          tabIndex={activeExperience === index ? 0 : -1}
          onClick={() => goToScene(index)}
        >
          <span>{String(index + 1).padStart(2, '0')}</span>
          <strong>{experience.label}</strong>
        </button>
      ))}
    </nav>
  );

  return (
    <>
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
        <div
          className={`fsd-home-hero__campaign-word fsd-home-hero__campaign-word--${active.id}`}
          key={`campaign-word-${active.id}`}
          aria-hidden="true"
        >
          <span>{active.label.replace(/^BE\s+/, '')}</span>
        </div>
        <div className="fsd-home-hero__edition" aria-hidden="true">
          <span className="fsd-home-hero__edition-rule" />
          <span className="fsd-home-hero__edition-index">01 / 04</span>
          <span className="fsd-home-hero__edition-name">{homeHeroExperiences[0].panelTitle}</span>
          <img src={approvedFsdShield} alt="" />
        </div>
        <div className="fsd-phase3-hero__frame" aria-hidden="true">
          <span className="fsd-phase3-hero__frame-line" />
          <span className="fsd-phase3-hero__frame-mark" />
        </div>
        <div className="fsd-phase3-hero__campaign-mark" aria-hidden="true">
          <span>FSD / CAMPAIGN</span>
          <strong>{homeHeroExperiences[0].label}</strong>
          <i>01</i>
        </div>
        <div className="fsd-home-hero__content">
          <p className="fsd-home-kicker"><span /> FITNESS &amp; SELF-DEFENCE</p>
          <p className="fsd-home-theme-label" aria-live="polite">
            <span>{String(activeExperience + 1).padStart(2, '0')}</span>
            {active.label}
          </p>
          <div className="fsd-home-hero__headline-wrap" ref={headlineRef}>
            <Heading id="fsd-home-title">MADE TO MOVE,<br />MADE TO <em>BELONG.</em></Heading>
            <span className="fsd-home-hero__headline-index" aria-hidden="true">01</span>
          </div>
          <p className="fsd-home-intro">Fitness &amp; Self-Defence.<br />A house for those who train with purpose.</p>
          <div className="fsd-home-actions">
            <a className="fsd-home-primary" href={homeHeroExperiences[0].href} data-hero-primary-action>
              {homeHeroExperiences[0].action} <span aria-hidden="true">↗</span>
            </a>
            <a className="fsd-home-secondary" href="/the-house.html">THE HOUSE</a>
          </div>
        </div>
        {renderSceneNavigation('fsd-home-switcher')}
      </section>

      {homeHeroExperiences.map((experience, index) => (
        <section
          className={`fsd-home-campaign-scene fsd-home-campaign-scene--${experience.id}`}
          id={sceneIdFor(experience)}
          key={experience.id}
          ref={node => {
            if (node) sceneRefs.current.set(sceneIdFor(experience), node);
            else sceneRefs.current.delete(sceneIdFor(experience));
          }}
          data-campaign-scene={experience.id}
          aria-labelledby={`${sceneIdFor(experience)}-title`}
        >
          <div className="fsd-home-campaign-scene__image" aria-hidden="true">
            <SafeImage
              src={siteMedia.homeHero?.src}
              alt=""
              placeholderTitle="FSD campaign photography"
              placeholderKind="hero"
              loading="lazy"
              className="fsd-home-campaign-scene__asset"
            />
          </div>
          <div className="fsd-home-campaign-scene__shade" aria-hidden="true" />
          <div className="fsd-home-campaign-scene__index" aria-hidden="true">
            <span>FSD / CAMPAIGN</span>
            <strong>{String(index + 1).padStart(2, '0')}</strong>
            <img src={approvedFsdShield} alt="" />
          </div>
          <div className="fsd-home-campaign-scene__content" data-fsd-reveal>
            <p className="fsd-home-campaign-scene__eyebrow">{experience.panelTitle}</p>
            <h2 id={`${sceneIdFor(experience)}-title`} className="fsd-home-campaign-scene__title">
              {experience.label}
            </h2>
            <p className="fsd-home-campaign-scene__manifesto">MADE TO MOVE,<br />MADE TO <em>BELONG.</em></p>
            <a className="fsd-home-campaign-scene__action" href={experience.href}>
              {experience.action}<span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="fsd-home-campaign-scene__navigation">
            {renderSceneNavigation('fsd-home-campaign-scene__controls')}
          </div>
        </section>
      ))}
    </>
  );
}
