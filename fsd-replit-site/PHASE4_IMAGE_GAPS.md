# Catalogue image gaps

The catalogue contains 73 records. Nine have usable mapped standalone images;
64 currently retain named placeholders rather than displaying unapproved boards,
composites, or unrelated photographs. Files may already exist for some records
but still require approval or standalone preparation.

All genuine colour options on the nine records with usable images have a mapped
colour image. This does not certify stock, availability, or final photography.

## Adding approved images

Follow `src/data/IMAGE_CONFIGURATION.md`. Product mappings are in
`src/data/products.js`; hero, collection and banner mappings are in
`src/data/site-media.js`. Public paths correspond to files inside `public/`.
Keep existing product names, sizes and colour labels. Update approval metadata
only when standalone imagery has actually been approved.

## Records still using placeholders

- FSD Ombré Slash Tee
- FSD Contrast-Panel Training Tee
- FSD 280 GSM Combat Tee
- FSD Back-Text Tee
- FSD Laser-Ventilated Training Tank
- FSD 500 GSM Combat Hoodie
- FSD 600 GSM Luxury Hoodie
- FSD Technical Zip Jacket
- FSD Hooded Running Shell
- FSD Cheetah Windrunner
- FSD Vector-Camo Windrunner
- FSD Quilted Technical Gilet
- FSD Spine-Vent Technical Gilet
- FSD Compression Baselayer Set
- FSD Long-Sleeve Performance Training Top
- FSD Strike Men's Training T-Shirt / Short-Sleeve Top
- FSD Performance Joggers
- FSD Aeroforge Training Tee
- FSD Aeroforge Hybrid Short
- FSD Premium Black & Gold Athletic Shorts
- FSD Roadwork Short
- FSD Technical Tracksuit
- FSD Low-Light Reflective Tracksuit
- FSD Gradient Compression Set
- FSD Aeroforge Tech Set (Zip Hoodie & Joggers)
- FSD Tiger-Slash 550 GSM Walkout Hoodie
- FSD Championship Walkout Bomber
- FSD Signature Walkout Jacket
- FSD Signature Boxing Gloves (Pair)
- FSD Curved Coaching Focus Mitts
- FSD Custom Sports Mouthguard & Protective Case
- FSD Forest Green Luxury Boxing Tracksuit & Gear Kit
- FSD Aeroforge Women’s Performance Training Top (Short Sleeve)
- FSD Aeroforge Women’s Performance Top (Long Sleeve)
- FSD Women's Performance Training Leggings
- FSD Strikeflex Women’s Training Trousers
- FSD Performance Sports Hijab
- FSD Flow Running Hijab (Presentation Box Edition)
- FSD Cover Extended-Coverage Sports Hijab
- FSD Aegis Modest Performance Gilet
- FSD Form Women's Modest Training Top
- FSD Titan Adaptive Training Jacket
- FSD Women's Lightweight Modest Training Overshirt
- FSD Modest Flow Training Trousers
- FSD Aeroforge Modest Tunic & Jogger Set
- FSD Precision Barbell Collars (Pair)
- FSD Olympic Bar & 5-Cutout Bumper Plate Set
- FSD COMMAND Gym Bag
- FSD Winter Accessories Set (Beanies and Scarf)
- FSD ALIGN (posture awareness wearable)
- FSD HYDRATE (smart hydration bottle)
- FSD MOTION (smart training apparel)
- FSD NEXUS (smart ring)
- FSD SONIC (training earbuds)
- FSD PULSE (premium step counter)
- FSD Black and Gold Signature Hoodie
- FSD Whalley Range Camo Hoodie & Jogger Set
- FSD AUREUS FORGED CARBON™ SET
- FSD FOUNDATION UTILITY™ SET
- FSD Apex High-Waisted Compression Leggings
- FSD Apex Pro Tactical Gym Backpack
- FSD Scorpion Chitin Tactical Gilet
- FSD Velocity Element Running Shell (Series 1)
- FSD Velocity Element Running Shell (Series 2)

## Regression checks

Run `npm test`, `npm run build`, `npm run test:browser`, and separately
`node tests/browser-image-placeholders.mjs`.
The last check covers broken-image fallback dimensions, missing colour imagery,
size-specific mappings, colour handoff to details, and cart variant/quantity flows.
