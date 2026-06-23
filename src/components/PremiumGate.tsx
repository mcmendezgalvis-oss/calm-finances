import { Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { useApp, isPremiumNow } from "@/store/useApp";
import type { ReactNode } from "react";

/** Wraps a premium-only surface. Free users see a soft locked overlay; the underlying data stays in the DOM (read-only). */
export function PremiumGate({ children, allowReadOnly = false }: { children: ReactNode; allowReadOnly?: boolean }) {
  const profile = useApp((s) => s.profile);
  const { t } = useI18n();
  const premium = isPremiumNow(profile);

  if (premium) return <>{children}</>;

  return (
    <div className="relative">
      <div className={allowReadOnly ? "pointer-events-none opacity-70" : "pointer-events-none opacity-40 blur-[1.5px]"}>
        {children}
      </div>
      <div className="absolute inset-0 grid place-items-center">
        <div className="bg-white/95 backdrop-blur border border-blush-200 rounded-3xl p-8 max-w-md shadow-xl text-center">
          <div className="size-12 mx-auto rounded-2xl bg-blush-100 grid place-items-center text-clay mb-4">
            <Lock className="size-5" />
          </div>
          <h3 className="font-serif text-2xl text-sage-900 mb-3">{t.paywall.title}</h3>
          <p className="text-sm text-sage-600 leading-relaxed mb-5 italic">{t.paywall.copy}</p>
          <Link
            to="/ajustes"
            className="inline-block bg-sage-900 text-sage-50 text-sm px-5 py-2.5 rounded-full font-medium hover:bg-sage-700 transition-colors"
          >
            {t.paywall.activate}
          </Link>
          {allowReadOnly && (
            <p className="mt-4 text-[10px] uppercase tracking-widest text-sage-400">{t.paywall.readOnly}</p>
          )}
        </div>
      </div>
    </div>
  );
}