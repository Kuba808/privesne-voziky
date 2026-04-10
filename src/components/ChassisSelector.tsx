import type { Podvozek } from '../types/configurator';

interface ChassisSelectorProps {
  chassis: Podvozek[];
  selected: Podvozek | null;
  onSelect: (podvozek: Podvozek) => void;
}

/**
 * Chassis selection cards showing braking, weight capacity, and price.
 */
export function ChassisSelector({ chassis, selected, onSelect }: ChassisSelectorProps) {
  if (chassis.length === 0) {
    return (
      <section className="config-section" id="section-podvozek">
        <h2 className="section-title">
          <span className="section-number">03</span>
          Podvozek
        </h2>
        <div className="card-desc" style={{ textAlign: 'center', padding: '24px 0' }}>
          Nejprve vyberte rozměr ložné plochy
        </div>
      </section>
    );
  }

  return (
    <section className="config-section" id="section-podvozek">
      <h2 className="section-title">
        <span className="section-number">03</span>
        Podvozek
      </h2>
      <div className="card-grid card-grid--chassis">
        {chassis.map((p) => {
          const isSelected = selected?.id_podvozek === p.id_podvozek;
          return (
            <button
              key={p.id_podvozek}
              className={`select-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(p)}
              aria-pressed={isSelected}
              style={{ display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <div className="card-check">
                <div className="card-check-inner" />
              </div>
              <div style={{ flex: 1, paddingLeft: 32 }}>
                <div className="card-title">
                  {p.brzdeny === 'ANO' ? 'Brzděný' : 'Nebrzděný'}
                </div>
                <div className="chassis-specs">
                  <div className="chassis-spec">
                    <div className="chassis-spec-value">{p.celkova_hmotnost_kg.toLocaleString('cs-CZ')} kg</div>
                    <div className="chassis-spec-label">celk. hmotnost</div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
