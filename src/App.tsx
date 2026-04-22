import { useState, useEffect, useCallback, useMemo } from 'react';
import type { VozikyData } from './types/configurator';
import { useConfigurator } from './hooks/useConfigurator';
import { getShareUrl } from './utils/configCode';
import { exportPDF } from './utils/pdfExport';
import { SectionNav } from './components/SectionNav';
import { ModelSelector } from './components/ModelSelector';
import { DimensionSelector } from './components/DimensionSelector';
import { ChassisSelector } from './components/ChassisSelector';
import { BocniceSelector } from './components/BocniceSelector';
import { AccessorySelector } from './components/AccessorySelector';
import { RPGVisualizer } from './components/RPGVisualizer';
import { SummarySection } from './components/SummarySection';
import { InquiryForm } from './components/InquiryForm';
import { PriceBar } from './components/PriceBar';
import { ConfigCodeModal } from './components/ConfigCodeModal';
import { Snackbar } from './components/Snackbar';

const SECTIONS = [
  { id: 'section-model', label: 'Model' },
  { id: 'section-rozmer', label: 'Rozměr' },
  { id: 'section-podvozek', label: 'Podvozek' },
  { id: 'section-bocnice', label: 'Bočnice' },
  { id: 'section-prislusenstvi', label: 'Příslušenství' },
  { id: 'section-souhrn', label: 'Souhrn' },
];

export default function App() {
  const [data, setData] = useState<VozikyData | null>(null);
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [vatIncluded, setVatIncluded] = useState(true);
  const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Load data
  useEffect(() => {
    import('../voziky.json')
      .then((module) => setData(module.default as unknown as VozikyData))
      .catch((err) => console.error('Failed to load voziky.json', err));
  }, []);

  // IntersectionObserver for active section tracking
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [data]);

  if (!data) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>Načítání konfigurátoru…</div>
        </div>
      </div>
    );
  }

  return <AppContent data={data} activeSection={activeSection} showCodeModal={showCodeModal} setShowCodeModal={setShowCodeModal} showInquiry={showInquiry} setShowInquiry={setShowInquiry} vatIncluded={vatIncluded} onToggleVat={() => setVatIncluded(v => !v)} snackbar={snackbar} setSnackbar={setSnackbar} />;
}

