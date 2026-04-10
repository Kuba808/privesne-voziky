/**
 * Encode/decode configuration state into a shareable compact code.
 *
 * Format: VZK-{model index (1 hex)}{rozmer index (1 hex)}{podvozek index (1 hex)}{bocnice index (1 hex)}-{accessory bitfield (hex)}
 * Bocnice index is 'X' when no bocnice is selected.
 * Example: VZK-1230-00A
 */

import type { VozikyData, ConfigState } from '../types/configurator';

export function encodeConfig(data: VozikyData, state: ConfigState): string {
  if (!state.selectedModel || !state.selectedRozmer || !state.selectedPodvozek) {
    return '';
  }

  const modelIdx = data.modely.findIndex(m => m.id_model === state.selectedModel!.id_model);
  const rozmerIdx = data.rozmery.findIndex(r => r.id_rozmer === state.selectedRozmer!.id_rozmer);
  const podvozekIdx = data.podvozky.findIndex(p => p.id_podvozek === state.selectedPodvozek!.id_podvozek);
  const bocniceIdx = state.selectedBocnice
    ? data.bocnice.findIndex(b => b.id_bocnice === state.selectedBocnice!.id_bocnice)
    : -1;

  if (modelIdx < 0 || rozmerIdx < 0 || podvozekIdx < 0) return '';

  // Accessory bitfield: each bit = one accessory selected
  let accBits = 0;
  for (const acc of state.selectedAccessories) {
    const accIdx = data.prislusenstvi.findIndex(p => p.id_doplnek === acc.id_doplnek);
    if (accIdx >= 0) {
      accBits |= (1 << accIdx);
    }
  }

  const bocniceHex = bocniceIdx >= 0 ? bocniceIdx.toString(16).toUpperCase() : 'X';
  const core = `${modelIdx.toString(16).toUpperCase()}${rozmerIdx.toString(16).toUpperCase()}${podvozekIdx.toString(16).toUpperCase()}${bocniceHex}`;
  const accHex = accBits.toString(16).toUpperCase().padStart(3, '0');

  return `VZK-${core}-${accHex}`;
}

export function decodeConfig(data: VozikyData, code: string): ConfigState | null {
  const match = code.match(/^VZK-([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-fXx])-([0-9A-Fa-f]+)$/);
  if (!match) return null;

  const modelIdx = parseInt(match[1], 16);
  const rozmerIdx = parseInt(match[2], 16);
  const podvozekIdx = parseInt(match[3], 16);
  const bocniceChar = match[4].toUpperCase();
  const accBits = parseInt(match[5], 16);

  const selectedModel = data.modely[modelIdx] ?? null;
  const selectedRozmer = data.rozmery[rozmerIdx] ?? null;
  const selectedPodvozek = data.podvozky[podvozekIdx] ?? null;
  const selectedBocnice = bocniceChar === 'X' ? null : (data.bocnice[parseInt(bocniceChar, 16)] ?? null);

  if (!selectedModel || !selectedRozmer || !selectedPodvozek) return null;

  const selectedAccessories = data.prislusenstvi.filter((_, i) => (accBits & (1 << i)) !== 0);

  return { selectedModel, selectedRozmer, selectedPodvozek, selectedBocnice, selectedAccessories };
}

export function getShareUrl(code: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}?config=${encodeURIComponent(code)}`;
}
