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
  informe_at: "INFORME DE ASISTENCIA TÉCNICA",
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
    .section-text { white-space: pre-wrap; margin: 4pt 0; }
    .firma-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40pt; margin-top: 40pt; }
    .firma-box { border-top: 1px solid #333; padding-top: 6pt; text-align: center; font-size: 9pt; }
    .footer { text-align: center; font-size: 7pt; color: #999; margin-top: 32pt; border-top: 1px solid #ddd; padding-top: 6pt; }
    p { margin: 4pt 0; }
  `;
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
  const modalidad = extra.modalidad === "proyecto" ? "con proyecto" : "CAE (sin proyecto)";
  return `
    ${logoHeader(safeworkLogo, cliente?.logo_url, TIPO_LABELS[doc.tipo], `Modalidad: ${modalidad}`)}
    <h2>Datos del Proyecto</h2>
    <div class="meta-grid">
      ${metaItem("Denominación", extra.denominacion)}
      ${metaItem("Emplazamiento", extra.emplazamiento)}
      ${metaItem("Tipo de obra", extra.tipo_obra)}
    </div>
    <h2>Datos del Promotor</h2>
    <div class="meta-grid">
      ${metaItem("Nombre / Razón Social", doc.nombre_promotor)}
      ${metaItem("CIF", doc.cif_promotor)}
      ${metaItem("Domicilio", doc.domicilio_promotor)}
    </div>
    <h2>Datos del Coordinador/a</h2>
    <div class="meta-grid">
      ${metaItem("Nombre", doc.nombre_coordinador)}
      ${metaItem("DNI", doc.dni_coordinador)}
      ${metaItem("Titulación / Nº Colegiado", doc.titulacion_colegiado)}
      ${metaItem("Empresa", doc.empresa_coordinacion)}
      ${metaItem("CIF Empresa", doc.cif_empresa)}
      ${metaItem("Domicilio Empresa", doc.domicilio_empresa)}
      ${metaItem("Móvil", doc.movil_coordinador)}
      ${metaItem("Email", doc.email_coordinador)}
    </div>
    ${firmaSection(extra.lugar_firma, doc.fecha_documento, ["El Promotor", "El Coordinador/a de SS"])}
  `;
}

function templateActaAprobacion(doc: any, extra: any, obra: any, cliente: any, safeworkLogo: string) {
  const isDGPO = doc.tipo === "acta_aprobacion_dgpo";
  return `
    ${logoHeader(safeworkLogo, cliente?.logo_url, TIPO_LABELS[doc.tipo])}
    <h2>Datos de la Obra</h2>
    <div class="meta-grid">
      ${metaItem("Actuación / Obra", extra.actuacion)}
      ${metaItem("Localidad", extra.localidad)}
      ${metaItem("Promotor", doc.nombre_promotor)}
    </div>
    <h2>Agentes del Proyecto</h2>
    <div class="meta-grid">
      ${metaItem("Autor del Proyecto", extra.autor_proyecto)}
      ${metaItem("Coordinador SS durante el Proyecto", extra.coord_ss_proyecto)}
      ${metaItem("Autor del Estudio SS", extra.autor_estudio_ss)}
      ${metaItem("Director de obra", extra.director_obra)}
      ${isDGPO ? metaItem("Coordinadora Actividades Empresariales", extra.coord_actividades_empresariales) : metaItem("Coordinador SS durante la Obra", extra.coord_ss_obra)}
      ${isDGPO ? metaItem("Empresa Contratista", extra.empresa_contratista_dgpo) : metaItem("Empresa Contratista del Plan", extra.empresa_contratista_plan)}
    </div>
    ${firmaSection(extra.lugar_firma, doc.fecha_documento, ["El Promotor", "El Coordinador/a de SS", "El Director de Obra"])}
  `;
}

function templateActaReunion(doc: any, extra: any, obra: any, cliente: any, safeworkLogo: string, asistentes: any[], actividades: any[], empresas: any[]) {
  const isCAE = doc.tipo === "acta_reunion_cae";
  let html = logoHeader(safeworkLogo, cliente?.logo_url, TIPO_LABELS[doc.tipo]);
  
  html += `<h2>Datos Generales</h2>
    <div class="meta-grid">
      ${metaItem("Obra / Actuación", extra.obra_actuacion)}
      ${metaItem("Localidad", extra.localidad)}
      ${metaItem("Promotor", doc.nombre_promotor)}
      ${metaItem("Lugar de reunión", extra.lugar_reunion)}
      ${metaItem("Fecha", doc.fecha_documento ? new Date(doc.fecha_documento).toLocaleDateString("es-ES") : "—")}
      ${isCAE ? metaItem("Mes de reunión", extra.mes_reunion) : ""}
      ${extra.numero_acta ? metaItem("Nº Acta", extra.numero_acta) : ""}
    </div>`;

  // Asistentes
  html += `<h2>Asistentes</h2>`;
  if (asistentes.length > 0) {
    html += `<table><tr><th>Nombre</th><th>Apellidos</th><th>Cargo</th><th>Empresa</th><th>DNI/NIE</th></tr>`;
    for (const a of asistentes) {
      html += `<tr><td>${a.nombre || ""}</td><td>${a.apellidos || ""}</td><td>${a.cargo || ""}</td><td>${a.empresa || ""}</td><td>${a.dni_nie || ""}</td></tr>`;
    }
    html += `</table>`;
  } else {
    html += `<p style="color:#999;font-style:italic;">Sin asistentes registrados.</p>`;
  }

  if (extra.excusados) {
    html += `<h2>Excusados / Ausentes</h2><p class="section-text">${extra.excusados.replace(/\n/g, "<br/>")}</p>`;
  }

  // Actividades (CAE)
  if (isCAE && actividades.length > 0) {
    html += `<h2>Actividades a Desarrollar</h2><table><tr><th>Actividad</th><th>Nº Pedido</th></tr>`;
    for (const a of actividades) {
      html += `<tr><td>${a.actividad}</td><td>${a.numero_pedido || "—"}</td></tr>`;
    }
    html += `</table>`;
  }

  // Empresas (CAE)
  if (isCAE && empresas.length > 0) {
    html += `<h2>Empresas con Acceso a Obra</h2><table><tr><th>Empresa</th><th>Persona de contacto</th><th>Email</th></tr>`;
    for (const e of empresas) {
      html += `<tr><td>${e.empresa}</td><td>${e.persona_contacto || "—"}</td><td>${e.email_referencia || "—"}</td></tr>`;
    }
    html += `</table>`;
  }

  // Riesgos (CAE)
  if (isCAE && extra.riesgos?.length > 0) {
    html += `<h2>Riesgos Previstos</h2><ul>`;
    for (const r of extra.riesgos) html += `<li>${r}</li>`;
    if (extra.otros_riesgos) html += `<li>Otros: ${extra.otros_riesgos}</li>`;
    html += `</ul>`;
    if (extra.plataforma_cae) html += `<p><strong>Plataforma CAE:</strong> ${extra.plataforma_cae}</p>`;
  }

  html += firmaSection(extra.lugar_firma || "", doc.fecha_documento, ["El Coordinador/a", "Representante"]);
  return html;
}

function templateInforme(doc: any, extra: any, obra: any, cliente: any, safeworkLogo: string) {
  const SECCIONES = [
    { key: "estado_general", label: "Estado general de la obra" },
    { key: "orden_limpieza", label: "Orden y limpieza" },
    { key: "senalizacion", label: "Señalización y balizamiento" },
    { key: "trabajos_altura", label: "Trabajos en altura" },
    { key: "epc", label: "Equipos de protección colectiva" },
    { key: "epi", label: "Equipos de protección individual" },
    { key: "maquinaria", label: "Maquinaria" },
    { key: "medios_auxiliares", label: "Medios auxiliares" },
  ];

  let html = logoHeader(safeworkLogo, cliente?.logo_url, TIPO_LABELS[doc.tipo]);
  
  html += `<h2>Datos Generales</h2>
    <div class="meta-grid">
      ${metaItem("Obra", extra.titulo_obra || obra?.nombre)}
      ${metaItem("Fecha de visita", doc.fecha_documento ? new Date(doc.fecha_documento).toLocaleDateString("es-ES") : "—")}
      ${metaItem("Técnico", extra.nombre_tecnico)}
      ${metaItem("Dirección", obra?.direccion)}
    </div>`;

  for (const s of SECCIONES) {
    const val = extra[s.key];
    if (val) {
      html += `<h2>${s.label}</h2><p class="section-text">${val.replace(/\n/g, "<br/>")}</p>`;
    }
  }

  if (extra.recomendaciones) {
    html += `<h2>Recomendaciones Adicionales</h2><p class="section-text">${extra.recomendaciones.replace(/\n/g, "<br/>")}</p>`;
  }

  html += firmaSection("", doc.fecha_documento, ["El Coordinador/a de SS"]);
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

    // Fetch document with obra and cliente
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
    const extra = (doc.datos_extra as Record<string, any>) || {};
    
    // Fetch company config for logo and data
    const { data: empresaConfig } = await supabase
      .from("configuracion_empresa")
      .select("*")
      .limit(1)
      .single();
    
    const safeworkLogo = empresaConfig?.logo_url || `${supabaseUrl}/storage/v1/object/public/logos/safework-logo.png`;

    let bodyHtml = "";
    const tipo = doc.tipo;

    if (tipo.startsWith("acta_nombramiento")) {
      bodyHtml = templateActaNombramiento(doc, extra, obra, cliente, safeworkLogo);
    } else if (tipo.startsWith("acta_aprobacion")) {
      bodyHtml = templateActaAprobacion(doc, extra, obra, cliente, safeworkLogo);
    } else if (tipo.startsWith("acta_reunion")) {
      // Fetch related data
      const [asistRes, actRes, empRes] = await Promise.all([
        supabase.from("asistentes_reunion").select("*").eq("documento_id", documento_id).order("created_at"),
        supabase.from("actividades_reunion_cae").select("*").eq("documento_id", documento_id).order("orden"),
        supabase.from("empresas_acceso_obra").select("*").eq("documento_id", documento_id),
      ]);
      bodyHtml = templateActaReunion(doc, extra, obra, cliente, safeworkLogo,
        asistRes.data || [], actRes.data || [], empRes.data || []);
    } else if (tipo.startsWith("informe_")) {
      bodyHtml = templateInforme(doc, extra, obra, cliente, safeworkLogo);
    } else {
      return new Response(JSON.stringify({ error: `Tipo de documento no soportado: ${tipo}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const fechaStr = doc.fecha_documento
      ? new Date(doc.fecha_documento).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>${baseStyles()}</style>
</head>
<body>
${bodyHtml}
<div class="footer">
  <p>SafeWork · Documento generado automáticamente · ${fechaStr}</p>
</div>
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
