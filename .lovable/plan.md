
## Objetivo

Que "Finanzas en Calma" sea instalable en iOS, Android y escritorio ("Añadir a la pantalla de inicio" / "Instalar app"), reconociendo el ícono y el nombre.

## Estado actual

Ya existe `public/manifest.webmanifest` con `name`, `short_name`, `display: standalone`, `theme_color`, íconos 192/512 (any maskable), y `src/routes/__root.tsx` ya inyecta:

- `<link rel="manifest" href="/manifest.webmanifest">`
- `<link rel="apple-touch-icon" href="/icon-192.png">`
- `<meta name="theme-color">`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`

También hay un `PWABanner` que dispara `beforeinstallprompt` y muestra instrucciones en iOS.

Es decir: la app ya cumple los requisitos de instalabilidad. Solo faltan pequeños ajustes de robustez.

## Cambios propuestos

1. **`public/manifest.webmanifest`** — endurecer para máxima compatibilidad:
   - Añadir `id: "/"` y `scope: "/"` (Chrome los pide para install prompt fiable).
   - Separar íconos con `purpose: "any"` y `purpose: "maskable"` en entradas distintas (Chrome recomienda no mezclarlos).
   - Mantener `name`, `short_name`, `display`, colores, `start_url`, `lang`.

2. **`src/routes/__root.tsx`** — pequeños añadidos de meta en el `head()`:
   - `<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">` y 512 (favicon en Android/Chrome).
   - `<link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png">` explícito con tamaño.
   - Confirmar que `theme-color`, viewport `viewport-fit=cover`, y las apple-mobile-web-app-* siguen presentes (ya están).

3. **Service Worker: NO se añade.**

   Según la guía interna de Lovable para PWAs, un service worker solo debe registrarse cuando el usuario pide funcionalidad offline. Para "instalar como acceso directo" el navegador ya considera la app instalable con solo manifest + íconos + HTTPS + meta tags — que es lo que tenemos. Añadir un SW aquí introduce riesgos serios de cachés obsoletas (pantallas en blanco tras deploy, versiones viejas atascadas) sin beneficio para el caso de uso pedido.

   Si más adelante quieres modo offline real, lo implemento con `vite-plugin-pwa` bajo las salvaguardas correspondientes (no registrar en preview, kill-switch `?sw=off`, NetworkFirst para HTML).

## Notas para el usuario

- En Chrome Android / desktop aparecerá "Instalar app" automáticamente cuando se cumplan los criterios de engagement; el `PWABanner` existente también ofrece el botón.
- En iOS Safari no existe prompt automático — el `PWABanner` ya explica el flujo "Compartir → Añadir a pantalla de inicio".
- El preview de Lovable puede no mostrar el prompt de instalación; se ve al publicar en un dominio HTTPS.

## Archivos

- Editar: `public/manifest.webmanifest`, `src/routes/__root.tsx`.
- No se crean/borran archivos.
