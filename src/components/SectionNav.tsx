interface SectionNavProps {
  sections: { id: string; label: string }[];
  activeSection: string;
}

/**
 * Sticky horizontal navigation bar that highlights the current section.
 */
export function SectionNav({ sections, activeSection }: SectionNavProps) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="section-nav" aria-label="Sekce konfigurátoru">
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
