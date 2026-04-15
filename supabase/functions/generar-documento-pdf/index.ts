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

  // Header
  let html = `
    <div style="text-align:center;margin-bottom:20pt;">
      ${safeworkLogo ? `<img src="${safeworkLogo}" alt="Logo" style="max-height:80pt;max-width:240pt;object-fit:contain;margin-bottom:16pt;" />` : ""}
      <h1 style="font-size:16pt;color:#1a1a1a;font-weight:bold;margin:0;">ACTA DE NOMBRAMIENTO</h1>
      <p style="font-size:10pt;color:#666;margin-top:6pt;">${subtitulo}</p>
    </div>
  `;

  // Datos del Proyecto
  const datosProyecto = [
    ["Denominación:", extra.denominacion || ""],
    ["Emplazamiento:", extra.emplazamiento || ""],
    ["Tipo de obra:", extra.tipo_obra || ""],
  ];
  html += `<h2 style="font-size:11pt;font-weight:bold;border-bottom:2px solid #F37520;padding-bottom:4pt;margin-top:20pt;">DATOS DEL PROYECTO</h2>`;
  html += `<table style="width:100%;border-collapse:collapse;margin:8pt 0;">`;
  for (const [label, value] of datosProyecto) {
    html += `<tr>
      <td style="border:1px solid #999;padding:6pt 10pt;font-size:9pt;font-weight:bold;width:35%;background:#f5f5f5;">${label}</td>
      <td style="border:1px solid #999;padding:6pt 10pt;font-size:9pt;">${value}</td>
    </tr>`;
  }
  html += `</table>`;

  // Datos del Promotor
  const datosPromotor = [
    ["Nombre / Razón Social:", doc.nombre_promotor || ""],
    ["CIF:", doc.cif_promotor || ""],
    ["Domicilio:", doc.domicilio_promotor || ""],
  ];
  html += `<h2 style="font-size:11pt;font-weight:bold;border-bottom:2px solid #F37520;padding-bottom:4pt;margin-top:20pt;">DATOS DEL PROMOTOR</h2>`;
  html += `<table style="width:100%;border-collapse:collapse;margin:8pt 0;">`;
  for (const [label, value] of datosPromotor) {
    html += `<tr>
      <td style="border:1px solid #999;padding:6pt 10pt;font-size:9pt;font-weight:bold;width:35%;background:#f5f5f5;">${label}</td>
      <td style="border:1px solid #999;padding:6pt 10pt;font-size:9pt;">${value}</td>
    </tr>`;
  }
  html += `</table>`;

  // Datos del Coordinador/a
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
    html += `<tr>
      <td style="border:1px solid #999;padding:6pt 10pt;font-size:9pt;font-weight:bold;width:35%;background:#f5f5f5;">${label}</td>
      <td style="border:1px solid #999;padding:6pt 10pt;font-size:9pt;">${value}</td>
    </tr>`;
  }
  html += `</table>`;

  // Texto legal
  const textoLegal = extra.texto_legal || "";
  if (textoLegal) {
    html += `<div style="margin-top:20pt;font-size:10pt;line-height:1.6;text-align:justify;">${renderRichText(textoLegal)}</div>`;
  }

  // Lugar y fecha
  html += `<p style="margin-top:24pt;font-size:10pt;">En ${extra.lugar_firma || "_______________"}, a ${fechaStr}.</p>`;

  // Firma doble
  html += `
    <div style="display:flex;justify-content:space-around;margin-top:60pt;">
      <div style="text-align:center;">
        <div style="border-top:1px solid #333;width:200pt;padding-top:8pt;font-size:9pt;">${firmaLabel1}</div>
      </div>
      <div style="text-align:center;">
        <div style="border-top:1px solid #333;width:200pt;padding-top:8pt;font-size:9pt;">${firmaLabel2}</div>
      </div>
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

  // Header with centered logo and title
  let html = `
    <div style="text-align:center;margin-bottom:20pt;">
      ${safeworkLogo ? `<img src="${safeworkLogo}" alt="Logo" style="max-height:80pt;max-width:240pt;object-fit:contain;margin-bottom:12pt;" />` : ""}
      <h1 style="font-size:14pt;color:#1a1a1a;font-weight:bold;margin:0;">${titulo}</h1>
      ${isInicial ? `<p style="font-size:10pt;color:#666;margin-top:4pt;">Coordinación en materia de Seguridad y Salud</p>` : ""}
      ${isCAE ? `<p style="font-size:9pt;color:#666;margin-top:4pt;">Protocolo CAE</p>` : ""}
    </div>
  `;

  // Data table
  const dataRows: [string, string][] = [
    [isCAE ? "Actuación:" : "Obra/Instalación:", extra.obra_actuacion || ""],
    ["Localidad y situación:", extra.localidad || ""],
    ["Promotor:", doc.nombre_promotor || ""],
    ["Fecha:", fechaStr],
    ["Lugar de reunión:", extra.lugar_reunion || ""],
  ];
  if (isCAE) dataRows.push(["Mes:", extra.mes_reunion || ""]);

  html += `<table style="width:100%;border-collapse:collapse;margin:12pt 0;">`;
  for (const [label, value] of dataRows) {
    html += `<tr>
      <td style="border:1px solid #999;padding:5pt 8pt;font-size:9pt;font-weight:bold;width:35%;background:#f5f5f5;">${label}</td>
      <td style="border:1px solid #999;padding:5pt 8pt;font-size:9pt;">${value}</td>
    </tr>`;
  }
  html += `</table>`;

  // Asistentes table
  html += `<h2 style="font-size:11pt;margin-top:16pt;margin-bottom:6pt;border-bottom:2px solid #F37520;padding-bottom:3pt;">ASISTENTES</h2>`;
  if (asistentes.length > 0) {
    if (isSYS) {
      html += `<table><tr><th>Empresa</th><th>Nombre</th><th>Apellidos</th><th style="width:120pt;">Firma</th></tr>`;
      for (const a of asistentes) {
        html += `<tr><td>${a.empresa || ""}</td><td>${a.nombre || ""}</td><td>${a.apellidos || ""}</td><td></td></tr>`;
      }
    } else {
      html += `<table><tr><th>Nombre</th><th>Apellidos</th><th>Cargo</th><th>Empresa</th><th>DNI/NIE</th>${isInicial ? `<th style="width:80pt;">Firma</th>` : ""}</tr>`;
      for (const a of asistentes) {
        html += `<tr><td>${a.nombre || ""}</td><td>${a.apellidos || ""}</td><td>${a.cargo || ""}</td><td>${a.empresa || ""}</td><td>${a.dni_nie || ""}</td>${isInicial ? `<td></td>` : ""}</tr>`;
      }
    }
    html += `</table>`;
  } else {
    html += `<p style="color:#999;font-style:italic;font-size:9pt;">Sin asistentes registrados.</p>`;
  }

  // Excusados
  if (extra.excusados) {
    html += `<h2 style="font-size:11pt;margin-top:16pt;margin-bottom:6pt;border-bottom:2px solid #F37520;padding-bottom:3pt;">EXCUSADOS / AUSENTES</h2>`;
    html += `<p style="font-size:9pt;">${renderRichText(extra.excusados)}</p>`;
  }

  // CAE: Actividades
  if (isCAE && actividades.length > 0) {
    html += `<h2 style="font-size:11pt;margin-top:16pt;margin-bottom:6pt;border-bottom:2px solid #F37520;padding-bottom:3pt;">ACTIVIDADES A DESARROLLAR</h2>`;
    html += `<table><tr><th>Actividad</th><th>Nº Pedido</th></tr>`;
    for (const a of actividades) {
      html += `<tr><td>${a.actividad}</td><td>${a.numero_pedido || "—"}</td></tr>`;
    }
    html += `</table>`;
  }

  // CAE: Empresas
  if (isCAE && empresas.length > 0) {
    html += `<h2 style="font-size:11pt;margin-top:16pt;margin-bottom:6pt;border-bottom:2px solid #F37520;padding-bottom:3pt;">EMPRESAS CON ACCESO A OBRA</h2>`;
    html += `<table><tr><th>Empresa</th><th>Persona de contacto</th><th>Email</th></tr>`;
    for (const e of empresas) {
      html += `<tr><td>${e.empresa}</td><td>${e.persona_contacto || "—"}</td><td>${e.email_referencia || "—"}</td></tr>`;
    }
    html += `</table>`;
  }

  // CAE: Riesgos
  if (isCAE && extra.riesgos?.length > 0) {
    html += `<h2 style="font-size:11pt;margin-top:16pt;margin-bottom:6pt;border-bottom:2px solid #F37520;padding-bottom:3pt;">RIESGOS PREVISTOS</h2>`;
    html += `<ul style="font-size:9pt;">`;
    for (const r of extra.riesgos) html += `<li>${r}</li>`;
    if (extra.otros_riesgos) html += `<li>Otros: ${extra.otros_riesgos}</li>`;
    html += `</ul>`;
    if (extra.plataforma_cae) html += `<p style="font-size:9pt;"><strong>Plataforma CAE:</strong> ${extra.plataforma_cae}</p>`;
  }

  // Legal text
  const textoLegal = extra.texto_legal || "";
  if (textoLegal) {
    html += `<div style="margin-top:20pt;font-size:10pt;line-height:1.6;text-align:justify;">${renderRichText(textoLegal)}</div>`;
  }

  // Lugar, fecha y firma
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

  // Cover page
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

  // Running header (will be picked up by CSS @page)
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

  // 1. Índice
  html += `<h2><span class="section-num">1.</span> ÍNDICE</h2>`;
  html += `<div class="toc">`;
  html += `<div class="toc-item"><span><span class="toc-num">1.</span> Índice</span></div>`;
  html += `<div class="toc-item"><span><span class="toc-num">2.</span> Recomendaciones</span></div>`;
  for (const s of SECCIONES) {
    html += `<div class="toc-item"><span><span class="toc-num">${s.num}.</span> ${s.label}</span></div>`;
  }
  html += `<div class="toc-item"><span><span class="toc-num">11.</span> Normativa aplicable</span></div>`;
  html += `</div>`;

  // 2. Recomendaciones
  const recomendaciones = extra.recomendaciones || "";
  html += `<h2><span class="section-num">2.</span> RECOMENDACIONES</h2>`;
  if (recomendaciones) {
    html += `<div class="legal-text">${renderRichText(recomendaciones)}</div>`;
  }

  // 3-10. Secciones técnicas
  for (const s of SECCIONES) {
    html += `<h2><span class="section-num">${s.num}.</span> ${s.label.toUpperCase()}</h2>`;
    const val = extra[s.key];
    if (val) {
      html += `<div class="section-text">${renderRichText(val)}</div>`;
    } else {
      html += `<p style="color:#999;font-style:italic;">Sin observaciones.</p>`;
    }
  }

  // 11. Normativa aplicable
  const normativa = extra.normativa || "";
  html += `<h2><span class="section-num">11.</span> NORMATIVA APLICABLE</h2>`;
  if (normativa) {
    html += `<div class="legal-text">${renderRichText(normativa)}</div>`;
  }

  // Firma
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
    // Normalize: handle legacy double-nested datos_extra
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
