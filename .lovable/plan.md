

# Plan: Fix admin dashboard broken queries

## Problem
All admin dashboard queries fail with 400:
```
"Could not find a relationship between 'visitas' and 'usuario_id' in the schema cache"
```

The code does `profiles:usuario_id(nombre)` but there's no FK from `visitas.usuario_id` to `profiles.user_id`.

## Solution

### 1. SQL Migration — Add foreign keys
Add the missing foreign keys so PostgREST can resolve the joins:

```sql
-- visitas.usuario_id -> profiles.user_id
ALTER TABLE public.visitas
  ADD CONSTRAINT visitas_usuario_id_profiles_fkey
  FOREIGN KEY (usuario_id) REFERENCES public.profiles(user_id);

-- visitas.obra_id -> obras.id
-- (likely already exists, will verify)

-- informes.visita_id -> visitas.id
-- (likely already exists, will verify)
```

### 2. Fix query syntax in `AdminInformes.tsx`
After adding the FK, the PostgREST embedded resource syntax needs to match the FK name. Since `visitas.usuario_id` -> `profiles.user_id`, use:

```typescript
// visitas query
.select('id, estado, fecha, obras(nombre), profiles!visitas_usuario_id_profiles_fkey(nombre)')

// informes query  
.select('id, estado, fecha, visita_id, visitas(obras(nombre), profiles!visitas_usuario_id_profiles_fkey(nombre))')
```

### 3. Also fix `AdminVisitaDetalle.tsx` if it uses the same pattern

| File | Change |
|---|---|
| SQL Migration | Add FK `visitas.usuario_id` -> `profiles.user_id` |
| `src/pages/AdminInformes.tsx` | Fix select queries with explicit FK hint |
| `src/pages/AdminVisitaDetalle.tsx` | Fix select queries if same pattern used |

