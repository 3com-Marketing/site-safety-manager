

# Plan: Cambiar sistema de switch Admin/Técnico a navegación por URL

## Problema

El sistema actual cambia el rol en memoria (estado React) sin cambiar la URL. El componente `Index` renderiza `TechHome` o `AdminInformes` inline según el rol. Cuando se cambia de admin a técnico, `TechHome` se monta y hace queries que pueden fallar (errores RLS, datos en caché del rol anterior, etc.), causando pantalla blanca. El ErrorBoundary no captura errores asíncronos en `useEffect`.

## Solución

Cambiar el `switchRole` para que además de cambiar el estado, **navegue a la URL correcta** y **limpie la caché de React Query**. Así cada vista se carga limpia.

## Cambios

### 1. `src/lib/auth.tsx`

- Añadir un callback opcional `onRoleSwitch` que se ejecute después de cambiar el rol.
- Exponer una función `switchRole` que acepte el nuevo rol y dispare la navegación.

### 2. `src/components/RoleSwitcher.tsx`

- Usar `useNavigate` de React Router.
- Usar `useQueryClient` de React Query.
- Al hacer click:
  1. Llamar `queryClient.clear()` para limpiar toda la caché de datos.
  2. Llamar `switchRole(nextRole)`.
  3. Navegar a `/` (para técnico) o `/admin` (para admin).

### 3. `src/pages/Index.tsx`

- Mantener la lógica actual como fallback (redirigir según rol), pero ahora el switcher ya navega directamente.

### 4. `src/pages/TechHome.tsx`

- Añadir guard: si `user` es null, mostrar loading en vez de intentar renderizar.
- Asegurar que el `useEffect` tiene try/catch robusto (ya se hizo, verificar que está bien).

## Resultado esperado

Al pulsar el botón de cambio de rol:
1. Se limpia la caché de queries.
2. Se cambia el rol en el estado.
3. Se navega a la URL correcta (`/admin` o `/`).
4. El componente se monta fresco con datos limpios.

## Archivos afectados
- **`src/components/RoleSwitcher.tsx`** — añadir navegación + limpiar caché
- **`src/pages/TechHome.tsx`** — guard contra user null

