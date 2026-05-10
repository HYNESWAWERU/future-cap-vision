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
      accountability_partners: {
        Row: {
          created_at: string
          email: string
          id: string
          label: string
          name: string
          notify_loss: boolean
          notify_milestones: boolean
          notify_profit: boolean
          notify_weekly: boolean
          session_id: string
          verification_token: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          label?: string
          name?: string
          notify_loss?: boolean
          notify_milestones?: boolean
          notify_profit?: boolean
          notify_weekly?: boolean
          session_id: string
          verification_token?: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          label?: string
          name?: string
          notify_loss?: boolean
          notify_milestones?: boolean
          notify_profit?: boolean
          notify_weekly?: boolean
          session_id?: string
          verification_token?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: []
      }
      edit_log: {
        Row: {
          created_at: string
          day_index: number | null
          field: string
          id: string
          new_value: string
          old_value: string
          session_id: string
        }
        Insert: {
          created_at?: string
          day_index?: number | null
          field: string
          id?: string
          new_value?: string
          old_value?: string
          session_id: string
        }
        Update: {
          created_at?: string
          day_index?: number | null
          field?: string
          id?: string
          new_value?: string
          old_value?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edit_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "trading_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "trading_sessions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_alerts_log: {
        Row: {
          alert_date: string
          alert_type: string
          created_at: string
          id: string
          partner_id: string
          pct: number | null
          pnl: number | null
          session_id: string
        }
        Insert: {
          alert_date?: string
          alert_type: string
          created_at?: string
          id?: string
          partner_id: string
          pct?: number | null
          pnl?: number | null
          session_id: string
        }
        Update: {
          alert_date?: string
          alert_type?: string
          created_at?: string
          id?: string
          partner_id?: string
          pct?: number | null
          pnl?: number | null
          session_id?: string
        }
        Relationships: []
      }
      trade_entries: {
        Row: {
          actual_result: number | null
          created_at: string
          deposit: number
          entry_date: string
          id: string
          session_id: string
          updated_at: string
          verified: boolean
          withdrawal: number
        }
        Insert: {
          actual_result?: number | null
          created_at?: string
          deposit?: number
          entry_date: string
          id?: string
          session_id: string
          updated_at?: string
          verified?: boolean
          withdrawal?: number
        }
        Update: {
          actual_result?: number | null
          created_at?: string
          deposit?: number
          entry_date?: string
          id?: string
          session_id?: string
          updated_at?: string
          verified?: boolean
          withdrawal?: number
        }
        Relationships: [
          {
            foreignKeyName: "trade_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "trading_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "trading_sessions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_sessions: {
        Row: {
          accountability_partner: string
          created_at: string
          daily_target_percent: number
          id: string
          pin_hash: string | null
          starting_capital: number
          trading_end_date: string
          trading_start_date: string
          updated_at: string
        }
        Insert: {
          accountability_partner?: string
          created_at?: string
          daily_target_percent?: number
          id?: string
          pin_hash?: string | null
          starting_capital?: number
          trading_end_date?: string
          trading_start_date?: string
          updated_at?: string
        }
        Update: {
          accountability_partner?: string
          created_at?: string
          daily_target_percent?: number
          id?: string
          pin_hash?: string | null
          starting_capital?: number
          trading_end_date?: string
          trading_start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      trading_sessions_public: {
        Row: {
          accountability_partner: string | null
          created_at: string | null
          daily_target_percent: number | null
          has_pin: boolean | null
          id: string | null
          starting_capital: number | null
          trading_end_date: string | null
          trading_start_date: string | null
          updated_at: string | null
        }
        Insert: {
          accountability_partner?: string | null
          created_at?: string | null
          daily_target_percent?: number | null
          has_pin?: never
          id?: string | null
          starting_capital?: number | null
          trading_end_date?: string | null
          trading_start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          accountability_partner?: string | null
          created_at?: string | null
          daily_target_percent?: number | null
          has_pin?: never
          id?: string | null
          starting_capital?: number | null
          trading_end_date?: string | null
          trading_start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      verify_session_pin: {
        Args: { provided_hash: string; session_uuid: string }
        Returns: boolean
      }
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
