export type ExpedienteStatus = 'rojo' | 'amarillo' | 'verde' | 'sin_datos';

interface DocResumen {
  tipo: string;
  estado: string;
}

const DOCS_SIN_PROYECTO = ['acta_nombramiento_cae'];
const DOCS_CON_PROYECTO = ['acta_nombramiento_proyecto', 'acta_aprobacion_plan_sys'];

function inferTipoObra(docs: DocResumen[]): 'sin_proyecto' | 'con_proyecto' {
  if (docs.some(d => d.tipo === 'acta_nombramiento_proyecto')) return 'con_proyecto';
  return 'sin_proyecto';
}

export function calcExpedienteStatus(docs: DocResumen[]): ExpedienteStatus {
  if (!docs || docs.length === 0) return 'sin_datos';

  const tipo = inferTipoObra(docs);
  const obligatorios = tipo === 'con_proyecto' ? DOCS_CON_PROYECTO : DOCS_SIN_PROYECTO;

  const estadosPorTipo = new Map<string, string>();
  docs.forEach(d => estadosPorTipo.set(d.tipo, d.estado));

  // Check if any mandatory doc is missing or pendiente
  for (const t of obligatorios) {
    const estado = estadosPorTipo.get(t);
    if (!estado || estado === 'pendiente') return 'rojo';
  }

  // Check if all mandatory are firmado
  const todosFirmados = obligatorios.every(t => estadosPorTipo.get(t) === 'firmado');
  if (todosFirmados) return 'verde';

  return 'amarillo';
}

export function ExpedienteDot({ status }: { status: ExpedienteStatus }) {
  const colors: Record<ExpedienteStatus, string> = {
    rojo: 'bg-destructive',
    amarillo: 'bg-warning',
    verde: 'bg-success',
    sin_datos: 'bg-muted-foreground/30',
  };
  return <span className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${colors[status]}`} />;
}
