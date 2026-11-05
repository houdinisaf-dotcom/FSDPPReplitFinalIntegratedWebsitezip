import { useEffect, useState } from 'react';
import { FsdLogo } from '../brand/Logos.jsx';
import './LuxuryEntryOverlay.css';

const EXIT_DURATION_MS = 600;

export function LuxuryEntryOverlay() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setLeaving(true));
    });
    const removalTimer = window.setTimeout(
      () => setVisible(false),
      EXIT_DURATION_MS + 32,
    );

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(removalTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fsd-luxury-entry${leaving ? ' is-leaving' : ''}`}
      data-fsd-luxury-entry
      aria-hidden="true"
    >
      <FsdLogo
        className="fsd-luxury-entry__logo"
        alt=""
        loading="eager"
        decoding="sync"
      />
    </div>
  );
}
