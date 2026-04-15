import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIPO_LABELS: Record<string, string> = {
  acta_nombramiento_cae: "ACTA DE NOMBRAMIENTO — CAE",
  acta_nombramiento_proyecto: "ACTA DE NOMBRAMIENTO — CON PROYECTO",
  acta_aprobacion_dgpo: "ACTA DE APROBACIÓN — DGPO",
  acta_aprobacion_plan_sys: "ACTA DE APROBACIÓN — PLAN DE SEGURIDAD Y SALUD",
  acta_reunion_cae: "ACTA DE REUNIÓN — CAE",
  acta_reunion_inicial: "ACTA DE REUNIÓN INICIAL",
  acta_reunion_sys: "ACTA DE REUNIÓN — SEGURIDAD Y SALUD",
  informe_css: "INFORME DE COORDINACIÓN DE SEGURIDAD Y SALUD",
  informe_at: "INFORME DE ASISTENCIA TÉCNICA DE SEGURIDAD Y SALUD",
};

function baseStyles() {
  return `
    @page { margin: 2cm; size: A4; }
    body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.5; margin: 0; }
    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16pt; border-bottom: 3px solid #F37520; margin-bottom: 24pt; }
    .header img { max-height: 60pt; max-width: 180pt; object-fit: contain; }
    .header .title-block { text-align: center; flex: 1; }
    h1 { font-size: 16pt; color: #F37520; margin: 0 0 4pt 0; }
    h2 { font-size: 12pt; color: #1a1a1a; border-bottom: 2px solid #F37520; padding-bottom: 3pt; margin-top: 20pt; margin-bottom: 8pt; }
    .subtitle { color: #666; font-size: 9pt; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6pt; margin: 10pt 0; }
    .meta-item { background: #f8f8f8; padding: 6pt 10pt; border-radius: 4pt; }
    .meta-label { font-size: 8pt; color: #888; text-transform: uppercase; letter-spacing: 0.5pt; }
    .meta-value { font-weight: bold; margin-top: 2pt; font-size: 10pt; }
    table { width: 100%; border-collapse: collapse; margin: 8pt 0; }
    th, td { border: 1px solid #ddd; padding: 5pt 7pt; text-align: left; font-size: 9pt; }
    th { background: #f0f0f0; font-weight: bold; }
    .section-text { margin: 6pt 0; line-height: 1.5; }
    .section-text p, .legal-text p { margin: 4pt 0; }
    .section-text ul, .section-text ol, .legal-text ul, .legal-text ol { margin: 4pt 0 4pt 16pt; padding: 0; }
    .section-text li, .legal-text li { margin-bottom: 3pt; }
    .section-text strong, .legal-text strong { font-weight: bold; }
    .section-text em, .legal-text em { font-style: italic; }
    .section-text u, .legal-text u { text-decoration: underline; }
    .section-text h2, .legal-text h2 { font-size: 11pt; margin: 8pt 0 4pt; }
    .section-text h3, .legal-text h3 { font-size: 10pt; margin: 6pt 0 3pt; }
    .firma-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40pt; margin-top: 40pt; }
    .firma-box { border-top: 1px solid #333; padding-top: 6pt; text-align: center; font-size: 9pt; }
    .footer { text-align: center; font-size: 7pt; color: #999; margin-top: 32pt; border-top: 1px solid #ddd; padding-top: 6pt; }
    p { margin: 4pt 0; }
  `;
}

function informeStyles() {
  return `
    @page {
      size: A4;
      margin: 2.5cm 2cm 2.5cm 2cm;
      @top-left { content: element(header-left); }
      @top-right { content: element(header-right); }
      @bottom-center { content: element(footer-center); }
    }
    @page :first { margin-top: 0; @top-left { content: none; } @top-right { content: none; } @bottom-center { content: none; } }
    body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.6; margin: 0; }

    /* Cover page */
    .cover { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; page-break-after: always; text-align: center; padding: 3cm 2cm; }
    .cover img.cover-logo { max-height: 120pt; max-width: 280pt; object-fit: contain; margin-bottom: 40pt; }
    .cover .cover-label { font-size: 11pt; color: #666; text-transform: uppercase; letter-spacing: 3pt; margin-bottom: 10pt; }
    .cover .cover-tipo { font-size: 18pt; font-weight: bold; color: #F37520; margin-bottom: 20pt; text-transform: uppercase; }
    .cover .cover-obra { font-size: 14pt; font-weight: bold; color: #1a1a1a; margin-bottom: 12pt; }
    .cover .cover-contratista { font-size: 12pt; color: #333; margin-bottom: 20pt; }
    .cover .cover-fecha { font-size: 11pt; color: #666; }
    .cover .cover-line { width: 60%; height: 3px; background: #F37520; margin: 20pt auto; }

    /* Running header */
    .running-header-left { position: running(header-left); }
    .running-header-right { position: running(header-right); }
    .running-footer { position: running(footer-center); }
    .rh-table { width: 100%; border-collapse: collapse; border-bottom: 2px solid #F37520; padding-bottom: 6pt; margin-bottom: 0; }
    .rh-table td { border: none; padding: 2pt 0; font-size: 8pt; color: #666; vertical-align: middle; }
    .rh-table img { max-height: 36pt; max-width: 120pt; object-fit: contain; }
    .rh-tipo { font-weight: bold; color: #F37520; font-size: 9pt; }
    .rf-text { font-size: 8pt; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 4pt; }

    /* Content */
    h2 { font-size: 13pt; color: #F37520; border-bottom: 2px solid #F37520; padding-bottom: 4pt; margin-top: 24pt; margin-bottom: 10pt; text-transform: uppercase; }
    h3 { font-size: 11pt; color: #333; margin-top: 14pt; margin-bottom: 6pt; }
    .section-num { color: #F37520; font-weight: bold; margin-right: 6pt; }
    .section-text { margin: 6pt 0; line-height: 1.6; }
    .section-text p { margin: 4pt 0; }
    .section-text ul, .section-text ol { margin: 4pt 0 4pt 16pt; padding: 0; }
    .section-text li { margin-bottom: 3pt; }
    .section-text strong { font-weight: bold; }
    .section-text em { font-style: italic; }
    .section-text u { text-decoration: underline; }
    .section-text h2 { font-size: 12pt; margin: 8pt 0 4pt; }
    .section-text h3 { font-size: 11pt; margin: 6pt 0 3pt; }
    .legal-text { font-size: 9pt; line-height: 1.5; }
    .legal-text ul { margin: 4pt 0 4pt 16pt; padding: 0; }
    .legal-text li { margin-bottom: 3pt; }

    /* TOC */
    .toc { margin: 20pt 0; }
    .toc-item { display: flex; justify-content: space-between; padding: 4pt 0; border-bottom: 1px dotted #ccc; font-size: 10pt; }
    .toc-item .toc-num { color: #F37520; font-weight: bold; min-width: 30pt; }

    .firma-section { margin-top: 60pt; text-align: center; }
    .firma-line { border-top: 1px solid #333; width: 250pt; margin: 60pt auto 6pt auto; }
    .firma-label { font-size: 9pt; color: #666; }
  `;
}

