# FSD House editorial layer

Shared presentation helpers for existing House editorial routes. The module is
opt-in and only changes host-page styling hooks; existing route content,
navigation, and FSD marks remain owned by the host.

## Integration

The existing standalone-page runtime mounts the editorial helper on the House
routes after each page's own content has rendered. It also checks the central
House page readiness registry and adds the internal review ribbon only for
`NOT_READY` pages in development.

For another House route, import `mountHouseEditorial` from
`src/house-pages/house-editorial.js` and call it after the page DOM is available:

```js
mountHouseEditorial({
  root: document,
  development: import.meta.env.DEV,
});
```

The runtime scopes the design layer to the opted-in page and styles each page's
existing markup without requiring identical section structures. The original
FSD charcoal and champagne-gold palette is retained, with Newsreader display
type, DM Sans reading text, and IBM Plex Mono for editorial metadata.

## Approved media

Use `mountApprovedHouseMedia({ hero, desktop, mobile, caption })` with only
approved assets. Each source is `{ src, alt, position }`; `position` is an
optional CSS focal position such as `62% 40%`. A source without meaningful alt
text is rejected. Mobile artwork is an optional `<picture>` source. With no
approved source, nothing is rendered in the public page.

Alternatively, declare an empty host slot with `data-fsd-house-media-slot`,
`data-desktop-src`, and `data-desktop-alt`, plus optional mobile, focal, and
caption attributes, then call `mountDeclaredHouseMedia(document)`.

Missing approved media may be documented internally by passing a
development-only `reviewSlots` entry to `mountHouseEditorial`, for example
`{ target: '.hero', label: 'Founder hero asset awaiting internal approval' }`.
These notes are created only when `development` is true and are never rendered
as customer-facing placeholders.

## Draft state

The internal ribbon appears only when both `development: true` is passed and
the host explicitly sets `data-fsd-status="NOT READY"` (or
`data-fsd-draft-status="NOT READY"`) on the root, body, or document element.
No page is inferred to be a draft.

The publication registry is in `src/data/house-page-readiness.js`. The
route-by-route review and remaining approvals are in `HOUSE-PAGE-AUDIT.md`.
