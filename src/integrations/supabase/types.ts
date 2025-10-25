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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      core_principles: {
        Row: {
          created_at: string | null
          credit_value: number
          id: string
          name: string
          parameters: Json | null
        }
        Insert: {
          created_at?: string | null
          credit_value?: number
          id?: string
          name: string
          parameters?: Json | null
        }
        Update: {
          created_at?: string | null
          credit_value?: number
          id?: string
          name?: string
          parameters?: Json | null
        }
        Relationships: []
      }
      growth_evaluations: {
        Row: {
          admin_verified: boolean | null
          ai_summary: string | null
          created_at: string | null
          credit_value: number
          gpa_contribution: number | null
          growth_grade: number | null
          id: string
          parameter_scores: Json | null
          principle_id: string | null
          user_id: string | null
          week: string | null
        }
        Insert: {
          admin_verified?: boolean | null
          ai_summary?: string | null
          created_at?: string | null
          credit_value: number
          gpa_contribution?: number | null
          growth_grade?: number | null
          id?: string
          parameter_scores?: Json | null
          principle_id?: string | null
          user_id?: string | null
          week?: string | null
        }
        Update: {
          admin_verified?: boolean | null
          ai_summary?: string | null
          created_at?: string | null
          credit_value?: number
          gpa_contribution?: number | null
          growth_grade?: number | null
          id?: string
          parameter_scores?: Json | null
          principle_id?: string | null
          user_id?: string | null
          week?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_evaluations_principle_id_fkey"
            columns: ["principle_id"]
            isOneToOne: false
            referencedRelation: "core_principles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_evaluations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          batch: string
          bonus_points: number | null
          campus_name: string
          course: string
          created_at: string | null
          gpa: number | null
          id: string
          joined_evp_on: string
          last_submission_date: string | null
          name: string
          rank: number | null
          total_credits: number | null
          total_score: number | null
          updated_at: string | null
        }
        Insert: {
          batch: string
          bonus_points?: number | null
          campus_name: string
          course: string
          created_at?: string | null
          gpa?: number | null
          id: string
          joined_evp_on: string
          last_submission_date?: string | null
          name: string
          rank?: number | null
          total_credits?: number | null
          total_score?: number | null
          updated_at?: string | null
        }
        Update: {
          batch?: string
          bonus_points?: number | null
          campus_name?: string
          course?: string
          created_at?: string | null
          gpa?: number | null
          id?: string
          joined_evp_on?: string
          last_submission_date?: string | null
          name?: string
          rank?: number | null
          total_credits?: number | null
          total_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reflection_questions: {
        Row: {
          created_at: string | null
          credit_value: number | null
          id: string
          order_index: number | null
          principle: string
          question: string
        }
        Insert: {
          created_at?: string | null
          credit_value?: number | null
          id?: string
          order_index?: number | null
          principle: string
          question: string
        }
        Update: {
          created_at?: string | null
          credit_value?: number | null
          id?: string
          order_index?: number | null
          principle?: string
          question?: string
        }
        Relationships: []
      }
      reflections: {
        Row: {
          created_at: string | null
          credit_value: number | null
          effort_score: number | null
          id: string
          principle: string
          quality_score: number | null
          question: string
          response: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credit_value?: number | null
          effort_score?: number | null
          id?: string
          principle: string
          quality_score?: number | null
          question: string
          response: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credit_value?: number | null
          effort_score?: number | null
          id?: string
          principle?: string
          quality_score?: number | null
          question?: string
          response?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reflections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          admin_comments: string | null
          category: Database["public"]["Enums"]["performance_category"]
          created_at: string | null
          id: string
          numeric_value: number | null
          proof_url: string | null
          score: number | null
          status: Database["public"]["Enums"]["submission_status"] | null
          text_value: string | null
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_comments?: string | null
          category: Database["public"]["Enums"]["performance_category"]
          created_at?: string | null
          id?: string
          numeric_value?: number | null
          proof_url?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          text_value?: string | null
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_comments?: string | null
          category?: Database["public"]["Enums"]["performance_category"]
          created_at?: string | null
          id?: string
          numeric_value?: number | null
          proof_url?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          text_value?: string | null
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gpa: {
        Row: {
          average_effort_score: number | null
          average_quality_score: number | null
          created_at: string | null
          id: string
          last_calculated: string | null
          rank: number | null
          total_effort_score: number | null
          total_quality_score: number | null
          total_reflections: number | null
          updated_at: string | null
          user_id: string | null
          weighted_gpa: number | null
        }
        Insert: {
          average_effort_score?: number | null
          average_quality_score?: number | null
          created_at?: string | null
          id?: string
          last_calculated?: string | null
          rank?: number | null
          total_effort_score?: number | null
          total_quality_score?: number | null
          total_reflections?: number | null
          updated_at?: string | null
          user_id?: string | null
          weighted_gpa?: number | null
        }
        Update: {
          average_effort_score?: number | null
          average_quality_score?: number | null
          created_at?: string | null
          id?: string
          last_calculated?: string | null
          rank?: number | null
          total_effort_score?: number | null
          total_quality_score?: number | null
          total_reflections?: number | null
          updated_at?: string | null
          user_id?: string | null
          weighted_gpa?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_gpa_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_gpa: { Args: { target_user_id?: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_all_ranks: { Args: never; Returns: undefined }
      update_user_gpa: { Args: { target_user: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "campus_lead" | "superadmin"
      performance_category:
        | "campus_outreach"
        | "events_attended"
        | "event_contribution"
        | "leadership"
        | "collaboration"
        | "communication"
      submission_status: "pending" | "verified" | "needs_revision"
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
      app_role: ["admin", "campus_lead", "superadmin"],
      performance_category: [
        "campus_outreach",
        "events_attended",
        "event_contribution",
        "leadership",
        "collaboration",
        "communication",
      ],
      submission_status: ["pending", "verified", "needs_revision"],
    },
  },
} as const
