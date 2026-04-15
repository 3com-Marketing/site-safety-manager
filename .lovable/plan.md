

# Plan: Importar datos de visitas en todos los formularios de documentos

## Situación actual

- **FormInforme** ya tiene un botón "Importar desde última visita" que funciona correctamente, importando checklist_bloques y notas_generales.
- **FormActaReunion**, **FormActaNombramiento** y **FormActaAprobacion** no tienen esta funcionalidad.

## Qué se va a hacer

Añadir la capacidad de importar datos de visitas a los formularios donde tiene sentido, y mejorar la experiencia permitiendo elegir qué visita importar (no solo la última).

### 1. Nuevo componente reutilizable: `ImportarVisitaButton`

Un componente compartido que encapsula la lógica de seleccionar e importar datos de una visita:

- Al pulsar, consulta todas las visitas finalizadas de la obra
- Si hay una sola, importa directamente
- Si hay varias, abre un mini-selector (popover) para elegir cuál
- Si no hay ninguna, muestra toast de error
- Retorna los datos crudos de la visita (informe, checklist_bloques con anotaciones, incidencias, observaciones, amonestaciones) al componente padre via callback `onImport(data)`

### 2. FormInforme — Refactorizar para usar el componente compartido

Reemplazar la lógica inline actual de `handleImport` por `ImportarVisitaButton`, manteniendo el mismo mapeo de datos.

### 3. FormActaReunion — Añadir importación

Datos que se pueden importar desde una visita:
- `empresas_presentes` del informe → pre-rellenar la lista de empresas con acceso a obra (split por comas)
- `incidencias` → generar puntos del orden del día / actividades a desarrollar
- `observaciones` → añadir como contexto en excusados o notas
- Fecha de la visita → referencia para la fecha de reunión
- `num_trabajadores` del informe → contexto

### 4. FormActaAprobacion y FormActaNombramiento — No se modifican

Estos formularios contienen datos administrativos (datos de promotor, coordinador, agentes del proyecto) que ya se pre-rellenan desde la obra y el cliente. Los datos de visitas no son relevantes para estos tipos de documento.

## Archivos afectados
- **Nuevo**: `src/components/documentos/ImportarVisitaButton.tsx`
- **Editado**: `src/components/documentos/formularios/FormInforme.tsx` (refactor para usar componente compartido)
- **Editado**: `src/components/documentos/formularios/FormActaReunion.tsx` (añadir importación)

## Detalle técnico

### ImportarVisitaButton

```text
Props: { obraId: string, onImport: (data: VisitaImportData) => void }

VisitaImportData = {
  visita: { id, fecha, fecha_fin }
  informe: { notas_generales, empresas_presentes, num_trabajadores }
  bloques: Array<{ categoria, estado, anotaciones: Array<{texto, etiqueta}> }>
  incidencias: Array<{ titulo, descripcion, categoria }>
  observaciones: Array<{ texto, etiqueta }>
}
```

Query encadenada: visitas → informes → checklist_bloques + anotaciones + incidencias + observaciones.

### Mapeo en FormActaReunion

- `empresas_presentes` (string con comas) → split y crear entradas en `localEmpresas`
- `incidencias` → crear entradas en `localActividades` con titulo como actividad
- Fecha visita → sugerir en campo fecha

