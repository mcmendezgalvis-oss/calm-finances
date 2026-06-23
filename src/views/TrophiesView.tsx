import { Trophy as TrophyIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { TROPHY_LABELS } from "@/lib/trophies";

export function TrophiesView() {
  const { t, lang } = useI18n();
  const trophies = useApp((s) => s.trophies);

  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="font-serif text-4xl text-wine flex items-center gap-3">
          <TrophyIcon className="size-7" /> {t.trophies.title}
        </h1>
        <p className="text-sm text-sage-600 italic mt-1">{t.trophies.subtitle}</p>
      </header>

      {trophies.length === 0 ? (
        <p className="text-center text-sm text-sage-500 italic py-12">{t.trophies.empty}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...trophies].reverse().map((tr) => {
            const meta = TROPHY_LABELS[tr.kind];
            return (
              <div
                key={tr.id}
                className="bg-white border border-wine-100 rounded-3xl p-5 shadow-sm"
              >
                <div className="text-4xl mb-2">{meta.emoji}</div>
                <p className="font-serif text-lg text-wine">
                  {lang === "es" ? meta.es : meta.en}
                </p>
                <p className="text-xs text-sage-600 mt-1">{tr.label}</p>
                <p className="text-[10px] uppercase tracking-widest text-sage-400 mt-3">
                  {new Date(tr.earnedAt).toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}