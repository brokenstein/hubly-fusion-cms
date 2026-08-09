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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_state: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      brand_kits: {
        Row: {
          colors: Json
          created_at: string
          fonts: Json
          id: string
          logo_url: string | null
          name: string
          notes: string | null
          source_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          colors?: Json
          created_at?: string
          fonts?: Json
          id?: string
          logo_url?: string | null
          name: string
          notes?: string | null
          source_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          colors?: Json
          created_at?: string
          fonts?: Json
          id?: string
          logo_url?: string | null
          name?: string
          notes?: string | null
          source_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          created_at: string
          download_url: string | null
          id: string
          image_url: string | null
          model: string
          name: string
          notes: string | null
          os: string
          platform_id: string | null
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          download_url?: string | null
          id?: string
          image_url?: string | null
          model?: string
          name: string
          notes?: string | null
          os?: string
          platform_id?: string | null
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          download_url?: string | null
          id?: string
          image_url?: string | null
          model?: string
          name?: string
          notes?: string | null
          os?: string
          platform_id?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      platforms: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roi_deals: {
        Row: {
          brand_kit_id: string | null
          company: string | null
          created_at: string
          id: string
          name: string
          results: Json
          share_slug: string | null
          template_id: string
          template_name: string | null
          updated_at: string
          user_id: string
          values: Json
        }
        Insert: {
          brand_kit_id?: string | null
          company?: string | null
          created_at?: string
          id?: string
          name: string
          results?: Json
          share_slug?: string | null
          template_id: string
          template_name?: string | null
          updated_at?: string
          user_id: string
          values?: Json
        }
        Update: {
          brand_kit_id?: string | null
          company?: string | null
          created_at?: string
          id?: string
          name?: string
          results?: Json
          share_slug?: string | null
          template_id?: string
          template_name?: string | null
          updated_at?: string
          user_id?: string
          values?: Json
        }
        Relationships: [
          {
            foreignKeyName: "roi_deals_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "brand_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      software_versions: {
        Row: {
          created_at: string
          device_id: string
          id: string
          name: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          name: string
          updated_at?: string
          version?: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          name?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "software_versions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      uptime_sites: {
        Row: {
          base_url: string
          created_at: string
          id: string
          name: string
          sort_order: number
          status_page_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_url: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          status_page_slug?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_url?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          status_page_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          is_admin: boolean
        }[]
      }
      admin_set_user_admin: {
        Args: { _is_admin: boolean; _user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
