import { useEffect, useState } from 'react';
import { ImagePlaceholder } from './ImagePlaceholder.jsx';

function isSafeAssetPath(src) {
  return typeof src === 'string' && src.startsWith('/') && !src.startsWith('//');
}

export function SafeImage({
  src,
  alt = '',
  className = '',
  placeholder = 'Imagery coming',
  fallbackLabel,
  placeholderTitle,
  variantLabel = '',
  placeholderKind = 'product',
  loading = 'lazy',
  decoding = 'async',
  onError,
  style,
  ...imageProps
}) {
  const [failedSource, setFailedSource] = useState(null);
  useEffect(() => {
    setFailedSource(current => (current === src ? current : null));
  }, [src]);

  if (!isSafeAssetPath(src) || failedSource === src) {
    return (
      <ImagePlaceholder
        title={placeholderTitle || alt?.split(/[—–]/)[0]?.trim() || fallbackLabel || placeholder}
        variantLabel={variantLabel}
        kind={placeholderKind}
        className={className}
        style={style}
      />
    );
  }

  return (
    <img
      {...imageProps}
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      decoding={decoding}
      onError={event => {
        setFailedSource(src);
        onError?.(event);
      }}
    />
  );
}
