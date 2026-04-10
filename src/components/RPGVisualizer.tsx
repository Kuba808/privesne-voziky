import { useRef, useEffect, useState, useCallback } from 'react';
import type { Model, Bocnice, Prislusenstvi } from '../types/configurator';

interface RPGVisualizerProps {
  selectedModel: Model | null;
  selectedBocnice: Bocnice | null;
  selectedAccessories: Prislusenstvi[];
  availableAccessoryCategories: string[];
}

/**
 * Anchor positions for each accessory category relative to the container.
 * Keys are category names, values are { box: position of the label box, anchor: point on model image }
 */
const ACC_POSITIONS: Record<string, {
  box: { top?: string; bottom?: string; left?: string; right?: string };
  anchorPct: { x: number; y: number }; 
}> = {
  OPT_03: { box: { bottom: '15%', left: '2%' }, anchorPct: { x: 0.3, y: 0.85 } },
  OPT_04: { box: { bottom: '15%', left: '2%' }, anchorPct: { x: 0.3, y: 0.85 } },
  OPT_05: { box: { bottom: '8%', right: '2%' }, anchorPct: { x: 0.85, y: 0.8 } },
  OPT_09: { box: { top: '5%', left: '2%' }, anchorPct: { x: 0.1, y: 0.3 } },
  OPT_11: { box: { top: '35%', left: '2%' }, anchorPct: { x: 0.05, y: 0.6 } },
  OPT_12: { box: { bottom: '35%', right: '2%' }, anchorPct: { x: 0.95, y: 0.8 } },
  OPT_13: { box: { bottom: '2%', left: '40%' }, anchorPct: { x: 0.5, y: 0.85 } },
};

/**
 * RPG-style visualizer showing the selected model with SVG connector lines
 * to accessory placeholder boxes.
 */
export function RPGVisualizer({ selectedModel, selectedBocnice, selectedAccessories, availableAccessoryCategories }: RPGVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [lines, setLines] = useState<{ id: string; x1: number; y1: number; x2: number; y2: number }[]>([]);

  const updateLines = useCallback(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image || !selectedModel) return;

    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();

    const newLines: typeof lines = [];

    // Render line for each selected accessory that has a mapped position
    selectedAccessories.forEach((acc) => {
      const pos = ACC_POSITIONS[acc.id_doplnek];
      if (!pos) return;

      const boxEl = container.querySelector(`[data-acc="${acc.id_doplnek}"]`) as HTMLElement | null;
      if (!boxEl) return;

      const boxRect = boxEl.getBoundingClientRect();

      // Anchor point on image
      const anchorX = imageRect.left - containerRect.left + imageRect.width * pos.anchorPct.x;
      const anchorY = imageRect.top - containerRect.top + imageRect.height * pos.anchorPct.y;

      // Center of box
      const boxCenterX = boxRect.left - containerRect.left + boxRect.width / 2;
      const boxCenterY = boxRect.top - containerRect.top + boxRect.height / 2;

      newLines.push({
        id: acc.id_doplnek,
        x1: anchorX,
        y1: anchorY,
        x2: boxCenterX,
        y2: boxCenterY,
      });
    });

    setLines(newLines);
  }, [selectedModel, availableAccessoryCategories, selectedAccessories, selectedBocnice]);

  useEffect(() => {
    updateLines();
    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [updateLines]);

  // Re-calculate lines when image loads
  const handleImageLoad = () => {
    setTimeout(updateLines, 50);
  };

  if (!selectedModel) {
    return (
      <div className="rpg-container" ref={containerRef}>
        <div className="rpg-empty-state">
          <svg className="rpg-empty-icon" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="30" width="60" height="25" rx="4" stroke="currentColor" strokeWidth="2" />
            <circle cx="25" cy="58" r="6" stroke="currentColor" strokeWidth="2" />
            <circle cx="55" cy="58" r="6" stroke="currentColor" strokeWidth="2" />
            <line x1="5" y1="43" x2="15" y2="38" stroke="currentColor" strokeWidth="2" />
          </svg>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>Vyberte model</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Začněte výběrem modelu vpravo
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rpg-container" ref={containerRef}>
      {/* SVG connector lines */}
      <svg className="rpg-svg-overlay" width="100%" height="100%">
        {lines.map((line) => {
          const isActive = true; // All mapped lines are active as they represent selected accessories
          // Bézier control points for a nice curve
          const midX = (line.x1 + line.x2) / 2;
          const midY = (line.y1 + line.y2) / 2;
          const dx = line.x2 - line.x1;
          const dy = line.y2 - line.y1;
          const cx1 = midX - dy * 0.15;
          const cy1 = midY + dx * 0.15;

          return (
            <g key={line.id}>
              <path
                d={`M ${line.x1} ${line.y1} Q ${cx1} ${cy1} ${line.x2} ${line.y2}`}
                className="rpg-connector-line"
                style={{ opacity: isActive ? 0.8 : 0.25, strokeWidth: isActive ? 2 : 1 }}
              />
              <circle cx={line.x1} cy={line.y1} className="rpg-connector-dot" style={{ opacity: isActive ? 1 : 0.3 }} />
            </g>
          );
        })}
      </svg>

      {/* Main model image */}
      <img
        ref={imageRef}
        src={`/images/${selectedModel.id_model}.png`}
        alt={selectedModel.nazev_modelu}
        className="rpg-model-image"
        onLoad={handleImageLoad}
      />

      {/* Accessory boxes */}
      {selectedAccessories.map((acc) => {
        const pos = ACC_POSITIONS[acc.id_doplnek];
        if (!pos) return null;

        return (
          <div
            key={acc.id_doplnek}
            data-acc={acc.id_doplnek}
            className="rpg-accessory-box active"
            style={{ ...pos.box, position: 'absolute' }}
          >
            <div className="rpg-acc-placeholder" style={{ background: 'transparent' }}>
               <img src={`/${acc.image}`} alt={acc.nazev} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="rpg-acc-label">{acc.nazev}</div>
          </div>
        );
      })}
    </div>
  );
}
