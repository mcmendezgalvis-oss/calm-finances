import { useState } from "react";
import { X, Archive, Trash2 } from "lucide-react";
import { useApp } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { toast } from "sonner";

export function DeleteGoalDialog({
  shieldId,
  onClose,
}: {
  shieldId: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const hasClosed = useApp((s) => s.shieldHasClosedHistory)(shieldId);
  const removeShield = useApp((s) => s.removeShield);
  const archiveShield = useApp((s) => s.archiveShield);
  const [confirmForce, setConfirmForce] = useState(false);

  const simpleDelete = () => {
    removeShield(shieldId);
    toast.success(t.deleteGoal.deletedToast);
    onClose();
  };
  const archive = () => {
    archiveShield(shieldId);
    toast.success(t.deleteGoal.archivedToast);
    onClose();
  };
  const force = () => {
    removeShield(shieldId, { force: true });
    toast(t.deleteGoal.deletedToast);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-sage-900/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-serif text-2xl text-wine">
            {hasClosed ? t.deleteGoal.blockedTitle : t.deleteGoal.confirmTitle}
          </h3>
          <button onClick={onClose} className="text-sage-400 hover:text-sage-700 p-1">
            <X className="size-4" />
          </button>
        </div>

        {!hasClosed ? (
          <>
            <p className="text-sm text-sage-600 mb-5 leading-relaxed">{t.deleteGoal.confirmCopy}</p>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 text-sage-600 py-2.5 rounded-full text-sm">{t.shields.cancel}</button>
              <button onClick={simpleDelete} className="flex-1 bg-clay text-white py-2.5 rounded-full font-medium text-sm">
                {t.deleteGoal.confirmCta}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-sage-600 mb-5 leading-relaxed">{t.deleteGoal.blockedCopy}</p>
            <div className="space-y-2">
              <button
                onClick={archive}
                className="w-full bg-sage-900 text-sage-50 py-2.5 rounded-full font-medium text-sm inline-flex items-center justify-center gap-2"
              >
                <Archive className="size-4" /> {t.deleteGoal.archive}
              </button>
              {!confirmForce ? (
                <button
                  onClick={() => setConfirmForce(true)}
                  className="w-full bg-blush-100 text-clay py-2 rounded-full text-xs inline-flex items-center justify-center gap-2"
                >
                  <Trash2 className="size-3.5" /> {t.deleteGoal.forceDelete}
                </button>
              ) : (
                <div className="bg-blush-100 rounded-2xl p-3 text-xs text-clay space-y-2">
                  <p>{t.deleteGoal.forceConfirm}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmForce(false)} className="flex-1 bg-white text-sage-600 py-2 rounded-full">
                      {t.shields.cancel}
                    </button>
                    <button onClick={force} className="flex-1 bg-clay text-white py-2 rounded-full">
                      {t.deleteGoal.confirmCta}
                    </button>
                  </div>
                </div>
              )}
              <button onClick={onClose} className="w-full text-sage-500 py-2 text-xs">{t.shields.cancel}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}