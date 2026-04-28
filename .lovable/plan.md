## Objetivo

Eliminar los bloques **Datos Mercantiles** y **Datos Bancarios** de la página `/admin/configuracion`, ya que no se utilizan.

## Cambios

### `src/pages/AdminConfiguracion.tsx`

1. **Eliminar las dos `<Card>` completas** correspondientes a:
   - "Datos Mercantiles" (campo `registro_mercantil`).
   - "Datos Bancarios" (campos `iban`, `banco`, `swift_bic`).

2. **Limpiar la interfaz `ConfigEmpresa`**: quitar las propiedades `registro_mercantil`, `iban`, `banco`, `swift_bic`.

3. **Limpiar `EMPTY_CONFIG`**: quitar esos mismos cuatro campos del objeto inicial.

4. **Quitar imports no usados**: `Landmark` y `CreditCard` de `lucide-react` (solo se usaban en estos bloques).

## Notas

- **No se tocará la base de datos**: las columnas `registro_mercantil`, `iban`, `banco`, `swift_bic` permanecerán en la tabla `configuracion_empresa` por seguridad (no afectan al funcionamiento). Si en el futuro se confirma que no se usan en ningún PDF ni edge function, se pueden eliminar con una migración.
- El resto de bloques (Logo, Datos Empresa, Responsable, Plantillas de Documentos) quedan intactos.
- El botón "Guardar" sigue funcionando igual: simplemente no enviará valores nuevos para esos campos (mantendrá los existentes en BD si los hubiera).