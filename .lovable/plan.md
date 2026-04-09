

# Plan: Botón de cambio de rol en la app

## Resumen
Añadir un `switchRole` al contexto de autenticación y un botón flotante visible en todas las pantallas que permita alternar entre los roles `admin` y `tecnico` sin cerrar sesión.

## Cambios

### 1. Modificar `src/lib/auth.tsx`
- Cambiar `fetchRole` para obtener **todos** los roles del usuario (no solo uno con `maybeSingle`).
- Guardar la lista de roles disponibles en el estado (`roles: AppRole[]`).
- Añadir función `switchRole(role: AppRole)` que cambia el rol activo.
- Exponer `roles` y `switchRole` en el contexto.

### 2. Crear componente `src/components/RoleSwitcher.tsx`
- Botón flotante (esquina inferior izquierda) que muestra el rol actual.
- Al hacer clic, alterna al otro rol disponible.
- Solo visible si el usuario tiene más de un rol asignado.
- Estilo: badge/chip con icono, colores distintos para admin (azul) vs tecnico (naranja).

### 3. Añadir `RoleSwitcher` en `src/App.tsx`
- Renderizar dentro del `AuthProvider`, visible en todas las rutas autenticadas.

### 4. Actualizar `src/pages/Index.tsx`
- Ya funciona con el `role` del contexto, no requiere cambios.

## Detalle técnico
- `fetchRole` pasará a usar `.select('role').eq('user_id', userId)` sin `maybeSingle` para obtener ambos roles.
- El primer rol cargado será el primero que devuelva la query.
- `switchRole` solo actualiza el estado local, no toca la base de datos.

