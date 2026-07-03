## 1. Corrección de "Copiar mes anterior" (sección Inversión y Futuro)

**Causa raíz:** al abrir un mes nuevo, `ensureMonth` invoca `syncLinkedLines`, que inyecta automáticamente una línea vacía (planned=0) por cada escudo/meta en el grupo `future`. Cuando el usuario pulsa "Copiar mes anterior", `copyFromPrevious` detecta que el destino ya tiene una línea con ese `linkedShieldId` y **omite** la línea del mes previo — por eso la sección "Inversión y Futuro" aparece vacía.

**Arreglo en `src/store/useApp.ts` › `copyFromPrevious`:**
- En vez de saltar líneas cuyo `linkedShieldId`/`linkedDebtId` ya existe en destino, **actualizar** la línea existente en destino copiando el `planned` (y el `name` si se editó) de la línea previa, dejando `real: 0`.
- Mantener el skip solo para la línea "sobrante mes anterior".
- Las líneas no enlazadas siguen añadiéndose como copia nueva (comportamiento actual).

Resultado: todas las categorías (income, muros, debts, generosity, lifestyle **y future**) se copian correctamente.

## 2. Renombrar "Mi Calma" → "Mi balance" y añadir columna en Reportes

**Presupuesto mensual (`src/views/BudgetView.tsx` + `src/i18n/strings.ts`):**
- En `budget.tabs.diff` (ES y EN) cambiar el label a "Mi balance" / "My balance".
- Actualizar el título de la tarjeta resumen (`myCalmTitle`) y textos internos que se refieran a la pestaña como "Mi Calma" dentro del presupuesto, para mantener coherencia. **No** se toca el nombre del dashboard general (`nav.dashboard = "Mi Calma"`), que es otra vista.

**Reportes (`src/views/ReportsView.tsx`, reporte "Presupuesto vs Real"):**
- Añadir tercera columna "Mi balance" (= Plan − Real) tanto en la vista detallada de un solo mes como en la vista colapsada multi-mes.
- Actualizar `cols`, cada `row` (agregando `fmt(planned - real, currency)`) y la fila `totals` (agregando `fmt(tp - tr, currency)`).
- La exportación PDF/CSV consume estas mismas columnas, así que quedará incluida automáticamente. Verificar `src/lib/pdf.ts` y `src/lib/csv.ts` por si asumen ancho fijo de columnas y ajustar si es necesario.

## 3. Rediseño del ícono (delicado y femenino)

Nuevo SVG: escudo con silueta suave y bordes redondeados, adornado con **elementos florales sutiles** (pequeñas hojas/pétalos en la base o enmarcando el escudo). Paleta pastel:

- Fondo del escudo: verde menta suave (`#C8E6D0`) con degradado sutil a rosa empolvado (`#F5D6D6`).
- Borde y elemento central: vinotinto profundo (`#6B1F3A`) o verde bosque (`#2F5D3F`) para asegurar contraste en pantallas.
- Elemento central: un pequeño símbolo `$` estilizado (serif fino) o una flor central en tono oscuro, según se vea mejor a 16 px.

**Reemplazos:**
- Header logo en `src/components/AppShell.tsx` (SVG inline).
- `public/favicon.svg` y `public/favicon.ico` (regenerado desde el SVG).
- `public/icon-192.png` y `public/icon-512.png` para PWA (generados con `imagegen`).
- `public/manifest.webmanifest` — solo si cambian nombres/paths.

QA visual: capturar el favicon renderizado a 16/32 px para confirmar que el elemento central es legible.

## Verificación final

- `bun run build` para confirmar que compila.
- Comprobar en preview: (a) copiar mes anterior trae valores de "Inversión y Futuro"; (b) la pestaña muestra "Mi balance" y el reporte tiene la nueva columna con totales correctos; (c) el nuevo ícono se ve en el header, favicon y manifest.
