// Navigation metadata is kept separate from the master product catalogue.
// Concept-only items below are named in the supplied FSD showroom brief; no
// prices, specifications, availability, or product-image mappings are implied.
export const collectionDivisions = [
  {
    id: 'apparel',
    title: 'FSD APPAREL',
    tagline: 'ENGINEERED FOR UNYIELDING MOVEMENT.',
    description: 'Performance apparel, combat training, and modest movement.',
    groups: [
      {
        id: 'mens-luxury-performance',
        title: 'MEN’S LUXURY PERFORMANCE',
        categories: ['Men’s Performance and Training', 'Training Sets', 'Combat and MMA', 'Lifestyle'],
        audiences: ['Men’s', 'Unisex'],
        subcategories: [
          { title: '500 GSM Hoodies & Tracksuits', productTerms: ['500 GSM', 'Tracksuit'] },
          { title: '2-in-1 Combat Training Shorts & Tanks', productTerms: ['2-in-1'], concepts: ['2-in-1 Combat Training Shorts & Tanks'] },
          { title: 'Walkout Robes & Bomber Jackets', productTerms: ['Walkout', 'Bomber'], concepts: ['Walkout Robes'] },
          { title: 'Volcanic Amber Capsule', concepts: ['Volcanic Amber Capsule'] },
          { title: 'Vector Camo Capsule', productTerms: ['Vector-Camo', 'Vector Camo'] },
        ],
      },
      {
        id: 'womens-modest-combat',
        title: 'WOMEN’S MODEST COMBAT',
        categories: ['Modest Activewear', 'Sports Hijabs', 'Women’s Performance', 'Combat and MMA'],
        audiences: ['Women’s'],
        subcategories: [
          { title: 'Performance Hijabs', productTerms: ['Hijab'] },
          { title: 'Women’s MMA Rash Guard', productTerms: ['MMA Performance Rash Guard'] },
          { title: 'Performance Training Tops', productTerms: ['Performance Training Top', 'Performance Top'] },
          { title: 'Longline Tunics & Training Jackets', productTerms: ['FSD Modest Longline Training Top / Tunic', 'FSD Modest Longline Training Jacket'] },
          { title: 'Performance Leggings & Strikeflex Trousers', productTerms: ['Performance Training Leggings', 'Apex High-Waisted Compression Leggings', 'FLEX — High-Waisted Sculpt Leggings', 'Strikeflex Women’s Training Trousers'] },
          { title: 'Modest Outer Layers', productTerms: ['Aegis Modest Performance Gilet', 'Lightweight Modest Training Overshirt'] },
          { title: 'FSD Modest Flow Training Trousers', productTerms: ['FSD Modest Flow Training Trousers'] },
          { title: 'FSD Breeze Set', productTerms: ['FSD Breeze Overshirt & Engineered Leggings Set'] },
          { title: 'AeroForge Modest Tunic & Jogger Set', productTerms: ['FSD Aeroforge Modest Tunic & Jogger Set'] },
          { title: 'Women’s Training Accessories', productTerms: ['FSD Signature Performance Sports Bag', 'FSD Performance Training Socks'] },
        ],
        prominent: true,
      },
    ],
    visual: 'apparel',
  },
  {
    id: 'bio-lab',
    title: 'FSD BIO-LAB™',
    tagline: 'INTELLIGENCE IN EVERY MOVEMENT.',
    description: 'Training technology and connected apparel.',
    groups: [{
      id: 'bio-lab-concepts',
      title: 'WEARABLE TECHNOLOGY',
      categories: ['Smart Tech'],
      concepts: [
        'Bio-Weave™ ECG & Hydration Compression Tops',
        'FSD Aware Band™',
        'Graphene-Infused Thermal Recovery Vests',
        'FSD Digital Pass™',
        'FSD VECTOR — Smartwatch',
        'FSD CORE — Heart Rate Sensor Strap',
      ],
    }],
    visual: 'bio-lab',
  },
  {
    id: 'hardware',
    title: 'FSD HARDWARE',
    tagline: 'BUILT FOR THE DEMANDS OF PERFORMANCE.',
    description: 'Strength equipment, combat essentials, recovery ideas, and training accessories.',
    groups: [
      {
        id: 'strength-equipment',
        title: 'STRENGTH EQUIPMENT',
        categories: ['Gym Hardware and Accessories'],
        productTerms: ['Dumbbell', 'AUREUS', 'OBSIDIAN', 'VANGUARD', 'UTILITY'],
      },
      {
        id: 'combat-equipment',
        title: 'COMBAT EQUIPMENT',
        categories: ['Combat and MMA'],
        productTerms: ['Gloves', 'Mitts', 'Mouthguard', 'Gear Kit'],
        concepts: ['16oz Pro Leather Boxing Gloves', 'Apex Ring Boots', 'Heavy Bags'],
      },
      {
        id: 'recovery-technology',
        title: 'RECOVERY TECHNOLOGY',
        categories: [],
        concepts: ['Cryo-Zero Recovery Chambers', 'Red Light Recovery Beds', '7mm Knee Sleeves'],
      },
      {
        id: 'performance-accessories',
        title: 'PERFORMANCE ACCESSORIES',
        categories: ['Gym Hardware and Accessories', 'Smart Tech'],
        productTerms: ['COMMAND', 'CARRY', 'SOCKS', 'COLLARS', 'HYDRATE', 'SONIC', 'PULSE'],
        concepts: ['Anti-Snap Resistance Systems', 'Premium Metal Flasks'],
      },
    ],
    visual: 'hardware',
  },
  {
    id: 'global',
    title: 'FSD GLOBAL',
    tagline: 'FROM THE TRAINING FLOOR TO THE WORLD STAGE.',
    description: 'FSD flagships, events, and athlete development.',
    groups: [
      {
        id: 'flagships',
        title: 'FSD FLAGSHIPS',
        concepts: ['Dublin', 'Belfast', 'Manchester', 'Islamabad', 'Future Global Locations'],
      },
      {
        id: 'promotions',
        title: 'FSD PROMOTIONS',
        concepts: [
          'Professional Fight Promotions',
          'Live Events',
          'Broadcast & PPV Concepts',
          'Athlete Development',
          'Academy & Grassroots Programmes',
        ],
      },
    ],
    visual: 'global',
  },
];
