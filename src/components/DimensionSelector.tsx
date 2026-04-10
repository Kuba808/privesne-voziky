import type { Rozmer } from '../types/configurator';

interface DimensionSelectorProps {
  dimensions: Rozmer[];
  selected: Rozmer | null;
  onSelect: (rozmer: Rozmer) => void;
}

/**
 * Dimension selection grid showing available sizes for the selected model.
 */
export function DimensionSelector({ dimensions, selected, onSelect }: DimensionSelectorProps) {
  if (dimensions.length === 0) {
    return (
      <section className="config-section" id="section-rozmer">
        <h2 className="section-title">
          <span className="section-number">02</span>
          Rozměr ložné plochy
        </h2>
        <div className="card-desc" style={{ textAlign: 'center', padding: '24px 0' }}>
          Nejprve vyberte model vozíku
        </div>
      </section>
    );
  }

  return (
    <section className="config-section" id="section-rozmer">
      <h2 className="section-title">
        <span className="section-number">02</span>
        Rozměr ložné plochy
      </h2>
      <div className="card-grid card-grid--dimensions">
        {dimensions.map((dim) => {
          const isSelected = selected?.id_rozmer === dim.id_rozmer;
          return (
            <button
              key={dim.id_rozmer}
              className={`select-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(dim)}
              aria-pressed={isSelected}
            >
              <div className="card-check">
                <div className="card-check-inner" />
              </div>
              <div className="card-title">
                {dim.delka_cm} × {dim.sirka_cm} cm
              </div>
              <div className="dim-specs">
                <div className="dim-spec">
                  <span>{dim.plocha_m2} m²</span>
                </div>

              </div>
              <span className="card-badge card-badge--size">{dim.kategorie_velikosti}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
