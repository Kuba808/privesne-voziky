import { useEffect, useRef } from 'react';

interface SectionNavProps {
  sections: { id: string; label: string }[];
  activeSection: string;
}

export function SectionNav({ sections, activeSection }: SectionNavProps) {
  const navRef = useRef<HTMLElement>(null);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activeBtn = nav.querySelector<HTMLButtonElement>('.section-nav-item.active');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeSection]);

  return (
    <nav className="section-nav" ref={navRef} aria-label="Sekce konfigurátoru">
      {sections.map((s) => (
        <button
          key={s.id}
          className={`section-nav-item ${activeSection === s.id ? 'active' : ''}`}
          onClick={() => scrollTo(s.id)}
          aria-current={activeSection === s.id ? 'true' : undefined}
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
}
