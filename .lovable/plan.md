

# Plan: Forzar recarga completa al cambiar de rol

## Problema

El cambio de rol con `navigate()` de React Router no recarga la página — solo cambia la ruta en memoria. En producción, el estado anterior (caché, componentes montados, listeners) persiste y causa conflictos que resultan en pantalla blanca. En el preview de Lovable funciona porque el dev server tiene Hot Module Replacement que gestiona mejor los estados.

## Solución

Usar `window.location.href` en vez de `navigate()` para forzar una recarga completa del navegador al cambiar de rol. Esto garantiza:
- Todos los componentes se desmontan y remontan desde cero
- La caché de React Query se destruye completamente
- La sesión de auth se re-inicializa limpia
- No hay estado residual del rol anterior

## Cambios

### 1. `src/components/RoleSwitcher.tsx`

Reemplazar la lógica de `handleSwitch`:
- Eliminar `queryClient.clear()` y `navigate()` (ya no son necesarios con recarga completa)
- Guardar el rol seleccionado en `localStorage` antes de recargar
- Usar `window.location.href = nextRole === 'admin' ? '/admin' : '/'` para forzar recarga

### 2. `src/lib/auth.tsx`

Al inicializar el rol después de `fetchRoles`, comprobar si hay un rol guardado en `localStorage`:
- Si existe y es válido para el usuario, usarlo como rol activo
- Limpiar el valor de localStorage después de leerlo
- Esto permite que el rol sobreviva a la recarga

### 3. `src/pages/Index.tsx`

Sin cambios — la lógica actual de redirigir según rol sigue siendo correcta como fallback.

## Archivos afectados
- **`src/components/RoleSwitcher.tsx`** — usar `window.location.href`
- **`src/lib/auth.tsx`** — leer rol preferido de localStorage tras fetchRoles

