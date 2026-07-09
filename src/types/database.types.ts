export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      anniversaries: {
        Row: {
          couple_id: string
          created_at: string
          date: string
          id: string
          label: string
          repeat_yearly: boolean
          track_id: string | null
          type: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          date: string
          id?: string
          label: string
          repeat_yearly?: boolean
          track_id?: string | null
          type: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          date?: string
          id?: string
          label?: string
          repeat_yearly?: boolean
          track_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "anniversaries_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anniversaries_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_members: {
        Row: {
          couple_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          couple_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          couple_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_members_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          created_at: string
          id: string
          invite_code: string | null
          started_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string | null
          started_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string | null
          started_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          all_day: boolean
          couple_id: string
          created_at: string
          ends_at: string | null
          id: string
          owner_id: string
          starts_at: string
          title: string
          title_hidden: boolean
        }
        Insert: {
          all_day?: boolean
          couple_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          owner_id: string
          starts_at: string
          title: string
          title_hidden?: boolean
        }
        Update: {
          all_day?: boolean
          couple_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          owner_id?: string
          starts_at?: string
          title?: string
          title_hidden?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "events_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          track_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          track_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          created_at: string
          height: number | null
          id: string
          storage_path: string
          taken_at: string | null
          track_id: string
          uploader_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          storage_path: string
          taken_at?: string | null
          track_id: string
          uploader_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          storage_path?: string
          taken_at?: string | null
          track_id?: string
          uploader_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          category: string | null
          created_at: string
          id: string
          lat: number | null
          link: string | null
          lng: number | null
          name: string
          naver_id: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          link?: string | null
          lng?: number | null
          name: string
          naver_id?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          link?: string | null
          lng?: number | null
          name?: string
          naver_id?: string | null
        }
        Relationships: []
      }
      playlist_places: {
        Row: {
          added_at: string
          added_by: string
          place_id: string
          playlist_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          place_id: string
          playlist_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          place_id?: string
          playlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_places_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          couple_id: string
          cover_photo_id: string | null
          created_at: string
          created_by: string
          id: string
          kind: string
          name: string
        }
        Insert: {
          couple_id: string
          cover_photo_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          kind?: string
          name: string
        }
        Update: {
          couple_id?: string
          cover_photo_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          kind?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlists_cover_photo_id_fkey"
            columns: ["cover_photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string
          id: string
          nickname: string
          push_token: string | null
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          id: string
          nickname?: string
          push_token?: string | null
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          id?: string
          nickname?: string
          push_token?: string | null
        }
        Relationships: []
      }
      track_places: {
        Row: {
          added_by: string
          done: boolean
          place_id: string
          sort_order: number
          track_id: string
          visit_time: string | null
        }
        Insert: {
          added_by: string
          done?: boolean
          place_id: string
          sort_order?: number
          track_id: string
          visit_time?: string | null
        }
        Update: {
          added_by?: string
          done?: boolean
          place_id?: string
          sort_order?: number
          track_id?: string
          visit_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "track_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_places_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          couple_id: string
          cover_photo_id: string | null
          created_at: string
          created_by: string
          date: string
          duration_min: number | null
          id: string
          liked: boolean
          title: string
        }
        Insert: {
          couple_id: string
          cover_photo_id?: string | null
          created_at?: string
          created_by: string
          date: string
          duration_min?: number | null
          id?: string
          liked?: boolean
          title?: string
        }
        Update: {
          couple_id?: string
          cover_photo_id?: string | null
          created_at?: string
          created_by?: string
          date?: string
          duration_min?: number | null
          id?: string
          liked?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_cover_photo_fk"
            columns: ["cover_photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      events_visible: {
        Row: {
          all_day: boolean | null
          couple_id: string | null
          created_at: string | null
          ends_at: string | null
          id: string | null
          owner_id: string | null
          starts_at: string | null
          title: string | null
          title_hidden: boolean | null
        }
        Insert: {
          all_day?: boolean | null
          couple_id?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string | null
          owner_id?: string | null
          starts_at?: string | null
          title?: never
          title_hidden?: boolean | null
        }
        Update: {
          all_day?: boolean | null
          couple_id?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string | null
          owner_id?: string | null
          starts_at?: string | null
          title?: never
          title_hidden?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "events_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_couple: { Args: { p_invite_code: string }; Returns: string }
      my_couple_id: { Args: never; Returns: string }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

