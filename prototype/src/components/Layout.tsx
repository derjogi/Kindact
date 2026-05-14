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

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Desktop top bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-lg font-semibold text-stone-800">
              Kindact
            </Link>
            <nav className="hidden md:flex gap-6">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`text-sm transition-colors ${
                    pathname === l.href
                      ? "text-stone-900 font-medium"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-stone-500">
            <RuntimeIndicator />
            <span className="hidden sm:inline">142.3 $CC</span>
            <button className="relative min-w-[44px] min-h-[44px] flex items-center justify-center" title="Notifications">
              🔔
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-20 md:pb-6 space-y-4">
        <OfflineBanner />
        {children}
      </main>

      {/* Bridge-pending toasts */}
      <BridgeToastContainer />

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 z-50">
        <div className="flex justify-around py-1">
          {mobileLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col items-center text-xs gap-0.5 min-w-[44px] min-h-[44px] justify-center px-3 ${
                pathname === l.href ? "text-stone-900" : "text-stone-400"
              }`}
            >
              <span className="text-xl">{l.label}</span>
              <span>{l.title}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
