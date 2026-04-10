import type { Bocnice } from '../types/configurator';

interface BocniceSelectorProps {
  bocnice: Bocnice[];
  selected: Bocnice | null;
  isRequired: boolean;
  onSelect: (bocnice: Bocnice) => void;
}

/**
 * Bocnice (side panel) selector showing available options
 * filtered by model and dimension area.
 */
export function BocniceSelector({ bocnice, selected, isRequired, onSelect }: BocniceSelectorProps) {
  if (bocnice.length === 0) {
    return (
      <section className="config-section" id="section-bocnice">
        <h2 className="section-title">
          <span className="section-number">04</span>
          Bočnice
        </h2>
        <div className="card-desc" style={{ textAlign: 'center', padding: '24px 0' }}>
          {isRequired ? 'Nejprve vyberte rozměr ložné plochy' : 'Pro tento model není volba bočnic k dispozici'}
        </div>
      </section>
    );
  }

  return (
    <section className="config-section" id="section-bocnice">
      <h2 className="section-title">
        <span className="section-number">04</span>
        Bočnice
        {isRequired && !selected && (
          <span className="card-badge card-badge--required" style={{ marginLeft: 8 }}>
            Vyžadováno
          </span>
        )}
      </h2>
      <div className="card-grid card-grid--chassis">
        {bocnice.map((b) => {
          const isSelected = selected?.id_bocnice === b.id_bocnice;
          return (
            <button
              key={b.id_bocnice}
              className={`select-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(b)}
              aria-pressed={isSelected}
              style={{ display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <div className="card-check">
                <div className="card-check-inner" />
              </div>
              <div style={{ flex: 1, paddingLeft: 32 }}>
                <div className="card-title" style={{ marginBottom: 0 }}>{b.nazev}</div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
