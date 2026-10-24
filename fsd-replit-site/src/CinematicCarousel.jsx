import { useCallback, useEffect, useRef, useState } from 'react';
import { featuredProducts } from './showroom-sections.js';
import { priceInfo } from './catalogue-data.js';
import './cinematic-carousel.css';

export function CinematicCarousel() {
  const trackRef = useRef(null);
  const [scrollState, setScrollState] = useState({
    canScrollPrevious: false,
    canScrollNext: false,
  });

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const nextState = {
      canScrollPrevious: track.scrollLeft > 2,
      canScrollNext: track.scrollLeft + track.clientWidth < track.scrollWidth - 2,
    };
    setScrollState(previous => (
      previous.canScrollPrevious === nextState.canScrollPrevious
      && previous.canScrollNext === nextState.canScrollNext
        ? previous
        : nextState
    ));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    updateScrollState();
    track.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState, { passive: true });

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateScrollState);
    resizeObserver?.observe(track);

    return () => {
      track.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
      resizeObserver?.disconnect();
    };
  }, [updateScrollState]);

  const scroll = direction => {
    const track = trackRef.current;
    if (!track) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    track.scrollBy({
      left: direction * track.clientWidth * 0.8,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  const handleTrackKeyDown = event => {
    if (event.target !== event.currentTarget) return;
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    scroll(event.key === 'ArrowRight' ? 1 : -1);
  };

  return (
    <div className="fsd-featured-carousel">
      <header className="fsd-featured-carousel__heading">
        <div>
          <p className="section-kicker">CURATED ARCHITECTURE</p>
          <h2 id="featured-title">Flagship Collections &amp; Gear</h2>
        </div>
        <div className="showroom-carousel-controls">
          <button
            type="button"
            data-feature-prev
            aria-label="Scroll to previous featured products"
            disabled={!scrollState.canScrollPrevious}
            onClick={() => scroll(-1)}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            data-feature-next
            aria-label="Scroll to next featured products"
            disabled={!scrollState.canScrollNext}
            onClick={() => scroll(1)}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </header>

      <div
        ref={trackRef}
        className="fsd-featured-track"
        role="region"
        aria-label="Featured FSD products; swipe or use the arrow buttons"
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={handleTrackKeyDown}
      >
        {featuredProducts.map((product, index) => {
          const price = priceInfo(product);
          const colourways = (product.colourways || '')
            .split(';')
            .map(colourway => colourway.trim())
            .filter(Boolean)
            .join(' · ');

          return (
            <article
              className="fsd-featured-card"
              key={product.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`Product ${index + 1} of ${featuredProducts.length}`}
            >
              <div className="fsd-featured-card__meta">
                <span>{product.category}</span>
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              </div>

              <div className="fsd-featured-card__main">
                <p className="fsd-featured-card__audience">{product.audience}</p>
                <h3>{product.name}</h3>
              </div>

              {colourways && (
                <div className="fsd-featured-card__colourways">
                  <p className="fsd-featured-card__label">Colourways</p>
                  <p>{colourways}</p>
                </div>
              )}

              <div className="fsd-featured-card__footer">
                <p className="fsd-featured-card__price">
                  <span>RRP</span>
                  <strong>{price.value}</strong>
                </p>
                <button className="fsd-featured-card__details" type="button" data-product={product.id}>
                  <span>View details</span>
                  <span aria-hidden="true">↗</span>
                  <span className="sr-only"> for {product.name}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
