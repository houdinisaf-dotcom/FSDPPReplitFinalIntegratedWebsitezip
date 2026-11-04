import { useRef } from 'react';
import './CategoryFilterTabs.css';

export function CategoryFilterTabs({ categories, activeId, onChange, ariaLabel }) {
  const tabRefs = useRef([]);

  const handleKeyDown = (event, index) => {
    let nextIndex;

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % categories.length;
        break;
      case 'ArrowLeft':
        nextIndex = (index - 1 + categories.length) % categories.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = categories.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="fsd-category-tabs" role="group" aria-label={ariaLabel}>
      <div className="fsd-category-tabs__rail">
        {categories.map((category, index) => {
          const isActive = category.id === activeId;

          return (
            <button
              key={category.id}
              ref={element => { tabRefs.current[index] = element; }}
              className="fsd-category-tabs__item"
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(category.id)}
              onKeyDown={event => handleKeyDown(event, index)}
            >
              <span className="fsd-category-tabs__label">{category.label}</span>
              <span className="fsd-category-tabs__count">{category.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryFilterTabs;
