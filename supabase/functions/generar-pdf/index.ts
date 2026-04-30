import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { informe_id } = await req.json();
    if (!informe_id) {
      return new Response(
        JSON.stringify({ error: "informe_id requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch informe with related data
    const { data: informe, error: infError } = await supabase
      .from("informes")
      .select("*, visitas(fecha, estado, firma_responsable_url, firma_responsable_nombre, firma_responsable_cargo, firma_tecnico_url, firmas_at, obras(nombre, direccion, clientes(nombre)), profiles:usuario_id(nombre, email))")
      .eq("id", informe_id)
      .single();

    if (infError || !informe) {
      return new Response(
        JSON.stringify({ error: "Informe no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all related data in parallel
    const [checklistRes, incidenciasRes, amonestacionesRes, observacionesRes] = await Promise.all([
      supabase
        .from("checklist_bloques")
        .select("categoria, estado, anotaciones(texto, normativa, foto_url, created_at)")
        .eq("informe_id", informe_id)
        .order("created_at"),
      supabase
        .from("incidencias")
        .select("titulo, descripcion, categoria, normativa, fotos(url, created_at)")
        .eq("informe_id", informe_id)
        .order("orden"),
      supabase
        .from("amonestaciones")
        .select("trabajador, descripcion, normativa, foto_url, created_at")
        .eq("informe_id", informe_id)
        .order("created_at"),
      supabase
        .from("observaciones")
        .select("texto, normativa, foto_url, created_at")
        .eq("informe_id", informe_id)
        .order("created_at"),
    ]);

    const visita = informe.visitas as any;
    const obra = visita?.obras;
    const tecnico = visita?.profiles;
    const checklist = checklistRes.data || [];
    const incidencias = incidenciasRes.data || [];
    const amonestaciones = amonestacionesRes.data || [];
    const observaciones = observacionesRes.data || [];

    const CATEGORIAS: Record<string, string> = {
      EPIs: "EPIs",
      orden_limpieza: "Orden y limpieza",
      altura: "Trabajo en altura",
      señalizacion: "Señalización",
      maquinaria: "Maquinaria",
      general: "General",
    };

    // Generate HTML for PDF
    const fechaInforme = new Date(informe.fecha).toLocaleDateString("es-ES", {
      day: "2-digit", month: "long", year: "numeric",
    });

    let html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 2cm; size: A4; }
  body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.5; }
  h1 { font-size: 22pt; color: #E63027; margin-bottom: 4pt; }
  h2 { font-size: 14pt; color: #1a1a1a; border-bottom: 2px solid #E63027; padding-bottom: 4pt; margin-top: 24pt; }
  h3 { font-size: 12pt; margin-top: 16pt; }
  .header { text-align: center; margin-bottom: 32pt; padding-bottom: 16pt; border-bottom: 3px solid #E63027; }
  .header .subtitle { color: #666; font-size: 10pt; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8pt; margin: 12pt 0; }
  .meta-item { background: #f8f8f8; padding: 8pt 12pt; border-radius: 4pt; }
  .meta-label { font-size: 9pt; color: #888; text-transform: uppercase; letter-spacing: 0.5pt; }
  .meta-value { font-weight: bold; margin-top: 2pt; }
  .item-card { border: 1px solid #e0e0e0; border-radius: 6pt; padding: 12pt; margin: 8pt 0; page-break-inside: avoid; }
  .normativa { background: #FDECEB; border-left: 3px solid #E63027; padding: 6pt 10pt; margin-top: 6pt; font-size: 9pt; color: #555; }
  .normativa-label { font-weight: bold; color: #E63027; font-size: 8pt; text-transform: uppercase; }
  .badge { display: inline-block; background: #E63027; color: white; font-size: 8pt; padding: 2pt 8pt; border-radius: 10pt; }
  .foto { max-width: 200pt; max-height: 150pt; border-radius: 4pt; margin: 6pt 4pt 2pt 0; }
  .foto-caption { font-size: 8pt; color: #666; text-align: center; margin: 2pt 0 6pt 0; }
  .empty { color: #999; font-style: italic; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0; }
  th, td { border: 1px solid #ddd; padding: 6pt 8pt; text-align: left; font-size: 10pt; }
  th { background: #f0f0f0; font-weight: bold; }
  .footer { text-align: center; font-size: 8pt; color: #999; margin-top: 32pt; border-top: 1px solid #ddd; padding-top: 8pt; }
</style>
</head>
<body>

<div class="header">
  <h1>INFORME DE INSPECCIÓN</h1>
  <p class="subtitle">Prevención de Riesgos Laborales</p>
  <p class="subtitle">${fechaInforme}</p>
</div>

<h2>1. Datos Generales</h2>
<div class="meta-grid">
  <div class="meta-item"><div class="meta-label">Obra</div><div class="meta-value">${obra?.nombre || "—"}</div></div>
  <div class="meta-item"><div class="meta-label">Dirección</div><div class="meta-value">${obra?.direccion || "—"}</div></div>
  <div class="meta-item"><div class="meta-label">Cliente</div><div class="meta-value">${obra?.clientes?.nombre || "—"}</div></div>
  <div class="meta-item"><div class="meta-label">Técnico</div><div class="meta-value">${tecnico?.nombre || "—"}</div></div>
  <div class="meta-item"><div class="meta-label">Nº Trabajadores</div><div class="meta-value">${informe.num_trabajadores ?? "—"}</div></div>
  <div class="meta-item"><div class="meta-label">Condiciones climáticas</div><div class="meta-value">${informe.condiciones_climaticas || "—"}</div></div>
  <div class="meta-item"><div class="meta-label">Empresas presentes</div><div class="meta-value">${informe.empresas_presentes || "—"}</div></div>
  <div class="meta-item"><div class="meta-label">Estado</div><div class="meta-value">${informe.estado}</div></div>
</div>
${informe.notas_generales ? `<p><strong>Notas generales:</strong> ${informe.notas_generales}</p>` : ""}

<h2>2. Checklist de Inspección</h2>`;

    if (checklist.length === 0) {
      html += `<p class="empty">Sin bloques de checklist.</p>`;
    } else {
      for (const bloque of checklist) {
        const b = bloque as any;
        const anotaciones = b.anotaciones || [];
        html += `<h3><span class="badge">${CATEGORIAS[b.categoria] || b.categoria}</span></h3>`;
        if (anotaciones.length === 0) {
          html += `<p class="empty">Sin anotaciones.</p>`;
        } else {
          for (const a of anotaciones) {
            html += `<div class="item-card">`;
            if (a.texto) html += `<p>${a.texto}</p>`;
            if (a.foto_url) {
              const fDate = new Date(a.created_at).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
              html += `<img class="foto" src="${a.foto_url}" /><p class="foto-caption">📅 ${fDate}</p>`;
            }
            if (a.normativa) html += `<div class="normativa"><span class="normativa-label">📋 Normativa</span><br/>${a.normativa.replace(/\n/g, "<br/>")}</div>`;
            html += `</div>`;
          }
        }
      }
    }

    html += `<h2>3. Incidencias</h2>`;
    if (incidencias.length === 0) {
      html += `<p class="empty">No se registraron incidencias.</p>`;
    } else {
      for (let i = 0; i < incidencias.length; i++) {
        const inc = incidencias[i] as any;
        html += `<div class="item-card">
          <p><strong>#${i + 1} — ${inc.titulo}</strong> <span class="badge">${CATEGORIAS[inc.categoria] || inc.categoria}</span></p>
          ${inc.descripcion ? `<p>${inc.descripcion}</p>` : ""}`;
        if (inc.fotos?.length) {
          for (const f of inc.fotos) {
            const fDate = new Date(f.created_at).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
            html += `<img class="foto" src="${f.url}" /><p class="foto-caption">📅 ${fDate}</p>`;
          }
        }
        if (inc.normativa) html += `<div class="normativa"><span class="normativa-label">📋 Normativa</span><br/>${inc.normativa.replace(/\n/g, "<br/>")}</div>`;
        html += `</div>`;
      }
    }

    html += `<h2>4. Amonestaciones</h2>`;
    if (amonestaciones.length === 0) {
      html += `<p class="empty">No se registraron amonestaciones.</p>`;
    } else {
      html += `<table><tr><th>Trabajador</th><th>Descripción</th><th>Normativa</th></tr>`;
      for (const a of amonestaciones as any[]) {
        html += `<tr><td>${a.trabajador || "—"}</td><td>${a.descripcion || "—"}</td><td>${a.normativa || "—"}</td></tr>`;
        if (a.foto_url) {
          const fDate = new Date(a.created_at).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
          html += `<tr><td colspan="3"><img class="foto" src="${a.foto_url}" /><p class="foto-caption">📅 ${fDate}</p></td></tr>`;
        }
      }
      html += `</table>`;
    }

    html += `<h2>5. Observaciones Generales</h2>`;
    if (observaciones.length === 0) {
      html += `<p class="empty">Sin observaciones.</p>`;
    } else {
      for (const obs of observaciones as any[]) {
        html += `<div class="item-card">`;
        if (obs.texto) html += `<p>${obs.texto}</p>`;
        if (obs.foto_url) {
          const fDate = new Date(obs.created_at).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
          html += `<img class="foto" src="${obs.foto_url}" /><p class="foto-caption">📅 ${fDate}</p>`;
        }
        if (obs.normativa) html += `<div class="normativa"><span class="normativa-label">📋 Normativa</span><br/>${obs.normativa.replace(/\n/g, "<br/>")}</div>`;
        html += `</div>`;
      }
    }

    html += `
<div class="footer">
  <p>SafeWork · Informe generado automáticamente · ${fechaInforme}</p>
</div>
</body></html>`;

    // Return HTML — the frontend will handle printing/PDF conversion
    return new Response(
      JSON.stringify({ html, filename: `informe_${obra?.nombre || "obra"}_${fechaInforme}.pdf` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generar-pdf error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
