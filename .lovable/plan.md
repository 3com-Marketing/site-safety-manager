

# Plan: Paso 6 — NuevoDocumentoDialog con wizard de 2 pasos y pre-relleno

## Cambios

### 1. `src/components/documentos/NuevoDocumentoDialog.tsx` — Reescritura completa

**Paso 1 — Selector de tipo por categoría:**
- 4 grupos de tarjetas seleccionables (cards clickables con borde resaltado al seleccionar):
  - **Nombramientos** (solo si rol es admin): `acta_nombramiento_cae`, `acta_nombramiento_proyecto`
  - **Aprobaciones** (solo si rol es admin): `acta_aprobacion_dgpo`, `acta_aprobacion_plan_sys`
  - **Reuniones** (si rol es tecnico o ambos): `acta_reunion_cae`, `acta_reunion_inicial`, `acta_reunion_sys`
  - **Informes** (si rol es tecnico o ambos): `informe_css`, `informe_at`
- Botón "Siguiente" habilitado solo cuando hay tipo seleccionado
- Botón "Atrás" en paso 2 para volver al selector

**Paso 2 — Formulario específico:**
- Renderiza el `FormComponent` del `FORM_MAP` existente
- Pre-rellena datos de la obra y técnico asignado

**Pre-relleno automático:**
- Hacer query a `obras` (join `clientes`) para obtener nombre obra, dirección, nombre cliente, CIF cliente
- Hacer query a `tecnicos` (join `tecnicos_obras`) para obtener nombre, email, teléfono del técnico asignado
- Pasar estos datos como prop `defaultValues` a los formularios

### 2. Formularios (`FormActaNombramiento`, `FormActaAprobacion`, `FormActaReunion`, `FormInforme`) — Añadir prop `defaultValues`

- Aceptar prop opcional `defaultValues?: Record<string, string>`
- En el `useEffect`, si no hay `documento` pero hay `defaultValues`, pre-rellenar los campos correspondientes (ej. `nombrePromotor` ← `defaultValues.nombre_promotor`, `empresaCoordinacion` ← `defaultValues.empresa_coordinacion`)

### 3. Queries de pre-relleno (dentro de NuevoDocumentoDialog)

```typescript
// Fetch obra + cliente
const { data: obra } = useQuery({
  queryKey: ['obra-detalle', obraId],
  queryFn: async () => {
    const { data } = await supabase
      .from('obras')
      .select('*, clientes(*)')
      .eq('id', obraId)
      .single();
    return data;
  },
  enabled: !!obraId,
});

// Fetch técnico asignado
const { data: tecnicoAsignado } = useQuery({
  queryKey: ['tecnico-obra', obraId],
  queryFn: async () => {
    const { data } = await supabase
      .from('tecnicos_obras')
      .select('*, tecnicos(*)')
      .eq('obra_id', obraId)
      .limit(1)
      .single();
    return data?.tecnicos;
  },
  enabled: !!obraId,
});
```

Mapeo de campos pre-rellenados:
- `nombre_promotor` ← `obra.clientes.nombre`
- `cif_promotor` ← `obra.clientes.cif`
- `domicilio_promotor` ← `obra.clientes.ciudad`
- `empresa_coordinacion` ← `tecnicoAsignado.nombre` (o campo empresa si existe)
- `email_coordinador` ← `tecnicoAsignado.email`
- `movil_coordinador` ← `tecnicoAsignado.telefono`

## Archivos afectados
- **Reescrito**: `NuevoDocumentoDialog.tsx`
- **Editados**: `FormActaNombramiento.tsx`, `FormActaAprobacion.tsx`, `FormActaReunion.tsx`, `FormInforme.tsx` (añadir `defaultValues` prop)

