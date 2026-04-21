

# Plan: Mejorar UX de la vista de tecnico

Basado en los mockups, hay varios cambios visuales y de usabilidad. No se cambia logica de negocio ni base de datos.

## Cambios principales

### 1. `src/components/visita/VisitaSecciones.tsx` -- Lista plana de 9 secciones

Actualmente hay 5 secciones (con "Checklist" agrupado). Los mockups muestran las 9 secciones individuales (Datos generales, EPIs, Orden y limpieza, Trabajo en altura, Senalizacion, Maquinaria, Incidencias, Amonestaciones, Observaciones) como filas independientes.

- Cada fila muestra un icono especifico (lucide), el nombre, y el estado: "Completado" con fondo verde suave + checkmark, o "Sin completar" en gris.
- Anadir barra de progreso en la parte superior: "Progreso de la visita — X de 9 completadas".
- El componente recibira un array de estados de completado por seccion (no solo counts).
- Iconos: Info (datos generales), ShieldCheck (EPIs), Trash2 (Orden), Mountain (Altura), AlertTriangle (Senalizacion), Cog (Maquinaria), AlertTriangle (Incidencias), FileText (Amonestaciones), Eye (Observaciones).

### 2. `src/pages/VisitaActiva.tsx` -- Adaptar header y navegacion

- **Header**: Mostrar "← Visitas" como breadcrumb textual (naranja) encima del nombre de obra, en lugar del boton ghost con icono.
- **Pasar estados de completado** a VisitaSecciones: un bloque se considera "completado" si tiene `estado === 'completado'`; incidencias/amonestaciones/observaciones se consideran completadas si tienen al menos 1 item.
- **Eliminar la logica de "paso X de N"** del header cuando se esta dentro de una seccion. En su lugar mostrar "← NombreObra" como breadcrumb.
- **onSelect** mapea directamente cada seccion a su step (ya no pasa por ChecklistSection intermedio).

### 3. `src/components/visita/ChecklistBloque.tsx` -- Mejorar UX interior

- **Header**: Cambiar el boton ArrowLeft + titulo por breadcrumb naranja "← NombreObra" + titulo grande de la categoria debajo.
- **Botones Foto/Nota por voz**: Reemplazar emojis (📷, 🎤) por iconos de lucide (Camera, Mic) en un estilo mas limpio, con fondo claro y borde.
- **Anadir boton "Anadir nota" manual**: Un tercer boton o una seccion debajo que abra un input de texto simple (textarea + "Guardar nota" / "Cancelar") para anadir anotaciones escritas sin usar voz.
- **Estado vacio**: Mostrar un icono ilustrativo centrado con texto "Sin anotaciones aun. Usa los botones de arriba." en lugar de solo texto.
- **Barra inferior**: En lugar de "Anterior/Siguiente" genericos, mostrar:
  - Boton izquierdo: "← Senalizacion" (nombre de la seccion anterior)
  - Boton derecho: "✓ Marcar completado" (que actualiza `checklist_bloques.estado` a 'completado' y va a la siguiente seccion)
  - Si ya esta completado, el boton cambia a "✓ Completado" con estilo verde.

### 4. `src/pages/VisitaActiva.tsx` -- Barra inferior contextual

- En vista de secciones: mantener "Guardar y salir" + "FINALIZAR VISITA" como esta.
- En vista de step (bloque checklist): mostrar los botones contextuales del bloque (nombre seccion anterior + marcar completado) en lugar de los genericos Anterior/Siguiente. Los botones se mueven al propio ChecklistBloque o se parametrizan desde VisitaActiva.
- En vista de step (incidencias, amonestaciones, observaciones): mantener navegacion pero con nombre de seccion anterior/siguiente.

### 5. `src/index.css` -- Ajustar field-action-btn

- Reducir `min-height` de 140px a ~100px para que los botones de accion sean mas compactos.
- Usar iconos lucide en vez de emojis, asi que el `.icon` class con `text-4xl` se ajustara.

## Archivos afectados

- **`src/components/visita/VisitaSecciones.tsx`** -- Reescribir con 9 secciones planas, estado de completado, barra de progreso
- **`src/pages/VisitaActiva.tsx`** -- Adaptar header, calcular estados de completado, pasar props, ajustar barra inferior
- **`src/components/visita/ChecklistBloque.tsx`** -- Breadcrumb, iconos lucide, boton nota manual, barra inferior contextual, estado vacio mejorado
- **`src/index.css`** -- Ajustar field-action-btn

