import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/forgot")({
  ssr: false,
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Te enviamos un correo con instrucciones.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-sage-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-sage-100 rounded-3xl p-8 shadow-sm">
        <h1 className="font-serif text-2xl text-sage-900">Recuperar contraseña</h1>
        <p className="text-sm text-sage-600 italic mt-1">Te enviamos un enlace seguro por correo.</p>
        {sent ? (
          <div className="mt-6 text-sm text-sage-700 bg-sage-50 rounded-2xl p-4">
            Revisa tu bandeja de entrada.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@correo.com"
              className="w-full bg-sage-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-sage-200"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sage-900 text-sage-50 py-3 rounded-full font-medium disabled:opacity-50"
            >
              {loading ? "Enviando…" : "Enviar enlace"}
            </button>
          </form>
        )}
        <div className="mt-6 text-center">
          <Link to="/auth" className="text-xs text-sage-600 hover:text-sage-900 italic">← Volver</Link>
        </div>
      </div>
    </div>
  );
}