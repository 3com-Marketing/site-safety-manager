

# Plan: Corregir pantalla en blanco al cambiar de Admin a Técnico en producción

## Problema

Al cambiar de rol admin a técnico en la app publicada, la pantalla se queda en blanco. Esto se debe a dos causas:

1. **No hay Error Boundary**: Si cualquier componente (TechHome o AdminInformes) lanza un error en producción, React desmonta todo el árbol sin mostrar nada. En desarrollo, Vite muestra el overlay de error, pero en producción no hay fallback.

2. **Posible race condition en producción**: El `onAuthStateChange` puede dispararse antes de que la sesión se restaure completamente, provocando que `auth.uid()` sea `null` en las políticas RLS. Esto puede causar que las consultas fallen silenciosamente o lancen errores.

## Cambios

### 1. Crear componente `ErrorBoundary` (`src/components/ErrorBoundary.tsx`)

- Componente de clase React que capture errores en `componentDidCatch`.
- Muestra un mensaje amigable con botón "Recargar" en lugar de pantalla blanca.
- Incluye un botón para volver al inicio.

### 2. Envolver la app con el ErrorBoundary (`src/App.tsx`)

- Envolver `<Routes>` dentro del `<ErrorBoundary>` para que cualquier error en las páginas muestre el fallback en vez de pantalla blanca.

### 3. Hacer el cambio de rol más robusto (`src/pages/Index.tsx`)

- Añadir verificación de que `role` no sea `null` antes de renderizar. Si `role` es `null` pero hay sesión, mostrar "Cargando...".
- Manejar el caso donde `role` está en transición.

### 4. Proteger TechHome contra errores (`src/pages/TechHome.tsx`)

- Envolver las consultas en try/catch para evitar que errores de red o RLS provoquen un crash.
- Si `user` es null, mostrar el estado de carga en vez de intentar renderizar contenido vacío.

## Archivos afectados
- **Nuevo**: `src/components/ErrorBoundary.tsx`
- **`src/App.tsx`** — envolver Routes con ErrorBoundary
- **`src/pages/Index.tsx`** — manejar role null con sesión activa
- **`src/pages/TechHome.tsx`** — try/catch en queries

