## Gestión de firma digital en el perfil de técnicos y coordinadores

Añadir una sección "Firma" únicamente dentro del diálogo de edición/creación de `AdminTecnicos.tsx` (que actúa como perfil de cada usuario técnico o coordinador). Sin tocar ninguna otra pantalla ni componente compartido.

### Cambios en base de datos
Migración sobre la tabla `tecnicos`:
- `firma_url` (text, nullable) — URL pública de la firma almacenada.
- `firma_actualizada_at` (timestamptz, nullable) — fecha de la última actualización.

Las firmas se subirán al bucket de storage existente `logos` (ya público), bajo la ruta `firmas/{tecnico_id}_{timestamp}.png`. Se añade política RLS de INSERT/UPDATE/DELETE sobre `storage.objects` para que cualquier admin autenticado pueda gestionar archivos en el prefijo `firmas/` del bucket `logos`.

### Nuevo componente: `src/components/tecnicos/FirmaCapture.tsx`
Componente local (no compartido), usado solo desde el diálogo de `AdminTecnicos`. Props: `value: string | null`, `actualizadaAt: string | null`, `onChange(pngBlob: Blob): void`.

UI con dos pestañas (Tabs ya disponibles):

**Pestaña "Dibujar"**
- `<canvas>` 500×200, fondo blanco, trazo negro fino (lineWidth 2, lineCap round).
- Eventos `pointerdown/move/up` (soporta dedo y ratón).
- Botones: "Borrar" (limpia canvas) y "Usar esta firma" (exporta a PNG con fondo transparente: se recorre el ImageData y los píxeles cercanos a blanco se ponen alpha=0).

**Pestaña "Subir imagen"**
- `<input type="file" accept="image/png,image/jpeg">`.
- Previsualización en `<img>` antes de confirmar.
- Botón "Usar esta imagen": dibuja la imagen en un canvas oculto y aplica el mismo recorte de fondo blanco (umbral RGB > 240 → alpha 0) para producir un PNG transparente.

**Vista actual**
- Si existe `firma_url`: muestra la firma sobre fondo cuadriculado/transparente, etiqueta "Última actualización: {fecha formateada es-ES}", y botón "Reemplazar firma" que abre las pestañas anteriores.

### Cambios en `AdminTecnicos.tsx`
1. Añadir `firma_url` y `firma_actualizada_at` al interface `Tecnico` y al `select('*')`.
2. Estado local en el diálogo: `firmaPendiente: Blob | null` y `firmaUrlActual: string | null`.
3. Insertar el componente `<FirmaCapture>` como nueva sección dentro del Dialog de edición (tras "Notas", antes de "Vincular a usuario"), con su propio `<Label>Firma</Label>` y un panel enmarcado.
4. En `handleSave`:
   - Si hay `firmaPendiente`, primero hacer `INSERT` o `UPDATE` del técnico para obtener el `id`.
   - Subir blob a `logos/firmas/{tecnicoId}_{Date.now()}.png` (`upsert: true`, `contentType: 'image/png'`).
   - Obtener `getPublicUrl` y hacer `UPDATE tecnicos SET firma_url=..., firma_actualizada_at=now() WHERE id=...`.
5. En el Dialog de visualización (View), añadir una fila "Firma:" que muestre la imagen (o "—" si no hay) y la fecha de actualización.

### Detalles técnicos clave
- Recorte de fondo: función `removeWhiteBackground(canvas)` que itera `getImageData`, y para cada píxel con `r>240 && g>240 && b>240` pone `a=0`. Suficientemente robusto para firmas escaneadas/fotografiadas con fondo claro.
- Validación de subida: tamaño máximo 5 MB, tipos permitidos `image/png` e `image/jpeg`, mostrar `toast.error` en caso contrario.
- El canvas de dibujo escala correctamente coordenadas del puntero respecto al `getBoundingClientRect()` para soportar pantallas táctiles.
- Limpieza de URL.createObjectURL al desmontar previews.

### Archivos a crear/modificar
- **Nuevo**: `src/components/tecnicos/FirmaCapture.tsx`
- **Modificado**: `src/pages/AdminTecnicos.tsx` (sección de firma en diálogos crear/editar y ver)
- **Migración**: añadir columnas `firma_url` y `firma_actualizada_at` a `tecnicos`, y políticas RLS en `storage.objects` para el prefijo `firmas/` del bucket `logos`.
