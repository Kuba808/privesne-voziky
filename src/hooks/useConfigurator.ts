/**
 * Central configurator hook.
 * Manages all selection state, filtering logic, price calculation,
 * and config code generation.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { VozikyData, ConfigState, Model, Rozmer, Podvozek, Bocnice, Prislusenstvi, PriceBreakdown } from '../types/configurator';
import { encodeConfig, decodeConfig } from '../utils/configCode';

/** Safely check if a comma-separated value string contains a specific value */
function matchesCsv(csv: string, value: string): boolean {
  return csv.split(',').includes(value);
}

/** Split a comma-separated string into an array */
function splitCsv(csv: string): string[] {
  return csv ? csv.split(',').map(s => s.trim()).filter(Boolean) : [];
}

/**
 * Compute the cheapest default selections for a given model.
 * Picks the cheapest rozměr, cheapest compatible podvozek,
 * cheapest compatible bočnice, and cheapest accessory in each mandatory category.
 */
function getDefaults(
  data: VozikyData,
  model: Model,
): Omit<ConfigState, 'selectedModel'> {
  // 1. Cheapest rozměr for this model
  const rozmery = data.rozmery
    .filter(r => matchesCsv(r.id_model, model.id_model))
    .sort((a, b) => a.priplatek_czk - b.priplatek_czk);
  const rozmer = rozmery[0] ?? null;

  // 2. Cheapest podvozek compatible with picked rozměr (by min_plocha_m2)
  let podvozek: Podvozek | null = null;
  if (rozmer) {
    const podvozky = data.podvozky
      .filter(p => {
        const min = p.min_plocha_m2 ?? 0;
        const max = p.max_plocha_m2 ?? Infinity;
        return rozmer.plocha_m2 >= min && rozmer.plocha_m2 <= max;
      })
      .sort((a, b) => a.priplatek_czk - b.priplatek_czk);
    podvozek = podvozky[0] ?? null;
  }

  // 3. Cheapest bočnice for this model and rozměr
  const povinneKategorie = splitCsv(model.povinna_kategorie);
  let bocnice: Bocnice | null = null;
  if (povinneKategorie.includes('BOČNICE') && rozmer) {
    const bocniceOptions = data.bocnice
      .filter(b => {
        const min = b.min_plocha_m2 ?? 0;
        const max = b.max_plocha_m2 ?? Infinity;
        return matchesCsv(b.id_model, model.id_model) && rozmer.plocha_m2 >= min && rozmer.plocha_m2 <= max;
      })
      .sort((a, b) => a.priplatek_czk - b.priplatek_czk);
    bocnice = bocniceOptions[0] ?? null;
  }

  // 4. Cheapest accessory in each mandatory category (excluding BOČNICE — handled separately)
  const excluded = splitCsv(model.vyloucena_kategorie);
  const available = data.prislusenstvi.filter(
    p => !excluded.includes(p.kat) && matchesCsv(p.id_model, model.id_model)
  );
  const accessories: Prislusenstvi[] = [];

  for (const cat of povinneKategorie) {
    if (cat === 'BOČNICE') continue; // handled via bocnice selector
    const cheapest = available
      .filter(a => a.kat === cat)
      .sort((a, b) => a.cena_czk - b.cena_czk)[0];
    if (cheapest && !accessories.some(a => a.id_doplnek === cheapest.id_doplnek)) {
      accessories.push(cheapest);
    }
  }

  return { selectedRozmer: rozmer, selectedPodvozek: podvozek, selectedBocnice: bocnice, selectedAccessories: accessories };
}

