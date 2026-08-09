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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      enrollments: {
        Row: {
          id: string
          school_year_id: string
          section_id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
        }
        Insert: {
          id?: string
          school_year_id: string
          section_id: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
        }
        Update: {
          id?: string
          school_year_id?: string
          section_id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_level_subjects: {
        Row: {
          grade_level_id: string
          subject_id: string
        }
        Insert: {
          grade_level_id: string
          subject_id: string
        }
        Update: {
          grade_level_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_level_subjects_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_level_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_levels: {
        Row: {
          id: string
          is_active: boolean
          name: string
          sequence: number
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
          sequence: number
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
          sequence?: number
        }
        Relationships: []
      }
      grading_periods: {
        Row: {
          end_date: string | null
          id: string
          is_active: boolean
          label: string
          school_year_id: string
          sequence: number
          start_date: string | null
        }
        Insert: {
          end_date?: string | null
          id?: string
          is_active?: boolean
          label: string
          school_year_id: string
          sequence: number
          start_date?: string | null
        }
        Update: {
          end_date?: string | null
          id?: string
          is_active?: boolean
          label?: string
          school_year_id?: string
          sequence?: number
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grading_periods_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          contact_email: string | null
          created_at: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          profile_picture_url: string | null
          role: Database["public"]["Enums"]["role"]
          updated_at: string
          username: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          first_name: string
          id: string
          is_active?: boolean
          last_name: string
          profile_picture_url?: string | null
          role: Database["public"]["Enums"]["role"]
          updated_at?: string
          username?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["role"]
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      school_years: {
        Row: {
          end_date: string
          id: string
          is_current: boolean
          label: string
          start_date: string
        }
        Insert: {
          end_date: string
          id?: string
          is_current?: boolean
          label: string
          start_date: string
        }
        Update: {
          end_date?: string
          id?: string
          is_current?: boolean
          label?: string
          start_date?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          adviser_id: string | null
          grade_level_id: string
          id: string
          is_active: boolean
          name: string
          school_year_id: string
          shift: Database["public"]["Enums"]["shift"] | null
        }
        Insert: {
          adviser_id?: string | null
          grade_level_id: string
          id?: string
          is_active?: boolean
          name: string
          school_year_id: string
          shift?: Database["public"]["Enums"]["shift"] | null
        }
        Update: {
          adviser_id?: string | null
          grade_level_id?: string
          id?: string
          is_active?: boolean
          name?: string
          school_year_id?: string
          shift?: Database["public"]["Enums"]["shift"] | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_adviser_id_fkey"
            columns: ["adviser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
        ]
      }
      student_details: {
        Row: {
          guardian_contact_number: string | null
          guardian_email: string
          guardian_name: string | null
          guardian_relationship: string | null
          is_4ps_beneficiary: boolean
          profile_id: string
          student_number: string
        }
        Insert: {
          guardian_contact_number?: string | null
          guardian_email: string
          guardian_name?: string | null
          guardian_relationship?: string | null
          is_4ps_beneficiary?: boolean
          profile_id: string
          student_number: string
        }
        Update: {
          guardian_contact_number?: string | null
          guardian_email?: string
          guardian_name?: string | null
          guardian_relationship?: string | null
          is_4ps_beneficiary?: boolean
          profile_id?: string
          student_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_details_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_assignments: {
        Row: {
          id: string
          is_active: boolean
          section_id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          section_id: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          section_id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_section: { Args: { section: string }; Returns: boolean }
      can_access_student: { Args: { student: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      set_current_school_year: {
        Args: { p_year_id: string }
        Returns: undefined
      }
    }
    Enums: {
      enrollment_status: "enrolled" | "inactive"
      role: "superadmin" | "admin" | "normal"
      shift: "AM" | "PM"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      enrollment_status: ["enrolled", "inactive"],
      role: ["superadmin", "admin", "normal"],
      shift: ["AM", "PM"],
    },
  },
} as const
