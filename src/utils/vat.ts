export const VAT_RATE = 0.21;

export function applyVat(price: number, withVat: boolean): number {
  return withVat ? Math.round(price * (1 + VAT_RATE)) : price;
}

export function vatLabel(withVat: boolean): string {
  return withVat ? 'vč. DPH' : 'bez DPH';
}
