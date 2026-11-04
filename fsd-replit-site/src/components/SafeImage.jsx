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
  mobileSrc,
  mobileMedia = '(max-width: 760px)',
  loading = 'lazy',
  decoding = 'async',
  onError,
  style,
  ...imageProps
}) {
  const [failedSource, setFailedSource] = useState(null);
  useEffect(() => {
    setFailedSource(null);
  }, [src, mobileSrc]);

  const hasMobileSource = isSafeAssetPath(mobileSrc);
  const mobileSourceUrl = hasMobileSource && typeof document !== 'undefined'
    ? new URL(mobileSrc, document.baseURI).href
    : mobileSrc;
  const mobileSourceFailed = hasMobileSource && failedSource === mobileSourceUrl;
  const desktopSourceFailed = failedSource === src;

  if (!isSafeAssetPath(src) || desktopSourceFailed) {
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

  const image = (
    <img
      {...imageProps}
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      decoding={decoding}
      onError={event => {
        const failedMobileSource = hasMobileSource
          && event.currentTarget.currentSrc === mobileSourceUrl;
        if (failedMobileSource) {
          setFailedSource(mobileSourceUrl);
          return;
        }
        setFailedSource(src);
        onError?.(event);
      }}
    />
  );
  if (!hasMobileSource || mobileSourceFailed) return image;
  return (
    <picture>
      <source media={mobileMedia} srcSet={mobileSrc} />
      {image}
    </picture>
  );
}
