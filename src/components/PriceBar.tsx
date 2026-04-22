import type { PriceBreakdown } from '../types/configurator';
import { applyVat } from '../utils/vat';

interface PriceBarProps {
  price: PriceBreakdown;
  vatIncluded: boolean;
  onToggleVat: () => void;
}

export function PriceBar({ price, vatIncluded, onToggleVat }: PriceBarProps) {
  const total = applyVat(price.total, vatIncluded);
  return (
    <footer className="price-bar">
      <div className="price-bar-inner">
        <span className="price-bar-label">Celková cena konfigurace</span>
        <div className="price-bar-right">
          <div className="vat-toggle">
            <button
              className={`vat-toggle-btn${!vatIncluded ? ' vat-toggle-btn--active' : ''}`}
              onClick={() => vatIncluded && onToggleVat()}
            >
              bez DPH
            </button>
            <button
              className={`vat-toggle-btn${vatIncluded ? ' vat-toggle-btn--active' : ''}`}
              onClick={() => !vatIncluded && onToggleVat()}
            >
              vč. DPH
            </button>
          </div>
          <span className="price-bar-value">
            {total > 0 ? `${total.toLocaleString('cs-CZ')} Kč` : '— Kč'}
          </span>
        </div>
      </div>
    </footer>
  );
}
