"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CommandPalette } from "./CommandPalette";

const NAV = [
  {
    href: "/",
    label: "Overview",
    icon: <path d="M3 13h4v8H3zM10 8h4v13h-4zM17 3h4v18h-4z" />,
  },
  {
    href: "/customers",
    label: "Customers",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.7 3 2.4 3.5 5.2" />
      </>
    ),
  },
];

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--color-accent)" />
        <path d="M5 17h5l3-7 4 13 3-8 2 2h5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight">PulseBoard</span>
    </span>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [path]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Main">
      <Link href="/" className="mb-6 px-2">
        <Logo />
      </Link>
      <p className="px-2 pb-1 text-[11px] font-medium tracking-wider text-muted uppercase">Fernway workspace</p>
      {NAV.map((n) => {
        const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "bg-accent/10 text-accent" : "text-ink-2 hover:bg-page hover:text-ink"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {n.icon}
            </svg>
            {n.label}
          </Link>
        );
      })}
      <div className="mt-auto rounded-xl border border-line bg-page p-3 text-xs text-ink-2">
        <p className="font-medium text-ink">Demo data</p>
        <p className="mt-1">Fernway is a fictional SaaS company. All figures are generated.</p>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen border-e border-line bg-surface lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside className="absolute inset-y-0 start-0 w-64 bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-page/85 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setMenuOpen(true)} className="rounded-md p-1.5 hover:bg-surface lg:hidden" aria-label="Open menu">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="lg:hidden">
            <Logo />
          </span>

          <button
            onClick={() => setPaletteOpen(true)}
            className="ms-auto flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-muted hover:text-ink sm:w-72 lg:ms-0"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="hidden sm:inline">Search customers…</span>
            <kbd className="ms-auto hidden rounded border border-line px-1.5 text-[11px] sm:inline">Ctrl K</kbd>
          </button>

          <button onClick={toggleTheme} className="rounded-lg border border-line bg-surface p-2 hover:bg-page lg:ms-auto" aria-label="Toggle dark mode">
            <svg viewBox="0 0 24 24" className="h-4 w-4 dark:hidden" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinejoin="round" />
            </svg>
            <svg viewBox="0 0 24 24" className="hidden h-4 w-4 dark:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </button>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/15 text-xs font-semibold text-accent" title="Demo user">
            DU
          </span>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
