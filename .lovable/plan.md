

# Plan: Aumentar tamaño de todos los diálogos de la app

## Problema
Todos los diálogos/modales de la aplicación usan `max-w-lg` (512px) o `max-w-md` (448px), que resultan pequeños en pantallas de escritorio.

## Solución
Cambiar el tamaño por defecto del componente base `DialogContent` de `max-w-lg` a `max-w-2xl` (672px), y ajustar los diálogos que especifican su propio `max-w-*` para que sean más grandes también.

### Cambios

| Archivo | De | A |
|---|---|---|
| `src/components/ui/dialog.tsx` | `max-w-lg` (default) | `max-w-2xl` |
| `src/components/ui/alert-dialog.tsx` | `max-w-lg` (default) | `max-w-2xl` |
| `src/pages/AdminClientes.tsx` | 3× `max-w-lg` | 3× `max-w-2xl` |
| `src/pages/AdminObras.tsx` | `max-w-lg` (view dialog) | `max-w-2xl` |
| `src/pages/AdminTecnicos.tsx` | 2× `max-w-lg` | 2× `max-w-2xl` |
| `src/pages/SelectObra.tsx` | `max-w-md` | `max-w-xl` |
| `src/components/visita/VoiceNoteDialog.tsx` | `max-w-md` | `max-w-xl` |

El padding interno (`p-6`) se aumentará a `p-8` en el componente base para que el contenido no quede apretado en el espacio más grande.

