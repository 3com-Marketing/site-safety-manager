# Importación de repositorio de señales (JSON + imágenes masivas)

Se añade un flujo en dos pasos en **Admin → Repositorio de señales**:

1. **Importar JSON** → crea categorías y señales (sin imagen aún), guardando el nombre del archivo original como referencia para el emparejamiento posterior.
2. **Importar imágenes en lote** → el admin selecciona muchas imágenes a la vez; el sistema las empareja automáticamente con las señales por nombre de archivo, sube las emparejadas a Storage y muestra una bandeja "Sin emparejar" con asignación manual.

Las funciones existentes (crear, editar, eliminar, toggle, gestión de categorías, editor de fotos) **no cambian**.

---

## 1. Cambio de base de datos

Añadir una columna a `signos_obra` para conservar el nombre original del archivo del JSON; es la clave para el emparejamiento automático y para reasignar imágenes más tarde.

```sql
ALTER TABLE public.signos_obra
  ADD COLUMN archivo_original text;

CREATE INDEX idx_signos_obra_archivo_original
  ON public.signos_obra (lower(archivo_original));
```

Sin valor por defecto: las señales existentes (seed inicial) se quedan en `NULL`, lo cual es correcto.

---

## 2. Nueva pestaña "Importar" en `AdminSenales.tsx`

Pestaña adicional junto a "Categorías" y "Señales", con dos bloques:

### 2.1 Importar JSON

- `Textarea` o `<input type="file" accept=".json">` para pegar/cargar el JSON.
- Validación del esquema: `categorias[]` con `nombre/orden/activa`, `señales[]` con `nombre/categoria_id/archivo_original/activa`. Tolerar el campo `pendientes_de_revision` (se ignora silenciosamente).
- **Vista previa** antes de importar: tabla con N categorías y M señales, marcando cuáles ya existen (por nombre, case-insensitive) — esas se omiten.
- Al confirmar:
  - Insertar categorías nuevas (las existentes por nombre se reutilizan; obtener su `id` real de la BD).
  - Construir mapa `categoria_id_json → categoria_id_uuid`.
  - Insertar señales con `imagen_url = ''` (placeholder), `archivo_original`, `activa`, y `categoria_id` mapeado. Las que ya existan por `nombre` (case-insensitive) se omiten.
  - **Marcadas como inactivas automáticamente** mientras `imagen_url` esté vacío, para que no aparezcan rotas en el editor del técnico hasta tener imagen.
- Toast con resumen: `X categorías creadas, Y señales creadas, Z omitidas`.

### 2.2 Importar imágenes en lote

- `<input type="file" multiple accept="image/*">` (PNG/JPG/SVG/GIF/WEBP).
- Al seleccionar archivos, sin subir aún, mostrar un panel con tres listas:
  - **Emparejadas automáticamente** (verde): coincidencia exacta `archivo_original` ↔ `file.name` (case-insensitive, normalizando espacios/guiones), o coincidencia única tras normalización agresiva (quitar acentos, espacios → `_`, etc.).
  - **Sin emparejar** (ámbar): mostrar el nombre del archivo + `Select` para asignar manualmente a una señal existente (filtrable). Opción "Omitir".
  - **Conflicto** (rojo): mismo nombre coincide con varias señales — `Select` para elegir.
- Botón **"Subir y emparejar (N)"**:
  - Para cada par (señal → archivo): subir a `signos-obra/{senal_id}/{timestamp}_{nombre}.{ext}`, obtener `publicUrl`, `UPDATE signos_obra SET imagen_url = ..., activa = true WHERE id = ...`.
  - Barra de progreso simple (`X / N`).
  - Si la señal ya tenía imagen previa de Storage, se sustituye y el archivo viejo se elimina del bucket (igual que en el flujo individual existente).
- Toast resumen: `N emparejadas, M sin asignar`.

Tras la importación, la pestaña "Señales" muestra todo automáticamente (React Query invalidate).

### 2.3 Bandeja "Sin emparejar" persistente

En la pestaña **Señales**, añadir un filtro rápido **"Sin imagen"** (`imagen_url = '' OR NULL`) para que el admin pueda subir manualmente las que se quedaron pendientes en cualquier momento desde el botón de edición existente, sin necesidad de relanzar la importación masiva.

---

## 3. Lógica de emparejamiento

```text
normalize(name) = lowercase
                  → quitar extensión
                  → quitar acentos (NFD + remove combining marks)
                  → reemplazar [espacios, _, -] por '-'
                  → colapsar guiones repetidos
```

Coincidencia: `normalize(file.name) === normalize(senal.archivo_original)`.

Si hay >1 candidato → conflicto. Si 0 → sin emparejar.

---

## 4. Archivos

**Modificar**
- `src/pages/AdminSenales.tsx` — nueva pestaña "Importar" con dos secciones.
- `src/hooks/useSignosObra.ts` — añadir `archivo_original` al tipo `SignoObraDB`.

**Crear**
- `src/components/admin/senales/ImportarRepositorio.tsx` — toda la lógica de importación (JSON + imágenes).
- `src/lib/signosMatching.ts` — helper `normalize()` y `matchFiles()` (testeable).
- Migración SQL en `supabase/migrations/` para añadir la columna y el índice.

**No se modifica**
- `FotoEditor.tsx`, gestión de categorías/señales existente, `App.tsx`, `AdminLayout.tsx`.

---

## Detalles técnicos

- El JSON pegado se procesa client-side; los inserts a Supabase van por lotes (`.insert([...])`) en una sola llamada por tabla.
- Las señales sin imagen se insertan con `activa = false` para evitar tarjetas rotas en el editor del técnico; al subir su imagen pasan a `activa = true` automáticamente (a menos que el admin las desactive manualmente luego).
- La normalización de nombres se prueba contra los 71 ejemplos del JSON: variantes como `"desvio_provisional-removebg-preview (1).png"` y `"barandilla_tipo_ayto.-removebg-preview (1).png"` quedan emparejables si el archivo subido tiene el mismo nombre exacto. Variaciones (renombrados manualmente) caen a "Sin emparejar" para asignación a mano.
- El bucket `signos-obra` ya existe y es público (creado en la migración previa). No se requieren cambios de Storage ni RLS.
- Reimportar el mismo JSON es seguro: se omiten duplicados por nombre.
