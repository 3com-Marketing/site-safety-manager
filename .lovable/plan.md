

# Plan: Crear cuenta de prueba con ambos roles y datos de ejemplo

## Resumen

Crear el usuario `oswaldo.tryvor@gmail.com` en el sistema de autenticación, asignarle ambos roles (admin y tecnico) para pruebas, y añadir datos de ejemplo (cliente + obra) para poder probar el flujo completo.

## Pasos

### 1. Habilitar auto-confirm temporal
Activar la confirmación automática de email para que la cuenta se pueda usar inmediatamente sin verificar correo.

### 2. Añadir registro (signup) en la pantalla de Login
Actualmente solo hay login. Añadir un modo de registro para crear la cuenta desde la app con email y contraseña.

### 3. Insertar datos de ejemplo en la base de datos
Usando el insert tool, crear:
- **1 cliente**: "Constructora Demo S.L."
- **1 obra**: "Residencial Las Palmas" asociada al cliente

### 4. Flujo para asignar roles
Después de que te registres con `oswaldo.tryvor@gmail.com`, insertaremos ambos roles (`admin` y `tecnico`) en `user_roles` para esa cuenta. Esto te permitirá probar ambos flujos.

## Detalle técnico

- Se usará `cloud--configure_auth` para habilitar auto-confirm
- Se modificará `Login.tsx` para añadir un toggle signup/login
- Se usará el signup de Supabase Auth (`supabase.auth.signUp`)
- El trigger `handle_new_user` ya creará el perfil automáticamente
- Tras el registro, se insertarán los roles con el insert tool

