import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/reset")({
  ssr: false,
  component: ResetPage,
});

function ResetPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Contraseña actualizada.");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-sage-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-sage-100 rounded-3xl p-8 shadow-sm">
        <h1 className="font-serif text-2xl text-sage-900">Nueva contraseña</h1>
        <p className="text-sm text-sage-600 italic mt-1">Elige una contraseña segura.</p>
        {!ready ? (
          <p className="mt-6 text-sm text-sage-500">Verificando enlace…</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Nueva contraseña"
              className="w-full bg-sage-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-sage-200"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sage-900 text-sage-50 py-3 rounded-full font-medium disabled:opacity-50"
            >
              {loading ? "Guardando…" : "Actualizar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}