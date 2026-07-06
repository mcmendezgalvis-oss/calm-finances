## Cambios a implementar

### 1. Gráfico de deudas: de barras apiladas a Donut reactivo

Reemplazar el contenido de `src/components/charts/DebtsBarChart.tsx` (se mantiene el nombre del archivo/exports para no tocar imports en `Dashboard.tsx`):

- Sustituir el `BarChart` mensual por un `PieChart` con `Pie` en modo dona (`innerRadius` + `outerRadius`) de recharts.
- Datos: suscribirse a `debts` con `useApp((s) => s.debts)` (ya lo hace) y calcular en `useMemo([debts, currency])` un array `[{ id, name, value: currentBalance, color }]` filtrando deudas con `currentBalance <= 0`. El total es `sum(currentBalance)`; el porcentaje se calcula por segmento.
- Cada `<Cell />` usa el color estable del `colorById` existente (paleta actual).
- Etiquetas: labels alrededor con `Nombre — X%`. Tooltip personalizado mostrando: Nombre, monto formateado con `fmt(value, currency)` y porcentaje con 1 decimal. Leyenda al pie con `Nombre — fmt(value)`.
- Eliminar el selector de año interno y el helper `YearSelect` (un donut de saldo actual no tiene eje temporal). También se puede eliminar la prop opcional `year`.
- Estado vacío: si no hay deudas o el total es 0, mostrar el mismo mensaje `t.dashboard.noHistoryYet` que hoy.
- Reactividad: la suscripción `useApp((s) => s.debts)` ya dispara re-render cuando `updateDebt` (usado por el input "Saldo Actual" en `DebtsView`) muta el estado en Zustand. Verificar que el selector devuelve la referencia del array del store (sin `.map`/`.filter` dentro del selector) para que Zustand notifique cambios; el `useMemo` depende de `debts` para recalcular al instante.

En `Dashboard.tsx` no se cambia nada: sigue renderizando `<DebtsBarChart />` sin props. El título sigue siendo `t.dashboard.debtCurve` (mismo copy solicitado por el usuario: "El derrumbe de las deudas").

### 2. Consentimiento legal en Sign Up

En `src/routes/auth.index.tsx`:

- Añadir estado `const [accepted, setAccepted] = useState(false)` y `const [showPrivacy, setShowPrivacy] = useState(false)`.
- En el bloque `mode === "signup"`, justo encima del botón submit, insertar un `<label>` con `<input type="checkbox">` controlado por `accepted`. Texto: "Acepto los <button>Términos de Servicio</button> y la <button>Política de Privacidad</button>". Ambos enlaces son `<button type="button">` (no `<a target="_blank">`) que hacen `setShowPrivacy(true)` — según petición, ambos abren el mismo modal legal placeholder.
- Botón submit: `disabled={loading || (mode === "signup" && !accepted)}`. Ya tiene `disabled:opacity-50`; se mantiene la clase para el estado opaco.
- Al cambiar de `signup` a `login`, resetear `accepted` para que si vuelve a `signup` la casilla no quede marcada por accidente (opcional pero limpio).

Modal de Política (mismo archivo, componente inline `<PrivacyModal open onClose />`):

- Overlay `fixed inset-0 bg-sage-900/40` + tarjeta centrada `max-w-lg bg-white rounded-3xl p-6 shadow-lg` con estilo consistente al resto (sage/wine, serif para el título).
- Contenido placeholder estructurado en secciones: "Política de Privacidad", "1. Protección de datos", "2. Encriptación y almacenamiento seguro", "3. Uso de tu información", "4. Tus derechos". Texto lorem-style genérico marcado claramente como plantilla.
- Botón "Cerrar" abajo (`bg-sage-900 text-sage-50 rounded-full`), cierre también con ESC (`useEffect` + `keydown`) y click en overlay.
- Scroll interno con `max-h-[80vh] overflow-y-auto` para pantallas pequeñas.

Sin cambios de i18n (los strings van directos en español, coherente con el resto de `auth.index.tsx`). Sin cambios en la lógica de `supabase.auth.signUp` — el consentimiento se valida solo en cliente para desbloquear el botón, como pide el usuario.

### Archivos que se modificarán

- `src/components/charts/DebtsBarChart.tsx` — reescritura a Donut.
- `src/routes/auth.index.tsx` — checkbox + modal.

### Notas

- No se toca el store, ni migraciones, ni `Dashboard.tsx`.
- El error de hidratación reportado en `/auth` es un pequeño mismatch de SSR ya presente; la ruta usa `ssr: false` en `beforeLoad` pero React re-hidrata el shell. No forma parte de este cambio y no se aborda aquí para respetar el alcance.
