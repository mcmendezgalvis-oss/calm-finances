import { useEffect, useState } from "react";
import { X, Share, Plus } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { isIos, isStandalone, type BeforeInstallPromptEvent } from "@/lib/pwa";

const DISMISS_KEY = "fec.pwa.dismissed";

export function PWABanner() {
  const { t } = useI18n();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (window.localStorage.getItem(DISMISS_KEY)) return;
    setDismissed(false);

    if (isIos()) {
      setShowIos(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed) return null;
  if (!installEvent && !showIos) return null;

  const dismiss = () => {
    setDismissed(true);
    try { window.localStorage.setItem(DISMISS_KEY, "1"); } catch {/* noop */}
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-40 bg-sage-900 text-sage-50 rounded-3xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm leading-relaxed">{t.pwa.banner}</p>
          {showIos && (
            <div className="mt-3 flex items-center gap-2 text-xs text-sage-200 flex-wrap">
              <span>{t.pwa.iosStep1}</span>
              <Share className="size-4" />
              <span>{t.pwa.iosStep2}</span>
              <Plus className="size-4" />
              <span>{t.pwa.iosStep3}</span>
            </div>
          )}
          {installEvent && (
            <button
              onClick={async () => {
                await installEvent.prompt();
                const result = await installEvent.userChoice;
                if (result.outcome === "accepted") dismiss();
                setInstallEvent(null);
              }}
              className="mt-3 bg-sage-50 text-sage-900 text-xs font-medium px-4 py-2 rounded-full"
            >
              {t.pwa.install}
            </button>
          )}
        </div>
        <button
          onClick={dismiss}
          className="text-sage-300 hover:text-sage-50 p-1"
          aria-label={t.pwa.dismiss}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}