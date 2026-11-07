const PLACEHOLDER_KINDS = new Set(['product', 'collection', 'banner', 'hero', 'gallery', 'detail']);

export function ImagePlaceholder({
  title = 'FSD image',
  variantLabel = '',
  kind = 'product',
  className = '',
  compact = false,
  viewLabel = '',
  style,
}) {
  const safeKind = PLACEHOLDER_KINDS.has(kind) ? kind : 'product';
  const accessibleTitle = [title, viewLabel, variantLabel].filter(Boolean).join(' — ');

  return (
    <span
      className={`fsd-image-placeholder fsd-image-placeholder--${safeKind}${viewLabel ? ' fsd-product-view-placeholder' : ''}${compact ? ' fsd-image-placeholder--compact' : ''}${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={viewLabel
        ? `${accessibleTitle} — IMAGE PENDING`
        : `${accessibleTitle} [ASSET PENDING]`}
      style={style}
    >
      {viewLabel ? (
        <>
          <svg className="fsd-product-view-placeholder__graphic" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
            <path d="M14 9h68v78H14z" fill="none" stroke="currentColor" strokeWidth=".7" opacity=".44" />
            <path d="M23 18h50v60H23z" fill="none" stroke="currentColor" strokeWidth=".55" strokeDasharray="2 4" opacity=".48" />
            <path d="M48 25v46M31 48h34" fill="none" stroke="currentColor" strokeWidth=".65" opacity=".58" />
            <circle cx="48" cy="48" r="13" fill="none" stroke="currentColor" strokeWidth=".65" opacity=".58" />
            <path d="M8 14h8M80 14h8M8 82h8M80 82h8" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
          <span className="fsd-product-view-placeholder__brand">FSD / PRODUCT IMAGE</span>
          <strong className="fsd-product-view-placeholder__view">{viewLabel.toLocaleUpperCase('en-GB')}</strong>
          <small className="fsd-product-view-placeholder__status">IMAGE PENDING</small>
          {variantLabel && <span className="fsd-product-view-placeholder__variant">{variantLabel}</span>}
        </>
      ) : (
        <>
          <span className="fsd-image-placeholder__mark" aria-hidden="true">FSD / {safeKind} media</span>
          <strong className="fsd-image-placeholder__title">{title}</strong>
          {variantLabel && <span className="fsd-image-placeholder__variant">{variantLabel}</span>}
          <small className="fsd-image-placeholder__note">[ASSET PENDING]</small>
        </>
      )}
    </span>
  );
}
