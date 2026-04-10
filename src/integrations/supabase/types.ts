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
      amonestaciones: {
        Row: {
          created_at: string
          descripcion: string
          foto_url: string | null
          id: string
          informe_id: string
          trabajador: string
        }
        Insert: {
          created_at?: string
          descripcion?: string
          foto_url?: string | null
          id?: string
          informe_id: string
          trabajador?: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          foto_url?: string | null
          id?: string
          informe_id?: string
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
          foto_url: string | null
          id: string
          texto: string
        }
        Insert: {
          bloque_id: string
          created_at?: string
          foto_url?: string | null
          id?: string
          texto?: string
        }
        Update: {
          bloque_id?: string
          created_at?: string
          foto_url?: string | null
          id?: string
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
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      fotos: {
        Row: {
          created_at: string
          id: string
          incidencia_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          incidencia_id: string
          url: string
        }
        Update: {
          created_at?: string
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
          orden: number
          titulo: string
        }
        Insert: {
          categoria: string
          created_at?: string
          descripcion?: string
          id?: string
          informe_id: string
          orden?: number
          titulo: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descripcion?: string
          id?: string
          informe_id?: string
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
          nombre: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          direccion?: string
          id?: string
          nombre: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          direccion?: string
          id?: string
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
          foto_url: string | null
          id: string
          informe_id: string
          texto: string
        }
        Insert: {
          created_at?: string
          foto_url?: string | null
          id?: string
          informe_id: string
          texto?: string
        }
        Update: {
          created_at?: string
          foto_url?: string | null
          id?: string
          informe_id?: string
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
          id: string
          obra_id: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha?: string
          id?: string
          obra_id: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha?: string
          id?: string
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
    },
  },
} as const
