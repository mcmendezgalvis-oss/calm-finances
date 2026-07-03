import { createFileRoute } from "@tanstack/react-router";
import { BudgetView } from "@/views/BudgetView";

export const Route = createFileRoute("/presupuesto")({
  head: () => ({
    meta: [
      { title: "Presupuesto · Finanzas en Calma" },
      { name: "description", content: "Tu presupuesto intencional con tres miradas: Mi Plan, Mi Realidad y Mi Calma." },
    ],
  }),
  component: BudgetView,
});