## Objetivo

Migrar la app de almacenamiento local (Zustand + localStorage) a Lovable Cloud (Supabase gestionado), con autenticación, RLS por usuario, y migración automática de datos existentes al primer login.

---

## 1. Habilitar Lovable Cloud

Provisiona backend gestionado automáticamente (no se usa el project ID externo `kygtkvuykeiihovkzcak` — Lovable Cloud crea el suyo). Los secretos `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `VITE_SUPABASE_*` quedan disponibles.

## 2. Esquema de base de datos (migración SQL)

Tablas en `public`, todas con `user_id uuid references auth.users(id) on delete cascade`, RLS activo y policies `auth.uid() = user_id`, más `GRANT` correspondientes.

```
profiles              (id=user_id PK, name, plan, premium_until, currency, language, created_at)
months                (id, user_id, month_key unique per user, closed, closed_at, snapshot jsonb, surplus_carry_forward_id)
budget_lines          (id, user_id, month_id fk, group, name, planned, real, linked_shield_id, linked_debt_id, permanent, sort_order)
shields               (id, user_id, name, kind, goal, balance, created_at, archived)
shield_tx             (id, user_id, shield_id fk, date, type, amount, note)
debts                 (id, user_id, name, initial_balance, minimum_payment, current_balance, paid, created_at, paid_at)
debt_adjustments      (id, user_id, debt_id fk, date, delta, note)
trophies              (id, user_id, kind, label, earned_at, context_id, month_key)
```

Trigger `handle_new_user()` en `auth.users` → inserta `profiles` con `name` desde metadata, `plan='free'`, `currency='EUR'`.

## 3. Autenticación

- **`/auth`** ruta pública: pestañas Login / Registro. Campos email + password (+ name en registro). `signUp` con `emailRedirectTo: window.location.origin`. Estados de carga, toasts para errores (email en uso, password débil, credenciales inválidas).
- **`/auth/forgot`**: formulario email → `resetPasswordForEmail(email, { redirectTo: origin + '/auth/reset' })`.
- **`/auth/reset`**: público, detecta `type=recovery` en URL hash, formulario nueva contraseña → `updateUser({ password })`.
- **`_authenticated` layout** (gestionado por integración): protege `/`, `/presupuesto`, `/escudos`, `/deudas`, `/reportes`, `/logros`, `/ajustes`. Todas las rutas actuales se mueven bajo `_authenticated/`.
- **`__root.tsx`**: `onAuthStateChange` filtrado (SIGNED_IN/OUT/USER_UPDATED) → `router.invalidate()` + `queryClient.invalidateQueries()`.
- **AppShell**: mostrar email/nombre del usuario + botón "Cerrar sesión" (con `cancelQueries` → `clear` → `signOut` → `navigate /auth replace`).

## 4. Capa de datos (Zustand → Supabase)

Refactor de `src/store/useApp.ts`: el store sigue siendo la fuente de estado en memoria (para render optimista), pero cada acción escribe a Supabase y las lecturas iniciales vienen de queries.

- Nuevo módulo `src/lib/data/*.ts` con funciones tipadas para cada tabla (fetchAll, upsert, delete) usando el cliente browser `@/integrations/supabase/client`.
- Hook `useSyncApp()` en el root de `_authenticated`: al montar, carga todas las tablas del usuario en paralelo (`Promise.all`) y hidrata el store.
- Cada acción del store (`upsertLine`, `addShield`, `addDebt`, `closeMonth`, etc.) pasa a `async` y emite escritura Supabase inmediatamente después de actualizar el estado local (write-through). Errores → toast + rollback local.
- **Realtime**: suscripción a los canales de las tablas del usuario (`filter: user_id=eq.${uid}`) para sincronizar cambios de otras pestañas/dispositivos → merge en el store.

## 5. Migración automática al primer login

Al hidratar por primera vez (perfil recién creado sin datos y localStorage tiene `finanzas-en-calma-store`):

1. Detectar snapshot local.
2. Confirmar con toast/modal "Importar tus datos guardados en este dispositivo".
3. Escribir en batch (transacciones lógicas) todos los meses, líneas, escudos, tx, deudas, ajustes, trofeos con el `user_id` actual.
4. Marcar `profiles.migrated_at` para no repetir.
5. Vaciar `localStorage` de la clave `finanzas-en-calma-store` tras éxito.

## 6. Ajustes UI menores

- Saludo dinámico ya usa `profile.name`; ahora ese nombre viene de `profiles` en Supabase.
- Redeem code (`CALMA2026`, etc.) sigue funcionando pero ahora `UPDATE profiles SET plan='premium', premium_until=...`.
- Reset all: borra filas del usuario (RLS lo limita naturalmente), no toca `auth.users`.

---

## Detalles técnicos

- **Cliente**: `supabase` de `@/integrations/supabase/client` para todo (browser + realtime). No se necesitan server functions porque toda la lógica es del usuario autenticado y RLS filtra.
- **Redirect URLs**: agregar `window.location.origin`, `.../auth/reset` en Supabase Auth.
- **Providers sociales**: no se incluyen (usuario solo pidió email/password).
- **Rutas nuevas**: `src/routes/auth.tsx`, `src/routes/auth.forgot.tsx`, `src/routes/auth.reset.tsx`, `src/routes/_authenticated/route.tsx` (auto), y mover `index.tsx`, `presupuesto.tsx`, `escudos.tsx`, `deudas.tsx`, `reportes.tsx`, `logros.tsx`, `ajustes.tsx` bajo `_authenticated/`.
- **Tipos**: `src/integrations/supabase/types.ts` autogenerado.

## Archivos

**Nuevos**: migración SQL, `src/lib/data/{profiles,months,lines,shields,debts,trophies}.ts`, `src/lib/data/sync.ts`, `src/lib/data/migrate-local.ts`, `src/routes/auth.tsx`, `src/routes/auth.forgot.tsx`, `src/routes/auth.reset.tsx`, `src/components/AuthForm.tsx`, `src/hooks/useRealtimeSync.ts`.

**Modificados**: `src/store/useApp.ts` (acciones async + write-through), `src/components/AppShell.tsx` (user info + logout), `src/routes/__root.tsx` (auth listener), `src/views/SettingsView.tsx` (redeem via Supabase), `src/views/Dashboard.tsx` (usar profile.name de Supabase); movimiento de rutas bajo `_authenticated/`.
