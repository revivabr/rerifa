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
      admin_users: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          role: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          role?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          role?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      buyers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          whatsapp: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          whatsapp: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          whatsapp?: string
        }
        Relationships: []
      }
      campaign_prizes: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          position: number | null
          title: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          position?: number | null
          title: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          position?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_prizes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          authorization_url: string | null
          banner_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          draw_date: string | null
          drive_folder_url: string | null
          end_date: string
          goal_amount: number | null
          id: string
          name: string
          number_price: number
          number_quantity: number
          pix_key: string | null
          regulation_text: string | null
          regulation_url: string | null
          slug: string
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          authorization_url?: string | null
          banner_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          draw_date?: string | null
          drive_folder_url?: string | null
          end_date: string
          goal_amount?: number | null
          id?: string
          name: string
          number_price: number
          number_quantity: number
          pix_key?: string | null
          regulation_text?: string | null
          regulation_url?: string | null
          slug: string
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          authorization_url?: string | null
          banner_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          draw_date?: string | null
          drive_folder_url?: string | null
          end_date?: string
          goal_amount?: number | null
          id?: string
          name?: string
          number_price?: number
          number_quantity?: number
          pix_key?: string | null
          regulation_text?: string | null
          regulation_url?: string | null
          slug?: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      draws: {
        Row: {
          campaign_id: string | null
          draw_hash: string | null
          draw_method: string
          draw_seed: string | null
          drawn_at: string | null
          drawn_by: string | null
          eligible_numbers_count: number
          id: string
          winner_art_url: string | null
          winner_buyer_id: string | null
          winner_number: number
          winner_order_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          draw_hash?: string | null
          draw_method: string
          draw_seed?: string | null
          drawn_at?: string | null
          drawn_by?: string | null
          eligible_numbers_count: number
          id?: string
          winner_art_url?: string | null
          winner_buyer_id?: string | null
          winner_number: number
          winner_order_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          draw_hash?: string | null
          draw_method?: string
          draw_seed?: string | null
          drawn_at?: string | null
          drawn_by?: string | null
          eligible_numbers_count?: number
          id?: string
          winner_art_url?: string | null
          winner_buyer_id?: string | null
          winner_number?: number
          winner_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "draws_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draws_drawn_by_fkey"
            columns: ["drawn_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draws_winner_buyer_id_fkey"
            columns: ["winner_buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draws_winner_order_id_fkey"
            columns: ["winner_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_numbers: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          id: string
          number: number
          order_id: string | null
          raffle_number_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          number: number
          order_id?: string | null
          raffle_number_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          number?: number
          order_id?: string | null
          raffle_number_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_numbers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_numbers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_numbers_raffle_number_id_fkey"
            columns: ["raffle_number_id"]
            isOneToOne: false
            referencedRelation: "raffle_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          buyer_id: string | null
          campaign_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          paid_at: string | null
          payment_provider: string | null
          payment_provider_id: string | null
          pix_copy_paste: string | null
          pix_qr_code: string | null
          quantity: number
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          buyer_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          payment_provider?: string | null
          payment_provider_id?: string | null
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          quantity: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          payment_provider?: string | null
          payment_provider_id?: string | null
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          quantity?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          campaign_id: string | null
          confirmed_at: string | null
          created_at: string | null
          id: string
          order_id: string | null
          payload: Json | null
          provider: string
          provider_payment_id: string | null
          status: string
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          payload?: Json | null
          provider: string
          provider_payment_id?: string | null
          status: string
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          payload?: Json | null
          provider?: string
          provider_payment_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      raffle_numbers: {
        Row: {
          buyer_id: string | null
          campaign_id: string | null
          created_at: string | null
          current_order_id: string | null
          id: string
          number: number
          reserved_until: string | null
          sold_at: string | null
          status: string
        }
        Insert: {
          buyer_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          current_order_id?: string | null
          id?: string
          number: number
          reserved_until?: string | null
          sold_at?: string | null
          status?: string
        }
        Update: {
          buyer_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          current_order_id?: string | null
          id?: string
          number?: number
          reserved_until?: string | null
          sold_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "raffle_numbers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_numbers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raffle_numbers_current_order_id_fkey"
            columns: ["current_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      reserve_numbers: {
        Args: {
          p_buyer_email: string
          p_buyer_name: string
          p_buyer_whatsapp: string
          p_campaign_id: string
          p_numbers: number[]
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
