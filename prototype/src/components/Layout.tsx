"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import RuntimeIndicator from "./RuntimeIndicator";
import BridgeToastContainer from "./BridgeToastContainer";
import OfflineBanner from "./OfflineBanner";

const navLinks = [
  { href: "/", label: "Issues" },
  { href: "/cells", label: "Cells" },
  { href: "/anchors", label: "Anchors" },
  { href: "/issues/new", label: "Create" },
  { href: "/activity", label: "My Activity" },
];

const mobileLinks = [
  { href: "/", label: "🏠", title: "Home" },
  { href: "/cells", label: "🏘️", title: "Cells" },
  { href: "/issues/new", label: "➕", title: "Create" },
  { href: "/vote", label: "🗳️", title: "Vote" },
  { href: "/activity", label: "👤", title: "Activity" },
];

const sideLinks = [
  { href: "/delegation", label: "Delegation", icon: "🪪" },
  { href: "/implementation", label: "Implementation", icon: "🛠️" },
  { href: "/reward", label: "Rewards & Impact", icon: "✨" },
  { href: "/activity", label: "Profile", icon: "👤" },
  { href: "/anchors", label: "Anchors", icon: "📍" },
  { href: "/onboarding", label: "Welcome tour", icon: "📚" },
];

export default function Layout({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      {/* Glass top bar — warm tones bleed through on scroll. */}
      <header className="sticky top-0 z-50 bg-surface/70 backdrop-blur-[16px]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link
              href="/"
              className="font-display text-2xl font-bold tracking-tight text-primary-dim"
            >
              Kindact
            </Link>
            <nav className="hidden md:flex gap-6">
              {navLinks.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`font-display italic text-lg transition-colors pb-1 ${
                      active
                        ? "text-primary-dim border-b-2 border-primary-dim"
                        : "text-on-surface-variant hover:text-primary-dim"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <RuntimeIndicator />
            <div className="hidden md:flex items-center px-3 py-1 bg-surface-container rounded-full font-meta text-sm font-medium text-on-primary-container">
              142.3 $CC
            </div>
            <button
              className="relative w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
              title="Notifications"
              aria-label="Notifications"
            >
              🔔
              <span className="absolute top-2 right-2 w-2 h-2 bg-status-implementing rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center font-meta text-sm font-medium text-on-primary-container">
              J
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Side nav (desktop) — secondary nav, kept one click away */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 px-3 py-6 gap-1 sticky top-16 h-[calc(100vh-4rem)]">
          <div className="px-3 mb-4">
            <h2 className="font-display font-semibold text-primary-dim">
              The Civic Archive
            </h2>
            <p className="font-meta text-[10px] uppercase tracking-widest text-on-surface-variant mt-0.5">
              Governance Hub
            </p>
          </div>
          {sideLinks.map((l) => (
            <Link
              key={`${l.href}-${l.label}`}
              href={l.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              <span className="text-base">{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          ))}
          <div className="mt-auto pt-4">
            <Link
              href="/anchors"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </Link>
          </div>
        </aside>

        {/* Page content */}
        <main
          className={`flex-1 w-full px-4 md:px-8 py-8 pb-24 md:pb-10 space-y-6 ${
            wide ? "max-w-7xl" : "max-w-5xl"
          } mx-auto`}
        >
          <OfflineBanner />
          {children}
        </main>
      </div>

      {/* Bridge-pending toasts */}
      <BridgeToastContainer />

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface/85 backdrop-blur-[16px] z-50">
        <div className="flex justify-around py-1">
          {mobileLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col items-center text-xs gap-0.5 min-w-[44px] min-h-[44px] justify-center px-3 ${
                pathname === l.href
                  ? "text-primary-dim"
                  : "text-on-surface-variant"
              }`}
            >
              <span className="text-xl">{l.label}</span>
              <span className="font-meta">{l.title}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
