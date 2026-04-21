export interface SignoObra {
  id: string;
  nombre: string;
  categoria: 'prohibicion' | 'obligacion' | 'advertencia' | 'emergencia';
  svg: string;
}

const circle = (bg: string, border: string, icon: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="${bg}" stroke="${border}" stroke-width="4"/>${icon}</svg>`;

const triangle = (icon: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,8 96,88 4,88" fill="#FFD600" stroke="#222" stroke-width="3"/>${icon}</svg>`;

export const SIGNOS_OBRA: SignoObra[] = [
  // Prohibición (rojo)
  {
    id: 'prohibido_paso',
    nombre: 'Prohibido el paso',
    categoria: 'prohibicion',
    svg: circle('#fff', '#D32F2F', `<line x1="25" y1="25" x2="75" y2="75" stroke="#D32F2F" stroke-width="6"/><circle cx="50" cy="50" r="30" fill="none" stroke="#D32F2F" stroke-width="5"/>`),
  },
  {
    id: 'prohibido_fumar',
    nombre: 'Prohibido fumar',
    categoria: 'prohibicion',
    svg: circle('#fff', '#D32F2F', `<rect x="35" y="42" width="25" height="6" rx="2" fill="#333"/><line x1="60" y1="45" x2="60" y2="32" stroke="#888" stroke-width="2"/><line x1="22" y1="22" x2="78" y2="78" stroke="#D32F2F" stroke-width="5"/>`),
  },
  {
    id: 'prohibido_tocar',
    nombre: 'No tocar',
    categoria: 'prohibicion',
    svg: circle('#fff', '#D32F2F', `<path d="M50 35 L50 28 M46 36 L46 30 M54 36 L54 30 M42 40 L42 34 M40 42 Q38 55 42 62 L58 62 Q62 55 60 42 L58 36" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="22" x2="78" y2="78" stroke="#D32F2F" stroke-width="5"/>`),
  },
  // Obligación (azul)
  {
    id: 'obligatorio_casco',
    nombre: 'Casco obligatorio',
    categoria: 'obligacion',
    svg: circle('#1565C0', '#0D47A1', `<path d="M35 55 Q35 35 50 30 Q65 35 65 55 Z" fill="#fff"/><rect x="33" y="53" width="34" height="5" rx="2" fill="#fff"/>`),
  },
  {
    id: 'obligatorio_chaleco',
    nombre: 'Chaleco obligatorio',
    categoria: 'obligacion',
    svg: circle('#1565C0', '#0D47A1', `<path d="M38 40 L42 65 L58 65 L62 40 Q50 35 38 40Z" fill="#fff"/><line x1="42" y1="48" x2="58" y2="48" stroke="#1565C0" stroke-width="2"/><line x1="42" y1="55" x2="58" y2="55" stroke="#1565C0" stroke-width="2"/>`),
  },
  {
    id: 'obligatorio_gafas',
    nombre: 'Gafas obligatorias',
    categoria: 'obligacion',
    svg: circle('#1565C0', '#0D47A1', `<rect x="30" y="42" width="16" height="12" rx="3" fill="none" stroke="#fff" stroke-width="3"/><rect x="54" y="42" width="16" height="12" rx="3" fill="none" stroke="#fff" stroke-width="3"/><line x1="46" y1="48" x2="54" y2="48" stroke="#fff" stroke-width="2"/>`),
  },
  {
    id: 'obligatorio_guantes',
    nombre: 'Guantes obligatorios',
    categoria: 'obligacion',
    svg: circle('#1565C0', '#0D47A1', `<path d="M40 60 L40 45 Q40 42 43 42 L43 35 Q43 32 46 32 L46 42 L46 33 Q46 30 49 30 L49 42 L49 33 Q49 30 52 30 L52 42 L52 35 Q52 32 55 32 L55 42 Q55 42 58 42 L58 52 Q58 60 50 62 Z" fill="#fff" stroke="#fff" stroke-width="1"/>`),
  },
  {
    id: 'obligatorio_arnes',
    nombre: 'Arnés obligatorio',
    categoria: 'obligacion',
    svg: circle('#1565C0', '#0D47A1', `<circle cx="50" cy="38" r="6" fill="#fff"/><path d="M42 46 L50 70 L58 46" fill="none" stroke="#fff" stroke-width="3"/><line x1="38" y1="55" x2="62" y2="55" stroke="#fff" stroke-width="2"/>`),
  },
  // Advertencia (amarillo)
  {
    id: 'riesgo_electrico',
    nombre: 'Riesgo eléctrico',
    categoria: 'advertencia',
    svg: triangle(`<path d="M52 35 L45 55 L52 50 L48 72 L58 48 L50 53 Z" fill="#222" stroke="#222" stroke-width="1"/>`),
  },
  {
    id: 'atencion_peligro',
    nombre: 'Atención peligro',
    categoria: 'advertencia',
    svg: triangle(`<line x1="50" y1="35" x2="50" y2="60" stroke="#222" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="72" r="3" fill="#222"/>`),
  },
  {
    id: 'riesgo_caida',
    nombre: 'Riesgo de caída',
    categoria: 'advertencia',
    svg: triangle(`<circle cx="50" cy="38" r="4" fill="#222"/><path d="M50 42 L50 58 M44 48 L56 48 M46 68 L50 58 L54 68" fill="none" stroke="#222" stroke-width="2.5" stroke-linecap="round"/><line x1="35" y1="75" x2="65" y2="75" stroke="#222" stroke-width="2" stroke-dasharray="4"/>`),
  },
  {
    id: 'riesgo_maquinaria',
    nombre: 'Riesgo maquinaria',
    categoria: 'advertencia',
    svg: triangle(`<circle cx="44" cy="58" r="10" fill="none" stroke="#222" stroke-width="2.5"/><circle cx="56" cy="58" r="10" fill="none" stroke="#222" stroke-width="2.5"/><line x1="44" y1="48" x2="44" y2="50" stroke="#222" stroke-width="2.5"/><line x1="44" y1="66" x2="44" y2="68" stroke="#222" stroke-width="2.5"/><line x1="56" y1="48" x2="56" y2="50" stroke="#222" stroke-width="2.5"/><line x1="56" y1="66" x2="56" y2="68" stroke="#222" stroke-width="2.5"/>`),
  },
  // Emergencia (verde)
  {
    id: 'extintor',
    nombre: 'Extintor',
    categoria: 'emergencia',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="8" fill="#2E7D32"/><rect x="42" y="25" width="16" height="50" rx="4" fill="#fff"/><rect x="46" y="20" width="8" height="8" rx="2" fill="#fff"/><path d="M42 35 L35 30" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><rect x="44" y="40" width="12" height="6" rx="1" fill="#2E7D32"/></svg>`,
  },
  {
    id: 'salida_emergencia',
    nombre: 'Salida emergencia',
    categoria: 'emergencia',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="8" fill="#2E7D32"/><circle cx="42" cy="32" r="4" fill="#fff"/><path d="M42 36 L42 52 M36 42 L48 42 M38 60 L42 52 L46 60" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M55 35 L65 35 L65 65 L55 65" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M58 50 L68 50" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'punto_reunion',
    nombre: 'Punto de reunión',
    categoria: 'emergencia',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="8" fill="#2E7D32"/><circle cx="38" cy="35" r="5" fill="#fff"/><path d="M38 40 L38 58 M30 46 L46 46 M34 66 L38 58 L42 66" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><circle cx="62" cy="35" r="5" fill="#fff"/><path d="M62 40 L62 58 M54 46 L70 46 M58 66 L62 58 L66 66" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  },
];
