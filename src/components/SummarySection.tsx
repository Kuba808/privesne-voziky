import type { PriceBreakdown } from '../types/configurator';

interface SummarySectionProps {
  price: PriceBreakdown;
  configCode: string;
  isComplete: boolean;
  missingCategories: string[];
  onSaveCode: () => void;
  onDownloadPDF: () => void;
  onShareLink: () => void;
  onInquiry: () => void;
}

/**
 * Summary section showing full price breakdown and action buttons.
 */
export function SummarySection({
  price,
  configCode,
  isComplete,
  missingCategories,
  onSaveCode,
  onDownloadPDF,
  onShareLink,
  onInquiry,
}: SummarySectionProps) {
  return (
    <section className="config-section" id="section-souhrn">
      <h2 className="section-title">
        <span className="section-number">06</span>
        Souhrn konfigurace
      </h2>

      <div className="summary-section">
        <div className="summary-title">Rozpis ceny</div>

        <div className="price-line">
          <span className="price-line-label">Základní model</span>
          <span className="price-line-value">
            {price.model > 0 ? `${price.model.toLocaleString('cs-CZ')} Kč` : '—'}
          </span>
        </div>
        <div className="price-line">
          <span className="price-line-label">Rozměr</span>
          <span className="price-line-value">
            {price.rozmer > 0 ? `+${price.rozmer.toLocaleString('cs-CZ')} Kč` : price.model > 0 ? 'v ceně' : '—'}
          </span>
        </div>
        <div className="price-line">
          <span className="price-line-label">Podvozek</span>
          <span className="price-line-value">
            {price.podvozek > 0 ? `+${price.podvozek.toLocaleString('cs-CZ')} Kč` : price.model > 0 ? 'v ceně' : '—'}
          </span>
        </div>
        <div className="price-line">
          <span className="price-line-label">Bočnice</span>
          <span className="price-line-value">
            {price.bocnice > 0 ? `+${price.bocnice.toLocaleString('cs-CZ')} Kč` : price.model > 0 ? 'v ceně' : '—'}
          </span>
        </div>

        {price.accessories.map((acc, i) => (
          <div key={i} className="price-line">
            <span className="price-line-label" style={{ paddingLeft: 12 }}>
              • {acc.name}
            </span>
            <span className="price-line-value">+{acc.price.toLocaleString('cs-CZ')} Kč</span>
          </div>
        ))}

        <hr className="price-divider" />

        <div className="price-line price-total">
          <span className="price-line-label">Celková cena</span>
          <span className="price-line-value">{price.total.toLocaleString('cs-CZ')} Kč</span>
        </div>

        {missingCategories.length > 0 && (
          <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--accent-orange)' }}>
            ⚠ Zbývá vybrat: {missingCategories.join(', ').toLowerCase()}
          </div>
        )}

        {configCode && (
          <div style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Kód konfigurace:{' '}
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-orange)' }}>
              {configCode}
            </span>
          </div>
        )}

        <div className="summary-actions">
          <button className="btn" onClick={onSaveCode} disabled={!configCode} title="Zobrazit kód konfigurace">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="1" width="10" height="14" rx="1.5" />
              <line x1="6" y1="5" x2="10" y2="5" />
              <line x1="6" y1="8" x2="10" y2="8" />
              <line x1="6" y1="11" x2="8" y2="11" />
            </svg>
            Kód konfigurace
          </button>
          <button className="btn" onClick={onDownloadPDF} disabled={!isComplete} title="Stáhnout PDF souhrn">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2v8M5 7l3 3 3-3" />
              <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" />
            </svg>
            Stáhnout PDF
          </button>
          <button className="btn" onClick={onShareLink} disabled={!configCode} title="Kopírovat odkaz">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="4" cy="8" r="2" />
              <circle cx="12" cy="4" r="2" />
              <circle cx="12" cy="12" r="2" />
              <line x1="5.8" y1="7" x2="10.2" y2="5" />
              <line x1="5.8" y1="9" x2="10.2" y2="11" />
            </svg>
            Sdílet odkaz
          </button>
        </div>

        <button className="btn-cta" onClick={onInquiry} disabled={!isComplete}>
          Zadat nezávaznou poptávku
        </button>
      </div>
    </section>
  );
}
