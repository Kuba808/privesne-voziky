/**
 * Central configurator hook.
 * Manages all selection state, filtering logic, price calculation,
 * and config code generation.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  VozikyData,
  ConfigState,
  Model,
  Rozmer,
  Podvozek,
  Bocnice,
  Prislusenstvi,
  PriceBreakdown,
  AccessoryAvailability,
} from '../types/configurator';
import { encodeConfig, decodeConfig } from '../utils/configCode';
import { evaluateAccessory } from '../utils/dependencies';
import { getAccessoryPrice } from '../utils/price';

function matchesCsv(csv: string, value: string): boolean {
  return csv.split(',').includes(value);
}

function splitCsv(csv: string): string[] {
  return csv ? csv.split(',').map(s => s.trim()).filter(Boolean) : [];
}

interface AccessoryCleanupContext {
  model: Model | null;
  bocnice: Bocnice | null;
}

/**
 * Iteratively drop selected accessories that are no longer valid against the new context.
 * Removing one can cascade (an accessory required by another disappears, taking the
 * dependent with it), so we loop until stable.
 */
function cleanupAccessories(
  selected: Prislusenstvi[],
  ctx: AccessoryCleanupContext,
): Prislusenstvi[] {
  let result = [...selected];
  let changed = true;
  while (changed) {
    changed = false;
    for (const acc of [...result]) {
      const others = result.filter(a => a.id_doplnek !== acc.id_doplnek);
      const evalResult = evaluateAccessory(acc, {
        model: ctx.model,
        bocnice: ctx.bocnice,
        selectedAccessories: others,
      });
      if (evalResult.state !== 'available') {
        result = others;
        changed = true;
        break;
      }
    }
  }
  return result;
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
  const rozmery = data.rozmery
    .filter(r => matchesCsv(r.id_model, model.id_model))
    .sort((a, b) => a.priplatek_czk - b.priplatek_czk);
  const rozmer = rozmery[0] ?? null;

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

  const excluded = splitCsv(model.vyloucena_kategorie);
  const available = data.prislusenstvi.filter(
    p => !excluded.includes(p.kat) && matchesCsv(p.id_model, model.id_model),
  );
  const accessories: Prislusenstvi[] = [];

  for (const cat of povinneKategorie) {
    if (cat === 'BOČNICE') continue;
    const cheapest = available
      .filter(a => a.kat === cat)
      .sort((a, b) => a.cena_czk - b.cena_czk)[0];
    if (cheapest && !accessories.some(a => a.id_doplnek === cheapest.id_doplnek)) {
      accessories.push(cheapest);
    }
  }

  for (const id of (model.default_prislusenstvi ?? [])) {
    if (!accessories.some(a => a.id_doplnek === id)) {
      const acc = data.prislusenstvi.find(p => p.id_doplnek === id);
      if (acc) accessories.push(acc);
    }
  }

  return {
    selectedRozmer: rozmer,
    selectedPodvozek: podvozek,
    selectedBocnice: bocnice,
    selectedAccessories: accessories,
  };
}

