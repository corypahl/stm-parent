"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { routePath, sitePath } from "../lib/site-path";
import { GradeFilter } from "./GradeFilter";
import { GradeFilterProvider } from "./GradeFilterProvider";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/calendar", label: "Events" },
  { href: "/lunch", label: "Lunch" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/handbook", label: "Handbook" },
  { href: "/staff", label: "Contacts" },
  { href: "/archive", label: "Archive" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activePath = routePath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <GradeFilterProvider>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="preview-ribbon">
        <span>Prototype</span>
        Sample newsletter content is clearly marked. Always verify official school communications.
      </div>
      <header className="site-header">
        <div className="site-header__top page-width">
          <a className="brand" href={sitePath("/")} aria-label="St. Martha School unofficial parent site home">
            <span className="brand__mark" aria-hidden="true">
              M
            </span>
            <span>
              <span className="brand__school">St. Martha School</span>
              <span className="brand__name">Unofficial Parent Site</span>
            </span>
          </a>
          <div className="header-actions">
            <a className="official-link" href="https://st-martha.org/school" target="_blank" rel="noreferrer">
              Official school site <span aria-hidden="true">↗</span>
            </a>
            <button
              type="button"
              className="menu-button"
              aria-expanded={menuOpen}
              aria-controls="primary-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
              <span>{menuOpen ? "Close" : "Menu"}</span>
            </button>
          </div>
        </div>
        <nav
          className={`primary-nav ${menuOpen ? "primary-nav--open" : ""}`}
          id="primary-navigation"
          aria-label="Primary navigation"
        >
          <div className="page-width primary-nav__inner">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={sitePath(item.href)}
                className={activePath === item.href ? "active" : ""}
                aria-current={activePath === item.href ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      </header>
      <div className="filter-wrap">
        <div className="page-width">
          <GradeFilter />
        </div>
      </div>
      <main id="main-content" className="page-width main-content">
        {children}
      </main>
      <footer className="site-footer">
        <div className="page-width footer-grid">
          <div>
            <p className="footer-title">St. Martha School · Unofficial Parent Site</p>
            <p>
              An unofficial, parent-created prototype for making weekly school information easier to find.
            </p>
          </div>
          <div>
            <p className="footer-title">Verify important details</p>
            <p>
              This resource is not operated or endorsed by St. Martha School. Refer to official school communications for authoritative information.
            </p>
          </div>
          <div className="footer-links">
            <a href="https://st-martha.org/school" target="_blank" rel="noreferrer">
              Official school site ↗
            </a>
            <a href="tel:+15173493322">School: (517) 349-3322</a>
            <span>1100 W. Grand River Ave., Okemos, MI</span>
          </div>
        </div>
      </footer>
    </GradeFilterProvider>
  );
}
