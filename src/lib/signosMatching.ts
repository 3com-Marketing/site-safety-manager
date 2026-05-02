// Helper para emparejar archivos subidos con señales por nombre original.

export function normalize(name: string): string {
  if (!name) return '';
  let s = name.toLowerCase();
  // quitar extensión
  s = s.replace(/\.[a-z0-9]+$/i, '');
  // quitar acentos
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // ñ -> n
  s = s.replace(/ñ/g, 'n');
  // reemplazar separadores comunes y paréntesis por '-'
  s = s.replace(/[\s_\-().]+/g, '-');
  // colapsar guiones
  s = s.replace(/-+/g, '-');
  // trim
  s = s.replace(/^-|-$/g, '');
  return s;
}

export interface MatchableSenal {
  id: string;
  nombre: string;
  archivo_original?: string | null;
}

export interface MatchResult {
  matched: Array<{ file: File; senal: MatchableSenal }>;
  conflicts: Array<{ file: File; candidates: MatchableSenal[] }>;
  unmatched: File[];
}

export function matchFiles(files: File[], senales: MatchableSenal[]): MatchResult {
  // Indexar señales por nombre normalizado de archivo_original
  const idx = new Map<string, MatchableSenal[]>();
  for (const s of senales) {
    if (!s.archivo_original) continue;
    const key = normalize(s.archivo_original);
    if (!key) continue;
    const arr = idx.get(key) || [];
    arr.push(s);
    idx.set(key, arr);
  }

  const matched: MatchResult['matched'] = [];
  const conflicts: MatchResult['conflicts'] = [];
  const unmatched: File[] = [];

  for (const file of files) {
    const key = normalize(file.name);
    const candidates = idx.get(key);
    if (!candidates || candidates.length === 0) {
      unmatched.push(file);
    } else if (candidates.length === 1) {
      matched.push({ file, senal: candidates[0] });
    } else {
      conflicts.push({ file, candidates });
    }
  }

  return { matched, conflicts, unmatched };
}
