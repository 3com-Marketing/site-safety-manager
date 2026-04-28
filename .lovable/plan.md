## Objetivo

En la portada del informe (CSS y AT):
1. **Quitar** el texto **"SEGURIDAD Y SALUD LABORAL"** (la línea `cover-label`) y la línea roja decorativa (`cover-line`).
2. **Subir el contenido** para liberar espacio en la parte inferior.
3. **Añadir el logotipo del cliente** (campo `clientes.logo_url`, ya disponible en BD) debajo del título de la obra, como aparece en la portada de referencia (logo "Abora Buenaventura" debajo del recuadro con el nombre de la obra).

## Cambios en `supabase/functions/generar-documento-pdf/index.ts`

### a) Estilos `.cover` (líneas 68-76)

- Cambiar `justify-content: center` → `flex-start` y reducir padding superior (`1.5cm 2cm 2cm`) para que todo suba.
- Eliminar la regla `.cover-label` y `.cover-line`.
- Reducir `margin-bottom` del logo principal de `40pt` a `30pt`.
- Cambiar el color del título tipo (`cover-tipo`) de rojo a negro (más fiel a la portada original) y reducir margen.
- Estilizar `cover-obra` como un **recuadro con borde redondeado** (como aparece "22511-REPARACIÓN FACHADA BALCONES" en la imagen original).
- Añadir nueva regla `.cover-cliente-logo` (max-height 140pt, max-width 320pt, márgen superior).

### b) Markup de la portada (líneas 779-790)

```html
<div class="cover">
  ${semana ? `<div class="cover-semana">SEMANA Nº ... </div>` : ""}
  ${safeworkLogo ? `<img class="cover-logo" src="${safeworkLogo}" />` : ""}
  ${!isCSS && empresaContratista ? `<div class="cover-contratista">...</div>` : ""}
  <div class="cover-tipo">${tipoLabel}</div>
  <div class="cover-obra">${obraNombre}</div>
  ${cliente?.logo_url ? `<img class="cover-cliente-logo" src="${cliente.logo_url}" alt="${cliente.nombre || ''}" />` : ""}
  <div class="cover-fecha">${fechaDoc}</div>
</div>
```

Cambios concretos:
- **Eliminada**: la línea `<div class="cover-label">SEGURIDAD Y SALUD LABORAL</div>`.
- **Eliminada**: la línea `<div class="cover-line"></div>`.
- **Añadida**: `<img class="cover-cliente-logo" src="${cliente.logo_url}" />` justo después del nombre de la obra, condicional a que el cliente tenga logo cargado.

## Notas

- El logo del cliente ya se obtiene en el query existente: `obras(nombre, direccion, clientes(nombre, logo_url))` (línea 869). Solo hay que renderizarlo.
- Si un cliente no tiene `logo_url`, simplemente no se muestra (el resto de la portada queda igual).
- No se toca nada del cuerpo del informe ni de la cabecera/pie en páginas interiores.
- No afecta a otros tipos de documento (actas), solo a `templateInforme`.