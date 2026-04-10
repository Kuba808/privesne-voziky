import { useState } from 'react';

interface ConfigCodeModalProps {
  configCode: string;
  shareUrl: string;
  onClose: () => void;
  onLoadCode: (code: string) => boolean;
}

/**
 * Modal for viewing/copying/loading configuration codes.
 */
export function ConfigCodeModal({ configCode, shareUrl, onClose, onLoadCode }: ConfigCodeModalProps) {
  const [loadInput, setLoadInput] = useState('');
  const [loadError, setLoadError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleLoad = () => {
    const success = onLoadCode(loadInput.trim());
    if (!success) {
      setLoadError('Neplatný kód konfigurace');
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label="Kód konfigurace">
        <div className="modal-title">Kód konfigurace</div>

        {configCode ? (
          <>
            <div className="modal-code">
              <span className="modal-code-value">{configCode}</span>
              <button
                className="btn"
                onClick={() => copyToClipboard(configCode, 'code')}
                style={{ flexShrink: 0 }}
              >
                {copied === 'code' ? '✓ Zkopírováno' : 'Kopírovat'}
              </button>
            </div>

            <button
              className="btn"
              onClick={() => copyToClipboard(shareUrl, 'url')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 16, height: 16 }}>
                <path d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-3" />
                <path d="M9 1h6v6M15 1L7 9" />
              </svg>
              {copied === 'url' ? '✓ Odkaz zkopírován' : 'Kopírovat odkaz pro sdílení'}
            </button>
          </>
        ) : (
          <div style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            Pro vygenerování kódu dokončete konfiguraci.
          </div>
        )}

        <div className="modal-divider">nebo</div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          Načíst existující konfiguraci
        </div>
        <div className="modal-load-row">
          <input
            className="form-input"
            type="text"
            placeholder="VZK-123-0A5"
            value={loadInput}
            onChange={(e) => {
              setLoadInput(e.target.value.toUpperCase());
              setLoadError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
          <button className="btn" onClick={handleLoad} disabled={!loadInput.trim()}>
            Načíst
          </button>
        </div>
        {loadError && (
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: 4 }}>
            {loadError}
          </div>
        )}

        <button className="modal-close" onClick={onClose}>
          Zavřít
        </button>
      </div>
    </div>
  );
}
