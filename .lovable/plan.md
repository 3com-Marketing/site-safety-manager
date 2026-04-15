
## Problema real detectado

He revisado el flujo completo y el fallo principal no está ya en Configuración, sino en cómo se guardan los documentos nuevos.

Hoy está pasando esto:

1. En `FormInforme.tsx` el formulario sí intenta cargar `texto_recomendaciones` y `texto_normativa` desde `configuracion_empresa`.
2. Pero al guardar un documento nuevo, `NuevoDocumentoDialog` envía un objeto con esta forma:
   - `titulo`
   - `fecha_documento`
   - `datos_extra: { recomendaciones, normativa, ... }`
3. Después, en `useDocumentosObra.ts`, al crear el registro, se vuelve a guardar `datos_extra: datos` en vez de `datos_extra: datos.datos_extra`.

Resultado:
```text
documentos_obra.datos_extra = {
  titulo: ...,
  fecha_documento: ...,
  datos_extra: {
    recomendaciones: ...,
    normativa: ...
  }
}
```

Pero tanto `FormInforme` al reabrir el documento, como la vista previa y el PDF, leen:
```text
extra.recomendaciones
extra.normativa
```
cuando en realidad ahora están en:
```text
extra.datos_extra.recomendaciones
extra.datos_extra.normativa
```

Eso explica exactamente lo que estás viendo: en Configuración sí existe, pero en Documentos no aparece.

Además, el documento que tienes abierto ahora mismo confirma ese problema: en base de datos ya está guardado con `datos_extra.datos_extra.recomendaciones` y `datos_extra.datos_extra.normativa`.

## Qué hay que corregir

### 1. Arreglar la creación de documentos nuevos
En `src/hooks/useDocumentosObra.ts`:
- cambiar la inserción para que `documentos_obra.datos_extra` guarde solo el contenido real del formulario
- es decir, usar `datos.datos_extra ?? datos`
- y no volver a envolverlo

Con eso, los documentos nuevos quedarán con estructura consistente.

### 2. Mantener compatibilidad con documentos ya creados
En `FormInforme.tsx`:
- leer primero `documento.datos_extra`
- y, si detecta `documento.datos_extra.datos_extra`, usar esa capa interna como fallback

Así los informes ya creados seguirán mostrando recomendaciones y normativa aunque estén mal guardados.

### 3. Hacer lo mismo en la vista previa y el PDF
En `supabase/functions/generar-documento-pdf/index.ts`:
- antes de renderizar el informe, normalizar `extra`
- si existe `extra.datos_extra`, usar esa capa interna
- así la preview y el PDF final mostrarán exactamente lo que haya en el documento

Esto es importante porque tu requisito es:
- Configuración = texto por defecto para nuevos documentos
- Documento nuevo = copia editable independiente
- Vista previa/PDF = reflejo exacto de lo guardado en ese documento

### 4. Revisar `FormInforme` para que la precarga por defecto siga siendo fiable
Aunque el fallo principal es el guardado anidado, mantendría también la protección ya prevista contra la carrera del editor rico:
- cargar configuración una sola vez en creación
- no sobrescribir cuando el documento ya existe
- aplicar primero defaults de Configuración y después guardar esos valores dentro del documento al pulsar Guardar

### 5. Corregir los documentos ya afectados
Como ya hay documentos recientes guardados con la estructura incorrecta, hace falta una reparación de datos:
- actualizar los registros recientes afectados en `documentos_obra`
- mover:
  - `datos_extra.datos_extra.recomendaciones` -> `datos_extra.recomendaciones`
  - `datos_extra.datos_extra.normativa` -> `datos_extra.normativa`
  - y el resto de campos internos igual
- eliminar la capa anidada sobrante

Sin este paso, aunque arregle el código, esos documentos antiguos seguirán sin verse bien.

## Resultado esperado tras el arreglo

```text
Configuración
   ↓
Nuevo informe CSS/AT
   ↓
Se precargan punto 2 y punto 11
   ↓
El usuario los puede editar
   ↓
Se guardan dentro de ese documento concreto
   ↓
Detalle / vista previa / PDF leen exactamente esos valores
```

## Archivos a tocar

- `src/hooks/useDocumentosObra.ts`
  - corregir estructura al crear documentos nuevos
- `src/components/documentos/formularios/FormInforme.tsx`
  - leer datos correctamente y mantener la precarga estable
- `supabase/functions/generar-documento-pdf/index.ts`
  - normalizar `datos_extra` antes de renderizar preview/PDF
- Datos en base de datos
  - reparación de documentos ya creados con `datos_extra` anidado

## Nota técnica
He comprobado el documento actual y está guardado con estructura anidada, así que este no es solo un problema visual del formulario: también afecta a persistencia, relectura del documento y generación del PDF. Por eso el arreglo correcto tiene que incluir código + reparación de datos existentes.
