# FSD public image configuration

Missing images must never remove a product, collection, banner, hero, or its controls.
The shared placeholder keeps the visual slot available until approved photography is added.

## Products and variants

1. Put approved standalone files in `public/assets/products/`.
2. Update the named product in `imageReferences` in `src/data/products.js`.
3. Each image accepts `src`, `label`, and optional `colourway`, `size`, or `variant`.
   Use the exact colourway and size labels already recorded for the product.
4. The existing `Colourway palette` in `src/master-products.json` also supports an
   `image` path per colourway, with optional `size` or `variant`.
5. Keep image approval metadata accurate. Records marked as composite/contact-sheet
   imagery retain their products and controls but show placeholders rather than boards.

Example:

```js
{ src: '/assets/products/example-black-front.webp',
  label: 'Black / Front', colourway: 'Black' }
{ src: '/assets/products/example-black-xl.webp',
  label: 'Black / XL fit', colourway: 'Black', size: 'XL' }
```

Product colour and size selectors can choose their mapped photographs. A missing
variant photograph shows a named placeholder, not an unrelated colour's photograph.
Normal size-independent photography can be reused across sizes without duplicating files.

## Collection cards, banners and hero images

Edit `src/data/site-media.js`. Use an approved `{ src, alt }` object, or `null`
while an image is unavailable. It contains the home hero, women's banner,
homepage collection cards, and hardware editorial image.

For page-specific visual slots, add a `{ src, alt }` entry in `pageMedia` keyed by
the exact slot title rendered by the page. Existing slot dimensions remain unchanged.
The men's collection uses an approved image from its catalogue first, then its
explicit collection-card mapping.

Public asset paths start with `/` and correspond to files under `public/`.
Keep portrait product photos within their existing 4:5 stages, square thumbnails
within their square stages, and wide banners within their existing responsive stages.
Images are fitted inside these slots; changing a path does not require redesigning them.
No stock-photo substitution or generated product photography is used.
