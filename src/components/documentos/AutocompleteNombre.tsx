import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export type AutocompleteSource = 'tecnico' | 'coordinador' | 'persona' | 'cliente';

export interface PersonaSuggestion {
  kind: 'persona';
  id: string;
  nombre: string;
  apellidos: string;
  codigo_tecnico?: string | null;
  email?: string | null;
  dni?: string | null;
  titulacion?: string | null;
  num_colegiado?: string | null;
  empresa?: string | null;
  cif_empresa?: string | null;
  direccion?: string | null;
  movil?: string | null;
  telefono?: string | null;
  tipo?: string | null;
}

export interface ClienteSuggestion {
  kind: 'cliente';
  id: string;
  nombre: string;
  cif?: string | null;
  ciudad?: string | null;
  email?: string | null;
  telefono?: string | null;
}

export type Suggestion = PersonaSuggestion | ClienteSuggestion;

interface Props {
  value: string;
  onChange: (text: string) => void;
  onSelect: (sug: Suggestion) => void;
  source: AutocompleteSource;
  placeholder?: string;
  id?: string;
  className?: string;
}

const escapeForOr = (s: string) => s.replace(/[%,()]/g, ' ').trim();

export default function AutocompleteNombre({
  value,
  onChange,
  onSelect,
  source,
  placeholder,
  id,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const lastSelectedRef = useRef<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const q = value.trim();
    if (!q || q === lastSelectedRef.current) {
      setItems([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      const esc = escapeForOr(q);
      try {
        if (source === 'cliente') {
          const { data } = await supabase
            .from('clientes')
            .select('id, nombre, cif, ciudad, email, telefono')
            .or(`nombre.ilike.%${esc}%,cif.ilike.%${esc}%`)
            .limit(8);
          setItems((data || []).map((c: any) => ({ kind: 'cliente', ...c })));
        } else {
          let req = supabase
            .from('tecnicos')
            .select(
              'id, nombre, apellidos, codigo_tecnico, email, dni, titulacion, num_colegiado, empresa, cif_empresa, direccion, movil, telefono, tipo'
            )
            .or(
              `nombre.ilike.%${esc}%,apellidos.ilike.%${esc}%,codigo_tecnico.ilike.%${esc}%,email.ilike.%${esc}%`
            )
            .limit(8);
          if (source === 'coordinador') req = req.eq('tipo', 'coordinador');
          if (source === 'tecnico') req = req.eq('tipo', 'tecnico');
          const { data } = await req;
          setItems((data || []).map((p: any) => ({ kind: 'persona', ...p })));
        }
        setOpen(true);
        setHighlight(0);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value, source]);

  // Click outside
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (s: Suggestion) => {
    const text =
      s.kind === 'persona'
        ? `${s.nombre || ''}${s.apellidos ? ' ' + s.apellidos : ''}`.trim()
        : s.nombre;
    lastSelectedRef.current = text;
    onChange(text);
    onSelect(s);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(items[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          lastSelectedRef.current = '';
          onChange(e.target.value);
        }}
        onFocus={() => {
          if (items.length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        aria-autocomplete="list"
      />
      {open && (items.length > 0 || loading) && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-72 overflow-auto">
          {loading && items.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Buscando…
            </div>
          )}
          {items.map((s, i) => {
            const isPersona = s.kind === 'persona';
            const title = isPersona
              ? `${s.nombre || ''}${s.apellidos ? ' ' + s.apellidos : ''}`.trim()
              : s.nombre;
            const subtitle = isPersona
              ? [s.codigo_tecnico, s.email, s.empresa].filter(Boolean).join(' · ')
              : [s.cif, s.ciudad].filter(Boolean).join(' · ');
            return (
              <button
                key={s.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`w-full text-left px-3 py-2 text-sm border-b border-border last:border-b-0 ${
                  i === highlight ? 'bg-accent' : 'hover:bg-accent/60'
                }`}
              >
                <div className="font-medium">{title || '(sin nombre)'}</div>
                {subtitle && (
                  <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
