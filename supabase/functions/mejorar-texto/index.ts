import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { texto, categoria } = await req.json();

    if (!texto || typeof texto !== "string" || texto.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Se requiere texto para mejorar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un técnico de prevención de riesgos laborales redactando un informe de inspección en obra.
Tu tarea es recibir un texto dictado por voz (puede tener errores, ser informal o desordenado) y convertirlo en una anotación profesional, clara y concisa para un informe técnico de seguridad.

Reglas:
- Mantén el significado original, no inventes información
- Usa lenguaje técnico de prevención de riesgos laborales cuando sea apropiado
- Corrige errores gramaticales y de puntuación
- Estructura el texto de forma clara
- Sé conciso pero completo
- No añadas saludos, encabezados ni formato markdown
${categoria ? `- Contexto: la anotación es sobre la categoría "${categoria}"` : ""}

Además de mejorar el texto, identifica la normativa española de prevención de riesgos laborales aplicable.
Usa la función proporcionada para devolver tanto el texto mejorado como la normativa.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "resultado_inspeccion",
          description: "Devuelve el texto mejorado y la normativa aplicable",
          parameters: {
            type: "object",
            properties: {
              texto_mejorado: {
                type: "string",
                description: "El texto profesionalizado y corregido",
              },
              normativa: {
                type: "array",
                description: "Normativa aplicable (puede estar vacío si no aplica ninguna específica)",
                items: {
                  type: "object",
                  properties: {
                    referencia: {
                      type: "string",
                      description: "Referencia legal, ej: RD 1627/1997, Anexo IV, Parte C",
                    },
                    descripcion: {
                      type: "string",
                      description: "Breve descripción de qué regula",
                    },
                  },
                  required: ["referencia", "descripcion"],
                },
              },
            },
            required: ["texto_mejorado", "normativa"],
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: texto },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "resultado_inspeccion" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes, intenta de nuevo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA agotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Error del servicio de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Try to extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        const normativaText = (args.normativa || [])
          .map((n: any) => `${n.referencia} — ${n.descripcion}`)
          .join("\n");

        return new Response(
          JSON.stringify({
            texto_mejorado: args.texto_mejorado || texto,
            normativa: normativaText,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (parseErr) {
        console.error("Failed to parse tool call args:", parseErr);
      }
    }

    // Fallback: plain text response
    const mejorado = data.choices?.[0]?.message?.content || texto;
    return new Response(
      JSON.stringify({ texto_mejorado: mejorado, normativa: "" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("mejorar-texto error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
