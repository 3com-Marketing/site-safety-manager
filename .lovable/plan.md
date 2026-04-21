

# Plan: Editor de fotos con anotaciones y senales de obra

## Resumen

Crear un componente `FotoEditor` que reemplace al actual `FotoViewer` de solo lectura. El editor permitira dibujar sobre las fotografias (flechas, circulos/ovalos, texto libre) con colores configurables, y arrastrar iconos de senales de obra directamente sobre la imagen. La imagen editada se guardara como nueva version en el almacenamiento.

## Funcionalidades

1. **Herramientas de dibujo**: flechas, circulos/ovalos, rectangulos, linea libre, texto
2. **Paleta de colores**: rojo, amarillo, verde, azul, blanco, negro (seleccionable)
3. **Grosor de trazo**: ajustable (fino, medio, grueso)
4. **Senales de obra**: panel lateral con iconos arrastrables de senales tipicas de construccion (prohibido el paso, obligatorio casco, riesgo electrico, extintor, salida de emergencia, obligatorio chaleco, prohibido fumar, atencion peligro, etc.)
5. **Deshacer/Rehacer**: historial de acciones
6. **Guardar**: exporta la imagen con las anotaciones superpuestas y la sube al bucket de almacenamiento, actualizando la URL en la base de datos

## Arquitectura tecnica

### Tecnologia: HTML5 Canvas con Fabric.js

Se usara `fabric.js` (libreria de canvas interactivo) porque ofrece:
- Objetos manipulables (mover, redimensionar, rotar)
- Soporte nativo de drag-and-drop de imagenes
- Exportacion a imagen
- Gestion de capas y seleccion

### Nuevos archivos

1. **`src/components/visita/FotoEditor.tsx`** — Componente principal del editor
   - Carga la imagen original en un canvas Fabric.js dentro de un Dialog a pantalla completa
   - Barra de herramientas superior: tipo de forma, color, grosor, deshacer/rehacer, guardar, cancelar
   - Panel lateral derecho: grid de senales de obra como imagenes PNG/SVG arrastrables al canvas
   - Al guardar: `canvas.toDataURL()` -> blob -> subida a bucket `incidencia-fotos` -> actualiza la URL en la tabla correspondiente

2. **`src/components/visita/editorSignos.ts`** — Catalogo de senales de obra
   - Array de objetos con `{ id, nombre, icono_url, categoria }` para senales como: prohibicion, obligacion, advertencia, emergencia, extintor, etc.
   - Las imagenes de senales se almacenaran como SVGs inline o se subiran al bucket `logos`

3. **`public/senales/`** — Carpeta con SVGs de senales de obra estandar
   - Aproximadamente 12-15 senales basicas de seguridad en construccion

### Cambios en archivos existentes

4. **`src/components/visita/FotoViewer.tsx`** — Transformar en wrapper que abre el editor
   - Anadir prop `editable?: boolean` y `onSave?: (newUrl: string) => void`
   - Si `editable=true`, al hacer click en la foto se abre `FotoEditor`
   - Si `editable=false`, se mantiene el visor actual de solo lectura

5. **`src/pages/AdminInformeDetalle.tsx`** — Pasar `editable={true}` y handler `onSave` al FotoViewer/FotoEditor en las secciones de checklist, incidencias, amonestaciones y observaciones

6. **`src/pages/AdminVisitaDetalle.tsx`** — Pasar `editable={false}` (vista de solo lectura de la visita)

7. **`src/components/visita/ChecklistBloque.tsx`**, **`SeccionIncidencias.tsx`**, **`SeccionAmonestaciones.tsx`**, **`SeccionObservaciones.tsx`** — Conectar el callback `onSave` del editor para actualizar la URL de la foto en la base de datos tras guardar la version editada

### Dependencia nueva

- **`fabric`** (npm) — libreria de canvas interactivo, ~300KB

### Flujo de guardado

```text
Canvas con anotaciones
  -> canvas.toDataURL('image/png')
  -> fetch() para convertir a Blob
  -> supabase.storage.from('incidencia-fotos').upload(path_nuevo)
  -> getPublicUrl()
  -> UPDATE tabla correspondiente SET foto_url = nueva_url / url = nueva_url
  -> Callback onSave(nueva_url) para actualizar el estado local
```

La imagen original se mantiene intacta; se guarda una nueva version con sufijo `_edited` en el nombre del archivo.

## Archivos afectados

- **Nuevo**: `src/components/visita/FotoEditor.tsx`
- **Nuevo**: `src/components/visita/editorSignos.ts`
- **Nuevo**: `public/senales/*.svg` (12-15 archivos SVG de senales)
- **Modificado**: `src/components/visita/FotoViewer.tsx`
- **Modificado**: `src/pages/AdminInformeDetalle.tsx`
- **Modificado**: `src/pages/AdminVisitaDetalle.tsx`
- **Modificado**: `src/components/visita/ChecklistBloque.tsx`
- **Modificado**: `src/components/visita/SeccionIncidencias.tsx`
- **Modificado**: `src/components/visita/SeccionAmonestaciones.tsx`
- **Modificado**: `src/components/visita/SeccionObservaciones.tsx`
- **Modificado**: `package.json` (anadir `fabric`)

