/**
 * Accessory pricing helper.
 * Some accessories (e.g. plachty, nástavby) scale with the trailer's floor area.
 * They define a per-m² rate and an optional minimum price; final price is:
 *   max(min_cena_czk, cena_czk + plocha_m2 * cena_za_m2_czk)
 */

import type { Prislusenstvi, Rozmer } from '../types/configurator';

export function getAccessoryPrice(
  accessory: Prislusenstvi,
  rozmer: Rozmer | null,
): number {
  const ratePerM2 = accessory.cena_za_m2_czk ?? 0;
  if (ratePerM2 === 0) return accessory.cena_czk;

  const plocha = rozmer?.plocha_m2 ?? 0;
  const computed = accessory.cena_czk + Math.round(ratePerM2 * plocha);
  const floor = accessory.min_cena_czk ?? 0;
  return Math.max(floor, computed);
}

export function hasPlochaScaling(accessory: Prislusenstvi): boolean {
  return (accessory.cena_za_m2_czk ?? 0) > 0;
}
