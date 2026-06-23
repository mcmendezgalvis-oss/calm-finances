import { useEffect, useState } from "react";
import { Plus, ArrowDown, ArrowUp, Trash2, Shield as ShieldIcon, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PremiumGate } from "@/components/PremiumGate";
import { useApp, currentMonthKey } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { fmt, EMERGENCY_FUND_ID } from "@/lib/finance";
import { toast } from "sonner";
import { InlineDatePicker } from "@/components/InlineDatePicker";
import { EmergencyFundCard } from "@/components/EmergencyFundCard";
import { DeleteGoalDialog } from "@/components/DeleteGoalDialog";

function Ring({ pct, size = 64 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, pct)));
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sage-100)" strokeWidth="6" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sage-600)" strokeWidth="6"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.16,1,0.3,1)" }}
      />
    </svg>
  );
}

function ShieldCard({ shieldId, locked = false }: { shieldId?: string; locked?: boolean }) {
  const { t } = useI18n();
  const currency = useApp((s) => s.profile.currency);
  const shields = useApp((s) => s.shields);
  const shieldDeposit = useApp((s) => s.shieldDeposit);
  const shieldWithdraw = useApp((s) => s.shieldWithdraw);
  const [showHistory, setShowHistory] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [editGoal, setEditGoal] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (locked) return null;

  const shield = shields.find((s) => s.id === shieldId)!;
  const pct = shield.goal > 0 ? shield.balance / shield.goal : 0;
  const complete = shield.balance >= shield.goal && shield.goal > 0;

  return (
    <div className="bg-white border border-sage-100 rounded-3xl p-6 shadow-sm">
      <div className="flex items-start gap-4 mb-4">
        <Ring pct={pct} />
        <div className="flex-1 min-w-0">
          <p className="font-serif text-xl text-wine truncate flex items-center gap-2">
            <ShieldIcon className="size-4 text-wine/70" />
            {shield.name}
          </p>
          {editGoal ? (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-sage-500">{fmt(shield.balance, currency)} /</span>
              <input
                inputMode="decimal"
                defaultValue={shield.goal}
                onBlur={(e) => {
                  const n = parseFloat(e.target.value);
                  if (!isNaN(n)) {
                    useApp.setState((st) => ({ shields: st.shields.map((s) => s.id === shield.id ? { ...s, goal: n } : s) }));
                  }
                  setEditGoal(false);
                }}
                className="w-24 text-xs bg-sage-50 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-sage-200"
                autoFocus
              />
            </div>
          ) : (
            <button onClick={() => setEditGoal(true)} className="text-xs text-sage-500 mt-0.5 hover:text-wine">
              {fmt(shield.balance, currency)} / {fmt(shield.goal, currency)} ✎
            </button>
          )}
          {complete && (
            <span className="inline-block mt-2 text-[10px] uppercase tracking-widest text-sage-600 font-semibold">
              {t.shields.complete}
            </span>
          )}
        </div>
        {shield.id !== EMERGENCY_FUND_ID && (
          <button
            onClick={() => setDeleteOpen(true)}
            className="text-sage-300 hover:text-clay p-1"
            aria-label={t.deleteGoal.btn}
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="flex-1 min-w-[8rem] text-sm bg-sage-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-sage-200 tabular-nums"
        />
        <InlineDatePicker date={date} onChange={setDate} />
        <button
          onClick={() => {
            const n = parseFloat(amount);
            if (n > 0) {
              shieldDeposit(shield.id, n, undefined, date.toISOString());
              toast.success(`+ ${fmt(n, currency)}`);
              setAmount("");
            }
          }}
          className="bg-sage-900 text-sage-50 text-xs font-medium px-3 py-2 rounded-full hover:bg-sage-700 transition-colors inline-flex items-center gap-1"
        >
          <ArrowUp className="size-3.5" /> {t.shields.addFunds}
        </button>
        <button
          onClick={() => {
            const n = parseFloat(amount);
            if (n > 0) {
              if (n > shield.balance) return toast.error("Insuficiente");
              shieldWithdraw(shield.id, n, undefined, date.toISOString());
              toast(`− ${fmt(n, currency)}`);
              setAmount("");
            }
          }}
          className="bg-blush-100 text-clay text-xs font-medium px-3 py-2 rounded-full hover:bg-blush-200 transition-colors inline-flex items-center gap-1"
        >
          <ArrowDown className="size-3.5" /> {t.shields.withdraw}
        </button>
      </div>

      {shield.history.length > 0 && (
        <>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="text-[10px] uppercase tracking-widest text-sage-400 hover:text-wine inline-flex items-center gap-1"
          >
            {t.shields.historyTitle} <ChevronDown className={`size-3 transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </button>
          {showHistory && (
            <ul className="mt-2 space-y-1 text-xs">
              {shield.history.slice().reverse().slice(0, 8).map((h) => (
                <li key={h.id} className="flex justify-between text-sage-500">
                  <span>{new Date(h.date).toLocaleDateString()}</span>
                  <span className={h.type === "deposit" ? "text-sage-700" : "text-clay"}>
                    {h.type === "deposit" ? "+" : "−"}{fmt(Math.abs(h.amount), currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {deleteOpen && <DeleteGoalDialog shieldId={shield.id} onClose={() => setDeleteOpen(false)} />}
    </div>
  );
}

function NewShieldDialog({ onCreated }: { onCreated: () => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const addShield = useApp((s) => s.addShield);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border-2 border-dashed border-sage-200 rounded-3xl p-6 hover:bg-sage-100/50 hover:border-sage-300 transition-colors flex items-center gap-3 text-sage-600"
      >
        <Plus className="size-5" />
        <span className="font-medium text-sm">{t.shields.add}</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-sage-900/40 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-2xl text-sage-900 mb-4">{t.shields.add.replace("+ ", "")}</h3>
            <label className="block text-xs uppercase tracking-widest text-sage-500 mb-1">
              {t.shields.newShieldName} *
            </label>
            <input
              required
              value={name} onChange={(e) => { setName(e.target.value); setError(null); }} autoFocus
              placeholder='"Viaje a Europa", "Mantenimiento Casa", "Fondo Universidad"'
              className="w-full bg-sage-50 rounded-xl px-3 py-2 mb-1 outline-none focus:ring-2 focus:ring-sage-200 placeholder:text-sage-300 placeholder:text-xs"
            />
            {error && <p className="text-xs text-clay mb-2">{error}</p>}
            <div className="h-2" />
            <label className="block text-xs uppercase tracking-widest text-sage-500 mb-1">{t.shields.newShieldGoal}</label>
            <input
              inputMode="decimal" value={goal} onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-sage-50 rounded-xl px-3 py-2 mb-5 outline-none focus:ring-2 focus:ring-sage-200"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="text-sm text-sage-500 px-4 py-2">{t.shields.cancel}</button>
              <button
                onClick={() => {
                  if (!name.trim()) { setError("Nombre obligatorio."); return; }
                  const id = addShield(name.trim(), parseFloat(goal) || 0);
                  if (!id) { setError("Ya tienes una meta con ese nombre."); return; }
                  setOpen(false);
                  setName(""); setGoal(""); setError(null);
                  toast.success(t.shields.shieldCreatedToast);
                  onCreated();
                }}
                className="bg-sage-900 text-sage-50 text-sm px-5 py-2 rounded-full font-medium"
              >
                {t.shields.create}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ShieldsView() {
  const { t } = useI18n();
  const shields = useApp((s) => s.shields);
  const ensureMonth = useApp((s) => s.ensureMonth);
  const ensureEmergencyFund = useApp((s) => s.ensureEmergencyFund);

  useEffect(() => {
    ensureEmergencyFund();
    ensureMonth(currentMonthKey());
  }, [ensureEmergencyFund, ensureMonth]);

  // Everything that's not the unified Emergency Fund is treated as a "custom goal".
  const customs = shields.filter((s) => s.id !== EMERGENCY_FUND_ID && !s.archived);
  const archived = shields.filter((s) => s.id !== EMERGENCY_FUND_ID && s.archived);

  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="font-serif text-4xl text-wine flex items-center gap-3">
          <ShieldIcon className="size-7" /> {t.shields.title}
        </h1>
        <p className="text-sm text-sage-600 italic mt-1">{t.shields.subtitle}</p>
      </header>

      <PremiumGate allowReadOnly>
        <EmergencyFundCard />

        <section className="mt-10">
          <h2 className="font-serif text-2xl text-wine mb-1">{t.emergency.customGoals}</h2>
          <p className="text-xs text-sage-500 italic mb-4">{t.shields.subtitle}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {customs.map((s) => (
              <ShieldCard key={s.id} shieldId={s.id} />
            ))}
            <NewShieldDialog onCreated={() => ensureMonth(currentMonthKey())} />
          </div>
        </section>

        {archived.length > 0 && (
          <section className="mt-10">
            <h2 className="font-serif text-xl text-sage-500 mb-3">{t.deleteGoal.archivedSection}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-70">
              {archived.map((s) => (
                <div key={s.id} className="bg-sage-100/40 border border-sage-200 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-sage-700">{s.name}</p>
                    <p className="text-xs text-sage-500">{fmt(s.balance, "USD")}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </PremiumGate>
    </AppShell>
  );
}