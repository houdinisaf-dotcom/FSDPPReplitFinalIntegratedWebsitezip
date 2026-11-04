import { forwardRef } from 'react';

const VARIANTS = new Set(['primary', 'secondary', 'text']);

export const SiteCTA = forwardRef(function SiteCTA(
  {
    href,
    variant = 'text',
    disabled = false,
    type = 'button',
    className = '',
    children,
    onClick,
    ...props
  },
  ref,
) {
  const safeVariant = VARIANTS.has(variant) ? variant : 'text';
  const classes = ['fsd-cta', `fsd-cta--${safeVariant}`, className].filter(Boolean).join(' ');

  if (href && !disabled) {
    return <a {...props} ref={ref} className={classes} href={href} onClick={onClick}>{children}</a>;
  }

  return (
    <button
      {...props}
      ref={ref}
      className={classes}
      type={type}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
});
