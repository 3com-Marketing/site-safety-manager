

# Plan: Corregir precarga de recomendaciones y normativa en informes CSS/AT

## Problema

Hay una condición de carrera en `FormInforme.tsx`. El `RichTextEditor` emite un `onChange` al inicializarse (con contenido vacío tipo `<p></p>`), lo que hace que `recomendaciones` y `normativa` dejen de ser strings vacíos antes de que la consulta async a `configuracion_empresa` se resuelva. Cuando llega la respuesta, la condición `!recomendaciones` es `false` y no se aplican los valores por defecto.

## Solución

1. **`FormInforme.tsx`**: Cambiar la lógica de carga de configuración para que no dependa del estado actual de `recomendaciones`/`normativa`. Usar un flag `configLoaded` con `useRef` para asegurar que los valores de configuración se cargan exactamente una vez al crear un documento nuevo, sin competir con el editor.

2. **Garantizar persistencia**: Los valores ya se guardan correctamente en `datos_extra` (líneas 115-116 del `handleSubmit`). El PDF ya los lee de `extra.recomendaciones` y `extra.normativa`. Solo falta asegurar que se cargan bien al crear.

## Cambio concreto

En `FormInforme.tsx`, reemplazar el `useEffect` de carga de configuración (líneas 56-65):

```typescript
const configLoaded = useRef(false);

useEffect(() => {
  if (documento || configLoaded.current) return;
  configLoaded.current = true;
  supabase.from('configuracion_empresa')
    .select('texto_recomendaciones, texto_normativa')
    .limit(1).single()
    .then(({ data }) => {
      if (data) {
        if (data.texto_recomendaciones) setRecomendaciones(data.texto_recomendaciones);
        if (data.texto_normativa) setNormativa(data.texto_normativa);
      }
    });
}, [documento]);
```

Se elimina la comprobación `!recomendaciones` / `!normativa` — si es un documento nuevo, siempre se sobreescriben con los valores de configuración. Esto es el comportamiento esperado: "el texto de configuración debe aparecer siempre por defecto".

## Archivos afectados
- **Editado**: `src/components/documentos/formularios/FormInforme.tsx` (corregir useEffect de carga de config)

