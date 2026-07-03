import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/" });
  },
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name },
          },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Revisa tu correo si te pide confirmación.");
        // If auto-confirm is on, user is signed in; navigate anyway.
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Algo salió mal";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-sage-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-sage-100 rounded-3xl p-8 shadow-sm">
        <h1 className="font-serif text-3xl text-sage-900 text-center">Finanzas en Calma</h1>
        <p className="text-sm text-sage-600 italic text-center mt-1">Tu compañera de finanzas personales.</p>

        <div className="mt-6 grid grid-cols-2 gap-1 bg-sage-50 rounded-full p-1">
          <button
            onClick={() => setMode("login")}
            className={`py-2 rounded-full text-sm font-medium ${mode === "login" ? "bg-sage-900 text-sage-50" : "text-sage-600"}`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`py-2 rounded-full text-sm font-medium ${mode === "signup" ? "bg-sage-900 text-sage-50" : "text-sage-600"}`}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-sage-500 mb-1">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-sage-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-sage-200"
              />
            </div>
          )}
          <div>
            <label className="block text-xs uppercase tracking-widest text-sage-500 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-sage-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-sage-200"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-sage-500 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full bg-sage-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-sage-200"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage-900 text-sage-50 py-3 rounded-full font-medium disabled:opacity-50"
          >
            {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        {mode === "login" && (
          <div className="mt-4 text-center">
            <Link to="/auth/forgot" className="text-xs text-sage-600 hover:text-sage-900 italic">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}