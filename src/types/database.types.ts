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
          color: string
          couple_id: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          owner_id: string
          starts_at: string
          title: string
        }
        Insert: {
          all_day?: boolean
          color?: string
          couple_id: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          owner_id: string
          starts_at: string
          title: string
        }
        Update: {
          all_day?: boolean
          color?: string
          couple_id?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          owner_id?: string
          starts_at?: string
          title?: string
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
      game_scores: {
        Row: {
          attempts: number
          best_score: number
          couple_id: string
          game_date: string
          game_key: string
          higher_is_better: boolean
          scores: number[]
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          best_score: number
          couple_id: string
          game_date: string
          game_key: string
          higher_is_better: boolean
          scores?: number[]
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          best_score?: number
          couple_id?: string
          game_date?: string
          game_key?: string
          higher_is_better?: boolean
          scores?: number[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_scores_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays_extra: {
        Row: {
          date: string
          name: string
          synced_at: string
        }
        Insert: {
          date: string
          name: string
          synced_at?: string
        }
        Update: {
          date?: string
          name?: string
          synced_at?: string
        }
        Relationships: []
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
          post_id: string | null
          storage_path: string
          story_id: string | null
          taken_at: string | null
          track_id: string | null
          uploader_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          post_id?: string | null
          storage_path: string
          story_id?: string | null
          taken_at?: string | null
          track_id?: string | null
          uploader_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          post_id?: string | null
          storage_path?: string
          story_id?: string | null
          taken_at?: string | null
          track_id?: string | null
          uploader_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
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
          color: string | null
          couple_id: string
          cover_photo_id: string | null
          created_at: string
          created_by: string
          icon: string | null
          id: string
          kind: string
          name: string
        }
        Insert: {
          color?: string | null
          couple_id: string
          cover_photo_id?: string | null
          created_at?: string
          created_by: string
          icon?: string | null
          id?: string
          kind?: string
          name: string
        }
        Update: {
          color?: string | null
          couple_id?: string
          cover_photo_id?: string | null
          created_at?: string
          created_by?: string
          icon?: string | null
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
      post_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          emoji: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          caption: string
          couple_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id: string
          caption?: string
          couple_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          caption?: string
          couple_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
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
      song_pool: {
        Row: {
          apple_url: string
          artist: string
          artwork_url: string
          created_at: string
          id: string
          itunes_id: number
          mood: string | null
          preview_url: string
          seq: number
          title: string
        }
        Insert: {
          apple_url: string
          artist: string
          artwork_url: string
          created_at?: string
          id?: string
          itunes_id: number
          mood?: string | null
          preview_url: string
          seq: number
          title: string
        }
        Update: {
          apple_url?: string
          artist?: string
          artwork_url?: string
          created_at?: string
          id?: string
          itunes_id?: number
          mood?: string | null
          preview_url?: string
          seq?: number
          title?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          author_id: string
          caption: string
          couple_id: string
          created_at: string
          id: string
          overlays: Json
          seen_at: string | null
          track_id: string | null
        }
        Insert: {
          author_id: string
          caption?: string
          couple_id: string
          created_at?: string
          id?: string
          overlays?: Json
          seen_at?: string | null
          track_id?: string | null
        }
        Update: {
          author_id?: string
          caption?: string
          couple_id?: string
          created_at?: string
          id?: string
          overlays?: Json
          seen_at?: string | null
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      story_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          story_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          story_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_reactions: {
        Row: {
          created_at: string
          emoji: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_comments: {
        Row: {
          author_id: string
          body: string
          couple_id: string
          created_at: string
          id: string
          parent_id: string | null
          topic_id: string
        }
        Insert: {
          author_id: string
          body: string
          couple_id: string
          created_at?: string
          id?: string
          parent_id?: string | null
          topic_id: string
        }
        Update: {
          author_id?: string
          body?: string
          couple_id?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_comments_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "topic_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_comments_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_votes: {
        Row: {
          choice: string
          couple_id: string
          created_at: string
          topic_id: string
          user_id: string
        }
        Insert: {
          choice: string
          couple_id: string
          created_at?: string
          topic_id: string
          user_id: string
        }
        Update: {
          choice?: string
          couple_id?: string
          created_at?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_votes_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_votes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          id: string
          options: Json
          question: string
          seq: number
        }
        Insert: {
          created_at?: string
          id?: string
          options: Json
          question: string
          seq: number
        }
        Update: {
          created_at?: string
          id?: string
          options?: Json
          question?: string
          seq?: number
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
          color: string | null
          couple_id: string | null
          created_at: string | null
          description: string | null
          ends_at: string | null
          id: string | null
          owner_id: string | null
          starts_at: string | null
          title: string | null
        }
        Insert: {
          all_day?: boolean | null
          color?: string | null
          couple_id?: string | null
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string | null
          owner_id?: string | null
          starts_at?: string | null
          title?: string | null
        }
        Update: {
          all_day?: boolean | null
          color?: string | null
          couple_id?: string | null
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string | null
          owner_id?: string | null
          starts_at?: string | null
          title?: string | null
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
      has_played: { Args: { p_date: string }; Returns: boolean }
      has_voted: { Args: { p_topic_id: string }; Returns: boolean }
      invoke_daily_release: { Args: never; Returns: undefined }
      invoke_sync_holidays: { Args: never; Returns: undefined }
      my_couple_id: { Args: never; Returns: string }
      partner_voted: { Args: { p_topic_id: string }; Returns: boolean }
      submit_game_round: {
        Args: {
          p_date: string
          p_game_key: string
          p_higher_is_better: boolean
          p_score: number
        }
        Returns: {
          attempts: number
          best_score: number
          couple_id: string
          game_date: string
          game_key: string
          higher_is_better: boolean
          scores: number[]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "game_scores"
          isOneToOne: true
          isSetofReturn: false
        }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
