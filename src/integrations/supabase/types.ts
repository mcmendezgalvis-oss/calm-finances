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
      budget_lines: {
        Row: {
          group: string
          id: string
          linked_debt_id: string | null
          linked_shield_id: string | null
          month_key: string
          name: string
          note: string | null
          permanent: boolean | null
          planned: number
          real: number
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          group: string
          id: string
          linked_debt_id?: string | null
          linked_shield_id?: string | null
          month_key: string
          name: string
          note?: string | null
          permanent?: boolean | null
          planned?: number
          real?: number
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          group?: string
          id?: string
          linked_debt_id?: string | null
          linked_shield_id?: string | null
          month_key?: string
          name?: string
          note?: string | null
          permanent?: boolean | null
          planned?: number
          real?: number
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_user_id_month_key_fkey"
            columns: ["user_id", "month_key"]
            isOneToOne: false
            referencedRelation: "months"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      debt_adjustments: {
        Row: {
          date: string
          debt_id: string
          delta: number
          id: string
          month_key: string | null
          note: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          date?: string
          debt_id: string
          delta: number
          id: string
          month_key?: string | null
          note?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
          date?: string
          debt_id?: string
          delta?: number
          id?: string
          month_key?: string | null
          note?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_adjustments_user_id_debt_id_fkey"
            columns: ["user_id", "debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      debts: {
        Row: {
          created_at: string
          current_balance: number
          id: string
          initial_balance: number
          minimum_payment: number
          name: string
          paid: boolean
          paid_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_balance?: number
          id: string
          initial_balance?: number
          minimum_payment?: number
          name: string
          paid?: boolean
          paid_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          minimum_payment?: number
          name?: string
          paid?: boolean
          paid_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      months: {
        Row: {
          closed: boolean
          closed_at: string | null
          id: string
          snapshot: Json | null
          surplus_carry_forward_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          closed?: boolean
          closed_at?: string | null
          id: string
          snapshot?: Json | null
          surplus_carry_forward_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          closed?: boolean
          closed_at?: string | null
          id?: string
          snapshot?: Json | null
          surplus_carry_forward_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          currency: string
          id: string
          language: string
          migrated_at: string | null
          name: string
          plan: string
          premium_until: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id: string
          language?: string
          migrated_at?: string | null
          name?: string
          plan?: string
          premium_until?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          language?: string
          migrated_at?: string | null
          name?: string
          plan?: string
          premium_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shield_tx: {
        Row: {
          amount: number
          date: string
          id: string
          month_key: string | null
          note: string | null
          shield_id: string
          source: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          date?: string
          id: string
          month_key?: string | null
          note?: string | null
          shield_id: string
          source?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          date?: string
          id?: string
          month_key?: string | null
          note?: string | null
          shield_id?: string
          source?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shield_tx_user_id_shield_id_fkey"
            columns: ["user_id", "shield_id"]
            isOneToOne: false
            referencedRelation: "shields"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      shields: {
        Row: {
          archived: boolean
          balance: number
          created_at: string
          goal: number
          id: string
          kind: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          balance?: number
          created_at?: string
          goal?: number
          id: string
          kind: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          balance?: number
          created_at?: string
          goal?: number
          id?: string
          kind?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trophies: {
        Row: {
          context_id: string | null
          earned_at: string
          id: string
          kind: string
          label: string
          month_key: string | null
          user_id: string
        }
        Insert: {
          context_id?: string | null
          earned_at?: string
          id: string
          kind: string
          label: string
          month_key?: string | null
          user_id: string
        }
        Update: {
          context_id?: string | null
          earned_at?: string
          id?: string
          kind?: string
          label?: string
          month_key?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