/** Render rich text: if it contains HTML tags, use directly; otherwise convert newlines to br */
function renderRichText(text: string): string {
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return text.replace(/\n/g, '<br/>');
}

function logoHeader(safeworkLogoUrl: string, clienteLogoUrl?: string, titulo?: string, subtitulo?: string) {
  return `
    <div class="header">
      <img src="${safeworkLogoUrl}" alt="SafeWork" />
      <div class="title-block">
        <h1>${titulo || "DOCUMENTO"}</h1>
        ${subtitulo ? `<p class="subtitle">${subtitulo}</p>` : ""}
      </div>
      ${clienteLogoUrl ? `<img src="${clienteLogoUrl}" alt="Cliente" />` : `<div style="width:180pt"></div>`}
    </div>
  `;
}

function metaItem(label: string, value: string) {
  if (!value) return "";
  return `<div class="meta-item"><div class="meta-label">${label}</div><div class="meta-value">${value}</div></div>`;
}

function firmaSection(lugarFirma: string, fecha: string, firmas: string[]) {
  const fechaStr = fecha ? new Date(fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) : "_______________";
  let html = `<p style="margin-top:24pt;">En ${lugarFirma || "_______________"}, a ${fechaStr}.</p>`;
  html += `<div class="firma-grid">`;
  for (const f of firmas) {
    html += `<div class="firma-box"><br/><br/><br/>${f}</div>`;
  }
  html += `</div>`;
  return html;
}

// --- Template generators ---

function templateActaNombramiento(doc: any, extra: any, obra: any, cliente: any, safeworkLogo: string) {
  const isCAE = doc.tipo === "acta_nombramiento_cae" || extra.modalidad === "cae";

  const subtitulo = isCAE
    ? "COORDINACIÓN DE ACTIVIDADES EMPRESARIALES (CAE)"
    : "COORDINACIÓN EN MATERIA DE SEGURIDAD Y SALUD EN FASE DE EJECUCIÓN";

  const firmaLabel1 = "El Promotor";
  const firmaLabel2 = isCAE ? "La Coordinadora CAE" : "La Coordinadora de SS en fase de ejecución";

  const fechaStr = doc.fecha_documento
    ? new Date(doc.fecha_documento).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
    : "_______________";

  let html = `
    <div style="text-align:center;margin-bottom:20pt;">
      ${safeworkLogo ? `<img src="${safeworkLogo}" alt="Logo" style="max-height:80pt;max-width:240pt;object-fit:contain;margin-bottom:16pt;" />` : ""}
      <h1 style="font-size:16pt;color:#1a1a1a;font-weight:bold;margin:0;">ACTA DE NOMBRAMIENTO</h1>
      <p style="font-size:10pt;color:#666;margin-top:6pt;">${subtitulo}</p>
    </div>
  `;

  const datosProyecto = [
    ["Denominación:", extra.denominacion || ""],
    ["Emplazamiento:", extra.emplazamiento || ""],
    ["Tipo de obra:", extra.tipo_obra || ""],
  ];
  html += `<h2 style="font-size:11pt;font-weight:bold;border-bottom:2px solid #F37520;padding-bottom:4pt;margin-top:20pt;">DATOS DEL PROYECTO</h2>`;
  html += `<table style="width:100%;border-collapse:collapse;margin:8pt 0;">`;
  for (const [label, value] of datosProyecto) {
    html += `<tr><td style="border:1px solid #999;padding:6pt 10pt;font-size:9pt;font-weight:bold;width:35%;background:#f5f5f5;">${label}</td><td style="border:1px solid #999;padding:6pt 10pt;font-size:9pt;">${value}</td></tr>`;
  }
  html += `</table>`;

  const datosPromotor = [
    ["Nombre / Razón Social:", doc.nombre_promotor || ""],
    ["CIF:", doc.cif_promotor || ""],
    ["Domicilio:", doc.domicilio_promotor || ""],
  ];
  html += `<h2 style="font-size:11pt;font-weight:bold;border-bottom:2px solid #F37520;padding-bottom:4pt;margin-top:20pt;">DATOS DEL PROMOTOR</h2>`;
  html += `<table style="width:100%;border-collapse:collapse;margin:8pt 0;">`;
  for (const [label, value] of datosPromotor) {
    html += `<tr><td style="border:1px solid #999;padding:6pt 10pt;font-size:9pt;font-weight:bold;width:35%;background:#f5f5f5;">${label}</td><td style="border:1px solid #999;padding:6pt 10pt;font-size:9pt;">${value}</td></tr>`;
  }
  html += `</table>`;

  const coordTitle = isCAE ? "DATOS DEL COORDINADOR/A CAE" : "DATOS DE LA COORDINADORA";
  const datosCoord = [
    ["Nombre y apellidos:", doc.nombre_coordinador || ""],
    ["DNI:", doc.dni_coordinador || ""],
    ["Titulación / Nº Colegiado:", doc.titulacion_colegiado || ""],
    ["Empresa de coordinación:", doc.empresa_coordinacion || ""],
    ["CIF Empresa:", doc.cif_empresa || ""],
    ["Domicilio Empresa:", doc.domicilio_empresa || ""],
    ["Móvil:", doc.movil_coordinador || ""],
    ["Email:", doc.email_coordinador || ""],
  ];
  html += `<h2 style="font-size:11pt;font-weight:bold;border-bottom:2px solid #F37520;padding-bottom:4pt;margin-top:20pt;">${coordTitle}</h2>`;
  html += `<table style="width:100%;border-collapse:collapse;margin:8pt 0;">`;
  for (const [label, value] of datosCoord) {
    html += `<tr><td style="border:1px solid #999;padding:6pt 10pt;font-size:9pt;font-weight:bold;width:35%;background:#f5f5f5;">${label}</td><td style="border:1px solid #999;padding:6pt 10pt;font-size:9pt;">${value}</td></tr>`;
  }
  html += `</table>`;

  const textoLegal = extra.texto_legal || "";
  if (textoLegal) {
    html += `<div style="margin-top:20pt;font-size:10pt;line-height:1.6;text-align:justify;">${renderRichText(textoLegal)}</div>`;
  }

  html += `<p style="margin-top:24pt;font-size:10pt;">En ${extra.lugar_firma || "_______________"}, a ${fechaStr}.</p>`;
  html += `
    <div style="display:flex;justify-content:space-around;margin-top:60pt;">
      <div style="text-align:center;"><div style="border-top:1px solid #333;width:200pt;padding-top:8pt;font-size:9pt;">${firmaLabel1}</div></div>
      <div style="text-align:center;"><div style="border-top:1px solid #333;width:200pt;padding-top:8pt;font-size:9pt;">${firmaLabel2}</div></div>
    </div>
  `;

  return html;
}

