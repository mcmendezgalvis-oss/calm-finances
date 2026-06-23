import { createFileRoute } from "@tanstack/react-router";
import { DebtsView } from "@/views/DebtsView";

export const Route = createFileRoute("/deudas")({
  head: () => ({
    meta: [
      { title: "Adiós a las Cadenas · Finanzas en Calma" },
      { name: "description", content: "Tu plan Bola de Nieve: una deuda a la vez, con calma." },
    ],
  }),
  component: DebtsView,
});