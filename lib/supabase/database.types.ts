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
      asistencia_semanal: {
        Row: {
          asistio: boolean
          comentario_miembro: string | null
          dio_ofrenda: boolean
          discipulado: string | null
          id: string
          invitado_por: string | null
          miembro_id: string | null
          nombre: string | null
          reporte_id: string
          se_congrega: boolean
          tipo: Database["public"]["Enums"]["tipo_asistencia"]
        }
        Insert: {
          asistio: boolean
          comentario_miembro?: string | null
          dio_ofrenda?: boolean
          discipulado?: string | null
          id?: string
          invitado_por?: string | null
          miembro_id?: string | null
          nombre?: string | null
          reporte_id: string
          se_congrega?: boolean
          tipo: Database["public"]["Enums"]["tipo_asistencia"]
        }
        Update: {
          asistio?: boolean
          comentario_miembro?: string | null
          dio_ofrenda?: boolean
          discipulado?: string | null
          id?: string
          invitado_por?: string | null
          miembro_id?: string | null
          nombre?: string | null
          reporte_id?: string
          se_congrega?: boolean
          tipo?: Database["public"]["Enums"]["tipo_asistencia"]
        }
        Relationships: [
          {
            foreignKeyName: "asistencia_semanal_invitado_por_fkey"
            columns: ["invitado_por"]
            isOneToOne: false
            referencedRelation: "miembros_red"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencia_semanal_miembro_id_fkey"
            columns: ["miembro_id"]
            isOneToOne: false
            referencedRelation: "miembros_red"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencia_semanal_reporte_id_fkey"
            columns: ["reporte_id"]
            isOneToOne: false
            referencedRelation: "reportes_semanales"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_reporte: {
        Row: {
          id: string
          reporte_id: string
          ruta_storage: string
          subida_por: string
        }
        Insert: {
          id?: string
          reporte_id: string
          ruta_storage: string
          subida_por: string
        }
        Update: {
          id?: string
          reporte_id?: string
          ruta_storage?: string
          subida_por?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_reporte_reporte_id_fkey"
            columns: ["reporte_id"]
            isOneToOne: false
            referencedRelation: "reportes_semanales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_reporte_subida_por_fkey"
            columns: ["subida_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materiales: {
        Row: {
          id: string
          titulo: string
        }
        Insert: {
          id?: string
          titulo: string
        }
        Update: {
          id?: string
          titulo?: string
        }
        Relationships: []
      }
      mentores: {
        Row: {
          color: string | null
          id: string
          nombre: string
        }
        Insert: {
          color?: string | null
          id?: string
          nombre: string
        }
        Update: {
          color?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      miembros_red: {
        Row: {
          activo: boolean
          apellido: string | null
          correo: string | null
          direccion: string | null
          fecha_nacimiento: string | null
          id: string
          nombre: string
          red_id: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          apellido?: string | null
          correo?: string | null
          direccion?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre: string
          red_id: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          apellido?: string | null
          correo?: string | null
          direccion?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre?: string
          red_id?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "miembros_red_red_id_fkey"
            columns: ["red_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          id: string
          mentor_id: string | null
          nombre_completo: string
          red_id: string | null
          rol: Database["public"]["Enums"]["rol_usuario"]
        }
        Insert: {
          id: string
          mentor_id?: string | null
          nombre_completo: string
          red_id?: string | null
          rol: Database["public"]["Enums"]["rol_usuario"]
        }
        Update: {
          id?: string
          mentor_id?: string | null
          nombre_completo?: string
          red_id?: string | null
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfiles_red_id_fkey"
            columns: ["red_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
        ]
      }
      peticiones_oracion: {
        Row: {
          creado_en: string
          descripcion: string
          id: string
          miembro_id: string | null
          nombre: string | null
          reporte_id: string
        }
        Insert: {
          creado_en?: string
          descripcion: string
          id?: string
          miembro_id?: string | null
          nombre?: string | null
          reporte_id: string
        }
        Update: {
          creado_en?: string
          descripcion?: string
          id?: string
          miembro_id?: string | null
          nombre?: string | null
          reporte_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "peticiones_oracion_miembro_id_fkey"
            columns: ["miembro_id"]
            isOneToOne: false
            referencedRelation: "miembros_red"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peticiones_oracion_reporte_id_fkey"
            columns: ["reporte_id"]
            isOneToOne: false
            referencedRelation: "reportes_semanales"
            referencedColumns: ["id"]
          },
        ]
      }
      redes: {
        Row: {
          activa: boolean
          anfitrion: string | null
          colider: string | null
          dia_reunion: string | null
          direccion: string | null
          horario: string | null
          id: string
          mentor_id: string | null
          nombre: string
        }
        Insert: {
          activa?: boolean
          anfitrion?: string | null
          colider?: string | null
          dia_reunion?: string | null
          direccion?: string | null
          horario?: string | null
          id?: string
          mentor_id?: string | null
          nombre: string
        }
        Update: {
          activa?: boolean
          anfitrion?: string | null
          colider?: string | null
          dia_reunion?: string | null
          direccion?: string | null
          horario?: string | null
          id?: string
          mentor_id?: string | null
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "redes_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentores"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes_semanales: {
        Row: {
          capitulo_actual: number | null
          comentario_lider: string | null
          creado_en: string
          creado_por: string
          dia_habitual: boolean
          discipulados: string | null
          fecha_reunion: string | null
          hora_reunion: string | null
          id: string
          material_id: string | null
          ofrenda: number | null
          red_id: string
          se_congregan: number | null
          se_recogio_ofrenda: boolean
          semana_fin: string
          semana_inicio: string
          total_fieles: number | null
          total_miembros: number | null
          total_nuevos: number | null
        }
        Insert: {
          capitulo_actual?: number | null
          comentario_lider?: string | null
          creado_en?: string
          creado_por: string
          dia_habitual?: boolean
          discipulados?: string | null
          fecha_reunion?: string | null
          hora_reunion?: string | null
          id?: string
          material_id?: string | null
          ofrenda?: number | null
          red_id: string
          se_congregan?: number | null
          se_recogio_ofrenda?: boolean
          semana_fin: string
          semana_inicio: string
          total_fieles?: number | null
          total_miembros?: number | null
          total_nuevos?: number | null
        }
        Update: {
          capitulo_actual?: number | null
          comentario_lider?: string | null
          creado_en?: string
          creado_por?: string
          dia_habitual?: boolean
          discipulados?: string | null
          fecha_reunion?: string | null
          hora_reunion?: string | null
          id?: string
          material_id?: string | null
          ofrenda?: number | null
          red_id?: string
          se_congregan?: number | null
          se_recogio_ofrenda?: boolean
          semana_fin?: string
          semana_inicio?: string
          total_fieles?: number | null
          total_miembros?: number | null
          total_nuevos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reportes_semanales_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_semanales_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_semanales_red_id_fkey"
            columns: ["red_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
        ]
      }
      temas_material: {
        Row: {
          id: string
          material_id: string
          numero_capitulo: number
          orden: number
          titulo_tema: string
        }
        Insert: {
          id?: string
          material_id: string
          numero_capitulo: number
          orden: number
          titulo_tema: string
        }
        Update: {
          id?: string
          material_id?: string
          numero_capitulo?: number
          orden?: number
          titulo_tema?: string
        }
        Relationships: [
          {
            foreignKeyName: "temas_material_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiales"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      resumen_semanal: {
        Row: {
          semana_fin: string | null
          semana_inicio: string | null
          total_asistencia_redes: number | null
          total_congregacion: number | null
          total_miembros: number | null
          total_nuevos: number | null
          total_ofrenda: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      listar_mentores_publico: {
        Args: Record<PropertyKey, never>
        Returns: {
          color: string
          id: string
          nombre: string
        }[]
      }
      listar_redes_publico: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          nombre: string
        }[]
      }
      listar_usuarios_pendientes: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          id: string
          mentor_id_sugerido: string
          nombre_sugerido: string
          red_id_sugerida: string
          rol_sugerido: string
        }[]
      }
      miembro_es_fiel: {
        Args: { p_meses?: number; p_miembro_id: string }
        Returns: boolean
      }
    }
    Enums: {
      rol_usuario: "pastor" | "admin" | "mentor" | "lider"
      tipo_asistencia: "fiel" | "nuevo"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      rol_usuario: ["pastor", "admin", "mentor", "lider"],
      tipo_asistencia: ["fiel", "nuevo"],
    },
  },
} as const
