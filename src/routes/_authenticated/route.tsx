import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadFromSupabase, startSync, stopSync } from "@/lib/sync";
import { useApp } from "@/store/useApp";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadFromSupabase(user.id);
      if (cancelled) return;
      startSync(user.id);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      stopSync();
      // Reset store so next user starts clean
      useApp.getState().resetAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-50">
        <p className="text-sage-600 italic font-serif text-lg">Cargando tu calma…</p>
      </div>
    );
  }

  return <Outlet />;
}