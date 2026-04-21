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
    svg: circle('#fff', '#D32F2F', `<text x="50" y="58" text-anchor="middle" font-size="32" fill="#333">✋</text><line x1="22" y1="22" x2="78" y2="78" stroke="#D32F2F" stroke-width="5"/>`),
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
    svg: circle('#1565C0', '#0D47A1', `<text x="50" y="60" text-anchor="middle" font-size="30" fill="#fff">🧤</text>`),
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
    svg: triangle(`<text x="50" y="72" text-anchor="middle" font-size="36" fill="#222">⚡</text>`),
  },
  {
    id: 'atencion_peligro',
    nombre: 'Atención peligro',
    categoria: 'advertencia',
    svg: triangle(`<text x="50" y="74" text-anchor="middle" font-size="38" font-weight="bold" fill="#222">!</text>`),
  },
  {
    id: 'riesgo_caida',
    nombre: 'Riesgo de caída',
    categoria: 'advertencia',
    svg: triangle(`<text x="50" y="70" text-anchor="middle" font-size="28" fill="#222">↓</text><line x1="35" y1="75" x2="65" y2="75" stroke="#222" stroke-width="2" stroke-dasharray="4"/>`),
  },
  {
    id: 'riesgo_maquinaria',
    nombre: 'Riesgo maquinaria',
    categoria: 'advertencia',
    svg: triangle(`<text x="50" y="72" text-anchor="middle" font-size="30" fill="#222">⚙</text>`),
  },
  // Emergencia (verde)
  {
    id: 'extintor',
    nombre: 'Extintor',
    categoria: 'emergencia',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="8" fill="#2E7D32"/><text x="50" y="64" text-anchor="middle" font-size="38" fill="#fff">🧯</text></svg>`,
  },
  {
    id: 'salida_emergencia',
    nombre: 'Salida emergencia',
    categoria: 'emergencia',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="8" fill="#2E7D32"/><text x="50" y="58" text-anchor="middle" font-size="16" font-weight="bold" fill="#fff">SALIDA</text><text x="50" y="74" text-anchor="middle" font-size="22" fill="#fff">→</text></svg>`,
  },
  {
    id: 'punto_reunion',
    nombre: 'Punto de reunión',
    categoria: 'emergencia',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="8" fill="#2E7D32"/><text x="50" y="64" text-anchor="middle" font-size="36" fill="#fff">👥</text></svg>`,
  },
];
