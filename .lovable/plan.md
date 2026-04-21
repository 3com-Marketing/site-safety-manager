

# Plan: PWA instalable + responsive mobile/tablet para técnicos

## Resumen

Convertir la app en una Progressive Web App (PWA) instalable desde el navegador, optimizar la UX responsive de las páginas del técnico para móvil y tablet, y corregir el error de runtime actual.

## Cambios

### 1. Configurar PWA con `vite-plugin-pwa`

**`vite.config.ts`**
- Instalar `vite-plugin-pwa`
- Configurar con `registerType: "autoUpdate"`, `devOptions: { enabled: false }`, y `navigateFallbackDenylist: [/^\/~oauth/]`
- Definir manifest inline: nombre "SafeWork", colores de la marca (orange #F37520, fondo #f5f7fa), iconos, `display: "standalone"`, `orientation: "portrait"`

**`src/main.tsx`**
- Añadir guard para no registrar service worker en iframe o preview de Lovable
- Desregistrar service workers existentes en contexto preview

### 2. Crear iconos PWA y manifest

**`public/`**
- Crear iconos PWA en los tamaños necesarios (192x192, 512x512) con el icono de HardHat/SafeWork en naranja
- El manifest se genera automáticamente desde vite-plugin-pwa

### 3. Actualizar `index.html` con meta tags móvil

- Añadir `<meta name="apple-mobile-web-app-capable" content="yes">`
- Añadir `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
- Añadir `<meta name="theme-color" content="#F37520">`
- Añadir `<link rel="apple-touch-icon" href="/icon-192.png">`
- Actualizar title a "SafeWork"

### 4. Responsive polish para páginas técnico

**`src/pages/TechHome.tsx`**
- Ajustar padding: `p-3 sm:p-4`
- Botón INICIAR VISITA: `h-16 sm:h-20`, texto `text-lg sm:text-xl`
- Tarjetas de visitas: padding `p-3 sm:p-4`, texto más compacto en móvil
- Badge de estado: ocultar texto largo en pantallas pequeñas, mostrar solo icono

**`src/components/visita/VisitaSecciones.tsx`**
- Reducir padding en móvil: `p-4 sm:p-5`
- Iconos: `h-10 w-10 sm:h-12 sm:w-12`

**`src/pages/VisitaActiva.tsx`**
- Bottom bar: reducir padding en móvil `p-3 sm:p-4`
- Botones de navegación: `h-11 sm:h-12`
- Header: más compacto en móvil

**`src/pages/SelectObra.tsx`**
- Tarjetas de obra: `p-3 sm:p-4`, icono más pequeño en móvil

**`src/pages/TechDocumentos.tsx`**
- Padding responsive: `p-4 sm:p-6`

### 5. Mover RoleSwitcher para no tapar contenido en móvil

**`src/components/RoleSwitcher.tsx`**
- Posición: `bottom-20 sm:bottom-6` para no solaparse con la barra inferior de VisitaActiva en móvil
- Tamaño más compacto en móvil: `px-3 py-2 sm:px-4 sm:py-3`

### 6. Corregir error de runtime

El error `useAuth must be used within AuthProvider` ocurre porque `RoleSwitcher` está fuera del `ErrorBoundary` pero dentro del `AuthProvider`. Sin embargo, si un error en el boundary causa un re-render parcial, puede fallar. Mover `RoleSwitcher` dentro del `ErrorBoundary` en `App.tsx`.

## Detalles técnicos

- `vite-plugin-pwa` genera automáticamente el service worker y el manifest
- El service worker solo se activa en producción (builds), no en el preview de Lovable
- La app será instalable con "Añadir a pantalla de inicio" en iOS y "Instalar app" en Android
- Se mantiene `display: standalone` para que parezca una app nativa sin barra del navegador

## Archivos afectados
- **`package.json`** — añadir `vite-plugin-pwa`
- **`vite.config.ts`** — configurar PWA plugin
- **`src/main.tsx`** — guard de service worker
- **`index.html`** — meta tags móvil y PWA
- **`public/icon-192.png`**, **`public/icon-512.png`** — iconos PWA (generados por script)
- **`src/pages/TechHome.tsx`** — responsive padding/sizing
- **`src/components/visita/VisitaSecciones.tsx`** — responsive
- **`src/pages/VisitaActiva.tsx`** — responsive bottom bar
- **`src/pages/SelectObra.tsx`** — responsive cards
- **`src/pages/TechDocumentos.tsx`** — responsive padding
- **`src/components/RoleSwitcher.tsx`** — posición responsive
- **`src/App.tsx`** — mover RoleSwitcher dentro de ErrorBoundary