function templateActaAprobacion(doc: any, extra: any, obra: any, cliente: any, safeworkLogo: string) {
  const isDGPO = doc.tipo === "acta_aprobacion_dgpo";
  const titulo = isDGPO ? "ACTA DE APROBACIÓN" : "ACTA DE APROBACIÓN";
  const subtitulo = isDGPO
    ? "DISPOSICIONES GENERALES DE PREVENCIÓN Y ORGANIZACIÓN"
    : "PLAN DE SEGURIDAD Y SALUD";

  const fechaStr = doc.fecha_documento
    ? new Date(doc.fecha_documento).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
    : "_______________";

  let html = `
    <div style="text-align:center;margin-bottom:20pt;">
      ${safeworkLogo ? `<img src="${safeworkLogo}" alt="Logo" style="max-height:80pt;max-width:240pt;object-fit:contain;margin-bottom:16pt;" />` : ""}
      <h1 style="font-size:16pt;color:#1a1a1a;font-weight:bold;margin:0;">${titulo}</h1>
      <p style="font-size:10pt;color:#666;margin-top:6pt;">${subtitulo}</p>
    </div>
  `;

  const campos = isDGPO
    ? [
        ["Actuación:", extra.actuacion || ""],
        ["Localidad y situación:", extra.localidad_situacion || ""],
        ["Promotor:", extra.promotor || ""],
        ["Autor del proyecto:", extra.autor_proyecto || ""],
        ["Coordinador del proyecto:", extra.coordinador_proyecto || ""],
        ["Autor del estudio de SYS:", extra.autor_estudio_syss || ""],
        ["Director de obra:", extra.director_obra || ""],
        ["Coordinadora actividades:", extra.coordinadora_actividades || ""],
        ["Empresa contratista:", extra.empresa_contratista || ""],
      ]
    : [
        ["Obra / Instalación:", extra.obra_instalacion || ""],
        ["Localidad y situación:", extra.localidad_situacion || ""],
        ["Promotor:", extra.promotor || ""],
        ["Autor del proyecto:", extra.autor_proyecto || ""],
        ["Coordinador del proyecto:", extra.coordinador_proyecto || ""],
        ["Autor del estudio de SYS:", extra.autor_estudio_syss || ""],
        ["Director de obra:", extra.director_obra || ""],
        ["Coordinador de obra:", extra.coordinador_obra || ""],
        ["Empresa contratista / titular:", extra.empresa_contratista_titular || ""],
      ];

  html += `<table style="width:100%;border-collapse:collapse;margin:16pt 0;">`;
  for (const [label, value] of campos) {
    html += `<tr><td style="border:1px solid #999;padding:6pt 10pt;font-size:9pt;font-weight:bold;width:40%;background:#f5f5f5;">${label}</td><td style="border:1px solid #999;padding:6pt 10pt;font-size:9pt;">${value}</td></tr>`;
  }
  html += `</table>`;

  const textoLegal = extra.texto_legal || "";
  if (textoLegal) {
    html += `<div style="margin-top:20pt;font-size:10pt;line-height:1.6;text-align:justify;">${renderRichText(textoLegal)}</div>`;
  }

  html += `<p style="margin-top:24pt;font-size:10pt;">En ${extra.lugar_firma || "_______________"}, a ${fechaStr}.</p>`;
  html += `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40pt;margin-top:60pt;">
      <div style="border-top:1px solid #333;padding-top:8pt;text-align:center;font-size:9pt;">El Promotor</div>
      <div style="border-top:1px solid #333;padding-top:8pt;text-align:center;font-size:9pt;">La Coordinadora de Seguridad y Salud</div>
    </div>
  `;

  return html;
}

