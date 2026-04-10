import type { Prislusenstvi } from '../types/configurator';

interface AccessorySelectorProps {
  accessories: Prislusenstvi[];
  selected: Prislusenstvi[];
  requiredCategories: string[];
  onToggle: (accessory: Prislusenstvi) => void;
  isDisabled: (accessory: Prislusenstvi) => string | null;
}

/** Human readable category names */
const CATEGORY_LABELS: Record<string, string> = {
  HYDRAULIKA: '⚙️ Hydraulika',
  NAJEZDY: '🔽 Nájezdy',
  NAVIJAK: '🔗 Naviják',
  DOPLNEK: '🧰 Doplňky',
};

/**
 * Accessory selector grouped by category.
 * Shows required categories, handles dependencies, disables excluded items.
 * Each accessory card shows an image thumbnail if available.
 */
export function AccessorySelector({
  accessories,
  selected,
  requiredCategories,
  onToggle,
  isDisabled,
}: AccessorySelectorProps) {
  if (accessories.length === 0) {
    return (
      <section className="config-section" id="section-prislusenstvi">
        <h2 className="section-title">
          <span className="section-number">05</span>
          Příslušenství
        </h2>
        <div className="card-desc" style={{ textAlign: 'center', padding: '24px 0' }}>
          Nejprve vyberte model vozíku
        </div>
      </section>
    );
  }

  // Group by category
  const grouped = accessories.reduce<Record<string, Prislusenstvi[]>>((acc, item) => {
    if (!acc[item.kat]) acc[item.kat] = [];
    acc[item.kat].push(item);
    return acc;
  }, {});

  // Sort: required categories first
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const aReq = requiredCategories.includes(a) ? -1 : 0;
    const bReq = requiredCategories.includes(b) ? -1 : 0;
    return aReq - bReq;
  });

  return (
    <section className="config-section" id="section-prislusenstvi">
      <h2 className="section-title">
        <span className="section-number">05</span>
        Příslušenství
      </h2>

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
                const disabledReason = isDisabled(acc);
                const disabled = disabledReason !== null && !isSelected;

                return (
                  <button
                    key={acc.id_doplnek}
                    className={`select-card accessory-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && onToggle(acc)}
                    disabled={disabled}
                    aria-pressed={isSelected}
                  >
                    {acc.image && (
                      <div className="accessory-image">
                        <img src={`/${acc.image}`} alt={acc.nazev} loading="lazy" />
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
                      {disabled && disabledReason && (
                        <div className="disabled-reason">{disabledReason}</div>
                      )}
                    </div>
                    <div className="card-price">
                      +{acc.cena_czk.toLocaleString('cs-CZ')} Kč
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