export function useConfigurator(data: VozikyData) {
  const [state, setState] = useState<ConfigState>({
    selectedModel: null,
    selectedRozmer: null,
    selectedPodvozek: null,
    selectedBocnice: null,
    selectedAccessories: [],
  });

  // Load config from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('config');
    if (code) {
      const decoded = decodeConfig(data, code);
      if (decoded) {
        setState(decoded);
      }
    }
  }, [data]);

  // Select model → auto-pick cheapest defaults for downstream selections
  const selectModel = useCallback((model: Model) => {
    setState(prev => {
      if (prev.selectedModel?.id_model === model.id_model) return prev;
      return {
        selectedModel: model,
        ...getDefaults(data, model),
      };
    });
  }, [data]);

  // Select dimension → auto-pick cheapest compatible chassis + bocnice
  const selectRozmer = useCallback((rozmer: Rozmer) => {
    const cheapestPodvozek = data.podvozky
      .filter(p => {
        const min = p.min_plocha_m2 ?? 0;
        const max = p.max_plocha_m2 ?? Infinity;
        return rozmer.plocha_m2 >= min && rozmer.plocha_m2 <= max;
      })
      .sort((a, b) => a.priplatek_czk - b.priplatek_czk)[0] ?? null;

    setState(prev => {
      // Re-pick bocnice for the new rozmer
      let bocnice = prev.selectedBocnice;
      if (prev.selectedModel) {
        const povinne = splitCsv(prev.selectedModel.povinna_kategorie);
        if (povinne.includes('BOČNICE')) {
          const bocniceOptions = data.bocnice
            .filter(b => {
              const min = b.min_plocha_m2 ?? 0;
              const max = b.max_plocha_m2 ?? Infinity;
              return matchesCsv(b.id_model, prev.selectedModel!.id_model) && rozmer.plocha_m2 >= min && rozmer.plocha_m2 <= max;
            })
            .sort((a, b) => a.priplatek_czk - b.priplatek_czk);
          bocnice = bocniceOptions[0] ?? null;
        }
      }

      return {
        ...prev,
        selectedRozmer: rozmer,
        selectedPodvozek: cheapestPodvozek,
        selectedBocnice: bocnice,
        selectedAccessories: prev.selectedAccessories,
      };
    });
  }, [data]);

  // Select chassis
  const selectPodvozek = useCallback((podvozek: Podvozek) => {
    setState(prev => ({
      ...prev,
      selectedPodvozek: podvozek,
    }));
  }, []);

  // Select bocnice
  const selectBocnice = useCallback((bocnice: Bocnice) => {
    setState(prev => ({
      ...prev,
      selectedBocnice: bocnice,
    }));
  }, []);

  // Toggle accessory with dependency/exclusion logic
  const toggleAccessory = useCallback((accessory: Prislusenstvi) => {
    setState(prev => {
      const isSelected = prev.selectedAccessories.some(a => a.id_doplnek === accessory.id_doplnek);

      if (isSelected) {
        // Removing: also remove anything that requires this accessory
        const removed = prev.selectedAccessories.filter(a => {
          if (a.id_doplnek === accessory.id_doplnek) return false;
          if (a.vyzaduje_id === accessory.id_doplnek) return false;
          return true;
        });
        return { ...prev, selectedAccessories: removed };
      } else {
        // Adding: remove excluded items, add required items
        let newList = [...prev.selectedAccessories];

        // Remove items excluded by this accessory
        if (accessory.vylucuje_id) {
          newList = newList.filter(a => a.id_doplnek !== accessory.vylucuje_id);
        }

        // Add the accessory
        newList.push(accessory);

        // Auto-add required dependency if not present
        if (accessory.vyzaduje_id) {
          const dep = data.prislusenstvi.find(p => p.id_doplnek === accessory.vyzaduje_id);
          if (dep && !newList.some(a => a.id_doplnek === dep.id_doplnek)) {
            newList.push(dep);
          }
        }

        return { ...prev, selectedAccessories: newList };
      }
    });
  }, [data.prislusenstvi]);

  // Filtered dimensions for selected model
  const availableRozmery = useMemo(() => {
    if (!state.selectedModel) return [];
    return data.rozmery.filter(r => matchesCsv(r.id_model, state.selectedModel!.id_model));
  }, [data.rozmery, state.selectedModel]);

  // Filtered podvozky for selected model and rozmer
  const availablePodvozky = useMemo(() => {
    if (!state.selectedModel || !state.selectedRozmer) return [];
    
    // Nápravy are now part of model
    // We only filter by min/max plocha_m2 ranges
    const plocha = state.selectedRozmer.plocha_m2;
    return data.podvozky.filter(p => {
      const min = p.min_plocha_m2 ?? 0;
      const max = p.max_plocha_m2 ?? Infinity;
      return plocha >= min && plocha <= max;
    });
  }, [data.podvozky, state.selectedModel, state.selectedRozmer]);

  // Filtered bocnice for selected model and rozmer
  const availableBocnice = useMemo(() => {
    if (!state.selectedModel || !state.selectedRozmer) return [];
    const plocha = state.selectedRozmer.plocha_m2;
    
    // Získat všechny bočnice pro daný model, jehož plocha zapadá striktně do min a max bounds
    return data.bocnice.filter(b => {
      const min = b.min_plocha_m2 ?? 0;
      const max = b.max_plocha_m2 ?? Infinity;
      return matchesCsv(b.id_model, state.selectedModel!.id_model) &&
             plocha >= min && plocha <= max;
    });
  }, [data.bocnice, state.selectedModel, state.selectedRozmer]);

  // Filtered accessories for selected model (filter by model AND excluded categories)
  const availableAccessories = useMemo(() => {
    if (!state.selectedModel) return [];
    const excluded = splitCsv(state.selectedModel.vyloucena_kategorie);
    return data.prislusenstvi.filter(
      p => !excluded.includes(p.kat) && matchesCsv(p.id_model, state.selectedModel!.id_model)
    );
  }, [data.prislusenstvi, state.selectedModel]);

  // Required accessory categories (excluding BOČNICE, which is handled separately)
  const requiredCategories = useMemo(() => {
    if (!state.selectedModel) return [];
    return splitCsv(state.selectedModel.povinna_kategorie).filter(c => c !== 'BOČNICE');
  }, [state.selectedModel]);

  // Is bocnice required for the current model?
  const isBocniceRequired = useMemo(() => {
    if (!state.selectedModel) return false;
    return splitCsv(state.selectedModel.povinna_kategorie).includes('BOČNICE');
  }, [state.selectedModel]);

  // Check if an accessory is disabled (excluded by another selected one)
  const isAccessoryDisabled = useCallback((accessory: Prislusenstvi): string | null => {
    for (const selected of state.selectedAccessories) {
      if (selected.vylucuje_id === accessory.id_doplnek) {
        return `Nelze kombinovat s: ${selected.nazev}`;
      }
    }
    return null;
  }, [state.selectedAccessories]);

  // Price breakdown
  const priceBreakdown: PriceBreakdown = useMemo(() => {
    const model = state.selectedModel?.zakladni_cena_czk ?? 0;
    const rozmer = state.selectedRozmer?.priplatek_czk ?? 0;
    const podvozek = state.selectedPodvozek?.priplatek_czk ?? 0;
    const bocnice = state.selectedBocnice?.priplatek_czk ?? 0;
    const accessories = state.selectedAccessories.map(a => ({
      name: a.nazev,
      price: a.cena_czk,
    }));
    const accTotal = accessories.reduce((sum, a) => sum + a.price, 0);

    return {
      model,
      rozmer,
      podvozek,
      bocnice,
      accessories,
      total: model + rozmer + podvozek + bocnice + accTotal,
    };
  }, [state]);

  // Config code
  const configCode = useMemo(() => encodeConfig(data, state), [data, state]);

  // Validation: are all required categories satisfied?
  const missingCategories = useMemo(() => {
    if (!state.selectedModel) return [];
    const missing: string[] = [];
    const povinne = splitCsv(state.selectedModel.povinna_kategorie);

    for (const cat of povinne) {
      if (cat === 'BOČNICE') {
        if (!state.selectedBocnice) missing.push('BOČNICE');
      } else {
        if (!state.selectedAccessories.some(a => a.kat === cat)) missing.push(cat);
      }
    }

    return missing;
  }, [state.selectedModel, state.selectedAccessories, state.selectedBocnice]);

  const isComplete = useMemo(() => {
    return (
      state.selectedModel !== null &&
      state.selectedRozmer !== null &&
      state.selectedPodvozek !== null &&
      missingCategories.length === 0
    );
  }, [state, missingCategories]);

  // Load from code
  const loadFromCode = useCallback((code: string): boolean => {
    const decoded = decodeConfig(data, code);
    if (decoded) {
      setState(decoded);
      return true;
    }
    return false;
  }, [data]);

  return {
    state,
    selectModel,
    selectRozmer,
    selectPodvozek,
    selectBocnice,
    toggleAccessory,
    availableRozmery,
    availablePodvozky,
    availableBocnice,
    availableAccessories,
    requiredCategories,
    isBocniceRequired,
    isAccessoryDisabled,
    priceBreakdown,
    configCode,
    missingCategories,
    isComplete,
    loadFromCode,
  };
}
