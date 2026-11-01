export const SIZE_GUIDE_SECTIONS = [
  {
    id: 'mens',
    title: 'Men’s',
    measurements: ['Chest', 'Waist', 'Hip', 'Inseam'],
    sizes: ['[TO CONFIRM]'],
  },
  {
    id: 'womens',
    title: 'Women’s',
    measurements: ['Chest', 'Waist', 'Hip', 'Inseam'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'headwear',
    title: 'Headwear',
    measurements: ['Head circumference'],
    sizes: ['[TO CONFIRM]'],
  },
];

export const SIZE_GUIDE_UNIT_NOTE = 'Centimetres · [TO CONFIRM]';
export const SIZE_GUIDE_FIT_NOTE =
  'Body measurements describe the person; garment measurements describe the item. FSD’s sizing basis is [TO CONFIRM].';
export const SIZE_GUIDE_MEASURE_NOTE =
  'Use a flexible measuring tape and keep it level without pulling tight. Exact tape placement for each measurement is [TO CONFIRM].';

const escapeHtml = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export function sizeGuideSectionForProduct(product) {
  const details = `${product?.audience || ''} ${product?.category || ''} ${product?.name || ''}`.toLowerCase();
  if (/headwear|hijab|head circumference/.test(details)) {
    return SIZE_GUIDE_SECTIONS.find(section => section.id === 'headwear');
  }
  if (/women|legging|women's|women’s/.test(details)) {
    return SIZE_GUIDE_SECTIONS.find(section => section.id === 'womens');
  }
  return SIZE_GUIDE_SECTIONS.find(section => section.id === 'mens');
}

export function renderSizeGuideTable(section, sizes = section?.sizes || []) {
  if (!section) return '';
  const rows = (sizes.length ? sizes : ['[TO CONFIRM]'])
    .map(size => `<tr><th scope="row">${escapeHtml(size)}</th>${section.measurements.map(measurement => `<td data-label="${escapeHtml(measurement)}">[TO CONFIRM]</td>`).join('')}</tr>`)
    .join('');
  return `<div class="size-guide-table-wrap"><table>
    <caption>Measurements in ${SIZE_GUIDE_UNIT_NOTE}</caption>
    <thead><tr><th scope="col">Size</th>${section.measurements.map(measurement => `<th scope="col">${measurement}</th>`).join('')}</tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}
