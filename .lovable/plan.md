## Objetivo

En **todos los documentos** (Acta Nombramiento, Acta Aprobación, Acta Reunión e Informes CSS/AT), el usuario debe poder editar dos campos clave que aparecen al final junto a la firma:

1. **Lugar de la firma** — texto libre, prefilled por defecto con el municipio de la obra (editable).
2. **Fecha del documento** — fecha editable (la que aparece como "En {lugar}, a {fecha}.").

Hoy:
- `FormActaNombramiento` y `FormActaAprobacion` ya tienen los campos "Lugar" y "Fecha" → **OK**, solo mejorar el prefill por defecto.
- `FormActaReunion` tiene "Lugar de reunión" + "Fecha y hora" pero **no tiene un campo de lugar de firma independiente** → falta añadirlo.
- `FormInforme` (CSS/AT) solo tiene "Fecha de visita". **No tiene campo de lugar de firma**, aunque la portada e header del PDF muestran esa fecha → falta añadir lugar de firma editable. Además, conviene renombrar/aclarar que esa fecha es también la que aparecerá en el documento.

El edge function `generar-documento-pdf` ya lee `extra.lugar_firma` (o `extra.localidad`) y `doc.fecha_documento` para imprimir "En {lugar}, a {fecha}." → no requiere cambios estructurales, solo asegurar que las plantillas de Reunión e Informe usen `extra.lugar_firma` consistentemente.

---

## Cambios

### 1. `FormActaReunion.tsx`
- Añadir estado `lugarFirma` (string) y `fechaFirma` (string `YYYY-MM-DD`).
- Cargar desde `extra.lugar_firma` (fallback a `defaultValues.direccion_obra` extraída como municipio o vacío) y `documento.fecha_documento`.
- Nueva sección al final del formulario "Firma" con dos inputs:
  - `Lugar de la firma` (texto, editable, placeholder "Maspalomas").
  - `Fecha de la firma` (`type="date"`).
- Guardar en `datos_extra.lugar_firma` y en el campo top-level `fecha_documento` (desacoplándolo de `fechaHora` que es la fecha/hora de la reunión).
- Mantener `fechaHora` como "Fecha y hora de la reunión" (no se toca su semántica).

### 2. `FormInforme.tsx`
- Añadir estado `lugarFirma` y mantener `fechaVisita` (que ya alimenta `fecha_documento`).
- Renombrar la etiqueta del input de fecha a "Fecha del documento" (sigue siendo la misma fecha que aparece en portada/header del PDF, pero se aclara que es editable y que es la que se imprime).
- Añadir campo `Lugar de la firma` (texto, editable) en una nueva sección "Firma" al final.
- Guardar en `datos_extra.lugar_firma`.

### 3. `FormActaNombramiento.tsx` y `FormActaAprobacion.tsx`
- Ya tienen los campos. Solo mejorar el prefill: cuando se crea uno nuevo y el `defaultValues` trae municipio/dirección, usarlo como valor inicial de `lugarFirma` (en lugar del hard-coded "Maspalomas"). Si no hay dato, dejar "Maspalomas" como fallback.

### 4. `supabase/functions/generar-documento-pdf/index.ts`
- En `templateActaReunion` (línea 663) y donde corresponda, cambiar `extra.localidad` por `extra.lugar_firma || extra.localidad || "_______________"` para que use el campo de firma específico.
- En `templateInforme`, añadir al final (después de `firmaRecuadros()`) la línea "En {lugar_firma}, a {fecha_documento}." encima de los recuadros de firma, igual que hacen las otras plantillas.
- No cambiar el comportamiento de portada/header del informe (ya usa `doc.fecha_documento` correctamente).

### 5. Sin cambios de base de datos
- `lugar_firma` y `fecha_documento` ya existen (uno en `datos_extra` JSONB, el otro como columna). No se requiere migración.

---

## Detalles técnicos

```ts
// FormInforme.tsx — añadir
const [lugarFirma, setLugarFirma] = useState('');

// load
setLugarFirma(extra.lugar_firma || '');

// save
datos_extra: { ..., lugar_firma: lugarFirma }

// UI
<p className="text-sm font-semibold text-muted-foreground pt-2">Firma</p>
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label>Lugar de la firma</Label>
    <Input value={lugarFirma} onChange={e => setLugarFirma(e.target.value)} placeholder="Maspalomas" />
  </div>
  <div className="space-y-2">
    <Label>Fecha del documento</Label>
    <Input type="date" value={fechaVisita} onChange={e => setFechaVisita(e.target.value)} />
  </div>
</div>
```

```ts
// FormActaReunion.tsx — añadir
const [lugarFirma, setLugarFirma] = useState('');
const [fechaFirma, setFechaFirma] = useState(''); // YYYY-MM-DD

// guardar fecha_documento como fechaFirma (no como fechaHora) y datos_extra.lugar_firma
```

```ts
// generar-documento-pdf/index.ts — templateInforme
html += `<p style="margin-top:24pt;font-size:10pt;text-align:right;">En ${extra.lugar_firma || "_______________"}, a ${fechaDoc || "_______________"}.</p>`;
html += firmaRecuadros();
```

---

## Resultado esperado

En cualquier documento, el técnico/admin verá una sección "Firma" con dos campos editables:
- Lugar de la firma (texto libre, p.ej. "Maspalomas", "Las Palmas", etc.).
- Fecha (date picker).

El PDF generado mostrará "En {lugar}, a {fecha}." encima de los recuadros de firma en todos los tipos de documento, con los valores que el usuario haya puesto.