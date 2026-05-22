/**
 * Centralized evaluation of accessory dependency rules.
 * Decides whether an accessory is available, disabled (greyed out with reason),
 * or hidden entirely. Data-driven: rules live in voziky.json.
 */

import type {
  Prislusenstvi,
  Bocnice,
  Model,
  AccessoryAvailability,
} from '../types/configurator';

function matchesCsv(csv: string, value: string): boolean {
  return csv.split(',').map(s => s.trim()).includes(value);
}

interface EvalContext {
  model: Model | null;
  bocnice: Bocnice | null;
  selectedAccessories: Prislusenstvi[];
}

/**
 * Evaluate an accessory's availability against current selections.
 * Returns its display state and (for disabled) the human-readable reason.
 */
export function evaluateAccessory(
  accessory: Prislusenstvi,
  ctx: EvalContext,
): AccessoryAvailability {
  // Model compatibility — always blocks; the configured chovani_pri_nesplneni
  // decides whether this blocking shows as disabled or hidden.
  if (ctx.model && !matchesCsv(accessory.id_model, ctx.model.id_model)) {
    return {
      state: accessory.chovani_pri_nesplneni === 'hidden' ? 'hidden' : 'disabled',
      reason: accessory.hlaska_disabled || `Nedostupné pro model ${ctx.model.nazev_modelu}.`,
    };
  }

  // Excluded by an already-selected accessory
  for (const sel of ctx.selectedAccessories) {
    if (sel.vylucuje_id.includes(accessory.id_doplnek)) {
      return {
        state: 'disabled',
        reason: `Nelze kombinovat s: ${sel.nazev}`,
      };
    }
  }

  // Required bocnice — at least one of the listed bocnice IDs must be selected
  if (accessory.vyzaduje_bocnici_jeden_z.length > 0) {
    const ok = ctx.bocnice && accessory.vyzaduje_bocnici_jeden_z.includes(ctx.bocnice.id_bocnice);
    if (!ok) {
      return {
        state: accessory.chovani_pri_nesplneni,
        reason: accessory.hlaska_disabled || 'Vyžaduje konkrétní typ bočnic.',
      };
    }
  }

  // Required accessories — ALL of these must be selected
  for (const reqId of accessory.vyzaduje_id) {
    if (!ctx.selectedAccessories.some(a => a.id_doplnek === reqId)) {
      return {
        state: accessory.chovani_pri_nesplneni,
        reason: accessory.hlaska_disabled || `Vyžaduje doplněk: ${reqId}`,
      };
    }
  }

  // Required-one-of accessories — at least one must be selected
  if (accessory.vyzaduje_id_jeden_z.length > 0) {
    const ok = ctx.selectedAccessories.some(a =>
      accessory.vyzaduje_id_jeden_z.includes(a.id_doplnek),
    );
    if (!ok) {
      return {
        state: accessory.chovani_pri_nesplneni,
        reason: accessory.hlaska_disabled || 'Vyžaduje jeden z navazujících doplňků.',
      };
    }
  }

  return { state: 'available', reason: '' };
}
