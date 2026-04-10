

# Plan: Visitas en tiempo real para Admin + edición desde admin

## Problema
El admin solo ve informes (ya generados). No ve las visitas activas de los técnicos ni recibe notificación cuando inician una. Tampoco puede entrar a editar una visita antes de que se genere el informe.

## Solución

### 1. Habilitar Realtime en tabla `visitas`
Migración SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitas;
```

### 2. Nueva sección "Visitas activas" en AdminInformes
Añadir arriba de los informes una sección que muestre todas las visitas (de todos los técnicos), con suscripción realtime:
- Al cargar: `SELECT visitas.*, obras(nombre), profiles:usuario_id(nombre)` ordenadas por fecha desc
- Suscripción a `postgres_changes` en `visitas` para recibir INSERTs y UPDATEs en tiempo real
- Cuando llega un INSERT → toast: "🔔 {técnico} ha iniciado visita en {obra}"
- Lista con badge de estado: "En progreso" (amarillo), "Finalizada" (verde)
- Cada visita clicable → navega a `/admin/visita/{id}` para ver/editar

### 3. Nueva ruta `/admin/visita/:id`
Reutilizar el componente `VisitaActiva` pero en modo admin:
- Añadir ruta en `App.tsx`: `<Route path="/admin/visita/:id" element={<VisitaActiva />} />`
- En `VisitaActiva.tsx`: detectar si la ruta empieza por `/admin/` → modo admin
  - No verificar `usuario_id === user.id`
  - Permitir edición completa
  - Botón atrás vuelve a `/admin` en vez de `/`
  - No mostrar "FINALIZAR VISITA" (eso lo hace el técnico)

### 4. Ajuste en VisitaActiva.tsx
- Extraer la lógica de "¿es admin?" desde `useLocation().pathname.startsWith('/admin')`
- Si es admin: skip la verificación de propiedad, cambiar navegación de retorno
- El RLS ya permite a admins ver y editar todo (las policies usan `has_role(auth.uid(), 'admin')`)

## Archivos

| Archivo | Cambio |
|---|---|
| Migración SQL | Habilitar realtime en `visitas` |
| `src/pages/AdminInformes.tsx` | Sección "Visitas activas" con realtime + toast + lista clicable |
| `src/pages/VisitaActiva.tsx` | Detectar modo admin, ajustar navegación y permisos |
| `src/App.tsx` | Añadir ruta `/admin/visita/:id` |

