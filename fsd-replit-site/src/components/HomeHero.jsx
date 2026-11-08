import { useEffect, useRef, useState } from 'react';
import { SafeImage } from './SafeImage.jsx';
import { siteMedia } from '../data/site-media.js';
import { homeHeroExperiences } from '../data/home-hero-experiences.js';
import approvedFsdShield from '../../brand-review/shield-refined-matte/assets/website-shield-lockup-defence.png';
import { loadCampaignScrollRuntime } from '../campaign-scroll-runtime.js';

const sceneIdFor = experience => `home-campaign-${experience.id}`;

export function HomeHero({ headingTag = 'h1' }) {
  const Heading = headingTag === 'h2' ? 'h2' : 'h1';
  const [activeExperience, setActiveExperience] = useState(0);
  const heroRef = useRef(null);
  const sequenceRef = useRef(null);
  const stageRef = useRef(null);
  const sceneRefs = useRef(new Map());
  const scrollTriggerRef = useRef(null);
  const active = homeHeroExperiences[0];

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(entries => {
      const leadHeroIsVisible = entries.some(entry => (
        entry.target === heroRef.current && entry.isIntersecting
      ));
      if (leadHeroIsVisible) {
        if (!sequenceRef.current?.classList.contains('is-pinned')) setActiveExperience(0);
        return;
      }

      const visibleScene = entries
        .filter(entry => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
      if (!visibleScene) return;

      if (sequenceRef.current?.classList.contains('is-pinned')) return;

      const nextIndex = homeHeroExperiences.findIndex(
        experience => sceneIdFor(experience) === visibleScene.target.id,
      );
      if (nextIndex >= 0) setActiveExperience(nextIndex);
    }, { threshold: [0.25, 0.5, 0.7] });

    if (heroRef.current) observer.observe(heroRef.current);
    sceneRefs.current.forEach(scene => observer.observe(scene));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let disposed = false;
    let media = null;

    void loadCampaignScrollRuntime().then(({ gsap, ScrollTrigger }) => {
      if (disposed || !sequenceRef.current || !stageRef.current) return;
      media = gsap.matchMedia();
      media.add({
        desktop: '(min-width: 1024px)',
        motion: '(prefers-reduced-motion: no-preference)',
      }, context => {
        if (!context.conditions.desktop || !context.conditions.motion || navigator.maxTouchPoints > 0) {
          return undefined;
        }
        const sequence = sequenceRef.current;
        const stage = stageRef.current;
        const scenes = homeHeroExperiences
          .map(experience => sceneRefs.current.get(sceneIdFor(experience)))
          .filter(Boolean);
        if (!sequence || !stage || scenes.length !== homeHeroExperiences.length) return undefined;

        const scope = gsap.context(() => {
          const images = scenes.map(scene => scene.querySelector('.fsd-home-campaign-scene__image'));
          const contents = scenes.map(scene => scene.querySelector('.fsd-home-campaign-scene__content'));

          gsap.set(scenes, { autoAlpha: 0 });
          gsap.set(scenes[0], { autoAlpha: 1 });
          gsap.set(images, { scale: 1.12, xPercent: 0 });
          gsap.set(images[0], { scale: 1.025 });
          gsap.set(contents, { autoAlpha: 0, y: 36 });
          gsap.set(contents[0], { autoAlpha: 1, y: 0 });
          sequence.classList.add('is-pinned');

          const timeline = gsap.timeline({
            scrollTrigger: {
              id: 'fsd-home-campaign-sequence',
              trigger: sequence,
              pin: stage,
              start: 'top top',
              end: () => `+=${Math.max(window.innerHeight, 600) * (scenes.length - 1)}`,
              scrub: 0.85,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: self => {
                const nextIndex = Math.min(
                  scenes.length - 1,
                  Math.round(self.progress * (scenes.length - 1)),
                );
                setActiveExperience(current => current === nextIndex ? current : nextIndex);
              },
              onLeaveBack: () => setActiveExperience(0),
              onLeave: () => setActiveExperience(scenes.length - 1),
            },
          });
          scrollTriggerRef.current = timeline.scrollTrigger;

          scenes.forEach((scene, index) => {
            if (index === 0) return;
            const previousScene = scenes[index - 1];
            const start = index - 0.32;
            const image = images[index];
            const content = contents[index];
            const direction = index % 2 ? 2.5 : -2.5;

            timeline.to(previousScene, {
              autoAlpha: 0,
              duration: 0.52,
              ease: 'power2.inOut',
            }, start);
            timeline.fromTo(scene, { autoAlpha: 0 }, {
              autoAlpha: 1,
              duration: 0.48,
              ease: 'power1.out',
            }, start);
            timeline.fromTo(image, {
              scale: 1.12,
              xPercent: direction,
            }, {
              scale: 1,
              xPercent: 0,
              duration: 0.94,
              ease: 'none',
            }, start);
            timeline.fromTo(content, {
              autoAlpha: 0,
              y: 36,
            }, {
              autoAlpha: 1,
              y: 0,
              duration: 0.55,
              ease: 'power2.out',
            }, start + 0.06);
          });

          timeline.to(images[images.length - 1], {
            scale: 1.04,
            duration: 0.45,
            ease: 'none',
          }, scenes.length - 0.34);
        }, sequence);

        ScrollTrigger.refresh();
        return () => {
          scrollTriggerRef.current = null;
          scope.revert();
          sequence.classList.remove('is-pinned');
        };
      });
    }).catch(error => {
      globalThis.console?.error?.('FSD campaign scenes are using their static-flow layout.', error);
    });

    return () => {
      disposed = true;
      media?.revert();
      scrollTriggerRef.current = null;
    };
  }, []);

  const goToScene = index => {
    const experience = homeHeroExperiences[index];
    const target = experience && sceneRefs.current.get(sceneIdFor(experience));
    if (!target) return;
    setActiveExperience(index);

    const trigger = scrollTriggerRef.current;
    if (trigger?.isActive || sequenceRef.current?.classList.contains('is-pinned')) {
      const progress = homeHeroExperiences.length < 2
        ? 0
        : index / (homeHeroExperiences.length - 1);
      window.scrollTo({
        top: trigger.start + (trigger.end - trigger.start) * progress,
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
      return;
    }

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

  const renderSceneNavigation = () => (
    <nav
      className="fsd-home-campaign-sequence__navigation fsd-home-switcher"
      aria-label="Homepage campaign scene navigation"
      data-sequence="campaigns"
      onKeyDown={handleSwitcherKeyDown}
    >
      {homeHeroExperiences.map((experience, index) => (
        <button
          type="button"
          key={experience.id}
          data-hero-theme={experience.id}
          aria-pressed={activeExperience === index}
          aria-current={activeExperience === index ? 'step' : undefined}
          aria-label={`Go to scene ${String(index + 1).padStart(2, '0')}: ${experience.label}`}
          tabIndex={activeExperience === index ? 0 : -1}
          onClick={() => goToScene(index)}
        >
          <span>{String(index + 1).padStart(2, '0')}</span>
          <strong>{experience.label}</strong>
          <i aria-hidden="true" />
        </button>
      ))}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        Scene {String(activeExperience + 1).padStart(2, '0')} of {homeHeroExperiences.length}: {homeHeroExperiences[activeExperience].label}
      </span>
    </nav>
  );

  return (
    <>
      <section
        ref={heroRef}
        className="fsd-home-hero fsd-phase3-hero fsd-phase3-hero--heroes"
        aria-labelledby="fsd-home-title"
        data-hero-theme={homeHeroExperiences[0].id}
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
            <span>01</span>
            {homeHeroExperiences[0].label}
          </p>
          <div className="fsd-home-hero__headline-wrap">
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
      </section>

      <div className="fsd-home-campaign-sequence" ref={sequenceRef}>
        <div className="fsd-home-campaign-sequence__stage" ref={stageRef}>
          {renderSceneNavigation()}
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
              data-scene-active={activeExperience === index ? 'true' : 'false'}
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
              <div className="fsd-home-campaign-scene__content">
                <p className="fsd-home-campaign-scene__eyebrow">{experience.panelTitle}</p>
                <h2 id={`${sceneIdFor(experience)}-title`} className="fsd-home-campaign-scene__title">
                  {experience.label}
                </h2>
                <p className="fsd-home-campaign-scene__manifesto">MADE TO MOVE,<br />MADE TO <em>BELONG.</em></p>
                <a
                  className="fsd-home-campaign-scene__action"
                  href={experience.href}
                  tabIndex={activeExperience === index ? 0 : -1}
                >
                  {experience.action}<span aria-hidden="true">↗</span>
                </a>
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
