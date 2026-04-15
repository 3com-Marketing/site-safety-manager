

# Plan: Texto por defecto de recomendaciones para informes CSS/AT

## Resumen

El campo `texto_recomendaciones` en `configuracion_empresa` ya existe y ya se precarga en el formulario de informes CSS/AT (en `FormInforme.tsx`). Solo falta insertar el texto proporcionado como valor por defecto en la base de datos.

## Cambio

Un único UPDATE en la tabla `configuracion_empresa` para establecer el campo `texto_recomendaciones` con el texto completo proporcionado por el usuario.

No se requieren cambios de código ni de esquema — la lógica de precarga y edición ya funciona correctamente.

## Archivo afectado
- **Datos**: UPDATE en `configuracion_empresa.texto_recomendaciones` (vía insert tool)

