import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Sparkles, Link2Off, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PremiumGate } from "@/components/PremiumGate";
import { useApp } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { fmt } from "@/lib/finance";
import { toast } from "sonner";
import { InlineDatePicker } from "@/components/InlineDatePicker";

function Confetti() {
  const items = Array.from({ length: 18 });
  const colors = ["var(--sage-600)", "var(--terracotta)", "var(--blush-400)", "var(--clay)"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center">
      {items.map((_, i) => (
        <span
          key={i}
          className="absolute size-2 rounded-full animate-confetti"
          style={{
            backgroundColor: colors[i % colors.length],
            top: "50%",
            left: "50%",
            transform: `translate(${(Math.random() - 0.5) * 600}px, ${(Math.random() - 0.5) * 400}px)`,
            animationDelay: `${i * 40}ms`,
          }}
        />
      ))}
    </div>
  );
}

function AdjustDialog({ id, current, onClose }: { id: string; current: number; onClose: () => void }) {
  const { t } = useI18n();
  const [v, setV] = useState(current.toString());
  const bankAdjust = useApp((s) => s.bankAdjust);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-sage-900/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-2xl text-sage-900 mb-1">{t.debts.bankAdjust}</h3>
        <p className="text-xs text-sage-500 mb-4">{t.debts.bankAdjustDesc}</p>
        <label className="block text-xs uppercase tracking-widest text-sage-500 mb-1">{t.debts.newAmount}</label>
        <input
          inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} autoFocus
          className="w-full bg-sage-50 rounded-xl px-3 py-2 mb-5 outline-none focus:ring-2 focus:ring-sage-200"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-sage-500 px-4 py-2">{t.shields.cancel}</button>
          <button
            onClick={() => { bankAdjust(id, parseFloat(v) || 0); onClose(); toast.success("✓"); }}
            className="bg-sage-900 text-sage-50 text-sm px-5 py-2 rounded-full font-medium"
          >
            {t.debts.adjustSave}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewDebtDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [bal, setBal] = useState("");
  const [min, setMin] = useState("");
  const addDebt = useApp((s) => s.addDebt);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-sage-900/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-2xl text-sage-900 mb-4">{t.debts.add.replace("+ ", "")}</h3>
        <label className="block text-xs uppercase tracking-widest text-sage-500 mb-1">{t.debts.name}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus className="w-full bg-sage-50 rounded-xl px-3 py-2 mb-3 outline-none focus:ring-2 focus:ring-sage-200" />
        <label className="block text-xs uppercase tracking-widest text-sage-500 mb-1">{t.debts.initial}</label>
        <input inputMode="decimal" value={bal} onChange={(e) => setBal(e.target.value)} className="w-full bg-sage-50 rounded-xl px-3 py-2 mb-3 outline-none focus:ring-2 focus:ring-sage-200" />
        <label className="block text-xs uppercase tracking-widest text-sage-500 mb-1">{t.debts.min}</label>
        <input inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} className="w-full bg-sage-50 rounded-xl px-3 py-2 mb-5 outline-none focus:ring-2 focus:ring-sage-200" />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-sage-500 px-4 py-2">{t.shields.cancel}</button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              addDebt({ name: name.trim(), initialBalance: parseFloat(bal) || 0, minimumPayment: parseFloat(min) || 0 });
              onClose();
            }}
            className="bg-sage-900 text-sage-50 text-sm px-5 py-2 rounded-full font-medium"
          >
            {t.debts.create}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DebtsView() {
  const { t } = useI18n();
  const debts = useApp((s) => s.debts);
  const currency = useApp((s) => s.profile.currency);
  const removeDebt = useApp((s) => s.removeDebt);
  const updateDebt = useApp((s) => s.updateDebt);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [openHistoryId, setOpenHistoryId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<Record<string, string>>({});
  const [payDate, setPayDate] = useState<Record<string, Date>>({});

  const sorted = useMemo(() => {
    const active = debts.filter((d) => !d.paid).sort((a, b) => a.currentBalance - b.currentBalance);
    const paid = debts.filter((d) => d.paid);
    return [...active, ...paid];
  }, [debts]);

  const adjustingDebt = adjustId ? debts.find((d) => d.id === adjustId) : null;

  const totalLeft = debts.filter((d) => !d.paid).reduce((s, d) => s + d.currentBalance, 0);
  const totalInitial = debts.reduce((s, d) => s + d.initialBalance, 0);

  return (
    <AppShell>
      {celebrate && <Confetti />}
      <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-4xl text-wine flex items-center gap-3">
            <Link2Off className="size-7" /> {t.debts.title}
          </h1>
          <p className="text-sm text-sage-600 italic mt-1">{t.debts.subtitle}</p>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="inline-flex items-center gap-2 bg-wine text-white text-sm px-5 py-2.5 rounded-full font-medium hover:opacity-90 transition"
        >
          <Plus className="size-4" /> {t.debts.add.replace("+ ", "")}
        </button>
      </header>

      <PremiumGate allowReadOnly>
        {debts.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="bg-white border border-sage-100 rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-sage-400">Saldo restante</p>
              <p className="font-serif text-2xl text-sage-900 mt-1">{fmt(totalLeft, currency)}</p>
            </div>
            <div className="bg-white border border-sage-100 rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-sage-400">Total inicial</p>
              <p className="font-serif text-2xl text-clay mt-1">{fmt(totalInitial, currency)}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {debts.length === 0 && (
            <p className="text-center text-sm text-sage-500 italic py-12">
              Aún no hay deudas registradas. Cuando estés lista, agrega la primera.
            </p>
          )}
          {sorted.map((d, idx) => {
            const isTarget = idx === 0 && !d.paid;
            const progress = d.initialBalance > 0 ? 1 - d.currentBalance / d.initialBalance : 0;
            return (
              <div
                key={d.id}
                className={`rounded-3xl p-5 border transition-all ${
                  d.paid
                    ? "bg-sage-100/60 border-sage-200 opacity-70"
                    : isTarget
                    ? "bg-blush-100 border-blush-200 shadow-md"
                    : "bg-white border-sage-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    {isTarget && (
                      <span className="inline-block text-[10px] uppercase tracking-widest font-bold text-clay mb-1">
                        {t.debts.myTarget}
                      </span>
                    )}
                    {d.paid && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-sage-700 mb-1">
                        <Sparkles className="size-3" /> {t.debts.paid}
                      </span>
                    )}
                    <p className="font-serif text-xl text-wine">{d.name}</p>
                    <div className="text-xs text-sage-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      <label className="inline-flex items-center gap-1">Inicial:
                        <input
                          inputMode="decimal" defaultValue={d.initialBalance}
                          onBlur={(e) => { const n = parseFloat(e.target.value); if (!isNaN(n)) updateDebt(d.id, { initialBalance: n }); }}
                          className="w-20 text-xs bg-white/50 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-wine tabular-nums"
                        />
                      </label>
                      <label className="inline-flex items-center gap-1">Mínimo:
                        <input
                          inputMode="decimal" defaultValue={d.minimumPayment}
                          onBlur={(e) => { const n = parseFloat(e.target.value); if (!isNaN(n)) updateDebt(d.id, { minimumPayment: n }); }}
                          className="w-20 text-xs bg-white/50 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-wine tabular-nums"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="text-right">
                    <input
                      inputMode="decimal" defaultValue={d.currentBalance}
                      onBlur={(e) => { const n = parseFloat(e.target.value); if (!isNaN(n)) updateDebt(d.id, { currentBalance: n, paid: n === 0 }); }}
                      className="font-serif text-2xl text-sage-900 text-right w-32 bg-transparent outline-none focus:bg-white rounded px-1 tabular-nums"
                    />
                    <div className="flex gap-1 justify-end mt-1">
                      {!d.paid && (
                        <button
                          onClick={() => setAdjustId(d.id)}
                          className="text-sage-400 hover:text-sage-700 p-1"
                          aria-label={t.debts.bankAdjust}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(t.debts.confirmDelete)) removeDebt(d.id);
                        }}
                        className="text-sage-300 hover:text-clay p-1"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${d.paid ? "bg-sage-600" : isTarget ? "bg-clay" : "bg-sage-400"}`}
                    style={{ width: `${Math.max(2, progress * 100)}%`, transition: "width 600ms" }}
                  />
                </div>

                {!d.paid && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      inputMode="decimal"
                      placeholder="Monto del pago"
                      value={payAmount[d.id] ?? ""}
                      onChange={(e) => setPayAmount({ ...payAmount, [d.id]: e.target.value })}
                      className="text-xs bg-white rounded-full px-3 py-2 outline-none focus:ring-2 focus:ring-wine/40 w-32 tabular-nums"
                    />
                    <InlineDatePicker
                      date={payDate[d.id] ?? new Date()}
                      onChange={(dd) => setPayDate({ ...payDate, [d.id]: dd })}
                    />
                    <button
                      onClick={() => {
                        const n = parseFloat(payAmount[d.id] ?? "");
                        if (isNaN(n) || n <= 0) return;
                        const date = (payDate[d.id] ?? new Date()).toISOString();
                        const paidOff = useApp.getState().registerDebtPayment(d.id, n, date, "Pago");
                        setPayAmount({ ...payAmount, [d.id]: "" });
                        if (paidOff) {
                          setCelebrate(true);
                          toast.success(t.debts.celebration);
                          setTimeout(() => setCelebrate(false), 1500);
                        } else {
                          toast(`− ${fmt(n, currency)}`);
                        }
                      }}
                      className="text-xs bg-wine text-white px-4 py-2 rounded-full hover:opacity-90 transition"
                    >
                      Registrar pago
                    </button>
                  </div>
                )}

                {d.adjustments.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() => setOpenHistoryId(openHistoryId === d.id ? null : d.id)}
                      className="text-[10px] uppercase tracking-widest text-sage-400 hover:text-wine inline-flex items-center gap-1"
                    >
                      {t.reports.history} <ChevronDown className={`size-3 transition-transform ${openHistoryId === d.id ? "rotate-180" : ""}`} />
                    </button>
                    {openHistoryId === d.id && (
                      <ul className="mt-2 space-y-1 text-xs">
                        {[...d.adjustments].reverse().slice(0, 12).map((a) => (
                          <li key={a.id} className="flex justify-between text-sage-500">
                            <span>{new Date(a.date).toLocaleDateString()} · {a.note ?? "—"}</span>
                            <span className={a.delta < 0 ? "text-sage-700" : "text-clay"}>
                              {a.delta >= 0 ? "+" : ""}{fmt(a.delta, currency)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PremiumGate>

      {newOpen && <NewDebtDialog onClose={() => setNewOpen(false)} />}
      {adjustingDebt && (
        <AdjustDialog
          id={adjustingDebt.id}
          current={adjustingDebt.currentBalance}
          onClose={() => setAdjustId(null)}
        />
      )}
    </AppShell>
  );
}