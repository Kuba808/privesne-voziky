import type { Model } from '../types/configurator';

interface ModelSelectorProps {
  models: Model[];
  selected: Model | null;
  onSelect: (model: Model) => void;
}

/**
 * Model selection cards with images, descriptions, and prices.
 */
export function ModelSelector({ models, selected, onSelect }: ModelSelectorProps) {
  return (
    <section className="config-section" id="section-model">
      <h2 className="section-title">
        <span className="section-number">01</span>
        Vyberte model
      </h2>
      <div className="card-grid card-grid--models">
        {models.map((model) => {
          const isSelected = selected?.id_model === model.id_model;
          return (
            <button
              key={model.id_model}
              className={`select-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(model)}
              aria-pressed={isSelected}
            >
              <div className="card-check">
                <div className="card-check-inner" />
              </div>
              <img
                src={`${import.meta.env.BASE_URL}images/${model.id_model}.png`}
                alt={model.nazev_modelu}
                className="model-card-img"
                loading="lazy"
              />
              <div className="card-title">{model.nazev_modelu}</div>
              <div className="card-desc">{model.popis}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
