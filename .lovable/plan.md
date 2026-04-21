

# Plan: Corregir iconos PWA para que la app sea instalable

## Problema

Los archivos `icon-192.png` e `icon-512.png` son en realidad imágenes JPEG renombradas con extensión `.png`. Los navegadores validan que los iconos del manifest PWA sean PNG reales. Al no serlo, el criterio de instalabilidad falla y no aparece la opción "Instalar app" / "Añadir a pantalla de inicio".

## Solución

Generar iconos PNG reales con un script Python (usando Pillow) que cree iconos de SafeWork (casco de obra naranja sobre fondo blanco) en formato PNG válido, en los tamaños 192x192 y 512x512.

## Cambios

### 1. Generar iconos PNG válidos (`public/icon-192.png`, `public/icon-512.png`)

- Usar Python con Pillow para crear iconos PNG reales con el logo de SafeWork (casco naranja #F37520 sobre fondo blanco redondeado).
- Guardar como PNG real en 192x192 y 512x512.
- También generar un `icon-180.png` para el Apple Touch Icon (tamaño recomendado por Apple).

### 2. Actualizar `index.html`

- Cambiar el Apple Touch Icon a `icon-180.png` (tamaño estándar de Apple).

### 3. Actualizar manifest en `vite.config.ts`

- Añadir el icono 180x180 para Apple.
- Verificar que `purpose: "any"` esté en al menos un icono (necesario para instalabilidad).

## Resultado esperado

- En Android (Chrome): aparecerá un banner o la opción en el menú de "Instalar app".
- En iOS (Safari): la opción "Añadir a pantalla de inicio" funcionará correctamente con el icono naranja.
- La app se abrirá sin barra del navegador (modo standalone).

## Nota importante

Las funciones PWA (instalación, offline) solo funcionan en la versión publicada (hc-hub.lovable.app), no en el preview de Lovable.

## Archivos afectados
- **`public/icon-192.png`** — regenerar como PNG real
- **`public/icon-512.png`** — regenerar como PNG real
- **`public/icon-180.png`** — nuevo, Apple Touch Icon
- **`index.html`** — actualizar apple-touch-icon
- **`vite.config.ts`** — verificar iconos en manifest

