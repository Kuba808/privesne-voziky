/** Types matching the voziky.json data structure */

export interface Model {
  id_model: string;
  nazev_modelu: string;
  zakladni_cena_czk: number;
  povinna_kategorie: string;
  vyloucena_kategorie: string;
  naprav: number;
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

export interface Prislusenstvi {
  id_doplnek: string;
  id_model: string;
  kat: string;
  nazev: string;
  cena_czk: number;
  vyzaduje_id: string | null;
  vylucuje_id: string | null;
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
