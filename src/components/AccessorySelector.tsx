import type { Prislusenstvi, AccessoryAvailability, Rozmer } from '../types/configurator';
import { applyVat, vatLabel } from '../utils/vat';
import { getAccessoryPrice, hasPlochaScaling } from '../utils/price';

interface AccessorySelectorProps {
  sectionId: string;
  sectionNumber: string;
  sectionTitle: string;
  accessories: Prislusenstvi[];
  selected: Prislusenstvi[];
  selectedRozmer: Rozmer | null;
  requiredCategories: string[];
  vatIncluded: boolean;
  onToggle: (accessory: Prislusenstvi) => void;
  getAvailability: (accessory: Prislusenstvi) => AccessoryAvailability;
  /** Hide entire section when empty. Default: true. */
  hideWhenEmpty?: boolean;
  /** Optional intro text shown above the cards. */
  intro?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  HYDRAULIKA: '⚙️ Hydraulika',
  NAJEZDY: '🔽 Nájezdy',
  NAVIJAK: '🔗 Naviják',
  DOPLNEK: '🧰 Doplňky',
  PLACHTA: '🛡️ Plachty',
  NASTAVBA: '📦 Nástavby',
};

export function AccessorySelector({
  sectionId,
  sectionNumber,
  sectionTitle,
  accessories,
  selected,
  selectedRozmer,
  requiredCategories,
  vatIncluded,
  onToggle,
  getAvailability,
  hideWhenEmpty = true,
  intro,
}: AccessorySelectorProps) {
  if (accessories.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <section className="config-section" id={sectionId}>
        <h2 className="section-title">
          <span className="section-number">{sectionNumber}</span>
          {sectionTitle}
        </h2>
        <div className="card-desc" style={{ textAlign: 'center', padding: '24px 0' }}>
          Nejprve vyberte model vozíku
        </div>
      </section>
    );
  }

  const grouped = accessories.reduce<Record<string, Prislusenstvi[]>>((acc, item) => {
    if (!acc[item.kat]) acc[item.kat] = [];
    acc[item.kat].push(item);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const aReq = requiredCategories.includes(a) ? -1 : 0;
    const bReq = requiredCategories.includes(b) ? -1 : 0;
    return aReq - bReq;
  });

  return (
    <section className="config-section" id={sectionId}>
      <h2 className="section-title">
        <span className="section-number">{sectionNumber}</span>
        {sectionTitle}
      </h2>

      {intro && <p className="section-intro">{intro}</p>}

      {sortedCategories.map((cat) => {
        const isRequired = requiredCategories.includes(cat);
        const hasSelection = selected.some((a) => a.kat === cat);

        return (
          <div key={cat} className="accessory-category">
            <div className="accessory-category-title">
              {CATEGORY_LABELS[cat] || cat}
              {isRequired && !hasSelection && (
                <span className="card-badge card-badge--required">
                  Vyžadováno
                </span>
              )}
            </div>

            <div className="card-grid card-grid--accessories">
              {grouped[cat].map((acc) => {
                const isSelected = selected.some((s) => s.id_doplnek === acc.id_doplnek);
                const availability = getAvailability(acc);
                const disabled = availability.state === 'disabled' && !isSelected;

                return (
                  <button
                    key={acc.id_doplnek}
                    className={`select-card accessory-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && onToggle(acc)}
                    disabled={disabled}
                    aria-pressed={isSelected}
                    title={disabled ? availability.reason : undefined}
                  >
                    {acc.image && (
                      <div className="accessory-image">
                        <img src={`${import.meta.env.BASE_URL}${acc.image}`} alt={acc.nazev} loading="lazy" />
                      </div>
                    )}
                    <div className="acc-checkbox">
                      <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 6L5 9L10 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="accessory-info">
                      <div className="card-title" style={{ fontSize: '0.9rem' }}>{acc.nazev}</div>
                      {acc.poznamka && <div className="accessory-note">{acc.poznamka}</div>}
                      {disabled && availability.reason && (
                        <div className="disabled-reason">{availability.reason}</div>
                      )}
                    </div>
                    <div className="card-price">
                      +{applyVat(getAccessoryPrice(acc, selectedRozmer), vatIncluded).toLocaleString('cs-CZ')} Kč
                      <span className="price-vat-note">{vatLabel(vatIncluded)}</span>
                      {hasPlochaScaling(acc) && (
                        <span className="price-vat-note" style={{ opacity: 0.7 }}>
                          dle plochy
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
