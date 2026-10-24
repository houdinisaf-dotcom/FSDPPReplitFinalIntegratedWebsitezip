import { useEffect, useState } from 'react';

function isSafeAssetPath(src) {
  return typeof src === 'string' && src.startsWith('/') && !src.startsWith('//');
}

export function SafeImage({
  src,
  alt = '',
  className = '',
  placeholder = 'Imagery coming',
  fallbackLabel,
  loading = 'lazy',
  decoding = 'async',
  onError,
  ...imageProps
}) {
  const [failedSource, setFailedSource] = useState(null);
  useEffect(() => {
    setFailedSource(current => (current === src ? current : null));
  }, [src]);

  if (!isSafeAssetPath(src) || failedSource === src) {
    return (
      <div
        className={`fsd-safe-image-fallback flex items-center justify-center bg-gunmetal text-xs uppercase tracking-[0.2em] text-titanium ${className}`.trim()}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : 'true'}
      >
        {fallbackLabel ?? placeholder}
      </div>
    );
  }

  return (
    <img
      {...imageProps}
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={event => {
        setFailedSource(src);
        onError?.(event);
      }}
    />
  );
}
