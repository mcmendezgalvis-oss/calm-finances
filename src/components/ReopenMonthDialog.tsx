import { X } from "lucide-react";
import { useApp } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "sonner";

export function ReopenMonthDialog({
  monthKey,
  onClose,
  onReopened,
}: {
  monthKey: string;
  onClose: () => void;
  onReopened: () => void;
}) {
  const { t } = useI18n();
  const reopenMonth = useApp((s) => s.reopenMonth);
  const hasSnapshot = useApp((s) => Boolean(s.months[monthKey]?.snapshot));

  const handle = (mode: "continue" | "restore") => {
    const res = reopenMonth(monthKey, mode);
    if (!res.ok) {
      toast.error(res.notice ?? t.closeMonth.nextCarryBlocked);
      return;
    }
    if (res.notice) toast(res.notice, { duration: 5000 });
    onReopened();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-sage-900/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-serif text-2xl text-wine">{t.closeMonth.reopenTitle}</h3>
          <button onClick={onClose} className="text-sage-400 hover:text-sage-700 p-1">
            <X className="size-4" />
          </button>
        </div>
        <p className="text-sm text-sage-600 mb-5 leading-relaxed">{t.closeMonth.reopenCopy}</p>
        <div className="space-y-2">
          <button
            onClick={() => handle("continue")}
            className="w-full bg-wine text-white py-2.5 rounded-full font-medium text-sm"
          >
            {t.closeMonth.reopenContinue}
          </button>
          <button
            disabled={!hasSnapshot}
            onClick={() => handle("restore")}
            className="w-full bg-sage-100 text-sage-800 py-2.5 rounded-full font-medium text-sm disabled:opacity-40"
          >
            {t.closeMonth.reopenRestore}
          </button>
          <button onClick={onClose} className="w-full text-sage-500 py-2 text-sm">{t.shields.cancel}</button>
        </div>
      </div>
    </div>
  );
}