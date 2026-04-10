/**
 * PDF export utility using jsPDF.
 * Generates a summary document with configuration details and price breakdown.
 */

import { jsPDF } from 'jspdf';
import type { ConfigState, PriceBreakdown } from '../types/configurator';

export async function exportPDF(state: ConfigState, price: PriceBreakdown, configCode: string): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;
  let fontName = 'helvetica';

  try {
    const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf';
    const response = await fetch(fontUrl);
    const buffer = await response.arrayBuffer();
    
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    doc.addFileToVFS('Roboto-Regular.ttf', base64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal', 'Identity-H');

    // Místo Roboto-Bold pužijeme Roboto-Medium (plně dostupný přes tento CDN a dostatečně tučný)
    const boldUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf';
    const resBold = await fetch(boldUrl);
    const bufBold = await resBold.arrayBuffer();
    
    let binBold = '';
    const bytesBold = new Uint8Array(bufBold);
    for (let i = 0; i < bytesBold.byteLength; i++) {
        binBold += String.fromCharCode(bytesBold[i]);
    }
    const b64Bold = btoa(binBold);
    doc.addFileToVFS('Roboto-Bold.ttf', b64Bold);
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold', 'Identity-H');
    
    fontName = 'Roboto';
  } catch(e) {
    console.warn("Failed to load TTF font for jsPDF, diacritics might be broken");
  }

  // Header
  doc.setFillColor(10, 10, 15);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(22);
  doc.setFont(fontName, 'bold');
  doc.text('Konfigurátor Přívěsných Vozíků', margin, y + 12);

  doc.setFontSize(11);
  doc.setFont(fontName, 'normal');
  doc.text('Přehled vaší konfigurace', margin, y + 20);

  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(`Kód konfigurace: ${configCode}`, margin, y + 28);
  doc.text(`Datum: ${new Date().toLocaleDateString('cs-CZ')}`, pageWidth - margin - 40, y + 28);

  y = 55;
  doc.setTextColor(30, 30, 30);

  // Model section
  doc.setFontSize(14);
  doc.setFont(fontName, 'bold');
  doc.text('Vybraný model', margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont(fontName, 'normal');
  if (state.selectedModel) {
    doc.text(`${state.selectedModel.nazev_modelu} — ${state.selectedModel.popis}`, margin, y);
    y += 6;
    doc.text(`Základní cena: ${formatPrice(price.model)}`, margin, y);
    y += 10;
  }

  // Dimensions
  doc.setFontSize(14);
  doc.setFont(fontName, 'bold');
  doc.text('Rozměr ložné plochy', margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont(fontName, 'normal');
  if (state.selectedRozmer) {
    doc.text(
      `${state.selectedRozmer.delka_cm} × ${state.selectedRozmer.sirka_cm} cm (${state.selectedRozmer.plocha_m2} m²) — ${state.selectedRozmer.kategorie_velikosti}`,
      margin,
      y
    );
    y += 6;
    doc.text(`Příplatek: ${formatPrice(price.rozmer)}`, margin, y);
    y += 10;
  }

  // Chassis
  doc.setFontSize(14);
  doc.setFont(fontName, 'bold');
  doc.text('Podvozek', margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont(fontName, 'normal');
  if (state.selectedPodvozek) {
    const brzdeny = state.selectedPodvozek.brzdeny === 'ANO' ? 'brzděný' : 'nebrzděný';
    doc.text(
      `${brzdeny}, do ${state.selectedPodvozek.celkova_hmotnost_kg} kg`,
      margin,
      y
    );
    y += 6;
    doc.text(`Příplatek: ${formatPrice(price.podvozek)}`, margin, y);
    y += 10;
  }

  // Bocnice
  if (state.selectedBocnice) {
    doc.setFontSize(14);
    doc.setFont(fontName, 'bold');
    doc.text('Bočnice', margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont(fontName, 'normal');
    doc.text(`${state.selectedBocnice.nazev}`, margin, y);
    y += 6;
    doc.text(`Příplatek: ${formatPrice(price.bocnice)}`, margin, y);
    y += 10;
  }

  // Accessories
  if (price.accessories.length > 0) {
    doc.setFontSize(14);
    doc.setFont(fontName, 'bold');
    doc.text('Příslušenství', margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont(fontName, 'normal');
    for (const acc of price.accessories) {
      doc.text(`• ${acc.name}`, margin, y);
      doc.text(formatPrice(acc.price), pageWidth - margin - 30, y);
      y += 6;
    }
    y += 4;
  }

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Total
  doc.setFontSize(16);
  doc.setFont(fontName, 'bold');
  doc.text('Celková cena:', margin, y);
  doc.text(formatPrice(price.total), pageWidth - margin - 40, y);

  y += 15;
  doc.setFontSize(9);
  doc.setFont(fontName, 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Ceny jsou uvedeny bez DPH. Konfigurace je nezávazná.', margin, y);
  doc.text(`Pro objednání kontaktujte nás s kódem: ${configCode}`, margin, y + 5);

  doc.save(`konfigurace-${configCode}.pdf`);
}

function formatPrice(value: number): string {
  return value.toLocaleString('cs-CZ') + ' Kč';
}
