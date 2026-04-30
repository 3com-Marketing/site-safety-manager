## Diagnóstico

El diálogo de firmas **sí está conectado** correctamente:

- `finishVisita()` ejecuta `setShowFirmas(true)` y `<FirmaPresenciaDialog open={showFirmas}>` está montado al final del JSX.
- Solo se dispara desde el botón verde **"FINALIZAR VISITA"** (y sus variantes "FINALIZAR" / "Finalizar visita ahora" cuando estás dentro de una sección).

El problema real es de UX en la barra inferior de `VisitaActiva.tsx`:

```
┌─────────────────────┬─────────────────────┐
│  Guardar y salir    │  FINALIZAR VISITA   │
│  (gris, navega /)   │  (verde, abre firmas)│
└─────────────────────┴─────────────────────┘
```

Al estar el botón izquierdo etiquetado **"Guardar y salir"**, transmite que ese flujo cierra la visita guardando los cambios. En realidad solo navega al home dejando la visita en estado `en_curso` (sin disparar el diálogo de firmas, sin pedir GPS, sin marcar como `finalizada`). Por eso el usuario percibe que «guardamos y no sale nada» — pulsa el botón equivocado, le devuelve al home y la visita sigue abierta sin firmas.

En la grabación de sesión se ve exactamente eso: tras editar Amonestaciones/Observaciones aparece un `unload event` y vuelve a TechHome con "INICIAR VISITA" — comportamiento de "Guardar y salir", no de finalizar.

## Cambios propuestos

Solo se toca `src/pages/VisitaActiva.tsx`. **No se modifica** `FirmaPresenciaDialog`, ni `persistFinish`, ni el flujo de firmas/GPS.

1. **Renombrar el botón izquierdo** para eliminar la palabra "Guardar":
   - `Guardar y salir` → `Salir sin finalizar`
   - Añadir un pequeño texto secundario o tooltip: «La visita queda como borrador. Para cerrarla pulsa FINALIZAR VISITA.»

2. **Reforzar visualmente el CTA "FINALIZAR VISITA"**:
   - Mantenerlo verde y en negrita.
   - En la vista de secciones, darle más peso (por ejemplo `flex-[2]` frente a `flex-1` del botón "Salir sin finalizar"), para que sea claramente la acción principal.

3. **Confirmación al salir sin finalizar** (opcional, mismo botón):
   - Antes de `navigate('/')`, abrir un `AlertDialog` con: «La visita queda guardada como borrador y aparecerá en "Visitas recientes". No se ha cerrado ni firmado. ¿Salir igualmente?» con botones `Salir` / `Continuar visita`.
   - Esto evita que el usuario crea que ha cerrado la visita.

4. **(Verificación)** Confirmar que el diálogo de firmas se abre correctamente al pulsar el botón verde. Si sigue sin aparecer tras este cambio, añadir un `console.log` en `finishVisita` para diagnosticar (las trazas se enviarán automáticamente en el próximo mensaje del usuario).

## Lo que NO se cambia

- `FirmaPresenciaDialog.tsx` — ya funciona y muestra los 3 pasos (Responsable → Técnico → Resumen).
- `persistFinish`, `startGeoFlow`, `handleFirmasConfirmed` — la cadena finalizar → firmas → GPS → guardar sigue intacta.
- Migraciones de BBDD ni edge function del PDF.

## Resultado esperado

Al pulsar el botón verde **FINALIZAR VISITA**, se abre el diálogo de firmas como hasta ahora. El botón gris ya no se llamará "Guardar y salir" y, si se pulsa, mostrará una confirmación dejando claro que la visita queda como borrador y no se ha cerrado.