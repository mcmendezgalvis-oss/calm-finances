import { createFileRoute } from "@tanstack/react-router";
import { SettingsView } from "@/views/SettingsView";

export const Route = createFileRoute("/ajustes")({
  head: () => ({
    meta: [
      { title: "Ajustes · Finanzas en Calma" },
      { name: "description", content: "Tu perfil, idioma y código de regalo." },
    ],
  }),
  component: SettingsView,
});