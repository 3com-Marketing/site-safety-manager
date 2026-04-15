

# Plan: Insertar datos ficticios de prueba

## Resumen

Insertar datos ficticios completos en todas las tablas principales para poder probar la generación de PDFs y el flujo completo de documentos.

## Datos a insertar

### 1. Clientes (3 nuevos)
- **Grupo Inmobiliario Mediterráneo S.A.** — CIF: A12345678, Madrid
- **Ayuntamiento de Valencia** — CIF: P4625000B, Valencia  
- **Ferrovial Construcción S.A.** — CIF: A28855260, Madrid

### 2. Obras (4 nuevas, repartidas entre clientes)
- Rehabilitación Edificio Gran Vía 42 (Grupo Mediterráneo)
- Centro Deportivo Municipal Malvarrosa (Ayuntamiento Valencia)
- Ampliación Estación Norte (Ferrovial)
- Urbanización Costa Blanca Fase II (Grupo Mediterráneo)

### 3. Técnicos — Vincular los 2 existentes a las nuevas obras via `tecnicos_obras`

### 4. Visitas (4 completadas) — Una por obra, estado `finalizada`, con el usuario actual

### 5. Documentos completados (8-10 documentos)
Todos con `datos_extra` rellenos para que los PDFs se generen con contenido real:
- Acta Nombramiento CAE (firmado)
- Acta Nombramiento Proyecto (firmado)
- Acta Aprobación DGPO (generado)
- Acta Aprobación Plan SyS (firmado)
- Acta Reunión CAE con asistentes y empresas (generado)
- Acta Reunión Inicial con asistentes (firmado)
- Informe CSS (generado)
- Informe AT (firmado)

### 6. Datos relacionados
- Asistentes de reunión (3-4 por acta de reunión)
- Actividades y empresas para la reunión CAE

## Método
Usar la herramienta de inserción de datos (no migraciones) para todos los INSERT.

## Resultado esperado
Al terminar, podrás navegar a cualquier documento y generar su PDF con datos completos y realistas.

