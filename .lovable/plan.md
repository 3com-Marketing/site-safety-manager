

# Plan: Texto por defecto de normativa aplicable para informes CSS/AT

## Resumen

La infraestructura ya existe: el campo `texto_normativa` en `configuracion_empresa` ya se precarga en `FormInforme.tsx` (líneas 57-61). Solo se necesita actualizar el valor en la base de datos.

## Cambio

Una operación UPDATE en `configuracion_empresa` para establecer `texto_normativa` con el listado de normativa proporcionado (Ley 54/2003, Ley 31/1995, RD 485/1997, RD 486/1997, RD 773/1997, RD 1627/1997, RD 2177/2004, RD 1215/1997).

No se requieren cambios de código — la lógica de precarga y edición ya funciona correctamente.

## Archivo afectado
- **Datos**: UPDATE en `configuracion_empresa.texto_normativa`

