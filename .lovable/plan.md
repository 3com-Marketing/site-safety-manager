

# Plan: Añadir Google OAuth al Login

## Resumen
Añadir un botón "Iniciar sesión con Google" en la pantalla de login, usando el sistema managed de Lovable Cloud (no requiere configurar credenciales propias).

## Pasos

### 1. Configurar Social Auth
- Usar la herramienta "Configure Social Auth" para generar el módulo `src/integrations/lovable/` con soporte de Google OAuth e instalar `@lovable.dev/cloud-auth-js`.

### 2. Modificar `src/pages/Login.tsx`
- Importar `lovable` desde `@/integrations/lovable/index`
- Añadir botón "Iniciar sesión con Google" debajo del formulario de email/password
- El botón llama a `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`
- Separador visual "o" entre el formulario y el botón de Google
- Estilo: botón grande (h-12), con icono de Google, mismo ancho que el formulario

### 3. Gestionar errores
- Si `result.error`, mostrar el error en el mismo `setError`
- Si `result.redirected`, dejar que el navegador redirija
- Si hay tokens, la sesión se establece automáticamente y el `onAuthStateChange` en `auth.tsx` se encarga del resto

## Archivos afectados
| Archivo | Acción |
|---------|--------|
| `src/integrations/lovable/*` | Generado automáticamente por herramienta |
| `src/pages/Login.tsx` | Modificar: añadir botón Google + import lovable |

## Notas
- No se necesitan credenciales propias: Lovable Cloud gestiona Google OAuth automáticamente
- El flujo de roles (`user_roles`) funciona igual: tras el login con Google, `fetchRoles` se ejecuta en `onAuthStateChange`
- Los usuarios nuevos que entren por Google necesitarán que un admin les asigne rol manualmente (o crear un trigger para asignar rol por defecto)

