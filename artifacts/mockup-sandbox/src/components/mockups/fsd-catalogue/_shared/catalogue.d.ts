export function catalogueSection(): string;

export function initCatalogue(options?: {
  onProductSelect?: (id: string | number, trigger?: HTMLElement) => void;
  onAddToBag?: (product: unknown) => void;
}): void;
