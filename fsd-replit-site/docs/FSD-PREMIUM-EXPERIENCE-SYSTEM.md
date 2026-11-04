# FSD Premium Experience System

This document records the current navigation, CTA, footer and motion system, and separates shipped behaviour from items that still need approval or implementation.

## Protected surfaces

- The approved “Made to Move, Made to Belong.” homepage hero remains unchanged.
- Existing SHOP and THE HOUSE mega-menu layouts remain unchanged.
- Existing product records, prices, approved logos and photography remain the source of truth.
- Private Enquiries is a separate route at `/enquiries.html`; it is not merged into another House page.

## Navigation sitemap

```text
/
├── SHOP
│   ├── Men’s Luxury Performance
│   ├── Women’s Modest Combat
│   ├── Limited Collections [disabled where no destination is approved]
│   ├── New & Featured [disabled where no destination is approved]
│   ├── Clothing Lines → #clothing-lines
│   └── Accessories & Technical → /#technical-collections-archive
├── UNIVERSE
│   ├── FSD Apparel [not currently linked]
│   ├── FSD Bio-Lab™ [not currently linked]
│   ├── FSD Hardware [not currently linked]
│   └── FSD Global [not currently linked]
├── BIO-LAB™
│   ├── Wearable Technology
│   └── Innovation Hub → #innovation-hub
├── HARDWARE
│   ├── Strength Equipment
│   ├── Combat Equipment
│   ├── Recovery Technology
│   └── Performance Accessories
├── THE HOUSE
│   ├── Our Story → /story
│   ├── Flagships
│   ├── Fight Promotions
│   ├── Global Vision & Operations → /fsd-pods.html
│   ├── Investor Relations → /investor.html
│   └── Community & Culture → /community-co-creation.html
└── PRIVATE ACCESS
    ├── Tactical Shield Membership → #tactical-shield-membership
    ├── VIP Access Registration [disabled; no sign-up collection]
    ├── Collection Announcements → #contact [informational; no sign-up collection]
    └── Private Enquiries → /enquiries.html
```

The header’s mobile menu, existing menu groups, predictive search entry point and shopping-bag trigger are retained. Where a destination or sign-up flow is not approved, the navigation remains informational or disabled rather than inventing a route or collecting data.

## CTA inventory

| CTA | Current destination / behaviour | Status |
| --- | --- | --- |
| Explore the Collections | Existing homepage CTA; footer CTA links to `/#collections` | Existing homepage preserved; footer link active |
| Explore Collection | Existing collection and product-card links | Existing behaviour preserved |
| Add to Bag | Existing product detail action | Existing shopping behaviour preserved |
| Begin an Enquiry | `/enquiries.html`, then scrolls to stage one | Active |
| Continue / Review Enquiry | Advances after category selection and field validation | Active |
| Send for Consideration | No network request or persistence | Disabled until email delivery and approved privacy wording are configured |
| Discover the House | Existing House navigation destinations | Existing menu presentation preserved |
| Explore Bio-Lab™ / Explore Hardware | Existing destination and collection controls | Existing menu presentation preserved |
| Enter Private Access | Existing Private Access menu | Registration and announcements remain non-collecting |

`SiteCTA` provides primary, secondary and text-link variants for new work. The enquiry flow and signature footer use the shared CTA styling. The approved homepage CTA and existing product purchase controls were not migrated, so their protected presentation and behaviour remain intact.

## Footer structure

1. Original approved FSD logo portal and brand line.
2. Primary route back to the catalogue and text link to Private Enquiries.
3. Compact link groups:
   - Shop
   - The House
   - Explore (FSD Universe, Bio-Lab™, Hardware)
   - Private Access
   - Customer Care (contact, delivery and returns, size guide, privacy, terms)
4. Existing React utility mount point.
5. Copyright and back-to-top control.

Social accounts are omitted because no approved profile destinations were supplied. The former internal legal-review placeholder has been removed; the footer does not invent registration information, contact details or legal claims.

## Motion specification

### Implemented

- Shared CTA hover: subtle 1px lift and restrained colour/border transitions, about 180ms.
- CTA keyboard focus: visible 2px Champagne Gold outline with offset.
- Footer links: colour change and short gold underline transition, about 180ms.
- Existing navigation and collection dialogs retain their current short opacity/transform transitions and reduced-motion handling.
- Existing homepage hero title uses a single 680ms arrival animation; reduced-motion preference disables it.
- Existing product imagery retains its short scale/opacity transitions and reduced-motion override.
- New enquiry page uses no autoplay media, parallax or blocking page transition.

### Proposed, not implemented

- A scroll-triggered footer entrance with a no-JavaScript visible fallback.
- A distinct easing/timing pass for the shopping-bag dialog; its checkout remains disabled and the current brief does not authorize payment behaviour.
- A unified review of image entrance effects across approved collection banners and product galleries.

For future motion, keep routine controls within roughly 160–220ms, larger editorial entrances within roughly 300–700ms, avoid layout shifts, and disable non-essential movement under `prefers-reduced-motion`. Do not hide essential content while waiting for an observer or image/video load.

## Current limits and missing assets

- No approved cinematic footage or hero photography was supplied for Private Enquiries; the page therefore uses a static, restrained graphic treatment.
- The enquiry categories, client-side validation, review stage and mobile layout work. The form currently sends and stores nothing; its final action stays disabled. A connected email provider, recipient inbox and approved privacy/retention wording are required before enabling submission.
- The responsive screenshots are saved under `generated-artifacts/screenshots/`; the page was checked at desktop and mobile sizes. Collection-grid browser checks continue to cover desktop, laptop, tablet and mobile layouts.
