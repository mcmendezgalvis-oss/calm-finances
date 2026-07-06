import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/")({
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
  const [accepted, setAccepted] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
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
            onClick={() => { setMode("login"); setAccepted(false); }}
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
          {mode === "signup" && (
            <label className="flex items-start gap-2 text-xs text-sage-700 leading-relaxed">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 size-4 accent-sage-900"
              />
              <span>
                Acepto los{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="text-sage-900 underline hover:text-wine"
                >
                  Términos de Servicio
                </button>{" "}
                y la{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="text-sage-900 underline hover:text-wine"
                >
                  Política de Privacidad
                </button>
                .
              </span>
            </label>
          )}
          <button
            type="submit"
            disabled={loading || (mode === "signup" && !accepted)}
            className="w-full bg-sage-900 text-sage-50 py-3 rounded-full font-medium disabled:opacity-40 disabled:cursor-not-allowed"
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
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  );
}

function PrivacyModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-sage-900/40 flex items-center justify-center px-4 py-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 space-y-5">
          <div>
            <h2 className="font-serif text-2xl text-sage-900">Política de Privacidad</h2>
            <p className="text-xs text-sage-500 italic mt-1">
              Documento plantilla — revísalo con tu asesor legal antes de la publicación definitiva.
            </p>
          </div>

          <section className="space-y-2">
            <h3 className="font-serif text-lg text-wine">1. Protección de datos</h3>
            <p className="text-sm text-sage-700 leading-relaxed">
              Recopilamos únicamente los datos necesarios para ofrecerte el servicio: tu nombre,
              correo electrónico y la información financiera que tú introduces. Nunca vendemos ni
              cedemos tus datos a terceros con fines comerciales.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-serif text-lg text-wine">2. Encriptación y almacenamiento seguro</h3>
            <p className="text-sm text-sage-700 leading-relaxed">
              Toda la información se transmite mediante conexiones cifradas (HTTPS/TLS) y se
              almacena en servidores protegidos con estándares de la industria. Tus contraseñas se
              guardan usando algoritmos de hash seguros y nunca son visibles para nuestro equipo.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-serif text-lg text-wine">3. Uso de tu información</h3>
            <p className="text-sm text-sage-700 leading-relaxed">
              Utilizamos tus datos exclusivamente para el funcionamiento de la aplicación:
              autenticación, sincronización de tu presupuesto y generación de reportes personales.
              No entrenamos modelos de terceros con tu información.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-serif text-lg text-wine">4. Tus derechos</h3>
            <p className="text-sm text-sage-700 leading-relaxed">
              Puedes acceder, rectificar o eliminar tu cuenta y todos los datos asociados en
              cualquier momento desde los ajustes de la aplicación o contactándonos por correo.
            </p>
          </section>

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-sage-900 text-sage-50 py-3 rounded-full font-medium hover:bg-sage-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}