export function useConfigurator(data: VozikyData) {
  const [state, setState] = useState<ConfigState>({
    selectedModel: null,
    selectedRozmer: null,
    selectedPodvozek: null,
    selectedBocnice: null,
    selectedAccessories: [],
  });

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

  const selectModel = useCallback((model: Model) => {
    setState(prev => {
      if (prev.selectedModel?.id_model === model.id_model) return prev;
      return {
        selectedModel: model,
        ...getDefaults(data, model),
      };
    });
  }, [data]);

  const selectRozmer = useCallback((rozmer: Rozmer) => {
    const cheapestPodvozek = data.podvozky
      .filter(p => {
        const min = p.min_plocha_m2 ?? 0;
        const max = p.max_plocha_m2 ?? Infinity;
        return rozmer.plocha_m2 >= min && rozmer.plocha_m2 <= max;
      })
      .sort((a, b) => a.priplatek_czk - b.priplatek_czk)[0] ?? null;

    setState(prev => {
      let bocnice = prev.selectedBocnice;
      if (prev.selectedModel) {
        const povinne = splitCsv(prev.selectedModel.povinna_kategorie);
        if (povinne.includes('BOČNICE')) {
          const bocniceOptions = data.bocnice
            .filter(b => {
              const min = b.min_plocha_m2 ?? 0;
              const max = b.max_plocha_m2 ?? Infinity;
              return matchesCsv(b.id_model, prev.selectedModel!.id_model) &&
                     rozmer.plocha_m2 >= min && rozmer.plocha_m2 <= max;
            })
            .sort((a, b) => a.priplatek_czk - b.priplatek_czk);
          // Keep current selection if still valid; otherwise pick cheapest.
          if (!bocnice || !bocniceOptions.some(b => b.id_bocnice === bocnice!.id_bocnice)) {
            bocnice = bocniceOptions[0] ?? null;
          }
        }
      }

      const cleanedAccessories = cleanupAccessories(prev.selectedAccessories, {
        model: prev.selectedModel,
        bocnice,
      });

      return {
        ...prev,
        selectedRozmer: rozmer,
        selectedPodvozek: cheapestPodvozek,
        selectedBocnice: bocnice,
        selectedAccessories: cleanedAccessories,
      };
    });
  }, [data]);

  const selectPodvozek = useCallback((podvozek: Podvozek) => {
    setState(prev => ({
      ...prev,
      selectedPodvozek: podvozek,
    }));
  }, []);

  const selectBocnice = useCallback((bocnice: Bocnice) => {
    setState(prev => {
      const cleanedAccessories = cleanupAccessories(prev.selectedAccessories, {
        model: prev.selectedModel,
        bocnice,
      });
      return {
        ...prev,
        selectedBocnice: bocnice,
        selectedAccessories: cleanedAccessories,
      };
    });
  }, []);

  const toggleAccessory = useCallback((accessory: Prislusenstvi) => {
    setState(prev => {
      const isSelected = prev.selectedAccessories.some(a => a.id_doplnek === accessory.id_doplnek);

      if (isSelected) {
        // Removing — also cascade-drop anything that requires this accessory.
        const without = prev.selectedAccessories.filter(a => a.id_doplnek !== accessory.id_doplnek);
        const cleaned = cleanupAccessories(without, {
          model: prev.selectedModel,
          bocnice: prev.selectedBocnice,
        });
        return { ...prev, selectedAccessories: cleaned };
      }

      // Adding — drop any items mutually excluded by the newcomer.
      let newList = prev.selectedAccessories.filter(a => !accessory.vylucuje_id.includes(a.id_doplnek));
      newList.push(accessory);

      // Auto-add required accessory IDs (AND list) that aren't already selected.
      for (const reqId of accessory.vyzaduje_id) {
        if (!newList.some(a => a.id_doplnek === reqId)) {
          const dep = data.prislusenstvi.find(p => p.id_doplnek === reqId);
          if (dep) newList.push(dep);
        }
      }

      return { ...prev, selectedAccessories: newList };
    });
  }, [data.prislusenstvi]);

  const availableRozmery = useMemo(() => {
    if (!state.selectedModel) return [];
    return data.rozmery.filter(r => matchesCsv(r.id_model, state.selectedModel!.id_model));
  }, [data.rozmery, state.selectedModel]);

  const availablePodvozky = useMemo(() => {
    if (!state.selectedModel || !state.selectedRozmer) return [];
    const plocha = state.selectedRozmer.plocha_m2;
    return data.podvozky.filter(p => {
      const min = p.min_plocha_m2 ?? 0;
      const max = p.max_plocha_m2 ?? Infinity;
      return plocha >= min && plocha <= max;
    });
  }, [data.podvozky, state.selectedModel, state.selectedRozmer]);

  const availableBocnice = useMemo(() => {
    if (!state.selectedModel || !state.selectedRozmer) return [];
    const plocha = state.selectedRozmer.plocha_m2;
    return data.bocnice.filter(b => {
      const min = b.min_plocha_m2 ?? 0;
      const max = b.max_plocha_m2 ?? Infinity;
      return matchesCsv(b.id_model, state.selectedModel!.id_model) &&
             plocha >= min && plocha <= max;
    });
  }, [data.bocnice, state.selectedModel, state.selectedRozmer]);

  /** Accessories eligible for the current model (model filter + excluded categories). */
  const modelAccessories = useMemo(() => {
    if (!state.selectedModel) return [];
    const excluded = splitCsv(state.selectedModel.vyloucena_kategorie);
    return data.prislusenstvi.filter(
      p => !excluded.includes(p.kat) && matchesCsv(p.id_model, state.selectedModel!.id_model),
    );
  }, [data.prislusenstvi, state.selectedModel]);

  /**
   * Pre-evaluated availability for every accessory in the catalog for the
   * current selection. UI components read this map to render disabled/hidden state.
   */
  const accessoryAvailability = useMemo(() => {
    const map = new Map<string, AccessoryAvailability>();
    for (const acc of data.prislusenstvi) {
      map.set(
        acc.id_doplnek,
        evaluateAccessory(acc, {
          model: state.selectedModel,
          bocnice: state.selectedBocnice,
          selectedAccessories: state.selectedAccessories,
        }),
      );
    }
    return map;
  }, [data.prislusenstvi, state.selectedModel, state.selectedBocnice, state.selectedAccessories]);

  const getAvailability = useCallback(
    (accessory: Prislusenstvi): AccessoryAvailability =>
      accessoryAvailability.get(accessory.id_doplnek) ?? { state: 'available', reason: '' },
    [accessoryAvailability],
  );

  /** Accessories visible in a given UI section. Hidden ones are filtered out here. */
  const accessoriesForSection = useCallback(
    (sekce: Prislusenstvi['sekce']) => {
      return modelAccessories.filter(acc => {
        if (acc.sekce !== sekce) return false;
        const ev = accessoryAvailability.get(acc.id_doplnek);
        return ev?.state !== 'hidden';
      });
    },
    [modelAccessories, accessoryAvailability],
  );

  const requiredCategories = useMemo(() => {
    if (!state.selectedModel) return [];
    return splitCsv(state.selectedModel.povinna_kategorie).filter(c => c !== 'BOČNICE');
  }, [state.selectedModel]);

  const isBocniceRequired = useMemo(() => {
    if (!state.selectedModel) return false;
    return splitCsv(state.selectedModel.povinna_kategorie).includes('BOČNICE');
  }, [state.selectedModel]);

  const priceBreakdown: PriceBreakdown = useMemo(() => {
    const model = state.selectedModel?.zakladni_cena_czk ?? 0;
    const rozmer = state.selectedRozmer?.priplatek_czk ?? 0;
    const podvozek = state.selectedPodvozek?.priplatek_czk ?? 0;
    const bocnice = state.selectedBocnice?.priplatek_czk ?? 0;
    const accessories = state.selectedAccessories.map(a => ({
      name: a.nazev,
      price: getAccessoryPrice(a, state.selectedRozmer),
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

  const configCode = useMemo(() => encodeConfig(data, state), [data, state]);

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
    modelAccessories,
    accessoriesForSection,
    getAvailability,
    requiredCategories,
    isBocniceRequired,
    priceBreakdown,
    configCode,
    missingCategories,
    isComplete,
    loadFromCode,
  };
}