function templateActaReunion(doc: any, extra: any, obra: any, cliente: any, safeworkLogo: string, asistentes: any[], actividades: any[], empresas: any[]) {
  const isCAE = doc.tipo === "acta_reunion_cae";
  const isSYS = doc.tipo === "acta_reunion_sys";
  const isInicial = doc.tipo === "acta_reunion_inicial";

  const fechaStr = doc.fecha_documento
    ? new Date(doc.fecha_documento).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
    : "_______________";

  let titulo = "";
  let firmaLabel1 = "";
  let firmaLabel2 = "";

  if (isInicial) {
    titulo = "ACTA DE REUNIÓN INICIAL";
    firmaLabel1 = "Empresa CSS";
    firmaLabel2 = "La Coordinadora de Seguridad y Salud";
  } else if (isCAE) {
    titulo = "ACTA DE REUNIÓN DE COORDINACIÓN<br/>DE ACTIVIDADES EMPRESARIALES";
    firmaLabel1 = "Empresa CSS";
    firmaLabel2 = "La Coordinadora CAE";
  } else {
    titulo = `ACTA REUNIÓN N.º ${extra.numero_acta || "___"}`;
    firmaLabel1 = "Empresa CSS";
    firmaLabel2 = "La Coordinadora de Seguridad y Salud";
  }

  // For non-CAE types, use the simpler original template
  if (!isCAE) {
    return templateActaReunionSimple(doc, extra, obra, cliente, safeworkLogo, asistentes, actividades, empresas, titulo, firmaLabel1, firmaLabel2, fechaStr, isSYS, isInicial);
  }

  // ===== FULL CAE TEMPLATE (10 pages, 13 sections) =====
  const actuacion = extra.obra_actuacion || obra?.nombre || "";
  const mesReunion = extra.mes_reunion || "";

  // PAGE 1: Header + Asistentes + Firma conformidad
  let html = `
    <div style="text-align:center;margin-bottom:16pt;">
      ${safeworkLogo ? `<img src="${safeworkLogo}" alt="Logo" style="max-height:70pt;max-width:200pt;object-fit:contain;margin-bottom:10pt;" />` : ""}
      <h1 style="font-size:14pt;color:#1a1a1a;font-weight:bold;margin:0;">${titulo}</h1>
      <p style="font-size:9pt;color:#666;margin-top:4pt;">Protocolo CAE · ${mesReunion}</p>
    </div>
  `;

  // Data table
  const dataRows: [string, string][] = [
    ["Actuación preventiva:", actuacion],
    ["Localidad y situación:", extra.localidad || ""],
    ["Promotor:", doc.nombre_promotor || ""],
    ["Fecha:", fechaStr],
    ["Lugar de reunión:", extra.lugar_reunion || ""],
    ["Mes:", mesReunion],
  ];
  html += `<table style="width:100%;border-collapse:collapse;margin:8pt 0;">`;
  for (const [label, value] of dataRows) {
    html += `<tr><td style="border:1px solid #999;padding:4pt 8pt;font-size:9pt;font-weight:bold;width:35%;background:#f5f5f5;">${label}</td><td style="border:1px solid #999;padding:4pt 8pt;font-size:9pt;">${value}</td></tr>`;
  }
  html += `</table>`;

  // Asistentes table with DNI and Firma columns
  html += `<h2 style="font-size:11pt;margin-top:14pt;margin-bottom:6pt;border-bottom:2px solid #F37520;padding-bottom:3pt;">ASISTENTES</h2>`;
  if (asistentes.length > 0) {
    html += `<table><tr><th>Nombre</th><th>Apellidos</th><th>Cargo</th><th>Empresa</th><th>DNI/NIE</th><th style="width:80pt;">Firma</th></tr>`;
    for (const a of asistentes) {
      html += `<tr><td>${a.nombre || ""}</td><td>${a.apellidos || ""}</td><td>${a.cargo || ""}</td><td>${a.empresa || ""}</td><td>${a.dni_nie || ""}</td><td></td></tr>`;
    }
    html += `</table>`;
  } else {
    html += `<p style="color:#999;font-style:italic;font-size:9pt;">Sin asistentes registrados.</p>`;
  }

  // Excusados
  if (extra.excusados) {
    html += `<p style="font-size:9pt;margin-top:8pt;"><strong>Excusados:</strong> ${renderRichText(extra.excusados)}</p>`;
  }

  // Conformidad text
  html += `<p style="font-size:9pt;margin-top:12pt;text-align:justify;">Los firmantes del presente acta, manifiestan su conformidad con los acuerdos recogidos en la misma, y la firman a los efectos oportunos.</p>`;

  // PAGE BREAK — PAGE 2: Orden del día
  html += `<div style="page-break-before:always;"></div>`;
  html += `<h2 style="font-size:13pt;color:#F37520;border-bottom:2px solid #F37520;padding-bottom:4pt;margin-top:0;">ORDEN DEL DÍA</h2>`;
  const tocItems = [
    "Objetivo y alcance",
    "Intercambio de documentación y acceso a obra",
    "Trabajos realizados y previstos. Análisis de riesgos y medidas preventivas",
    "Recurso preventivo",
    "Acuerdos generales adoptados en materia de prevención de riesgos laborales",
    "Formación e información",
    "Control de maquinaria, equipos de trabajo, medios auxiliares y certificados",
    "Protecciones colectivas",
    "Protecciones individuales",
    "Interferencias entre empresas",
    "Interferencias con terceros",
    "Medio ambiente",
    "Ruegos y sugerencias",
  ];
  html += `<div style="margin:10pt 0;">`;
  for (let i = 0; i < tocItems.length; i++) {
    html += `<div style="display:flex;padding:4pt 0;border-bottom:1px dotted #ccc;font-size:10pt;"><span style="color:#F37520;font-weight:bold;min-width:30pt;">${i + 1}.</span><span>${tocItems[i]}</span></div>`;
  }
  html += `</div>`;

  // PAGE BREAK — PAGE 3+: Content sections
  html += `<div style="page-break-before:always;"></div>`;

  // 1. Objetivo y alcance + Actividades table
  html += `<h2 style="font-size:12pt;color:#F37520;border-bottom:2px solid #F37520;padding-bottom:3pt;margin-top:0;"><span style="font-weight:bold;">1.</span> OBJETIVO Y ALCANCE</h2>`;
  html += `<div class="section-text" style="font-size:9pt;text-align:justify;"><p>El presente protocolo tiene por objeto establecer los criterios de coordinación de actividades empresariales para la prevención de los riesgos laborales de las empresas contratadas para la ejecución de los trabajos descritos en la siguiente tabla, conforme a lo dispuesto en el Real Decreto 171/2004.</p></div>`;

  // Actividades table
  if (actividades.length > 0) {
    html += `<table><tr><th>Actividad</th><th>Nº Pedido</th></tr>`;
    for (const a of actividades) {
      html += `<tr><td>${a.actividad}</td><td>${a.numero_pedido || "—"}</td></tr>`;
    }
    html += `</table>`;
  }

  // 2. Intercambio documentación + Empresas table
  html += `<h2 style="font-size:12pt;color:#F37520;border-bottom:2px solid #F37520;padding-bottom:3pt;"><span style="font-weight:bold;">2.</span> INTERCAMBIO DE DOCUMENTACIÓN Y ACCESO A OBRA</h2>`;
  html += `<div class="section-text" style="font-size:9pt;text-align:justify;"><p>Se acuerda que las empresas que se relacionan a continuación deberán entregar la documentación necesaria para el acceso a la obra antes del inicio de los trabajos.</p></div>`;

  if (empresas.length > 0) {
    html += `<table><tr><th>Empresa</th><th>Persona de contacto</th><th>Email</th></tr>`;
    for (const e of empresas) {
      html += `<tr><td>${e.empresa}</td><td>${e.persona_contacto || "—"}</td><td>${e.email_referencia || "—"}</td></tr>`;
    }
    html += `</table>`;
  }

  // Checklist documentación (fixed)
  html += `<p style="font-size:9pt;font-weight:bold;margin-top:10pt;">Documentación a entregar por cada empresa:</p>`;
  const checkDocs = [
    "Alta en la Seguridad Social (TC2 / RNT) — último mes",
    "Certificado de estar al corriente con la Seguridad Social",
    "Seguro de responsabilidad civil",
    "Evaluación de riesgos del puesto de trabajo",
    "Planificación de la actividad preventiva",
    "Formación e información en PRL de los trabajadores",
    "Aptitud médica de los trabajadores",
    "Entrega de EPIs a los trabajadores",
    "Autorización de uso de maquinaria y equipos de trabajo",
    "Nombramiento de Recurso Preventivo",
  ];
  html += `<table><tr><th style="width:85%">Documento</th><th style="text-align:center;">✓</th></tr>`;
  for (const d of checkDocs) {
    html += `<tr><td style="font-size:8pt;">${d}</td><td style="text-align:center;">☐</td></tr>`;
  }
  html += `</table>`;

  // Plataforma CAE
  if (extra.plataforma_cae) {
    html += `<p style="font-size:9pt;margin-top:6pt;"><strong>Plataforma CAE utilizada:</strong> ${extra.plataforma_cae}</p>`;
  }

  // 3. Trabajos realizados y previstos + Riesgos
  html += `<h2 style="font-size:12pt;color:#F37520;border-bottom:2px solid #F37520;padding-bottom:3pt;"><span style="font-weight:bold;">3.</span> TRABAJOS REALIZADOS Y PREVISTOS. ANÁLISIS DE RIESGOS Y MEDIDAS PREVENTIVAS</h2>`;

  // Riesgos previstos
  if (extra.riesgos?.length > 0) {
    html += `<p style="font-size:9pt;font-weight:bold;">Riesgos previstos:</p>`;
    html += `<ul style="font-size:9pt;">`;
    for (const r of extra.riesgos) html += `<li>${r}</li>`;
    if (extra.otros_riesgos) html += `<li>Otros: ${extra.otros_riesgos}</li>`;
    html += `</ul>`;
  }

  // 3.1 Empresas que intervienen
  const empIntervienen = extra.empresas_intervienen || [];
  html += `<h3 style="font-size:11pt;color:#333;margin-top:12pt;">3.1 Empresas que intervienen en la obra</h3>`;
  if (empIntervienen.length > 0) {
    html += `<table><tr><th>Razón Social</th><th>Acrónimo</th><th>Persona Responsable</th></tr>`;
    for (const e of empIntervienen) {
      html += `<tr><td>${e.razon_social || ""}</td><td>${e.acronimo || ""}</td><td>${e.responsable || ""}</td></tr>`;
    }
    html += `</table>`;
  } else {
    html += `<p style="color:#999;font-style:italic;font-size:9pt;">Sin empresas registradas.</p>`;
  }

  // 3.2 Duración y ubicación
  const durTrab = extra.duracion_trabajos || [];
  html += `<h3 style="font-size:11pt;color:#333;margin-top:12pt;">3.2 Duración y ubicación de los trabajos</h3>`;
  if (durTrab.length > 0) {
    html += `<table><tr><th>Título</th><th>Inicio</th><th>Fin</th><th>Observaciones</th></tr>`;
    for (const d of durTrab) {
      html += `<tr><td>${d.titulo || ""}</td><td>${d.inicio || ""}</td><td>${d.fin || ""}</td><td>${d.observaciones || ""}</td></tr>`;
    }
    html += `</table>`;
  } else {
    html += `<p style="color:#999;font-style:italic;font-size:9pt;">Sin datos registrados.</p>`;
  }

  // 3.3 Trabajos a realizar
  html += `<h3 style="font-size:11pt;color:#333;margin-top:12pt;">3.3 Trabajos a realizar</h3>`;
  if (extra.texto_trabajos_realizar) {
    html += `<div class="section-text" style="font-size:9pt;text-align:justify;">${renderRichText(extra.texto_trabajos_realizar)}</div>`;
  } else {
    html += `<p style="color:#999;font-style:italic;font-size:9pt;">Sin descripción.</p>`;
  }

  // 4. Recurso preventivo
  html += `<h2 style="font-size:12pt;color:#F37520;border-bottom:2px solid #F37520;padding-bottom:3pt;"><span style="font-weight:bold;">4.</span> RECURSO PREVENTIVO</h2>`;
  if (extra.texto_recurso_preventivo) {
    html += `<div class="section-text" style="font-size:9pt;text-align:justify;">${renderRichText(extra.texto_recurso_preventivo)}</div>`;
  } else {
    html += `<p style="font-size:9pt;">Se designará Recurso Preventivo por parte de cada empresa contratista cuando sea necesario conforme al Art. 32 bis de la Ley 31/1995 de Prevención de Riesgos Laborales.</p>`;
  }

  // 5-9: Legal text from configuración (texto_legal field)
  const textoLegal = extra.texto_legal || "";
  if (textoLegal) {
    html += `<h2 style="font-size:12pt;color:#F37520;border-bottom:2px solid #F37520;padding-bottom:3pt;"><span style="font-weight:bold;">5.</span> ACUERDOS GENERALES ADOPTADOS EN MATERIA DE PRL</h2>`;
    html += `<div class="legal-text" style="text-align:justify;">${renderRichText(textoLegal)}</div>`;
  } else {
    // Fixed default text for sections 5-9
    const fixedSections = [
      { num: 5, title: "ACUERDOS GENERALES ADOPTADOS EN MATERIA DE PRL", text: "Se acuerda la aplicación de las medidas preventivas establecidas en la evaluación de riesgos y la planificación de la actividad preventiva de cada empresa, así como las medidas de coordinación que se estimen necesarias." },
      { num: 6, title: "FORMACIÓN E INFORMACIÓN", text: "Cada empresa garantizará que sus trabajadores disponen de la formación e información necesaria en materia de prevención de riesgos laborales, conforme al Art. 18 y 19 de la Ley 31/1995." },
      { num: 7, title: "CONTROL DE MAQUINARIA, EQUIPOS DE TRABAJO, MEDIOS AUXILIARES Y CERTIFICADOS", text: "Cada empresa será responsable de que la maquinaria, equipos de trabajo y medios auxiliares que emplee cumplan la normativa vigente y dispongan de la documentación correspondiente (marcado CE, revisiones periódicas, etc.)." },
      { num: 8, title: "PROTECCIONES COLECTIVAS", text: "Se establecerán las protecciones colectivas necesarias (redes de seguridad, barandillas, líneas de vida, etc.) antes del inicio de los trabajos que las requieran." },
      { num: 9, title: "PROTECCIONES INDIVIDUALES", text: "Los trabajadores deberán utilizar los Equipos de Protección Individual (EPI) adecuados a los riesgos de su puesto de trabajo, conforme a la evaluación de riesgos realizada." },
    ];
    for (const s of fixedSections) {
      html += `<h2 style="font-size:12pt;color:#F37520;border-bottom:2px solid #F37520;padding-bottom:3pt;"><span style="font-weight:bold;">${s.num}.</span> ${s.title}</h2>`;
      html += `<div class="section-text" style="font-size:9pt;text-align:justify;"><p>${s.text}</p></div>`;
    }
  }

  // 10. Interferencias entre empresas
  html += `<h2 style="font-size:12pt;color:#F37520;border-bottom:2px solid #F37520;padding-bottom:3pt;"><span style="font-weight:bold;">10.</span> INTERFERENCIAS ENTRE EMPRESAS</h2>`;
  if (extra.interferencias_empresas_aplica) {
    html += `<p style="font-size:9pt;"><strong>Sí se detectan interferencias.</strong></p>`;
    if (extra.interferencias_empresas_texto) {
      html += `<div class="section-text" style="font-size:9pt;">${renderRichText(extra.interferencias_empresas_texto)}</div>`;
    }
  } else {
    html += `<p style="font-size:9pt;">No se detectan interferencias entre las empresas presentes en la obra durante el periodo analizado.</p>`;
  }

  // 11. Interferencias con terceros
  html += `<h2 style="font-size:12pt;color:#F37520;border-bottom:2px solid #F37520;padding-bottom:3pt;"><span style="font-weight:bold;">11.</span> INTERFERENCIAS CON TERCEROS</h2>`;
  if (extra.interferencias_terceros_aplica) {
    html += `<p style="font-size:9pt;"><strong>Sí se detectan interferencias con terceros.</strong></p>`;
    if (extra.interferencias_terceros_texto) {
      html += `<div class="section-text" style="font-size:9pt;">${renderRichText(extra.interferencias_terceros_texto)}</div>`;
    }
  } else {
    html += `<p style="font-size:9pt;">No se detectan interferencias con terceros durante el periodo analizado.</p>`;
  }

  // 12. Medio ambiente
  html += `<h2 style="font-size:12pt;color:#F37520;border-bottom:2px solid #F37520;padding-bottom:3pt;"><span style="font-weight:bold;">12.</span> MEDIO AMBIENTE</h2>`;
  if (extra.medio_ambiente_aplica) {
    html += `<p style="font-size:9pt;"><strong>Sí aplica.</strong></p>`;
    if (extra.medio_ambiente_texto) {
      html += `<div class="section-text" style="font-size:9pt;">${renderRichText(extra.medio_ambiente_texto)}</div>`;
    }
  } else {
    html += `<p style="font-size:9pt;">No se detectan aspectos medioambientales relevantes.</p>`;
  }

  // 13. Ruegos y sugerencias
  html += `<h2 style="font-size:12pt;color:#F37520;border-bottom:2px solid #F37520;padding-bottom:3pt;"><span style="font-weight:bold;">13.</span> RUEGOS Y SUGERENCIAS</h2>`;
  if (extra.ruegos_aplica) {
    if (extra.ruegos_texto) {
      html += `<div class="section-text" style="font-size:9pt;">${renderRichText(extra.ruegos_texto)}</div>`;
    } else {
      html += `<p style="font-size:9pt;">Se recogen ruegos y sugerencias.</p>`;
    }
  } else {
    html += `<p style="font-size:9pt;">Sin ruegos ni sugerencias.</p>`;
  }

  // Firma
  html += `<p style="margin-top:24pt;font-size:10pt;">En ${extra.localidad || "_______________"}, a ${fechaStr}.</p>`;
  html += `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40pt;margin-top:60pt;">
      <div style="border-top:1px solid #333;padding-top:8pt;text-align:center;font-size:9pt;">${firmaLabel1}</div>
      <div style="border-top:1px solid #333;padding-top:8pt;text-align:center;font-size:9pt;">${firmaLabel2}</div>
    </div>
  `;

  return html;
}

