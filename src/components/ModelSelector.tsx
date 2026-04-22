import { useState, useEffect } from 'react';
import type { Model } from '../types/configurator';

interface ModelSelectorProps {
  models: Model[];
  selected: Model | null;
  onSelect: (model: Model) => void;
}

const PREVIEW_LEN = 110;

export function ModelSelector({ models, selected, onSelect }: ModelSelectorProps) {
  const [techExpanded, setTechExpanded] = useState(false);

  useEffect(() => {
    setTechExpanded(false);
  }, [selected?.id_model]);

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

      {selected?.popis_technika && (
        <div className="model-tech-panel">
          <div className="model-tech-panel-label">Technické detaily — {selected.nazev_modelu}</div>
          <p className="model-tech-panel-text">
            {techExpanded || selected.popis_technika.length <= PREVIEW_LEN
              ? selected.popis_technika
              : selected.popis_technika.slice(0, PREVIEW_LEN) + '…'}
          </p>
          {selected.popis_technika.length > PREVIEW_LEN && (
            <button
              className="model-tech-panel-toggle"
              onClick={() => setTechExpanded(!techExpanded)}
            >
              {techExpanded ? 'méně ▲' : 'více ▾'}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