function AppContent({
  data,
  activeSection,
  showCodeModal,
  setShowCodeModal,
  showInquiry,
  setShowInquiry,
  vatIncluded,
  onToggleVat,
  snackbar,
  setSnackbar,
}: {
  data: VozikyData;
  activeSection: string;
  showCodeModal: boolean;
  setShowCodeModal: (v: boolean) => void;
  showInquiry: boolean;
  setShowInquiry: (v: boolean) => void;
  vatIncluded: boolean;
  onToggleVat: () => void;
  snackbar: { message: string; type: 'success' | 'error' | 'info' } | null;
  setSnackbar: (v: { message: string; type: 'success' | 'error' | 'info' } | null) => void;
}) {
  const {
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
  } = useConfigurator(data);

  const shareUrl = useMemo(() => (configCode ? getShareUrl(configCode) : ''), [configCode]);

  // Available accessory categories (unique from available accessories)
  const availableAccCategories = useMemo(() => {
    const cats = new Set(availableAccessories.map((a) => a.kat));
    return Array.from(cats);
  }, [availableAccessories]);

  const handleDownloadPDF = useCallback(async () => {
    if (isComplete && configCode) {
      setSnackbar({ message: 'Generuji PDF dokument...', type: 'info' });
      await exportPDF(state, priceBreakdown, configCode);
      setSnackbar({ message: 'PDF bylo úspěšně staženo', type: 'success' });
    }
  }, [isComplete, configCode, state, priceBreakdown, setSnackbar]);

  const handleShareLink = useCallback(() => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setSnackbar({ message: 'Odkaz byl zkopírován do schránky', type: 'success' });
      });
    }
  }, [shareUrl, setSnackbar]);

  const handleInquirySubmit = useCallback(() => {
    setShowInquiry(false);
    setSnackbar({ message: 'Poptávka byla úspěšně odeslána.', type: 'success' });
  }, [setShowInquiry, setSnackbar]);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <svg className="logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Hlavní ložná plocha */}
              <rect x="8" y="12" width="22" height="8" rx="2" fill="var(--accent-blue)" />
              {/* Podvozek */}
              <rect x="7" y="20" width="22" height="3" rx="1.5" fill="var(--text-secondary)" />
              {/* Tažné oje */}
              <path d="M2 19L7 21.5V19.5L2 19Z" fill="var(--text-secondary)" />
              <circle cx="2" cy="19" r="1.5" fill="var(--accent-blue)" />
              {/* Kola - dvounáprava */}
              <circle cx="15" cy="24" r="4" fill="var(--text-primary)" />
              <circle cx="15" cy="24" r="1.5" fill="var(--bg-card)" />
              
              <circle cx="23" cy="24" r="4" fill="var(--text-primary)" />
              <circle cx="23" cy="24" r="1.5" fill="var(--bg-card)" />
              
              {/* Linie na bočnici */}
              <rect x="13" y="12" width="1" height="8" fill="#ffffff" opacity="0.3" />
              <rect x="18" y="12" width="1" height="8" fill="#ffffff" opacity="0.3" />
              <rect x="23" y="12" width="1" height="8" fill="#ffffff" opacity="0.3" />
            </svg>
            Konfigurátor vozíků
          </div>
          <SectionNav sections={SECTIONS} activeSection={activeSection} />
        </div>
      </header>

      {/* Main content */}
      <main className="main-layout">
        {/* Left: RPG Visualizer (desktop/tablet) */}
        <aside className="visualizer-panel visualizer-panel--desktop" aria-label="Vizualizace konfigurace">
          <RPGVisualizer
            selectedModel={state.selectedModel}
            selectedBocnice={state.selectedBocnice}
            selectedAccessories={state.selectedAccessories}
            availableAccessoryCategories={availableAccCategories}
          />
        </aside>

        {/* Right: Configuration panels */}
        <div className="config-panel">
          <ModelSelector
            models={data.modely}
            selected={state.selectedModel}
            onSelect={selectModel}
          />

          <DimensionSelector
            dimensions={availableRozmery}
            selected={state.selectedRozmer}
            onSelect={selectRozmer}
          />

          <ChassisSelector
            chassis={availablePodvozky}
            selected={state.selectedPodvozek}
            onSelect={selectPodvozek}
          />

          <BocniceSelector
            bocnice={availableBocnice}
            selected={state.selectedBocnice}
            isRequired={isBocniceRequired}
            onSelect={selectBocnice}
          />

          <AccessorySelector
            accessories={availableAccessories}
            selected={state.selectedAccessories}
            requiredCategories={requiredCategories}
            vatIncluded={vatIncluded}
            onToggle={toggleAccessory}
            isDisabled={isAccessoryDisabled}
          />

          {/* Mobile-only inline visualizer */}
          <aside className="visualizer-panel visualizer-panel--mobile" aria-label="Vizualizace konfigurace">
            <RPGVisualizer
              selectedModel={state.selectedModel}
              selectedBocnice={state.selectedBocnice}
              selectedAccessories={state.selectedAccessories}
              availableAccessoryCategories={availableAccCategories}
            />
          </aside>

          <SummarySection
            price={priceBreakdown}
            configCode={configCode}
            isComplete={isComplete}
            missingCategories={missingCategories}
            vatIncluded={vatIncluded}
            onSaveCode={() => setShowCodeModal(true)}
            onDownloadPDF={handleDownloadPDF}
            onShareLink={handleShareLink}
            onInquiry={() => setShowInquiry(!showInquiry)}
          />

          <InquiryForm isOpen={showInquiry} onClose={() => setShowInquiry(false)} onSubmit={handleInquirySubmit} />
        </div>
      </main>

      {/* Sticky price footer */}
      <PriceBar price={priceBreakdown} vatIncluded={vatIncluded} onToggleVat={onToggleVat} />

      {/* Config code modal */}
      {showCodeModal && (
        <ConfigCodeModal
          configCode={configCode}
          shareUrl={shareUrl}
          onClose={() => setShowCodeModal(false)}
          onLoadCode={loadFromCode}
        />
      )}

      {/* Snackbar */}
      {snackbar && (
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          onClose={() => setSnackbar(null)}
        />
      )}
    </div>
  );
}
