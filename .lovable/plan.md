## Paso de firma en el cierre del informe

Añadir un diálogo de "Confirmación de firma" que aparece justo antes de marcar un informe como cerrado, sin tocar ninguna otra lógica del informe.

### Cambios en base de datos
Migración sobre la tabla `informes`:
- `firma_url` (text, nullable) — URL pública de la firma asociada al informe.
- `firma_at` (timestamptz, nullable) — fecha y hora del cierre con firma.

Políticas RLS sobre `storage.objects` para el prefijo `firmas-informes/` del bucket `logos`:
- INSERT/UPDATE/DELETE: cualquier usuario autenticado.
- SELECT: público (necesario para mostrarla en el PDF y la ficha).

### Nuevo componente: `src/components/informes/ConfirmarFirmaDialog.tsx`
Componente local, usado solo desde `AdminInformeDetalle.tsx`. Props: `open`, `onClose`, `firmaPerfilUrl: string|null`, `onConfirm(blob: Blob | { useStored: true }): Promise<void>`.

Estados internos:
1. **Si hay firma de perfil**: pantalla con dos opciones:
   - Tarjeta "Firmar con mi firma guardada" mostrando la imagen de la firma del perfil + botón **"Confirmar y cerrar"**.
   - Botón secundario "Firmar ahora" → cambia al modo dibujo.
2. **Si NO hay firma de perfil**: directamente el canvas de dibujo + aviso «No tienes firma guardada. Puedes añadir una en tu perfil para agilizar este paso en el futuro.»
3. **Modo dibujo**: canvas táctil 500×200, fondo blanco, trazo negro fino. Botones "Borrar", "Volver" (si hay firma de perfil) y "Confirmar y cerrar". Aplica recorte de fondo blanco para producir un PNG transparente.

El componente reutiliza la lógica de canvas y `removeWhiteBackground` ya implementada en `FirmaCapture.tsx` (mismo patrón, sin importarlo para mantenerlos independientes).

### Cambios en `AdminInformeDetalle.tsx`
1. Importar `useAuth` para obtener el `user.id` actual.
2. Al montar, hacer una consulta adicional: `supabase.from('tecnicos').select('firma_url').eq('user_id', user.id).maybeSingle()` y guardarla en estado local `firmaPerfilUrl`.
3. Cambiar el botón "Marcar como revisado": al pulsar, abre el `ConfirmarFirmaDialog` en lugar de cerrar directamente.
4. Nueva función `closeWithFirma(payload)`:
   - Si `payload.useStored`: usa `firmaPerfilUrl` directamente como `firma_url`.
   - Si es Blob: subir a `logos/firmas-informes/{informeId}_{Date.now()}.png` con `upsert: true`, obtener `getPublicUrl`.
   - `UPDATE informes SET estado='cerrado', firma_url=..., firma_at=now() WHERE id=...`.
   - `toast.success('Informe cerrado y firmado')`, refetch, cerrar diálogo.
5. **No se modifica nunca la fila de `tecnicos`.** La firma del perfil queda intacta; solo se copia su URL al informe (o se sube una nueva firma específica del informe).

### Archivos a crear/modificar
- **Nuevo**: `src/components/informes/ConfirmarFirmaDialog.tsx`
- **Modificado**: `src/pages/AdminInformeDetalle.tsx` (carga de firma del perfil, nuevo handler, sustitución del comportamiento del botón "Marcar como revisado")
- **Migración**: nuevas columnas `firma_url` y `firma_at` en `informes`, y políticas RLS en `storage.objects` para `firmas-informes/`.
