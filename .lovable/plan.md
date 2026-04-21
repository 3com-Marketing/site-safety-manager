

# Plan: Fusionar anotaciones de foto y texto en una sola tarjeta

## Problema

Los datos en la base de datos almacenan las fotos y el texto como registros separados en la tabla `anotaciones`:
- Registro 1: solo `foto_url` (sin texto ni normativa)
- Registro 2: solo `texto` y `normativa` (sin foto)

El código actual renderiza cada registro como una tarjeta independiente con sus propios campos de Descripción y Normativa. Esto crea la "doble pantalla": una tarjeta vacía con foto y otra con texto.

## Solución

Antes de renderizar, agrupar las anotaciones de cada bloque en pares lógicos:

1. Recorrer las anotaciones de cada bloque del checklist
2. Si una anotación tiene `foto_url` pero no tiene `texto` ni `normativa`, y la siguiente anotación tiene `texto`/`normativa` pero no `foto_url`, fusionarlas en un solo objeto
3. Si una anotación tiene todo (foto + texto), dejarla tal cual
4. Si una anotación es solo foto sin par de texto, mostrarla sola con campos editables vacíos

Cada tarjeta resultante mostrará:
- La foto (si existe)
- Un Textarea de Descripción (con texto si lo hay, vacío si no)
- Un Textarea de Normativa (con texto si lo hay, vacío si no)

Para guardar, se usará el ID del registro de texto (si existe) o el de la foto para las actualizaciones.

## Cambios técnicos

### `src/pages/AdminInformeDetalle.tsx`

1. **Añadir función de fusión** antes del return:

```typescript
const mergeAnotaciones = (anotaciones: any[]) => {
  const merged: any[] = [];
  let i = 0;
  while (i < anotaciones.length) {
    const current = anotaciones[i];
    const next = anotaciones[i + 1];
    
    // Foto sin texto + siguiente con texto sin foto → fusionar
    if (current.foto_url && !current.texto && !current.normativa 
        && next && !next.foto_url && (next.texto || next.normativa)) {
      merged.push({
        id: next.id,           // ID del texto para edición
        foto_id: current.id,   // ID de la foto
        foto_url: current.foto_url,
        texto: next.texto,
        normativa: next.normativa,
      });
      i += 2;
    } else {
      merged.push(current);
      i += 1;
    }
  }
  return merged;
};
```

2. **Usar `mergeAnotaciones`** en el map del checklist, reemplazando `bloque.anotaciones.map(...)` por `mergeAnotaciones(bloque.anotaciones).map(...)`.

3. **Mantener el renderizado actual** (foto + Textarea Descripción + Textarea Normativa) pero ahora cada tarjeta tendrá los datos combinados, eliminando las tarjetas duplicadas.

## Archivo afectado

- **`src/pages/AdminInformeDetalle.tsx`** — Añadir función de fusión y usarla en el bucle del checklist.

