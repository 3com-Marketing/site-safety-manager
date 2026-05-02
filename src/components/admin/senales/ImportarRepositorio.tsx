import { useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileJson, Image as ImageIcon, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useSignoCategorias, useSignosObra } from '@/hooks/useSignosObra';
import { matchFiles, type MatchableSenal } from '@/lib/signosMatching';

interface JsonCategoria {
  id: number;
  nombre: string;
  orden?: number;
  activa?: boolean;
}
interface JsonSenal {
  id: number;
  nombre: string;
  categoria_id: number;
  archivo_original: string;
  activa?: boolean;
}
interface JsonRepo {
  categorias: JsonCategoria[];
  // El JSON usa la clave "señales" con eñe
  señales?: JsonSenal[];
  senales?: JsonSenal[];
  pendientes_de_revision?: unknown;
}

export default function ImportarRepositorio() {
  const qc = useQueryClient();
  const { data: categorias = [] } = useSignoCategorias({ soloActivas: false });
  const { data: signos = [] } = useSignosObra({ soloActivas: false });

  // ---------------- JSON ----------------
  const [jsonText, setJsonText] = useState('');
  const [parsed, setParsed] = useState<JsonRepo | null>(null);
  const [importingJson, setImportingJson] = useState(false);
  const fileJsonRef = useRef<HTMLInputElement>(null);

  const onJsonFile = async (f: File) => {
    const txt = await f.text();
    setJsonText(txt);
    tryParse(txt);
  };

  const tryParse = (txt: string) => {
    try {
      const data = JSON.parse(txt) as JsonRepo;
      if (!Array.isArray(data.categorias)) throw new Error('Falta categorias[]');
      const sen = data.señales ?? data.senales;
      if (!Array.isArray(sen)) throw new Error('Faltan señales[]');
      setParsed({ categorias: data.categorias, señales: sen });
    } catch (e: any) {
      setParsed(null);
      if (txt.trim()) toast.error('JSON inválido: ' + e.message);
    }
  };

  const jsonPreview = useMemo(() => {
    if (!parsed) return null;
    const sen = parsed.señales ?? [];
    const catNamesExisting = new Set(categorias.map(c => c.nombre.trim().toLowerCase()));
    const senNamesExisting = new Set(signos.map(s => s.nombre.trim().toLowerCase()));
    const newCats = parsed.categorias.filter(c => !catNamesExisting.has(c.nombre.trim().toLowerCase()));
    const newSens = sen.filter(s => !senNamesExisting.has(s.nombre.trim().toLowerCase()));
    return {
      newCatsCount: newCats.length,
      skipCatsCount: parsed.categorias.length - newCats.length,
      newSensCount: newSens.length,
      skipSensCount: sen.length - newSens.length,
    };
  }, [parsed, categorias, signos]);

  const importJson = async () => {
    if (!parsed) return;
    setImportingJson(true);
    try {
      const sen = parsed.señales ?? [];
      // 1) Categorías
      const existingCats = new Map(categorias.map(c => [c.nombre.trim().toLowerCase(), c]));
      const toInsertCats = parsed.categorias
        .filter(c => !existingCats.has(c.nombre.trim().toLowerCase()))
        .map(c => ({
          nombre: c.nombre.trim(),
          orden: c.orden ?? 0,
          activa: c.activa ?? true,
        }));

      let insertedCats: { id: string; nombre: string }[] = [];
      if (toInsertCats.length) {
        const { data, error } = await supabase
          .from('signo_categorias').insert(toInsertCats).select('id, nombre');
        if (error) throw error;
        insertedCats = data || [];
      }
      // Mapa: nombre normalizado -> uuid
      const catUuidByName = new Map<string, string>();
      categorias.forEach(c => catUuidByName.set(c.nombre.trim().toLowerCase(), c.id));
      insertedCats.forEach(c => catUuidByName.set(c.nombre.trim().toLowerCase(), c.id));

      // Mapa: id JSON -> uuid
      const catUuidByJsonId = new Map<number, string>();
      for (const c of parsed.categorias) {
        const uuid = catUuidByName.get(c.nombre.trim().toLowerCase());
        if (uuid) catUuidByJsonId.set(c.id, uuid);
      }

      // 2) Señales
      const existingSens = new Set(signos.map(s => s.nombre.trim().toLowerCase()));
      const toInsertSens = sen
        .filter(s => !existingSens.has(s.nombre.trim().toLowerCase()))
        .map((s, i) => {
          const uuid = catUuidByJsonId.get(s.categoria_id);
          if (!uuid) return null;
          return {
            nombre: s.nombre.trim(),
            categoria_id: uuid,
            archivo_original: s.archivo_original,
            imagen_url: '',
            activa: false, // inactiva hasta tener imagen
            orden: i + 1,
          };
        })
        .filter(Boolean) as any[];

      let insertedSensCount = 0;
      if (toInsertSens.length) {
        // insertar por lotes de 100
        for (let i = 0; i < toInsertSens.length; i += 100) {
          const chunk = toInsertSens.slice(i, i + 100);
          const { error } = await supabase.from('signos_obra').insert(chunk);
          if (error) throw error;
          insertedSensCount += chunk.length;
        }
      }

      toast.success(
        `Importado: ${insertedCats.length} categoría(s), ${insertedSensCount} señal(es). ` +
        `Omitidas: ${parsed.categorias.length - insertedCats.length} cat, ${sen.length - insertedSensCount} señ.`
      );
      qc.invalidateQueries({ queryKey: ['signo_categorias'] });
      qc.invalidateQueries({ queryKey: ['signos_obra'] });
    } catch (err: any) {
      toast.error(err?.message ?? 'Error importando JSON');
    } finally {
      setImportingJson(false);
    }
  };

  // ---------------- IMÁGENES ----------------
  const fileImgRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [manualMatches, setManualMatches] = useState<Map<string, string>>(new Map()); // file.name -> senal_id
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  const matchableSenales: MatchableSenal[] = useMemo(
    () => signos.map(s => ({ id: s.id, nombre: s.nombre, archivo_original: s.archivo_original })),
    [signos]
  );

  const matchResult = useMemo(() => matchFiles(files, matchableSenales), [files, matchableSenales]);

  const onFilesChosen = (filesList: FileList | null) => {
    if (!filesList) return;
    setFiles(Array.from(filesList));
    setManualMatches(new Map());
  };

  const senalesPorId = useMemo(() => {
    const m = new Map(signos.map(s => [s.id, s]));
    return m;
  }, [signos]);

  const setManual = (fileName: string, senalId: string) => {
    setManualMatches(prev => {
      const n = new Map(prev);
      if (senalId === '__skip__') n.delete(fileName);
      else n.set(fileName, senalId);
      return n;
    });
  };

  const totalToUpload = matchResult.matched.length + manualMatches.size;

  const uploadAndMatch = async () => {
    // Construir lista final: auto + manuales (manuales sobreescriben en caso de conflicto)
    const pairs: Array<{ file: File; senalId: string }> = [];
    for (const m of matchResult.matched) {
      const manual = manualMatches.get(m.file.name);
      pairs.push({ file: m.file, senalId: manual ?? m.senal.id });
    }
    // Manuales para conflictos / sin emparejar
    for (const f of [...matchResult.conflicts.map(c => c.file), ...matchResult.unmatched]) {
      const senalId = manualMatches.get(f.name);
      if (senalId) pairs.push({ file: f, senalId });
    }
    if (pairs.length === 0) {
      toast.error('No hay imágenes para subir');
      return;
    }

    setUploadProgress({ done: 0, total: pairs.length });
    let ok = 0; let fail = 0;
    for (let i = 0; i < pairs.length; i++) {
      const { file, senalId } = pairs[i];
      try {
        const senal = senalesPorId.get(senalId);
        // borrar archivo viejo si era de Storage
        if (senal && senal.imagen_url && !senal.imagen_url.startsWith('data:')) {
          try {
            const url = new URL(senal.imagen_url);
            const idx = url.pathname.indexOf('/signos-obra/');
            if (idx >= 0) {
              const oldPath = url.pathname.slice(idx + '/signos-obra/'.length);
              await supabase.storage.from('signos-obra').remove([oldPath]);
            }
          } catch { /* ignore */ }
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        const safeName = file.name.replace(/[^a-z0-9._-]/gi, '_');
        const path = `${senalId}/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage
          .from('signos-obra').upload(path, file, { contentType: file.type, upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('signos-obra').getPublicUrl(path);
        const { error: updErr } = await supabase.from('signos_obra')
          .update({ imagen_url: data.publicUrl, activa: true })
          .eq('id', senalId);
        if (updErr) throw updErr;
        ok++;
      } catch (e) {
        console.error('Error subiendo', file.name, e);
        fail++;
      }
      setUploadProgress({ done: i + 1, total: pairs.length });
    }

    toast.success(`Subidas ${ok}/${pairs.length}${fail ? ` · ${fail} con error` : ''}`);
    qc.invalidateQueries({ queryKey: ['signos_obra'] });
    setFiles([]);
    setManualMatches(new Map());
    setUploadProgress(null);
    if (fileImgRef.current) fileImgRef.current.value = '';
  };

  // Lista de señales para Selects de asignación manual
  const senalesOptions = useMemo(
    () => [...signos].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [signos]
  );

  return (
    <div className="space-y-6">
      {/* ===== JSON ===== */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">1. Importar JSON del repositorio</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Crea categorías y señales (sin imagen). Las señales sin imagen quedan inactivas hasta que
            se emparejen con un archivo desde el segundo paso.
          </p>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileJsonRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={e => e.target.files?.[0] && onJsonFile(e.target.files[0])}
            />
            <Button variant="outline" onClick={() => fileJsonRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" /> Cargar archivo JSON
            </Button>
          </div>

          <div>
            <Label>O pegar JSON</Label>
            <Textarea
              rows={6}
              placeholder='{ "categorias": [...], "señales": [...] }'
              value={jsonText}
              onChange={e => { setJsonText(e.target.value); tryParse(e.target.value); }}
              className="font-mono text-xs"
            />
          </div>

          {parsed && jsonPreview && (
            <div className="rounded-md border p-3 bg-muted/30 space-y-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{parsed.categorias.length} categorías en JSON</Badge>
                <Badge variant="secondary">{(parsed.señales ?? []).length} señales en JSON</Badge>
              </div>
              <div className="text-muted-foreground">
                Se crearán <strong className="text-foreground">{jsonPreview.newCatsCount}</strong> categorías
                {' '}y <strong className="text-foreground">{jsonPreview.newSensCount}</strong> señales nuevas.
                {(jsonPreview.skipCatsCount + jsonPreview.skipSensCount) > 0 && (
                  <> Se omitirán {jsonPreview.skipCatsCount} cat. y {jsonPreview.skipSensCount} señales (ya existen por nombre).</>
                )}
              </div>
              <Button onClick={importJson} disabled={importingJson} className="gap-2">
                {importingJson && <Loader2 className="h-4 w-4 animate-spin" />}
                Importar al repositorio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== IMÁGENES ===== */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">2. Importar imágenes en lote</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Selecciona múltiples imágenes. Se emparejan automáticamente con las señales por
            el nombre del archivo. Las que no coincidan podrás asignarlas a mano antes de subir.
          </p>

          <div>
            <input
              ref={fileImgRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/gif,image/webp"
              className="hidden"
              onChange={e => onFilesChosen(e.target.files)}
            />
            <Button variant="outline" onClick={() => fileImgRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" /> Seleccionar imágenes
            </Button>
            {files.length > 0 && (
              <span className="ml-3 text-sm text-muted-foreground">
                {files.length} archivo(s) seleccionado(s)
              </span>
            )}
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              {/* Emparejadas */}
              {matchResult.matched.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-sm">
                      Emparejadas automáticamente ({matchResult.matched.length})
                    </h4>
                  </div>
                  <div className="border rounded-md divide-y max-h-64 overflow-auto">
                    {matchResult.matched.map(m => (
                      <div key={m.file.name} className="px-3 py-2 text-sm flex items-center justify-between gap-2">
                        <span className="truncate">{m.file.name}</span>
                        <Badge variant="outline" className="shrink-0">→ {m.senal.nombre}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conflictos */}
              {matchResult.conflicts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <h4 className="font-medium text-sm">
                      Conflictos ({matchResult.conflicts.length}) — elige una señal
                    </h4>
                  </div>
                  <div className="border rounded-md divide-y">
                    {matchResult.conflicts.map(c => (
                      <div key={c.file.name} className="px-3 py-2 text-sm flex items-center gap-2">
                        <span className="truncate flex-1">{c.file.name}</span>
                        <Select
                          value={manualMatches.get(c.file.name) ?? '__skip__'}
                          onValueChange={(v) => setManual(c.file.name, v)}
                        >
                          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__skip__">— Omitir —</SelectItem>
                            {c.candidates.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sin emparejar */}
              {matchResult.unmatched.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <h4 className="font-medium text-sm">
                      Sin emparejar ({matchResult.unmatched.length}) — asigna a mano si quieres
                    </h4>
                  </div>
                  <div className="border rounded-md divide-y max-h-80 overflow-auto">
                    {matchResult.unmatched.map(f => (
                      <div key={f.name} className="px-3 py-2 text-sm flex items-center gap-2">
                        <span className="truncate flex-1">{f.name}</span>
                        <Select
                          value={manualMatches.get(f.name) ?? '__skip__'}
                          onValueChange={(v) => setManual(f.name, v)}
                        >
                          <SelectTrigger className="w-64"><SelectValue placeholder="Asignar a…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__skip__">— Omitir —</SelectItem>
                            {senalesOptions.map(s => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.nombre}{!s.imagen_url ? ' · sin imagen' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Acción */}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={uploadAndMatch} disabled={!!uploadProgress || totalToUpload === 0} className="gap-2">
                  {uploadProgress && <Loader2 className="h-4 w-4 animate-spin" />}
                  Subir y emparejar ({totalToUpload})
                </Button>
                {uploadProgress && (
                  <div className="flex-1">
                    <Progress value={(uploadProgress.done / uploadProgress.total) * 100} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {uploadProgress.done} / {uploadProgress.total}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
