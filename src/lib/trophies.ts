import confetti from "canvas-confetti";
import { toast } from "sonner";
import type { Trophy, TrophyKind } from "@/store/types";

export const TROPHY_LABELS: Record<TrophyKind, { es: string; en: string; emoji: string }> = {
  shield_l1: { es: "Escudo Inicial completado", en: "Starter Shield reached", emoji: "🛡️" },
  shield_l2: { es: "Escudo Nivel 2 alcanzado", en: "Shield Level 2 reached", emoji: "🌿" },
  shield_l3: { es: "Escudo Definitivo en calma", en: "Full Shield in calm", emoji: "🌳" },
  debt_paid: { es: "Una cadena menos", en: "One chain less", emoji: "🔗" },
  under_budget: { es: "Mes bajo presupuesto", en: "Under-budget month", emoji: "🌸" },
  income_growth: { es: "Ingresos al alza", en: "Income on the rise", emoji: "📈" },
};

export function fireConfetti() {
  try {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#722F37", "#6b8e6b", "#e8b7b1", "#c48a7a", "#fbf4d8"],
    });
  } catch {
    /* noop */
  }
}

export function celebrateTrophy(trophy: Trophy, lang: "es" | "en") {
  const meta = TROPHY_LABELS[trophy.kind];
  fireConfetti();
  toast.success(`${meta.emoji} ${lang === "es" ? meta.es : meta.en}`, {
    description: trophy.label,
    duration: 4500,
  });
}