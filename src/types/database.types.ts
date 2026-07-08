/**
 * 임시 스텁 — 로컬 Supabase 기동 후 아래 명령으로 재생성한다:
 *   npx supabase gen types typescript --local > src/types/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
    CompositeTypes: Record<string, unknown>;
  };
};