/** Simple template for Reunión Inicial and SYS (non-CAE) */
function templateActaReunionSimple(doc: any, extra: any, obra: any, cliente: any, safeworkLogo: string, asistentes: any[], actividades: any[], empresas: any[], titulo: string, firmaLabel1: string, firmaLabel2: string, fechaStr: string, isSYS: boolean, isInicial: boolean) {
  let html = `
    <div style="text-align:center;margin-bottom:20pt;">
      ${safeworkLogo ? `<img src="${safeworkLogo}" alt="Logo" style="max-height:80pt;max-width:240pt;object-fit:contain;margin-bottom:12pt;" />` : ""}
      <h1 style="font-size:14pt;color:#1a1a1a;font-weight:bold;margin:0;">${titulo}</h1>
      ${isInicial ? `<p style="font-size:10pt;color:#666;margin-top:4pt;">Coordinación en materia de Seguridad y Salud</p>` : ""}
    </div>
  `;

  const dataRows: [string, string][] = [
    ["Obra/Instalación:", extra.obra_actuacion || ""],
    ["Localidad y situación:", extra.localidad || ""],
    ["Promotor:", doc.nombre_promotor || ""],
    ["Fecha:", fechaStr],
    ["Lugar de reunión:", extra.lugar_reunion || ""],
  ];

  html += `<table style="width:100%;border-collapse:collapse;margin:12pt 0;">`;
  for (const [label, value] of dataRows) {
    html += `<tr><td style="border:1px solid #999;padding:5pt 8pt;font-size:9pt;font-weight:bold;width:35%;background:#f5f5f5;">${label}</td><td style="border:1px solid #999;padding:5pt 8pt;font-size:9pt;">${value}</td></tr>`;
  }
  html += `</table>`;

  html += `<h2 style="font-size:11pt;margin-top:16pt;margin-bottom:6pt;border-bottom:2px solid #F37520;padding-bottom:3pt;">ASISTENTES</h2>`;
  if (asistentes.length > 0) {
    if (isSYS) {
      html += `<table><tr><th>Empresa</th><th>Nombre</th><th>Apellidos</th><th style="width:120pt;">Firma</th></tr>`;
      for (const a of asistentes) {
        html += `<tr><td>${a.empresa || ""}</td><td>${a.nombre || ""}</td><td>${a.apellidos || ""}</td><td></td></tr>`;
      }
    } else {
      html += `<table><tr><th>Nombre</th><th>Apellidos</th><th>Cargo</th><th>Empresa</th><th>DNI/NIE</th><th style="width:80pt;">Firma</th></tr>`;
      for (const a of asistentes) {
        html += `<tr><td>${a.nombre || ""}</td><td>${a.apellidos || ""}</td><td>${a.cargo || ""}</td><td>${a.empresa || ""}</td><td>${a.dni_nie || ""}</td><td></td></tr>`;
      }
    }
    html += `</table>`;
  }

  if (extra.excusados) {
    html += `<h2 style="font-size:11pt;margin-top:16pt;margin-bottom:6pt;border-bottom:2px solid #F37520;padding-bottom:3pt;">EXCUSADOS / AUSENTES</h2>`;
    html += `<p style="font-size:9pt;">${renderRichText(extra.excusados)}</p>`;
  }

  const textoLegal = extra.texto_legal || "";
  if (textoLegal) {
    html += `<div style="margin-top:20pt;font-size:10pt;line-height:1.6;text-align:justify;">${renderRichText(textoLegal)}</div>`;
  }

  html += `<p style="margin-top:24pt;font-size:10pt;">En ${extra.localidad || "_______________"}, a ${fechaStr}.</p>`;
  html += `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40pt;margin-top:60pt;">
      <div style="border-top:1px solid #333;padding-top:8pt;text-align:center;font-size:9pt;">${firmaLabel1}</div>
      <div style="border-top:1px solid #333;padding-top:8pt;text-align:center;font-size:9pt;">${firmaLabel2}</div>
    </div>
  `;

  return html;
}

