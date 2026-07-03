import { createFileRoute } from "@tanstack/react-router";
import { TrophiesView } from "@/views/TrophiesView";

export const Route = createFileRoute("/logros")({
  head: () => ({
    meta: [
      { title: "Logros · Finanzas en Calma" },
      { name: "description", content: "Tu historia de éxito financiero, paso a paso." },
    ],
  }),
  component: TrophiesView,
});