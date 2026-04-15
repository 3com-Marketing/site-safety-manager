import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useDocumentosObra, type DocumentoConRelaciones } from '@/hooks/useDocumentosObra';
import type { Json } from '@/integrations/supabase/types';

interface Props {
  documento?: DocumentoConRelaciones | null;
  obraId?: string;
  tipo?: string;
  onSave: (data: Record<string, any>) => Promise<void>;
  saving?: boolean;
  defaultValues?: Record<string, string>;
}

export default function FormActaReunion({ documento, obraId, tipo, onSave, saving, defaultValues }: Props) {
  const tipoActual = documento?.tipo || tipo || '';
  const isCAE = tipoActual === 'acta_reunion_cae';
  const effectiveObraId = obraId || documento?.obra_id || '';
  const { addAsistente, deleteAsistente, addActividad, deleteActividad, addEmpresa, deleteEmpresa } = useDocumentosObra(effectiveObraId);

  const [titulo, setTitulo] = useState('');
  const [fechaDocumento, setFechaDocumento] = useState('');
  const [nombreCoordinador, setNombreCoordinador] = useState('');
  const [dniCoordinador, setDniCoordinador] = useState('');
  const [empresaCoordinacion, setEmpresaCoordinacion] = useState('');
  const [nombrePromotor, setNombrePromotor] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Inline forms
  const [nuevoAsistente, setNuevoAsistente] = useState({ nombre: '', apellidos: '', cargo: '', empresa: '', dni_nie: '' });
  const [nuevaActividad, setNuevaActividad] = useState({ actividad: '', numero_pedido: '' });
  const [nuevaEmpresa, setNuevaEmpresa] = useState({ empresa: '', persona_contacto: '', email_referencia: '' });

  useEffect(() => {
    if (documento) {
      setTitulo(documento.titulo || '');
      setFechaDocumento(documento.fecha_documento || '');
      setNombreCoordinador(documento.nombre_coordinador || '');
      setDniCoordinador(documento.dni_coordinador || '');
      setEmpresaCoordinacion(documento.empresa_coordinacion || '');
      setNombrePromotor(documento.nombre_promotor || '');
      const extra = (documento.datos_extra as Record<string, any>) || {};
      setObservaciones(extra.observaciones || '');
    } else if (defaultValues) {
      setNombreCoordinador(defaultValues.nombre_coordinador || '');
      setEmpresaCoordinacion(defaultValues.empresa_coordinacion || '');
      setNombrePromotor(defaultValues.nombre_promotor || '');
    }
  }, [documento, defaultValues]);

  // Related data from the joined query
  const asistentes = documento?.asistentes_reunion || [];
  const actividades = documento?.actividades_reunion_cae || [];
  const empresas = documento?.empresas_acceso_obra || [];

  const handleAddAsistente = async () => {
    if (!documento || !nuevoAsistente.nombre.trim()) return;
    await addAsistente.mutateAsync({ documento_id: documento.id, ...nuevoAsistente });
    setNuevoAsistente({ nombre: '', apellidos: '', cargo: '', empresa: '', dni_nie: '' });
  };

  const handleDeleteAsistente = async (id: string) => {
    await deleteAsistente.mutateAsync(id);
  };

  const handleAddActividad = async () => {
    if (!documento || !nuevaActividad.actividad.trim()) return;
    await addActividad.mutateAsync({ documento_id: documento.id, actividad: nuevaActividad.actividad, numero_pedido: nuevaActividad.numero_pedido || null, orden: actividades.length });
    setNuevaActividad({ actividad: '', numero_pedido: '' });
  };

  const handleDeleteActividad = async (id: string) => {
    await deleteActividad.mutateAsync(id);
  };

  const handleAddEmpresa = async () => {
    if (!documento || !nuevaEmpresa.empresa.trim()) return;
    await addEmpresa.mutateAsync({ documento_id: documento.id, ...nuevaEmpresa });
    setNuevaEmpresa({ empresa: '', persona_contacto: '', email_referencia: '' });
  };

  const handleDeleteEmpresa = async (id: string) => {
    await deleteEmpresa.mutateAsync(id);
  };

  const handleSubmit = () => {
    onSave({
      titulo, fecha_documento: fechaDocumento || null,
      nombre_coordinador: nombreCoordinador, dni_coordinador: dniCoordinador,
      empresa_coordinacion: empresaCoordinacion, nombre_promotor: nombrePromotor,
      datos_extra: { observaciones } as unknown as Json,
      ...(obraId ? { obra_id: obraId, tipo } : {}),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Título</Label>
          <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título del acta" />
        </div>
        <div className="space-y-2">
          <Label>Fecha del documento</Label>
          <Input type="date" value={fechaDocumento} onChange={e => setFechaDocumento(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Coordinador</Label>
          <Input value={nombreCoordinador} onChange={e => setNombreCoordinador(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>DNI</Label>
          <Input value={dniCoordinador} onChange={e => setDniCoordinador(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Input value={empresaCoordinacion} onChange={e => setEmpresaCoordinacion(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Promotor</Label>
          <Input value={nombrePromotor} onChange={e => setNombrePromotor(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observaciones</Label>
        <Textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={3} />
      </div>

      {/* Asistentes */}
      {documento && (
        <div className="space-y-3 pt-2">
          <p className="text-sm font-semibold">Asistentes</p>
          {asistentes.map(a => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="text-sm">
                <span className="font-medium">{a.nombre} {a.apellidos}</span>
                {a.cargo && <span className="text-muted-foreground"> · {a.cargo}</span>}
                {a.empresa && <span className="text-muted-foreground"> · {a.empresa}</span>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteAsistente(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
          <div className="grid grid-cols-5 gap-2">
            <Input placeholder="Nombre" value={nuevoAsistente.nombre} onChange={e => setNuevoAsistente(p => ({ ...p, nombre: e.target.value }))} />
            <Input placeholder="Apellidos" value={nuevoAsistente.apellidos} onChange={e => setNuevoAsistente(p => ({ ...p, apellidos: e.target.value }))} />
            <Input placeholder="Cargo" value={nuevoAsistente.cargo} onChange={e => setNuevoAsistente(p => ({ ...p, cargo: e.target.value }))} />
            <Input placeholder="Empresa" value={nuevoAsistente.empresa} onChange={e => setNuevoAsistente(p => ({ ...p, empresa: e.target.value }))} />
            <Button size="sm" onClick={handleAddAsistente} disabled={!nuevoAsistente.nombre.trim()} className="gap-1"><Plus className="h-4 w-4" /> Añadir</Button>
          </div>
        </div>
      )}

      {/* Actividades CAE */}
      {documento && isCAE && (
        <div className="space-y-3 pt-2">
          <p className="text-sm font-semibold">Actividades</p>
          {actividades.map(a => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="text-sm">
                <span className="font-medium">{a.actividad}</span>
                {a.numero_pedido && <span className="text-muted-foreground"> · Pedido: {a.numero_pedido}</span>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteActividad(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Actividad" value={nuevaActividad.actividad} onChange={e => setNuevaActividad(p => ({ ...p, actividad: e.target.value }))} className="col-span-1" />
            <Input placeholder="Nº pedido" value={nuevaActividad.numero_pedido} onChange={e => setNuevaActividad(p => ({ ...p, numero_pedido: e.target.value }))} />
            <Button size="sm" onClick={handleAddActividad} disabled={!nuevaActividad.actividad.trim()} className="gap-1"><Plus className="h-4 w-4" /> Añadir</Button>
          </div>
        </div>
      )}

      {/* Empresas acceso */}
      {documento && isCAE && (
        <div className="space-y-3 pt-2">
          <p className="text-sm font-semibold">Empresas con acceso a obra</p>
          {empresas.map(e => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="text-sm">
                <span className="font-medium">{e.empresa}</span>
                {e.persona_contacto && <span className="text-muted-foreground"> · {e.persona_contacto}</span>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteEmpresa(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
          <div className="grid grid-cols-4 gap-2">
            <Input placeholder="Empresa" value={nuevaEmpresa.empresa} onChange={e => setNuevaEmpresa(p => ({ ...p, empresa: e.target.value }))} />
            <Input placeholder="Contacto" value={nuevaEmpresa.persona_contacto} onChange={e => setNuevaEmpresa(p => ({ ...p, persona_contacto: e.target.value }))} />
            <Input placeholder="Email" value={nuevaEmpresa.email_referencia} onChange={e => setNuevaEmpresa(p => ({ ...p, email_referencia: e.target.value }))} />
            <Button size="sm" onClick={handleAddEmpresa} disabled={!nuevaEmpresa.empresa.trim()} className="gap-1"><Plus className="h-4 w-4" /> Añadir</Button>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} disabled={saving} className="h-12 rounded-xl">
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
