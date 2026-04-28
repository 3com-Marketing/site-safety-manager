## Objetivo

Aplicar la identidad cromática de **HC Seguridad y Salud** (hcseguridadysalud.com) a toda la app: UI, badges, sidebar, login y los PDFs de informes y documentos. El logo de HC es negro con un check rojo sobre fondo blanco/rojo; el naranja del casco aparece como acento de apoyo.

## Paleta corporativa HC

| Token | Hex | HSL | Uso |
|---|---|---|---|
| **Primario (rojo HC)** | `#E63027` | `4 78% 53%` | Botones primarios, links, focus ring, barras de acento, headings de PDF |
| **Primario hover** | `#C8221A` | `4 76% 45%` | Estado hover/active del primario |
| **Acento (naranja casco)** | `#F37520` | `24 90% 54%` | Badges informativos, highlights secundarios, iconos destacados |
| **Negro grafito** | `#1A1A1A` | `0 0% 10%` | Texto principal, sidebar, headings |
| **Gris superficie** | `#F5F5F5` | `0 0% 96%` | Fondos de tarjetas/meta en PDFs |
| **Gris borde** | `#E0E0E0` | `0 0% 88%` | Bordes y separadores |
| **Blanco** | `#FFFFFF` | — | Fondo app |
| **Estados** | success `#16A34A`, warning `#F59E0B`, destructive `#DC2626` | — | Se mantienen |

Tipografía: se conserva (Space Grotesk + DM Sans).

## Cambios en código

### 1. `src/index.css` — tokens HSL globales
Sustituir variables del `:root`:

- `--primary: 4 78% 53%` (era `24 95% 53%`)
- `--ring: 4 78% 53%`
- `--accent: 24 90% 54%` (naranja HC, era azul)
- `--accent-foreground: 0 0% 100%`
- `--sidebar-primary: 4 78% 53%`
- `--sidebar-ring: 4 78% 53%`
- Resto de tokens se mantienen.

Esto repinta automáticamente: botones primarios, badges, focus rings, sidebar, indicadores activos en `AdminLayout`, switch de pivot del calendario, chips de visitas, etc. (todos consumen `hsl(var(--primary))`).

### 2. `index.html` — meta theme-color
- `<meta name="theme-color" content="#E63027" />` (era `#F37520`).

### 3. PDFs — `supabase/functions/generar-pdf/index.ts` y `supabase/functions/generar-documento-pdf/index.ts`
Reemplazo masivo del color hardcoded `#F37520` por **`#E63027`** en:
- `h1`, `h2` (títulos y bordes inferiores)
- `.header` border-bottom
- `.badge` background
- `.normativa` y `.normativa-label` (pasa de naranja a rojo HC, fondo claro `#FDECEB`)
- `.cover-tipo`, `.cover-line`, `.section-num`, `.toc-num`, `.rh-tipo`
- Estilos inline en cabeceras de actas (nombramiento, aprobación, reunión)

Resultado: portadas, cabeceras y separadores en rojo HC, manteniendo cuerpo en negro grafito y tablas en grises.

### 4. `src/components/documentos/DocumentoStatusBadge.tsx` y `src/types/documentos.ts`
Mantener semántica de estados (rojo = pendiente, verde = firmado…). **Sin cambios** — los colores de estado son funcionales, no de marca.

### 5. Login y splash
`src/pages/Login.tsx` ya usa `bg-primary` / `text-primary` → adopta el rojo automáticamente. No hace falta tocar.

### 6. Memoria del proyecto
Actualizar `mem://index.md`:
- Core: cambiar "Orange primary (#F37520)" por "Red primary (#E63027 — HC brand), orange accent (#F37520)".

## Lo que NO se toca

- Lógica de negocio, hooks, queries.
- Calendario, modales y panel lateral recientes.
- Tipografías ni radios.
- Esquema de BD ni RLS.
- `client.ts`, `types.ts`, `.env`.

## Verificación tras aplicar

- Botones primarios, sidebar activo y focus ring en rojo HC.
- Badges de tipo "acento" en naranja.
- PDFs generados (informe y acta de nombramiento) con cabecera y separadores rojos.
- Estados pendiente/firmado conservan colores semánticos.
