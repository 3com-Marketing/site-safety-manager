# Unificar bloque de firmas en todos los PDFs

## Objetivo

Reemplazar todos los bloques de firma actuales por un formato unificado tipo "acta papel" con dos recuadros lado a lado:

```text
┌──────────────────────────────┐   ┌──────────────────────────────┐
│                              │   │                              │
│        (espacio firma)       │   │        (espacio firma)       │
│                              │   │                              │
├──────────────────────────────┤   ├──────────────────────────────┤
│  FIRMA DEL TÉCNICO INSPECTOR │   │  FIRMA RESPONSABLE DE LA     │
│                              │   │  EMPRESA:                    │
│                              │   │  Recibí nombre y cargo       │
└──────────────────────────────┘   └──────────────────────────────┘
```

## Cambios en `supabase/functions/generar-documento-pdf/index.ts`

### 1. Nuevo helper `firmaRecuadros()`

Crear una función única que devuelva el bloque HTML con los dos recuadros, reutilizable por todas las plantillas:

- Dos cajas con `border: 1px solid #333`
- Altura interna ~70pt para permitir firmar a mano
- Línea separadora horizontal antes del texto
- Etiquetas en negrita 8.5pt centradas:
  - Izquierda: "FIRMA DEL TÉCNICO INSPECTOR"
  - Derecha: "FIRMA RESPONSABLE DE LA EMPRESA:" + subtítulo "Recibí nombre y cargo"
- Layout con `display: flex; gap: 20pt; margin-top: 20pt;`

### 2. Reemplazos en cada plantilla

- **Informe CSS / AT** (línea ~844-849): sustituir `firma-section` (línea única + nombre técnico) por `firmaRecuadros()`.
- **Acta Nombramiento** (líneas ~227-232): sustituir las dos líneas con etiquetas "El Promotor / La Coordinadora" por `firmaRecuadros()`.
- **Acta Aprobación** (líneas ~290-295 con `firmaSection()`): sustituir por `firmaRecuadros()`.
- **Acta Reunión completa** (líneas ~659-665): sustituir bloque actual por `firmaRecuadros()`.
- **Acta Reunión simple** (líneas ~720-726): sustituir bloque actual por `firmaRecuadros()`.

Mantener encima de cada bloque la línea "En {lugar}, a {fecha}." que ya existe.

### 3. CSS común

Añadir clases reutilizables en el `<style>` global:

```css
.firma-recuadros { display: flex; gap: 20pt; margin-top: 20pt; page-break-inside: avoid; }
.firma-recuadro { flex: 1; border: 1px solid #333; min-height: 110pt; display: flex; flex-direction: column; }
.firma-recuadro-area { flex: 1; min-height: 70pt; }
.firma-recuadro-label { border-top: 1px solid #333; padding: 4pt 6pt; text-align: center; font-size: 8.5pt; font-weight: bold; }
.firma-recuadro-sub { font-size: 7.5pt; font-weight: normal; color: #555; margin-top: 2pt; }
```

## Notas

- Las etiquetas específicas anteriores (Promotor, Coordinadora CAE, Empresa CSS, etc.) se eliminan en favor del formato unificado solicitado.
- El nombre del técnico ya no aparece bajo la firma (irá escrito a mano en el recuadro derecho como "nombre y cargo").
- Se mantiene `page-break-inside: avoid` para que el bloque no se parta entre páginas.