function templateInforme(doc: any, extra: any, obra: any, cliente: any, safeworkLogo: string, empresaConfig: any) {
  const isCSS = doc.tipo === "informe_css";
  const tipoLabel = isCSS ? "INFORME COORDINACIÓN DE SEGURIDAD Y SALUD" : "INFORME ASISTENCIA TÉCNICA DE SEGURIDAD Y SALUD";
  const rolLabel = isCSS ? "COORDINADOR/A DE SEGURIDAD Y SALUD" : "TÉCNICO PRL";
  const obraNombre = extra.titulo_obra || obra?.nombre || "";
  const tecnicoNombre = extra.nombre_tecnico || "";
  const fechaDoc = doc.fecha_documento
    ? new Date(doc.fecha_documento).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
    : "";
  const empresaContratista = extra.empresa_contratista || "";

  const SECCIONES = [
    { num: 3, key: "estado_general", label: "Estado general de la obra" },
    { num: 4, key: "orden_limpieza", label: "Orden y limpieza" },
    { num: 5, key: "senalizacion", label: "Señalización y balizamiento" },
    { num: 6, key: "trabajos_altura", label: "Trabajos en altura" },
    { num: 7, key: "epc", label: "Equipos de protección colectiva" },
    { num: 8, key: "epi", label: "Equipos de protección individual" },
    { num: 9, key: "maquinaria", label: "Maquinaria" },
    { num: 10, key: "medios_auxiliares", label: "Medios auxiliares" },
  ];

  let html = `
    <div class="cover">
      ${safeworkLogo ? `<img class="cover-logo" src="${safeworkLogo}" alt="Logo" />` : ""}
      <div class="cover-label">SEGURIDAD Y SALUD LABORAL</div>
      <div class="cover-line"></div>
      ${!isCSS && empresaContratista ? `<div class="cover-contratista">Empresa contratista: ${empresaContratista}</div>` : ""}
      <div class="cover-tipo">${tipoLabel}</div>
      <div class="cover-obra">${obraNombre}</div>
      <div class="cover-fecha">${fechaDoc}</div>
    </div>
  `;

  html += `
    <div class="running-header-left">
      <table class="rh-table"><tr>
        <td style="width:100pt">${safeworkLogo ? `<img src="${safeworkLogo}" alt="Logo" />` : ""}</td>
        <td><span class="rh-tipo">${tipoLabel}</span><br/>${fechaDoc}</td>
      </tr></table>
    </div>
    <div class="running-header-right">
      <table class="rh-table"><tr>
        <td style="text-align:right"><strong>${obraNombre}</strong><br/>${rolLabel}: ${tecnicoNombre}</td>
      </tr></table>
    </div>
    <div class="running-footer">
      <div class="rf-text">${obraNombre}</div>
    </div>
  `;

  html += `<h2><span class="section-num">1.</span> ÍNDICE</h2>`;
  html += `<div class="toc">`;
  html += `<div class="toc-item"><span><span class="toc-num">1.</span> Índice</span></div>`;
  html += `<div class="toc-item"><span><span class="toc-num">2.</span> Recomendaciones</span></div>`;
  for (const s of SECCIONES) {
    html += `<div class="toc-item"><span><span class="toc-num">${s.num}.</span> ${s.label}</span></div>`;
  }
  html += `<div class="toc-item"><span><span class="toc-num">11.</span> Normativa aplicable</span></div>`;
  html += `</div>`;

  const recomendaciones = extra.recomendaciones || "";
  html += `<h2><span class="section-num">2.</span> RECOMENDACIONES</h2>`;
  if (recomendaciones) {
    html += `<div class="legal-text">${renderRichText(recomendaciones)}</div>`;
  }

  for (const s of SECCIONES) {
    html += `<h2><span class="section-num">${s.num}.</span> ${s.label.toUpperCase()}</h2>`;
    const val = extra[s.key];
    if (val) {
      html += `<div class="section-text">${renderRichText(val)}</div>`;
    } else {
      html += `<p style="color:#999;font-style:italic;">Sin observaciones.</p>`;
    }
  }

  const normativa = extra.normativa || "";
  html += `<h2><span class="section-num">11.</span> NORMATIVA APLICABLE</h2>`;
  if (normativa) {
    html += `<div class="legal-text">${renderRichText(normativa)}</div>`;
  }

  html += `
    <div class="firma-section">
      <div class="firma-line"></div>
      <div class="firma-label">${tecnicoNombre}<br/>${rolLabel}</div>
    </div>
  `;

  return html;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documento_id } = await req.json();
    if (!documento_id) {
      return new Response(JSON.stringify({ error: "documento_id requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: doc, error: docErr } = await supabase
      .from("documentos_obra")
      .select("*, obras(nombre, direccion, clientes(nombre, logo_url))")
      .eq("id", documento_id)
      .single();

    if (docErr || !doc) {
      return new Response(JSON.stringify({ error: "Documento no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const obra = (doc as any).obras;
    const cliente = obra?.clientes;
    const rawExtra = (doc.datos_extra as Record<string, any>) || {};
    const extra = rawExtra.datos_extra && typeof rawExtra.datos_extra === 'object' && !Array.isArray(rawExtra.datos_extra)
      ? { ...rawExtra, ...(rawExtra.datos_extra as Record<string, any>) }
      : rawExtra;
    
    const { data: empresaConfig } = await supabase
      .from("configuracion_empresa")
      .select("*")
      .limit(1)
      .single();
    
    const safeworkLogo = empresaConfig?.logo_url || `${supabaseUrl}/storage/v1/object/public/logos/safework-logo.png`;

    let bodyHtml = "";
    let useInformeLayout = false;
    const tipo = doc.tipo;

    if (tipo.startsWith("acta_nombramiento")) {
      bodyHtml = templateActaNombramiento(doc, extra, obra, cliente, safeworkLogo);
    } else if (tipo.startsWith("acta_aprobacion")) {
      bodyHtml = templateActaAprobacion(doc, extra, obra, cliente, safeworkLogo);
    } else if (tipo.startsWith("acta_reunion")) {
      const [asistRes, actRes, empRes] = await Promise.all([
        supabase.from("asistentes_reunion").select("*").eq("documento_id", documento_id).order("created_at"),
        supabase.from("actividades_reunion_cae").select("*").eq("documento_id", documento_id).order("orden"),
        supabase.from("empresas_acceso_obra").select("*").eq("documento_id", documento_id),
      ]);
      bodyHtml = templateActaReunion(doc, extra, obra, cliente, safeworkLogo,
        asistRes.data || [], actRes.data || [], empRes.data || []);
    } else if (tipo.startsWith("informe_")) {
      bodyHtml = templateInforme(doc, extra, obra, cliente, safeworkLogo, empresaConfig);
      useInformeLayout = true;
    } else {
      return new Response(JSON.stringify({ error: `Tipo de documento no soportado: ${tipo}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const fechaStr = doc.fecha_documento
      ? new Date(doc.fecha_documento).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

    const styles = useInformeLayout ? informeStyles() : baseStyles();
    const footer = useInformeLayout ? "" : `<div class="footer"><p>SafeWork · Documento generado automáticamente · ${fechaStr}</p></div>`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>${styles}</style>
</head>
<body>
${bodyHtml}
${footer}
</body></html>`;

    const filename = `${tipo}_${obra?.nombre || "doc"}_${fechaStr}.pdf`;

    return new Response(
      JSON.stringify({ html, filename }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generar-documento-pdf error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
