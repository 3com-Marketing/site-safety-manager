## Objetivo

En la portada de los informes (CSS y AT), añadir en la parte superior un banner con el número de semana ISO y el rango de fechas de **lunes a viernes** de esa semana, con el formato:

> **SEMANA Nº 30, DEL 20 AL 24 DE ABRIL DE 2026**

Tal y como aparece en la portada física que usa actualmente HC Seguridad y Salud.

## Cambios

### 1. `supabase/functions/generar-documento-pdf/index.ts`

**a) Añadir helper para calcular semana ISO + rango lunes-viernes** (justo antes de `templateInforme`):

```ts
function getSemanaInfo(fechaIso: string): { numero: number; texto: string } | null {
  if (!fechaIso) return null;
  const d = new Date(fechaIso);
  if (isNaN(d.getTime())) return null;

  // Lunes de esa semana (ISO: lunes = 1)
  const day = d.getUTCDay(); // 0=domingo..6=sábado
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const lunes = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diffToMonday));
  const viernes = new Date(lunes); viernes.setUTCDate(lunes.getUTCDate() + 4);

  // Número de semana ISO 8601
  const tmp = new Date(Date.UTC(lunes.getUTCFullYear(), lunes.getUTCMonth(), lunes.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const mismoMes = lunes.getUTCMonth() === viernes.getUTCMonth();
  const mismoAnio = lunes.getUTCFullYear() === viernes.getUTCFullYear();

  let texto: string;
  if (mismoMes && mismoAnio) {
    texto = `DEL ${lunes.getUTCDate()} AL ${viernes.getUTCDate()} DE ${meses[viernes.getUTCMonth()].toUpperCase()} DE ${viernes.getUTCFullYear()}`;
  } else if (mismoAnio) {
    texto = `DEL ${lunes.getUTCDate()} DE ${meses[lunes.getUTCMonth()].toUpperCase()} AL ${viernes.getUTCDate()} DE ${meses[viernes.getUTCMonth()].toUpperCase()} DE ${viernes.getUTCFullYear()}`;
  } else {
    texto = `DEL ${lunes.getUTCDate()} DE ${meses[lunes.getUTCMonth()].toUpperCase()} DE ${lunes.getUTCFullYear()} AL ${viernes.getUTCDate()} DE ${meses[viernes.getUTCMonth()].toUpperCase()} DE ${viernes.getUTCFullYear()}`;
  }
  return { numero: weekNo, texto };
}
```

**b) Estilo CSS** (añadir junto al resto de `.cover` ~líneas 68-75):

```css
.cover .cover-semana { font-size: 13pt; font-weight: bold; color: #1a1a1a; margin-bottom: 30pt; text-align: center; letter-spacing: 1pt; }
```

**c) En `templateInforme`**, calcular semana y renderizar el banner como **primer elemento** dentro de `.cover` (encima del logo):

```ts
const semana = getSemanaInfo(doc.fecha_documento);
// ...
<div class="cover">
  ${semana ? `<div class="cover-semana">SEMANA Nº ${semana.numero}, ${semana.texto}</div>` : ""}
  ${safeworkLogo ? `<img class="cover-logo" ... />` : ""}
  ...
</div>
```

## Notas

- Se usa `doc.fecha_documento` (ya disponible) como referencia para deducir la semana.
- El cálculo es **ISO 8601** (semana empieza en lunes; semana 1 = la que contiene el primer jueves del año), que es el estándar usado en España.
- Solo afecta a los informes (`templateInforme`), no a actas u otros documentos.
- No se toca nada que ya funciona: solo se añade un helper, una regla CSS y una línea en la portada.