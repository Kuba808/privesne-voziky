import type { PriceBreakdown } from '../types/configurator';

interface PriceBarProps {
  price: PriceBreakdown;
}

/**
 * Sticky footer bar displaying the current total price.
 */
export function PriceBar({ price }: PriceBarProps) {
  return (
    <footer className="price-bar">
      <div className="price-bar-inner">
        <span className="price-bar-label">Celková cena konfigurace</span>
        <span className="price-bar-value">
          {price.total > 0 ? `${price.total.toLocaleString('cs-CZ')} Kč` : '— Kč'}
        </span>
      </div>
    </footer>
  );
}
