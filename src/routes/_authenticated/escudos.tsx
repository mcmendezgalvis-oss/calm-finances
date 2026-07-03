import { createFileRoute } from "@tanstack/react-router";
import { ShieldsView } from "@/views/ShieldsView";

export const Route = createFileRoute("/_authenticated/escudos")({
  head: () => ({
    meta: [
      { title: "Mis Escudos · Finanzas en Calma" },
      { name: "description", content: "Fondos de emergencia y ahorros con propósito." },
    ],
  }),
  component: ShieldsView,
});