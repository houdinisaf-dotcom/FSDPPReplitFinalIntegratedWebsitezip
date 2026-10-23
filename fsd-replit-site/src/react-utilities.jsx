import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

const socialProfiles = [
  { name: 'Facebook', glyph: 'f' },
  { name: 'Instagram', glyph: '◎' },
  { name: 'TikTok', glyph: '♪' },
  { name: 'YouTube', glyph: '▶' },
  { name: 'LinkedIn', glyph: 'in' },
];

function getSavedTheme() {
  try {
    return window.localStorage.getItem('fsd-theme') === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function ReadingProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
        barRef.current?.style.setProperty('--fsd-reading-progress', String(progress));
      });
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={barRef} className="fsd-reading-progress" aria-hidden="true"><span /></div>;
}

function FooterUtilities({ theme, onToggleTheme }) {
  const openSearch = () => {
    const archive = document.querySelector('#catalogue-archive');
    const search = document.querySelector('#search');
    if (!archive || !search) throw new Error('The FSD product search controls are unavailable.');

    archive.open = true;
    archive.scrollIntoView({
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
    window.setTimeout(() => search.focus({ preventScroll: true }), 180);
  };

  return (
    <div className="fsd-footer-tools flex flex-wrap items-center gap-3" aria-label="Store utilities">
      <button
        className="fsd-react-control inline-flex items-center justify-center px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
        type="button"
        onClick={openSearch}
      >
        Search products
      </button>
      <button
        className="fsd-react-control inline-flex items-center justify-center px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
        type="button"
        aria-pressed={theme === 'dark'}
        onClick={onToggleTheme}
      >
        {theme === 'dark' ? 'Dark mode · on' : 'Dark mode · off'}
      </button>
      <nav className="fsd-social-placeholders flex flex-wrap items-center gap-2" aria-label="Social profile links">
        {socialProfiles.map(({ name, glyph }) => (
          <span
            className="fsd-social-placeholder inline-flex items-center justify-center"
            key={name}
            role="img"
            aria-label={`${name} profile link not configured`}
            title={`${name} profile link not configured`}
          >
            {glyph}
          </span>
        ))}
      </nav>
    </div>
  );
}

export function FSDReactUtilities() {
  const [theme, setTheme] = useState(getSavedTheme);
  const [footerTarget, setFooterTarget] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem('fsd-theme', theme);
    } catch {
      // The current page still follows the selected theme if storage is unavailable.
    }
  }, [theme]);

  useEffect(() => {
    setFooterTarget(document.getElementById('fsd-react-footer-utilities'));
  }, []);

  return (
    <>
      <ReadingProgress />
      {footerTarget && createPortal(
        <FooterUtilities
          theme={theme}
          onToggleTheme={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
        />,
        footerTarget,
      )}
    </>
  );
}
