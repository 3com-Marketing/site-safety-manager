

# Plan: Panel de Administración CRUD (Clientes, Obras, Técnicos)

## Resumen
El panel admin actualmente solo muestra informes. Falta la gestión completa de las entidades base: **Clientes**, **Obras** y **Técnicos** (usuarios con roles). Crearemos un panel con navegación por pestañas y CRUD completo para cada entidad.

## Estructura

### 1. Nuevo layout admin con navegación lateral/pestañas
Modificar `AdminInformes.tsx` o crear un layout wrapper `AdminLayout.tsx` con tabs:
- **Informes** (ya existe)
- **Clientes** (nuevo)
- **Obras** (nuevo)
- **Técnicos** (nuevo)

### 2. Nueva página `src/pages/AdminClientes.tsx`
- Lista de clientes con nombre
- Botón "Nuevo cliente" que abre un diálogo con campo nombre
- Editar nombre inline o con diálogo
- Eliminar cliente (con confirmación)
- Operaciones: `supabase.from('clientes').insert/update/delete`

### 3. Nueva página `src/pages/AdminObras.tsx`
- Lista de obras con nombre, dirección y cliente asociado
- Botón "Nueva obra" con formulario: nombre, dirección, selector de cliente
- Editar y eliminar
- Operaciones: `supabase.from('obras').insert/update/delete`

### 4. Nueva página `src/pages/AdminTecnicos.tsx`
- Lista de perfiles con rol `tecnico` (join `profiles` + `user_roles`)
- Mostrar nombre, email, rol
- Posibilidad de asignar/quitar roles (insert/delete en `user_roles`)
- No se crean usuarios desde aquí (se registran solos), pero el admin puede gestionar roles

### 5. Migración DB: RLS para DELETE en clientes/obras
- Actualmente clientes y obras tienen política `ALL` para admins, que ya cubre DELETE
- No se necesita migración adicional

### 6. Rutas nuevas en `App.tsx`
```
/admin/clientes
/admin/obras
/admin/tecnicos
```

### 7. Modificar `AdminInformes.tsx`
- Extraer el header a un componente compartido `AdminLayout.tsx` con tabs de navegación
- Cada tab navega a su ruta

## Archivos

| Archivo | Acción |
|---------|--------|
| `src/components/admin/AdminLayout.tsx` | Crear: layout con header + tabs |
| `src/pages/AdminClientes.tsx` | Crear: CRUD clientes |
| `src/pages/AdminObras.tsx` | Crear: CRUD obras |
| `src/pages/AdminTecnicos.tsx` | Crear: gestión roles |
| `src/pages/AdminInformes.tsx` | Modificar: usar AdminLayout |
| `src/App.tsx` | Modificar: añadir rutas admin |

## UX
- Mismo estilo visual: rounded-xl, border-border, bg-card
- Diálogos para crear/editar (no páginas nuevas)
- Botones grandes, confirmación antes de eliminar
- Tabs visibles en header para navegar entre secciones

