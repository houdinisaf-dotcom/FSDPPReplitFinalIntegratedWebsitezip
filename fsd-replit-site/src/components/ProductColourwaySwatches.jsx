import { imageSwatchBackground } from '../data/products.js';
import { productColourwayOptions } from '../product-card-media.js';
import './ProductColourwaySwatches.css';

export function ProductColourwaySwatches({ product }) {
  const colourways = productColourwayOptions(product);
  const swatches = colourways
    .map(name => ({ name, background: imageSwatchBackground(name, product) }))
    .filter(swatch => swatch.background);

  if (!swatches.length) return null;

  return (
    <div
      className="fsd-product-colourway-swatches"
      role="group"
      aria-label={`Available colourways: ${colourways.join(', ')}`}
    >
      {swatches.map(({ name, background }) => (
        <span
          key={name}
          className="fsd-product-colourway-swatches__dot"
          role="img"
          aria-label={name}
          title={name}
          style={{ background }}
        />
      ))}
    </div>
  );
}
