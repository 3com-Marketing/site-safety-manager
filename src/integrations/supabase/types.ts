export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      actividades_reunion_cae: {
        Row: {
          actividad: string
          documento_id: string
          id: string
          numero_pedido: string | null
          orden: number | null
        }
        Insert: {
          actividad: string
          documento_id: string
          id?: string
          numero_pedido?: string | null
          orden?: number | null
        }
        Update: {
          actividad?: string
          documento_id?: string
          id?: string
          numero_pedido?: string | null
          orden?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "actividades_reunion_cae_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_obra"
            referencedColumns: ["id"]
          },
        ]
      }
      amonestaciones: {
        Row: {
          created_at: string
          descripcion: string
          etiqueta: string
          foto_url: string | null
          id: string
          informe_id: string
          normativa: string
          trabajador: string
        }
        Insert: {
          created_at?: string
          descripcion?: string
          etiqueta?: string
          foto_url?: string | null
          id?: string
          informe_id: string
          normativa?: string
          trabajador?: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          etiqueta?: string
          foto_url?: string | null
          id?: string
          informe_id?: string
          normativa?: string
          trabajador?: string
        }
        Relationships: [
          {
            foreignKeyName: "amonestaciones_informe_id_fkey"
            columns: ["informe_id"]
            isOneToOne: false
            referencedRelation: "informes"
            referencedColumns: ["id"]
          },
        ]
      }
      anotaciones: {
        Row: {
          bloque_id: string
          created_at: string
          etiqueta: string
          foto_url: string | null
          id: string
          normativa: string
          texto: string
        }
        Insert: {
          bloque_id: string
          created_at?: string
          etiqueta?: string
          foto_url?: string | null
          id?: string
          normativa?: string
          texto?: string
        }
        Update: {
          bloque_id?: string
          created_at?: string
          etiqueta?: string
          foto_url?: string | null
          id?: string
          normativa?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "anotaciones_bloque_id_fkey"
            columns: ["bloque_id"]
            isOneToOne: false
            referencedRelation: "checklist_bloques"
            referencedColumns: ["id"]
          },
        ]
      }
      asistentes_reunion: {
        Row: {
          apellidos: string | null
          cargo: string | null
          created_at: string | null
          dni_nie: string | null
          documento_id: string
          empresa: string | null
          firma_url: string | null
          id: string
          nombre: string
        }
        Insert: {
          apellidos?: string | null
          cargo?: string | null
          created_at?: string | null
          dni_nie?: string | null
          documento_id: string
          empresa?: string | null
          firma_url?: string | null
          id?: string
          nombre: string
        }
        Update: {
          apellidos?: string | null
          cargo?: string | null
          created_at?: string | null
          dni_nie?: string | null
          documento_id?: string
          empresa?: string | null
          firma_url?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistentes_reunion_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_obra"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_bloques: {
        Row: {
          categoria: string
          created_at: string
          estado: string
          id: string
          informe_id: string
        }
        Insert: {
          categoria: string
          created_at?: string
          estado?: string
          id?: string
          informe_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          estado?: string
          id?: string
          informe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_bloques_informe_id_fkey"
            columns: ["informe_id"]
            isOneToOne: false
            referencedRelation: "informes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cif: string
          ciudad: string
          created_at: string
          email: string
          id: string
          logo_url: string | null
          nombre: string
          notas: string
          telefono: string
          tipo_cliente: string
        }
        Insert: {
          cif?: string
          ciudad?: string
          created_at?: string
          email?: string
          id?: string
          logo_url?: string | null
          nombre: string
          notas?: string
          telefono?: string
          tipo_cliente?: string
        }
        Update: {
          cif?: string
          ciudad?: string
          created_at?: string
          email?: string
          id?: string
          logo_url?: string | null
          nombre?: string
          notas?: string
          telefono?: string
          tipo_cliente?: string
        }
        Relationships: []
      }
      configuracion_empresa: {
        Row: {
          banco: string
          cargo_responsable: string
          cif: string
          ciudad: string
          created_at: string | null
          direccion: string
          email: string
          iban: string
          id: string
          logo_url: string | null
          nombre: string
          nombre_responsable: string
          num_colegiado: string
          registro_mercantil: string
          swift_bic: string
          telefono: string
          texto_acta_aprobacion_dgpo: string
          texto_acta_aprobacion_sys: string
          texto_acta_nombramiento_cae: string
          texto_acta_nombramiento_proyecto: string
          texto_acta_reunion_cae: string
          texto_acta_reunion_inicial: string
          texto_acta_reunion_sys: string
          texto_acuerdos_generales: string
          texto_cae_punto1: string
          texto_cae_punto10: string
          texto_cae_punto10_procede: string
          texto_cae_punto13: string
          texto_cae_punto13_procede: string
          texto_cae_punto2: string
          texto_cae_punto2_bloque2: string
          texto_cae_punto3: string
          texto_cae_punto6: string
          texto_cae_punto7: string
          texto_cae_punto8: string
          texto_cae_punto9: string
          texto_normativa: string
          texto_recomendaciones: string
          texto_recurso_preventivo: string
          titulacion: string
          updated_at: string | null
          web: string
        }
        Insert: {
          banco?: string
          cargo_responsable?: string
          cif?: string
          ciudad?: string
          created_at?: string | null
          direccion?: string
          email?: string
          iban?: string
          id?: string
          logo_url?: string | null
          nombre?: string
          nombre_responsable?: string
          num_colegiado?: string
          registro_mercantil?: string
          swift_bic?: string
          telefono?: string
          texto_acta_aprobacion_dgpo?: string
          texto_acta_aprobacion_sys?: string
          texto_acta_nombramiento_cae?: string
          texto_acta_nombramiento_proyecto?: string
          texto_acta_reunion_cae?: string
          texto_acta_reunion_inicial?: string
          texto_acta_reunion_sys?: string
          texto_acuerdos_generales?: string
          texto_cae_punto1?: string
          texto_cae_punto10?: string
          texto_cae_punto10_procede?: string
          texto_cae_punto13?: string
          texto_cae_punto13_procede?: string
          texto_cae_punto2?: string
          texto_cae_punto2_bloque2?: string
          texto_cae_punto3?: string
          texto_cae_punto6?: string
          texto_cae_punto7?: string
          texto_cae_punto8?: string
          texto_cae_punto9?: string
          texto_normativa?: string
          texto_recomendaciones?: string
          texto_recurso_preventivo?: string
          titulacion?: string
          updated_at?: string | null
          web?: string
        }
        Update: {
          banco?: string
          cargo_responsable?: string
          cif?: string
          ciudad?: string
          created_at?: string | null
          direccion?: string
          email?: string
          iban?: string
          id?: string
          logo_url?: string | null
          nombre?: string
          nombre_responsable?: string
          num_colegiado?: string
          registro_mercantil?: string
          swift_bic?: string
          telefono?: string
          texto_acta_aprobacion_dgpo?: string
          texto_acta_aprobacion_sys?: string
          texto_acta_nombramiento_cae?: string
          texto_acta_nombramiento_proyecto?: string
          texto_acta_reunion_cae?: string
          texto_acta_reunion_inicial?: string
          texto_acta_reunion_sys?: string
          texto_acuerdos_generales?: string
          texto_cae_punto1?: string
          texto_cae_punto10?: string
          texto_cae_punto10_procede?: string
          texto_cae_punto13?: string
          texto_cae_punto13_procede?: string
          texto_cae_punto2?: string
          texto_cae_punto2_bloque2?: string
          texto_cae_punto3?: string
          texto_cae_punto6?: string
          texto_cae_punto7?: string
          texto_cae_punto8?: string
          texto_cae_punto9?: string
          texto_normativa?: string
          texto_recomendaciones?: string
          texto_recurso_preventivo?: string
          titulacion?: string
          updated_at?: string | null
          web?: string
        }
        Relationships: []
      }
      contactos_cliente: {
        Row: {
          cargo: string
          cliente_id: string
          created_at: string
          email: string
          id: string
          nombre: string
          telefono: string
        }
        Insert: {
          cargo?: string
          cliente_id: string
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          telefono?: string
        }
        Update: {
          cargo?: string
          cliente_id?: string
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          telefono?: string
        }
        Relationships: [
          {
            foreignKeyName: "contactos_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_obra: {
        Row: {
          archivo_nombre: string | null
          archivo_url: string | null
          cif_empresa: string | null
          cif_promotor: string | null
          creado_por: string | null
          created_at: string | null
          datos_extra: Json | null
          dni_coordinador: string | null
          domicilio_empresa: string | null
          domicilio_promotor: string | null
          email_coordinador: string | null
          empresa_coordinacion: string | null
          estado: Database["public"]["Enums"]["estado_documento"]
          fecha_documento: string | null
          id: string
          movil_coordinador: string | null
          nombre_coordinador: string | null
          nombre_promotor: string | null
          obra_id: string
          tipo: Database["public"]["Enums"]["tipo_documento"]
          titulacion_colegiado: string | null
          titulo: string | null
          updated_at: string | null
        }
        Insert: {
          archivo_nombre?: string | null
          archivo_url?: string | null
          cif_empresa?: string | null
          cif_promotor?: string | null
          creado_por?: string | null
          created_at?: string | null
          datos_extra?: Json | null
          dni_coordinador?: string | null
          domicilio_empresa?: string | null
          domicilio_promotor?: string | null
          email_coordinador?: string | null
          empresa_coordinacion?: string | null
          estado?: Database["public"]["Enums"]["estado_documento"]
          fecha_documento?: string | null
          id?: string
          movil_coordinador?: string | null
          nombre_coordinador?: string | null
          nombre_promotor?: string | null
          obra_id: string
          tipo: Database["public"]["Enums"]["tipo_documento"]
          titulacion_colegiado?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Update: {
          archivo_nombre?: string | null
          archivo_url?: string | null
          cif_empresa?: string | null
          cif_promotor?: string | null
          creado_por?: string | null
          created_at?: string | null
          datos_extra?: Json | null
          dni_coordinador?: string | null
          domicilio_empresa?: string | null
          domicilio_promotor?: string | null
          email_coordinador?: string | null
          empresa_coordinacion?: string | null
          estado?: Database["public"]["Enums"]["estado_documento"]
          fecha_documento?: string | null
          id?: string
          movil_coordinador?: string | null
          nombre_coordinador?: string | null
          nombre_promotor?: string | null
          obra_id?: string
          tipo?: Database["public"]["Enums"]["tipo_documento"]
          titulacion_colegiado?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_obra_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "documentos_obra_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas_acceso_obra: {
        Row: {
          documento_id: string
          email_referencia: string | null
          empresa: string
          id: string
          persona_contacto: string | null
        }
        Insert: {
          documento_id: string
          email_referencia?: string | null
          empresa: string
          id?: string
          persona_contacto?: string | null
        }
        Update: {
          documento_id?: string
          email_referencia?: string | null
          empresa?: string
          id?: string
          persona_contacto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_acceso_obra_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_obra"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos: {
        Row: {
          created_at: string
          etiqueta: string
          id: string
          incidencia_id: string
          url: string
        }
        Insert: {
          created_at?: string
          etiqueta?: string
          id?: string
          incidencia_id: string
          url: string
        }
        Update: {
          created_at?: string
          etiqueta?: string
          id?: string
          incidencia_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_incidencia_id_fkey"
            columns: ["incidencia_id"]
            isOneToOne: false
            referencedRelation: "incidencias"
            referencedColumns: ["id"]
          },
        ]
      }
      incidencias: {
        Row: {
          categoria: string
          created_at: string
          descripcion: string
          id: string
          informe_id: string
          normativa: string
          orden: number
          titulo: string
        }
        Insert: {
          categoria: string
          created_at?: string
          descripcion?: string
          id?: string
          informe_id: string
          normativa?: string
          orden?: number
          titulo: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descripcion?: string
          id?: string
          informe_id?: string
          normativa?: string
          orden?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidencias_informe_id_fkey"
            columns: ["informe_id"]
            isOneToOne: false
            referencedRelation: "informes"
            referencedColumns: ["id"]
          },
        ]
      }
      informes: {
        Row: {
          condiciones_climaticas: string | null
          created_at: string
          empresas_presentes: string | null
          estado: string
          fecha: string
          firma_at: string | null
          firma_url: string | null
          id: string
          notas_generales: string | null
          num_trabajadores: number | null
          visita_id: string
        }
        Insert: {
          condiciones_climaticas?: string | null
          created_at?: string
          empresas_presentes?: string | null
          estado?: string
          fecha?: string
          firma_at?: string | null
          firma_url?: string | null
          id?: string
          notas_generales?: string | null
          num_trabajadores?: number | null
          visita_id: string
        }
        Update: {
          condiciones_climaticas?: string | null
          created_at?: string
          empresas_presentes?: string | null
          estado?: string
          fecha?: string
          firma_at?: string | null
          firma_url?: string | null
          id?: string
          notas_generales?: string | null
          num_trabajadores?: number | null
          visita_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "informes_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "visitas"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          cliente_id: string
          created_at: string
          direccion: string
          id: string
          latitud: number | null
          longitud: number | null
          nombre: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          direccion?: string
          id?: string
          latitud?: number | null
          longitud?: number | null
          nombre: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          direccion?: string
          id?: string
          latitud?: number | null
          longitud?: number | null
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      observaciones: {
        Row: {
          created_at: string
          etiqueta: string
          foto_url: string | null
          id: string
          informe_id: string
          normativa: string
          texto: string
        }
        Insert: {
          created_at?: string
          etiqueta?: string
          foto_url?: string | null
          id?: string
          informe_id: string
          normativa?: string
          texto?: string
        }
        Update: {
          created_at?: string
          etiqueta?: string
          foto_url?: string | null
          id?: string
          informe_id?: string
          normativa?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "observaciones_informe_id_fkey"
            columns: ["informe_id"]
            isOneToOne: false
            referencedRelation: "informes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nombre: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          user_id?: string
        }
        Relationships: []
      }
      tecnicos: {
        Row: {
          apellidos: string
          cif_empresa: string
          codigo_tecnico: string
          created_at: string
          direccion: string
          dni: string
          email: string
          empresa: string
          firma_actualizada_at: string | null
          firma_url: string | null
          id: string
          movil: string
          nombre: string
          notas: string
          num_colegiado: string
          telefono: string
          tipo: string
          titulacion: string
          user_id: string | null
        }
        Insert: {
          apellidos?: string
          cif_empresa?: string
          codigo_tecnico?: string
          created_at?: string
          direccion?: string
          dni?: string
          email?: string
          empresa?: string
          firma_actualizada_at?: string | null
          firma_url?: string | null
          id?: string
          movil?: string
          nombre?: string
          notas?: string
          num_colegiado?: string
          telefono?: string
          tipo?: string
          titulacion?: string
          user_id?: string | null
        }
        Update: {
          apellidos?: string
          cif_empresa?: string
          codigo_tecnico?: string
          created_at?: string
          direccion?: string
          dni?: string
          email?: string
          empresa?: string
          firma_actualizada_at?: string | null
          firma_url?: string | null
          id?: string
          movil?: string
          nombre?: string
          notas?: string
          num_colegiado?: string
          telefono?: string
          tipo?: string
          titulacion?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tecnicos_obras: {
        Row: {
          created_at: string
          id: string
          obra_id: string
          tecnico_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          obra_id: string
          tecnico_id: string
        }
        Update: {
          created_at?: string
          id?: string
          obra_id?: string
          tecnico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tecnicos_obras_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tecnicos_obras_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnicos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitas: {
        Row: {
          created_at: string
          estado: string
          fecha: string
          fecha_fin: string | null
          firma_responsable_cargo: string | null
          firma_responsable_nombre: string | null
          firma_responsable_url: string | null
          firma_tecnico_url: string | null
          firmas_at: string | null
          id: string
          lat_fin: number | null
          lat_inicio: number | null
          lng_fin: number | null
          lng_inicio: number | null
          obra_id: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha?: string
          fecha_fin?: string | null
          firma_responsable_cargo?: string | null
          firma_responsable_nombre?: string | null
          firma_responsable_url?: string | null
          firma_tecnico_url?: string | null
          firmas_at?: string | null
          id?: string
          lat_fin?: number | null
          lat_inicio?: number | null
          lng_fin?: number | null
          lng_inicio?: number | null
          obra_id: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha?: string
          fecha_fin?: string | null
          firma_responsable_cargo?: string | null
          firma_responsable_nombre?: string | null
          firma_responsable_url?: string | null
          firma_tecnico_url?: string | null
          firmas_at?: string | null
          id?: string
          lat_fin?: number | null
          lat_inicio?: number | null
          lng_fin?: number | null
          lng_inicio?: number | null
          obra_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_usuario_id_profiles_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "tecnico"
      estado_documento: "pendiente" | "generado" | "adjuntado" | "firmado"
      tipo_documento:
        | "acta_nombramiento_cae"
        | "acta_nombramiento_proyecto"
        | "acta_aprobacion_dgpo"
        | "acta_aprobacion_plan_sys"
        | "acta_reunion_cae"
        | "acta_reunion_inicial"
        | "acta_reunion_sys"
        | "informe_css"
        | "informe_at"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "tecnico"],
      estado_documento: ["pendiente", "generado", "adjuntado", "firmado"],
      tipo_documento: [
        "acta_nombramiento_cae",
        "acta_nombramiento_proyecto",
        "acta_aprobacion_dgpo",
        "acta_aprobacion_plan_sys",
        "acta_reunion_cae",
        "acta_reunion_inicial",
        "acta_reunion_sys",
        "informe_css",
        "informe_at",
      ],
    },
  },
} as const
