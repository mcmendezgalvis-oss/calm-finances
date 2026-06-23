import { Link, useLocation } from "@tanstack/react-router";
import { ReactNode, useEffect, useState } from "react";
import { LayoutDashboard, Wallet, Shield, Link2Off, Settings, Menu, X, FileText, Trophy } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useApp, daysLeft, isPremiumNow } from "@/store/useApp";
import { PWABanner } from "./PWABanner";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const profile = useApp((s) => s.profile);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const nav = [
    { to: "/", label: t.nav.dashboard, icon: LayoutDashboard },
    { to: "/presupuesto", label: t.nav.budget, icon: Wallet },
    { to: "/escudos", label: t.nav.shields, icon: Shield },
    { to: "/deudas", label: t.nav.debts, icon: Link2Off },
    { to: "/reportes", label: t.reports.title, icon: FileText },
    { to: "/logros", label: t.trophies.nav, icon: Trophy },
    { to: "/ajustes", label: t.nav.settings, icon: Settings },
  ] as const;

  const premium = isPremiumNow(profile);
  const days = daysLeft(profile);

  return (
    <div className="min-h-screen bg-sage-50">
      {premium && days > 0 && (
        <div className="bg-sage-900 text-sage-50 text-xs text-center py-2 px-4 italic">
          {t.settings.premiumBannerActive.replace("{days}", String(days))}
        </div>
      )}

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-sage-50/90 backdrop-blur border-b border-sage-100 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-serif text-xl text-sage-900">
          {t.appName}
        </Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 text-sage-700 rounded-full hover:bg-sage-100"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      <div className="lg:grid lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside
          className={`${
            mobileOpen ? "block" : "hidden"
          } lg:block bg-sage-50 lg:bg-white/40 lg:border-r border-sage-100 lg:min-h-screen p-6`}
        >
          <div className="hidden lg:block mb-10">
            <Link to="/" className="font-serif text-2xl text-sage-900 italic">
              {t.appName}
            </Link>
            <p className="text-xs text-sage-600 mt-1 italic">{t.tagline}</p>
          </div>
          <nav className="space-y-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-sage-700 hover:bg-sage-100 transition-colors [&.active]:bg-sage-900 [&.active]:text-sage-50"
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-8 pt-6 border-t border-sage-200/70">
            <p className="text-[10px] uppercase tracking-widest text-sage-400 mb-2">
              {t.settings.language}
            </p>
            <div className="flex gap-1 bg-white rounded-full p-1 w-fit border border-sage-200">
              <button
                onClick={() => setLang("es")}
                className={`px-3 py-1 text-xs rounded-full ${
                  lang === "es" ? "bg-sage-900 text-sage-50" : "text-sage-600"
                }`}
              >
                ES
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1 text-xs rounded-full ${
                  lang === "en" ? "bg-sage-900 text-sage-50" : "text-sage-600"
                }`}
              >
                EN
              </button>
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-widest text-sage-400">
              {t.settings.currentPlan}
            </p>
            <p className="text-sm text-sage-700 mt-1">
              {premium ? t.settings.planPremium : t.settings.planFree}
            </p>
          </div>
        </aside>

        <main className="px-5 py-6 md:px-10 md:py-10 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      <PWABanner />
    </div>
  );
}