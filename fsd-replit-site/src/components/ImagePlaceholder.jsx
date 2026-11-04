const PLACEHOLDER_KINDS = new Set(['product', 'collection', 'banner', 'hero', 'gallery', 'detail']);

export function ImagePlaceholder({
  title = 'FSD image',
  variantLabel = '',
  kind = 'product',
  className = '',
  compact = false,
  style,
}) {
  const safeKind = PLACEHOLDER_KINDS.has(kind) ? kind : 'product';
  const accessibleTitle = [title, variantLabel].filter(Boolean).join(' — ');

  return (
    <span
      className={`fsd-image-placeholder fsd-image-placeholder--${safeKind}${compact ? ' fsd-image-placeholder--compact' : ''}${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={`${accessibleTitle} image placeholder`}
      style={style}
    >
      <span className="fsd-image-placeholder__mark" aria-hidden="true">FSD / {safeKind} media</span>
      <strong className="fsd-image-placeholder__title">{title}</strong>
      {variantLabel && <span className="fsd-image-placeholder__variant">{variantLabel}</span>}
      <small className="fsd-image-placeholder__note">Image to be added</small>
    </span>
  );
}
