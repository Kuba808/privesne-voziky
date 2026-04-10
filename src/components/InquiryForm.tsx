import { useState } from 'react';

interface InquiryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { firstName: string; lastName: string; email: string }) => void;
}

/**
 * Expandable inquiry form with name, surname, and email fields.
 * Validates email format before submission.
 */
export function InquiryForm({ isOpen, onClose, onSubmit }: InquiryFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Zavření přes Escape
  import('react').then(R => {
    R.useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'Vyplňte jméno';
    if (!lastName.trim()) newErrors.lastName = 'Vyplňte příjmení';
    if (!email.trim()) {
      newErrors.email = 'Vyplňte e-mail';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Neplatný formát e-mailu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() });
      setFirstName('');
      setLastName('');
      setEmail('');
      setErrors({});
    }
  };

  return (
    <div className={`inquiry-modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} aria-hidden={!isOpen}>
      <div className="inquiry-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="inquiry-title">
        <div className="drawer-header">
          <h3 id="inquiry-title">Nezávazná poptávka</h3>
          <button type="button" className="drawer-close-btn" onClick={onClose} aria-label="Zavřít zobrazení">×</button>
        </div>
        <div className="drawer-content">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="inquiry-firstname">Jméno</label>
                <input
                  id="inquiry-firstname"
                  className={`form-input ${errors.firstName ? 'error' : ''}`}
                  type="text"
                  placeholder="Např. Jan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                {errors.firstName && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: 4 }}>
                    {errors.firstName}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="inquiry-lastname">Příjmení</label>
                <input
                  id="inquiry-lastname"
                  className={`form-input ${errors.lastName ? 'error' : ''}`}
                  type="text"
                  placeholder="Např. Novák"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                {errors.lastName && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: 4 }}>
                    {errors.lastName}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" htmlFor="inquiry-email">E-mail</label>
              <input
                id="inquiry-email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                type="email"
                placeholder="jan.novak@email.cz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: 4 }}>
                  {errors.email}
                </div>
              )}
            </div>
            <button type="submit" className="btn-submit" style={{ width: '100%', padding: '14px', fontSize: '1.05rem' }}>
              Odeslat poptávku
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
              Odesláním souhlasíte se zpracováním osobních údajů.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
