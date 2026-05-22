/** Types matching the voziky.json data structure */

export interface Model {
  id_model: string;
  nazev_modelu: string;
  zakladni_cena_czk: number;
  povinna_kategorie: string;
  vyloucena_kategorie: string;
  naprav: number;
  skryto_v_vyberu?: boolean;
  default_prislusenstvi?: string[];
  popis: string;
  popis_technika?: string;
}

export interface Rozmer {
  id_rozmer: string;
  id_model: string;
  delka_cm: number;
  sirka_cm: number;
  plocha_m2: number;
  priplatek_czk: number;
  kategorie_velikosti: string;
}

export interface Podvozek {
  id_podvozek: string;
  brzdeny: string;
  celkova_hmotnost_kg: number;
  priplatek_czk: number;
  min_plocha_m2?: number;
  max_plocha_m2?: number;
}

export interface Bocnice {
  id_bocnice: string;
  id_model: string;
  nazev: string;
  priplatek_czk: number;
  min_plocha_m2?: number;
  max_plocha_m2?: number;
}

export type SekceDoplnku = 'plachty' | 'pokrocile' | 'doplnky';
export type ChovaniPriNesplneni = 'disabled' | 'hidden';

export interface Prislusenstvi {
  id_doplnek: string;
  id_model: string;
  kat: string;
  sekce: SekceDoplnku;
  nazev: string;
  cena_czk: number;
  /** When set, final price = max(min_cena_czk ?? 0, cena_czk + plocha_m2 * cena_za_m2_czk). */
  cena_za_m2_czk?: number;
  min_cena_czk?: number;
  vyzaduje_id: string[];
  vyzaduje_id_jeden_z: string[];
  vyzaduje_bocnici_jeden_z: string[];
  vylucuje_id: string[];
  chovani_pri_nesplneni: ChovaniPriNesplneni;
  hlaska_disabled: string;
  poznamka: string;
  image: string;
}

export interface VozikyData {
  modely: Model[];
  rozmery: Rozmer[];
  podvozky: Podvozek[];
  bocnice: Bocnice[];
  prislusenstvi: Prislusenstvi[];
}

export interface ConfigState {
  selectedModel: Model | null;
  selectedRozmer: Rozmer | null;
  selectedPodvozek: Podvozek | null;
  selectedBocnice: Bocnice | null;
  selectedAccessories: Prislusenstvi[];
}

export interface PriceBreakdown {
  model: number;
  rozmer: number;
  podvozek: number;
  bocnice: number;
  accessories: { name: string; price: number }[];
  total: number;
}

export interface AccessoryAvailability {
  state: 'available' | 'disabled' | 'hidden';
  reason: string;
}
