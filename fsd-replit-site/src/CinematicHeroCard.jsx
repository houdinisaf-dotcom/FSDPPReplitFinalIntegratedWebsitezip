import { useEffect, useRef, useState } from 'react';
import './cinematic-hero-card.css';

export function CinematicHeroCard({ onExplore }) {
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;

    if (
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      || !('IntersectionObserver' in window)
    ) {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.12 });

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className={`fsd-cinematic-preview${isVisible ? ' is-visible' : ''}`}
      aria-labelledby="fsd-modest-preview-title"
    >
      <div className="relative w-full max-w-7xl mx-auto px-4 py-8">
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#C8AA72]/10 via-transparent to-[#C8AA72]/5 blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />

        <div
          ref={cardRef}
          className="fsd-cinematic-preview__card relative w-full h-[540px] sm:h-[620px] md:h-[720px] overflow-hidden rounded-xl border border-[rgba(200,170,114,0.2)] bg-[#090A0C] shadow-2xl group"
        >
          <img
            src="/fsd-assets/womens-modest-combat-preview.webp"
            alt="Model wearing a full-length modest training outfit in an illuminated setting."
            className="fsd-cinematic-preview__image w-full h-full object-cover object-[65%_35%] md:object-center transition-transform duration-1000 ease-out group-hover:scale-105"
            loading="lazy"
            decoding="async"
            width="1024"
            height="1536"
          />

          <div
            className="absolute inset-0 bg-gradient-to-t from-[#090A0C] via-[#090A0C]/40 to-transparent"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#090A0C]/70 via-transparent to-transparent"
            aria-hidden="true"
          />

          <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
            <span className="inline-block px-3 py-1 rounded-full bg-[#1A1C20]/80 backdrop-blur-md border border-[rgba(200,170,114,0.3)] font-['Manrope'] text-[10px] tracking-[0.25em] text-[#C8AA72] uppercase">
              01 — Collection Preview
            </span>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 md:p-12 z-20">
            <span className="fsd-cinematic-preview__reveal fsd-cinematic-preview__reveal--one font-['Manrope'] text-xs tracking-[0.3em] text-[#C8AA72] uppercase block mb-3 font-semibold">
              FSD / COLLECTION PREVIEW
            </span>

            <h2
              id="fsd-modest-preview-title"
              className="fsd-cinematic-preview__reveal fsd-cinematic-preview__reveal--two font-['Manrope'] text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#F7F7F5] uppercase tracking-wider mb-4 max-w-2xl leading-tight"
            >
              Women&apos;s Modest Combat
            </h2>

            <p className="fsd-cinematic-preview__reveal fsd-cinematic-preview__reveal--three font-['DM_Sans'] text-sm sm:text-base text-[#8D929B] max-w-xl mb-8 font-normal leading-relaxed">
              Full-coverage performance layers engineered for absolute confidence in motion.
            </p>

            <div className="fsd-cinematic-preview__reveal fsd-cinematic-preview__reveal--four">
              <button
                type="button"
                onClick={onExplore}
                className="group relative inline-flex flex-nowrap items-center justify-center space-x-4 whitespace-nowrap px-5 sm:px-8 py-4 bg-[#1A1C20]/90 backdrop-blur-md border border-[rgba(200,170,114,0.4)] text-[#F7F7F5] font-['Manrope'] text-[10px] sm:text-xs tracking-[0.12em] sm:tracking-[0.2em] uppercase transition-all duration-300 hover:border-[#C8AA72] hover:bg-[#C8AA72]/10 hover:shadow-[0_0_25px_rgba(200,170,114,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C8AA72]"
              >
                <span className="whitespace-nowrap">Explore Collection</span>
                <span className="text-[#C8AA72] transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
