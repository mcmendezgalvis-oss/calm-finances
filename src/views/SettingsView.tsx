import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useApp, daysLeft, isPremiumNow } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "sonner";

export function SettingsView() {
  const { t, lang, setLang } = useI18n();
  const profile = useApp((s) => s.profile);
  const setProfileName = useApp((s) => s.setProfileName);
  const redeemCode = useApp((s) => s.redeemCode);
  const resetAll = useApp((s) => s.resetAll);
  const [code, setCode] = useState("");

  const premium = isPremiumNow(profile);
  const days = daysLeft(profile);

  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="font-serif text-4xl text-sage-900">{t.settings.title}</h1>
      </header>

      <div className="space-y-6 max-w-2xl">
        <section className="bg-white border border-sage-100 rounded-3xl p-6">
          <h2 className="font-serif text-xl text-sage-900 mb-4">{t.settings.profile}</h2>
          <label className="block text-xs uppercase tracking-widest text-sage-500 mb-1">{t.settings.name}</label>
          <input
            value={profile.name}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Elena"
            className="w-full bg-sage-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-sage-200 mb-4"
          />
          <label className="block text-xs uppercase tracking-widest text-sage-500 mb-1">{t.settings.language}</label>
          <div className="flex gap-2">
            <button onClick={() => setLang("es")} className={`px-4 py-2 rounded-full text-sm ${lang === "es" ? "bg-sage-900 text-sage-50" : "bg-sage-50 text-sage-700"}`}>Español</button>
            <button onClick={() => setLang("en")} className={`px-4 py-2 rounded-full text-sm ${lang === "en" ? "bg-sage-900 text-sage-50" : "bg-sage-50 text-sage-700"}`}>English</button>
          </div>
        </section>

        <section className="bg-white border border-sage-100 rounded-3xl p-6">
          <h2 className="font-serif text-xl text-sage-900 mb-1">{t.settings.redeem}</h2>
          <p className="text-sm text-sage-500 mb-4 italic">{t.settings.redeemDesc}</p>
          <div className="flex gap-2">
            <input
              value={code} onChange={(e) => setCode(e.target.value)}
              placeholder={t.settings.redeemPlaceholder}
              className="flex-1 bg-sage-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-sage-200 uppercase tracking-wider"
            />
            <button
              onClick={() => {
                if (redeemCode(code)) {
                  toast.success("✓ 30 días activados");
                  setCode("");
                } else {
                  toast.error("Código no válido");
                }
              }}
              className="bg-sage-900 text-sage-50 text-sm px-5 py-2 rounded-full font-medium"
            >
              {t.settings.redeemBtn}
            </button>
          </div>
          <p className="mt-4 text-xs text-sage-600">
            {t.settings.currentPlan}:{" "}
            <strong className="text-sage-900">{premium ? t.settings.planPremium : t.settings.planFree}</strong>
            {premium && days > 0 && <span className="text-sage-500"> · {days} días restantes</span>}
          </p>
        </section>

        <section className="bg-white border border-blush-200 rounded-3xl p-6">
          <h2 className="font-serif text-xl text-clay mb-2">{t.settings.resetAll}</h2>
          <button
            onClick={() => {
              if (confirm(t.settings.resetConfirm)) {
                resetAll();
                toast("Todo limpio.");
              }
            }}
            className="bg-blush-100 text-clay text-sm px-5 py-2 rounded-full hover:bg-blush-200 transition-colors"
          >
            {t.settings.resetAll}
          </button>
        </section>
      </div>
    </AppShell>
  );
}