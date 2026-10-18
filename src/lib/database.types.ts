// Generated from the Supabase project's schema (supabase/migrations). Do not edit by hand:
// after a migration, regenerate it (Supabase MCP `generate_typescript_types`, or
// `npx supabase gen types typescript --project-id iggetuuoghdoyppdlppy`). The generic helper
// types Supabase adds at the end are left out because nothing uses them.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      classes: {
        Row: {
          code_active: boolean
          created_at: string
          id: string
          join_code: string
          mission_target: number
          name: string
          teacher_id: string
        }
        Insert: {
          code_active?: boolean
          created_at?: string
          id?: string
          join_code?: string
          mission_target?: number
          name: string
          teacher_id?: string
        }
        Update: {
          code_active?: boolean
          created_at?: string
          id?: string
          join_code?: string
          mission_target?: number
          name?: string
          teacher_id?: string
        }
        Relationships: []
      }
      content_events: {
        Row: {
          actor_id: string | null
          at: string
          from_status: string | null
          id: number
          item_id: string
          note: string | null
          to_status: string
        }
        Insert: {
          actor_id?: string | null
          at?: string
          from_status?: string | null
          id?: never
          item_id: string
          note?: string | null
          to_status: string
        }
        Update: {
          actor_id?: string | null
          at?: string
          from_status?: string | null
          id?: never
          item_id?: string
          note?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'content_events_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'content_items'
            referencedColumns: ['id']
          },
        ]
      }
      content_items: {
        Row: {
          content_hash: string
          id: string
          kind: string
          lang: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_note: string | null
          status: string
          submitted_by: string | null
        }
        Insert: {
          content_hash: string
          id: string
          kind: string
          lang: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          status?: string
          submitted_by?: string | null
        }
        Update: {
          content_hash?: string
          id?: string
          kind?: string
          lang?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          status?: string
          submitted_by?: string | null
        }
        Relationships: []
      }
      progress: {
        Row: {
          best_score: number
          building_id: string
          completed: boolean
          stars: number
          student_id: string
          updated_at: string
        }
        Insert: {
          best_score: number
          building_id: string
          completed?: boolean
          stars: number
          student_id?: string
          updated_at?: string
        }
        Update: {
          best_score?: number
          building_id?: string
          completed?: boolean
          stars?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'progress_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
        ]
      }
      quiz_attempts: {
        Row: {
          at: string
          building_id: string
          correct: boolean
          id: number
          question_id: string
          student_id: string
        }
        Insert: {
          at?: string
          building_id: string
          correct: boolean
          id?: never
          question_id: string
          student_id?: string
        }
        Update: {
          at?: string
          building_id?: string
          correct?: boolean
          id?: never
          question_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'quiz_attempts_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
        ]
      }
      student_extras: {
        Row: {
          badges: string[]
          cards: string[]
          marigolds: string[]
          pledges: string[]
          student_id: string
        }
        Insert: {
          badges?: string[]
          cards?: string[]
          marigolds?: string[]
          pledges?: string[]
          student_id?: string
        }
        Update: {
          badges?: string[]
          cards?: string[]
          marigolds?: string[]
          pledges?: string[]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'student_extras_student_id_fkey'
            columns: ['student_id']
            isOneToOne: true
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
        ]
      }
      students: {
        Row: {
          avatar: Json
          band: string
          class_id: string
          created_at: string
          first_name: string
          id: string
        }
        Insert: {
          avatar?: Json
          band: string
          class_id: string
          created_at?: string
          first_name: string
          id: string
        }
        Update: {
          avatar?: Json
          band?: string
          class_id?: string
          created_at?: string
          first_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'students_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'class_mission'
            referencedColumns: ['class_id']
          },
          {
            foreignKeyName: 'students_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
        ]
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      class_mission: {
        Row: {
          class_id: string | null
          mission_target: number | null
          total_stars: number | null
        }
        Relationships: []
      }
      class_progress_summary: {
        Row: {
          average_score: number | null
          average_stars: number | null
          building_id: string | null
          class_id: string | null
          completed_count: number | null
        }
        Relationships: []
      }
      class_question_stats: {
        Row: {
          answered: number | null
          building_id: string | null
          class_id: string | null
          question_id: string | null
          wrong: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_class: { Args: { class: string }; Returns: undefined }
      join_class: {
        Args: { avatar?: Json; band: string; code: string; first_name: string }
        Returns: {
          class_id: string
          class_name: string
        }[]
      }
      leave_class: { Args: never; Returns: undefined }
      review_content: {
        Args: { decision: string; item: string; note?: string }
        Returns: undefined
      }
      rotate_join_code: { Args: { class: string }; Returns: string }
      submit_content_for_review: {
        Args: {
          hash: string
          item: string
          item_kind: string
          item_lang: string
        }
        Returns: undefined
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
