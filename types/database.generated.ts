Warning: truncated output (original token count: 823335)
... 2244761 bytes omitted ...

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
      _migrations: {
        Row: {
          error_message: string | null
          executed_at: string | null
          filename: string
          id: number
          success: boolean | null
        }
        Insert: {
          error_message?: string | null
          executed_at?: string | null
          filename: string
          id?: number
          success?: boolean | null
        }
        Update: {
          error_message?: string | null
          executed_at?: string | null
          filename?: string
          id?: number
          success?: boolean | null
        }
        Relationships: []
      }
      academic_integrity_violations: {
        Row: {
          action_taken: string | null
          created_at: string
          description: string
          id: string
          incident_date: string
          reported_by: string | null
          status: string | null
          student_record_id: string
          violation_type: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          description: string
          id?: string
          incident_date: string
          reported_by?: string | null
          status?: string | null
          student_record_id: string
          violation_type: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          description?: string
          id?: string
          incident_date?: string
          reported_by?: string | null
          status?: string | null
          student_record_id?: string
          violation_type?: string
        }
        Relationships: []
      }
      access_tokens: {
        Row: {
          apprentice_application_id: string | null
          created_at: string
          expires_at: string
          host_shop_application_id: string | null
          id: string
          max_uses: number
          purpose: string
          token: string
          uses_count: number
        }
        Insert: {
          apprentice_application_id?: string | null
          created_at?: string
          expires_at: string
          host_shop_application_id?: string | null
          id?: string
          max_uses?: number
          purpose: string
          token: string
          uses_count?: number
        }
        Update: {
          apprentice_application_id?: string | null
          created_at?: string
          expires_at?: string
          host_shop_application_id?: string | null
          id?: string
          max_uses?: number
          purpose?: string
          token?: string
          uses_count?: number
        }
        Relationships: []
      }
      accessibility_preferences: {
        Row: {
          color_blind_mode: string | null
          created_at: string | null
          font_size: number | null
          high_contrast: boolean | null
          id: string
          keyboard_navigation: boolean | null
          large_text: boolean | null
          preferences: Json | null
          reduced_motion: boolean | null
          screen_reader: boolean | null
          tts_pitch: string | null
          tts_rate: number | null
          tts_voice: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color_blind_mode?: string | null
          created_at?: string | null
          font_size?: number | null
          high_contrast?: boolean | null
          id?: string
          keyboard_navigation?: boolean | null
          large_text?: boolean | null
          preferences?: Json | null
          reduced_motion?: boolean | null
          screen_reader?: boolean | null
          tts_pitch?: string | null
          tts_rate?: number | null
          tts_voice?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color_blind_mode?: string | null
          created_at?: string | null
          font_size?: number | null
          high_contrast?: boolean | null
          id?: string
          keyboard_navigation?: boolean | null
          large_text?: boolean | null
          preferences?: Json | null
          reduced_motion?: boolean | null
          screen_reader?: boolean | null
          tts_pitch?: string | null
          tts_rate?: number | null
          tts_voice?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      account_deletion_requests: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          notes: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      account_export_events: {
        Row: {
          action: string | null
          created_at: string | null
          details: Json | null
          email: string | null
          format: string | null
          id: string
          ip_address: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          email?: string | null
          format?: string | null
          id?: string
          ip_address?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          email?: string | null
          format?: string | null
          id?: string
          ip_address?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      accreditation_evidence: {
        Row: {
          created_at: string
          document_path: string | null
          evidence_type: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          standard_id: string
          status: string
          submitted_by: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          document_path?: string | null
          evidence_type: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          standard_id: string
          status?: string
          submitted_by?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          document_path?: string | null
          evidence_type?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          standard_id?: string
          status?: string
          submitted_by?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accreditation_evidence_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "accreditation_readiness"
            referencedColumns: ["standard_id"]
          },
          {
            foreignKeyName: "accreditation_evidence_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "accreditation_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      accreditation_records: {
        Row: {
          body: string
          certificate_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          issued_at: string | null
          notes: string | null
          program_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          body: string
          certificate_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          program_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          body?: string
          certificate_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          program_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accreditation_records_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "participant_report"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "accreditation_records_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_catalog_index"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accreditation_records_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_catalog_index"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "accreditation_records_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_integrity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accreditation_records_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accreditation_records_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs_for_holder"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accreditation_records_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "public_program_compliance"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "accreditation_records_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "v_active_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accreditation_records_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "v_published_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      accreditation_reviews: {
        Row: {
          created_at: string
          findings: Json | null
          id: string
          next_review_date: string | null
          notes: string | null
          readiness_score: number | null
          review_date: string
          review_type: string
          reviewer_id: string | null
          reviewer_name: string | null
          standards_complete: number
          standards_total: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          findings?: Json | null
          id?: string
          next_review_date?: string | null
          notes?: string | null
          readiness_score?: number | null
          review_date?: string
          review_type?: string
          reviewer_id?: string | null
          reviewer_name?: string | null
          standards_complete?: number
          standards_total?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          findings?: Json | null
          id?: string
          next_review_date?: string | null
          notes?: string | null
          readiness_score?: number | null
          review_date?: string
          review_type?: string
          reviewer_id?: string | null
          reviewer_name?: string | null
          standards_complete?: number
          standards_total?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      accreditation_standards: {
        Row: {
          admin_link: string | null
          category: string
          created_at: string
          description: string | null
          evidence_types: string[]
          id: string
          name: string
          required: boolean
          sort_order: number
        }
        Insert: {
          admin_link?: string | null
          category: string
          created_at?: string
          description?: string | null
          evidence_types?: string[]
          id?: string
          name: string
          required?: boolean
          sort_order?: number
        }
        Update: {
          admin_link?: string | null
          category?: string
          created_at?: string
          description?: string | null
          evidence_types?: string[]
          id?: string
          name?: string
          required?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      accreditations: {
        Row: {
          apprenticeship: string | null
          created_at: string | null
          description: string | null
          dwd: string | null
          elevateforhumanity: string | null
          gov: string | null
          id: string
          id_number: string | null
          jpg: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          apprenticeship?: string | null
          created_at?: string | null
          description?: string | null
          dwd?: string | null
          elevateforhumanity?: string | null
          gov?: string | null
          id?: string
          id_number?: string | null
          jpg?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          apprenticeship?: string | null
          created_at?: string | null
          description?: string | null
          dwd?: string | null
          elevateforhumanity?: string | null
          gov?: string | null
          id?: string
          id_number?: string | null
          jpg?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      achievements: {
        Row: {
          category: string | null
          code: string | null
          created_at: string | null
          criteria: Json | null
          description: string | null
          earned_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          label: string | null
          name: string
          points: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          code?: string | null
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          earned_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          name: string
          points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          code?: string | null
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          earned_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          name?: string
          points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      activity_feed: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      activity_progress: {
        Row: {
          activity_id: string | null
          attempt_number: number | null
          completed_at: string | null
          id: string
          is_correct: boolean | null
          time_spent_seconds: number | null
          user_answer: Json | null
          user_id: string | null
        }
        Insert: {
          activity_id?: string | null
          attempt_number?: number | null
          completed_at?: string | null
          id?: string
          is_correct?: boolean | null
          time_spent_seconds?: number | null
          user_answer?: Json | null
          user_id?: string | null
        }
        Update: {
          activity_id?: string | null
          attempt_number?: number | null
          completed_at?: string | null
          id?: string
          is_correct?: boolean | null
          time_spent_seconds?: number | null
          user_answer?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_progress_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "practice_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_compliance_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_capabilities"
            referencedColumns: ["user_id"]
          },
        ]
      }
      adaptive_learning_paths: {
        Row: {
          course_id: string | null
          created_at: string | null
          difficulty_level: string | null
          id: string
          learning_style: string | null
          recommended_lessons: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          id?: string
          learning_style?: string | null
          recommended_lessons?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          id?: string
          learning_style?: string | null
          recommended_lessons?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adaptive_learning_paths_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "participant_report"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "adaptive_learning_paths_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "program_catalog_index"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adaptive_learning_paths_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "program_catalog_index"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "adaptive_learning_paths_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "program_integrity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adaptive_learning_paths_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adaptive_learning_paths_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "programs_for_holder"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adaptive_learning_paths_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "public_program_compliance"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "adaptive_learning_paths_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_active_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adaptive_learning_paths_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_published_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      addon_subscriptions: {
        Row: {
          activated_at: string
          active: boolean
          addon_code: string
          canceled_at: string | null
          created_at: string
          id: string
          metadata: Json
          monthly_price: number | null
          organization_id: string
          stripe_subscription_item_id: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string
          active?: boolean
          addon_code: string
          canceled_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          monthly_price?: number | null
          organization_id: string
          stripe_subscription_item_id?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string
          active?: boolean
          addon_code?: string
          canceled_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          monthly_price?: number | null
          organization_id?: string
          stripe_subscription_item_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addon_subscriptions_addon_code_fkey"
            columns: ["addon_code"]
            isOneToOne: false
            referencedRelation: "saas_addon_catalog"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "addon_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_activity_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string | null
          id: string
          ip: unknown
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          apprentice_id: string | null
          created_at: string
          details: Json | null
          escalated_at: string | null
          escalation_level: number
          id: string
          message: string
          metadata: Json
          partner_id: string | null
          progress_entry_id: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          site_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          apprentice_id?: string | null
          created_at?: string
          details?: Json | null
          escalated_at?: string | null
          escalation_level?: number
          id?: string
          message: string
          metadata?: Json
          partner_id?: string | null
          progress_entry_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          site_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          apprentice_id?: string | null
          created_at?: string
          details?: Json | null
          escalated_at?: string | null
          escalation_level?: number
          id?: string
          message?: string
          metadata?: Json
          partner_id?: string | null
          progress_entry_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "admin_compliance_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "user_capabilities"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_checkout_sessions: {
        Row: {
          admin_id: string
          created_at: string | null
          expires_at: string
          id: string
          metadata: Json | null
          used: boolean | null
          used_at: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          metadata?: Json | null
          used?: boolean | null
          used_at?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          metadata?: Json | null
          used?: boolean | null
          used_at?: string | null
        }
        Relationships: []
      }
      admin_priority_queue: {
        Row: {
          compliance_risk: number
          created_at: string
          days_overdue: number
          href: string
          id: string
          item_type: string
          priority_score: number
          reference_id: string
          reference_table: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          revenue_impact: number
          severity: string | null
          title: string
          updated_at: string
          user_blocked: boolean
        }
        Insert: {
          compliance_risk?: number
          created_at?: string
          days_overdue?: number
          href: string
          id?: string
          item_type: string
          priority_score?: number
          reference_id: string
          reference_table: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          revenue_impact?: number
          severity?: string | null
          title: string
          updated_at?: string
          user_blocked?: boolean
        }
        Update: {
          compliance_risk?: number
          created_at?: string
          days_overdue?: number
          href?: string
          id?: string
          item_type?: string
          priority_score?: number
          reference_id?: string
          reference_table?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          revenue_impact?: number
          severity?: string | null
          title?: string
          updated_at?: string
          user_blocked?: boolean
        }
        Relationships: []
      }
      advising_requests: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      affiliate_applications: {
        Row: {
          approved_at: string | null
          audience_size: number | null
          company_name: string | null
          created_at: string | null
          id: string
          marketing_channels: string[] | null
          rejected_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          approved_at?: string | null
          audience_size?: number | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          marketing_channels?: string[] | null
          rejected_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          approved_at?: string | null
          audience_size?: number | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          marketing_channels?: string[] | null
          rejected_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          paid_at: string | null
          payment_details: Json | null
          payment_method: string | null
          period_end: string
          period_start: string
          referral_count: number | null
          status: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          paid_at?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          period_end: string
          period_start: string
          referral_count?: number | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          paid_at?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          period_end?: string
          period_start?: string
          referral_count?: number | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string | null
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      agency_referral_confirmations: {
        Row: {
          completion_date: string | null
          confirmation_method: string
          confirmation_type: string
          confirmed_at: string
          confirmed_by_email: string | null
          confirmed_by_name: string | null
          confirmed_by_phone: string | null
          created_at: string
          employer_name: string | null
          enrollment_date: string | null
          follow_up_completed: boolean
          follow_up_due_date: string | null
          follow_up_required: boolean
          hourly_wage: number | null
          id: string
          job_title: string | null
          notes: string | null
          placement_date: string | null
          recorded_by: string | null
          referral_id: string
          updated_at: string
        }
        Insert: {
          completion_date?: string | null
          confirmation_method?: string
          confirmation_type?: string
          confirmed_at?: string
          confirmed_by_email?: string | null
          confirmed_by_name?: string | null
          confirmed_by_phone?: string | null
          created_at?: string
          employer_name?: string | null
          enrollment_date?: string | null
          follow_up_completed?: boolean
          follow_up_due_date?: string | null
          follow_up_required?: boolean
          hourly_wage?: number | null
          id?: string
          job_title?: string | null
          notes?: string | null
          placement_date?: string | null
          recorded_by?: string | null
          referral_id: string
          updated_at?: string
        }
        Update: {
          completion_date?: string | null
          confirmation_method?: string
          confirmation_type?: string
          confirmed_at?: string
          confirmed_by_email?: string | null
          confirmed_by_name?: string | null
          confirmed_by_phone?: string | null
          created_at?: string
          employer_name?: string | null
          enrollment_date?: string | null
          follow_up_completed?: boolean
          follow_up_due_date?: string | null
          follow_up_required?: boolean
          hourly_wage?: number | null
          id?: string
          job_title?: string | null
          notes?: string | null
          placement_date?: string | null
          recorded_by?: string | null
          referral_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_referral_confirmations_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referral_pipeline_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_referral_confirmations_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "workforce_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_activities: {
        Row: {
          action: string
          agent_id: string
          approved_by: string | null
          duration: number | null
          error: string | null
          id: string
          input: Json | null
          output: Json | null
          requires_approval: boolean | null
          status: string
          timestamp: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          action: string
          agent_id: string
          approved_by?: string | null
          duration?: number | null
          error?: string | null
          id?: string
          input?: Json | null
          output?: Json | null
          requires_approval?: boolean | null
          status?: string
          timestamp?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          agent_id?: string
          approved_by?: string | null
          duration?: number | null
          error?: string | null
          id?: string
          input?: Json | null
          output?: Json | null
          requires_approval?: boolean | null
          status?: string
          timestamp?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_activities_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_knowledge: {
        Row: {
          agent_id: string
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          last_used_at: string | null
          metadata: Json | null
          relevance: number | null
          source: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          relevance?: number | null
          source: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          relevance?: number | null
          source?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_knowledge_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_memories: {
        Row: {
          access_count: number | null
          agent_id: string
          content: Json
          created_at: string | null
          expires_at: string | null
          id: string
          importance: number | null
          type: string
        }
        Insert: {
          access_count?: number | null
          agent_id: string
          content?: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          importance?: number | null
          type: string
        }
        Update: {
          access_count?: number | null
          agent_id?: string
          content?: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          importance?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_memories_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_build_artifacts: {
        Row: {
          artifact_type: string
          authority: string
          blocking_findings: Json
          created_at: string
          id: string
          manifest: Json
          project_id: string
          target_id: string | null
          updated_at: string
          validation_status: string
          warnings: Json
        }
        Insert: {
          artifact_type: string
          authority: string
          blocking_findings?: Json
          created_at?: string
          id?: string
          manifest?: Json
          project_id: string
          target_id?: string | null
          updated_at?: string
          validation_status?: string
          warnings?: Json
        }
        Update: {
          artifact_type?: string
          authority?: string
          blocking_findings?: Json
          created_at?: string
          id?: string
          manifest?: Json
          project_id?: string
          target_id?: string | null
          updated_at?: string
          validation_status?: string
          warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "agentic_build_artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_build_checkpoints: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          label: string
          project_id: string
          run_id: string | null
          snapshot: Json
          target_id: string | null
          target_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
          project_id: string
          run_id?: string | null
          snapshot: Json
          target_id?: string | null
          target_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          project_id?: string
          run_id?: string | null
          snapshot?: Json
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agentic_build_checkpoints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agentic_build_checkpoints_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_build_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          project_id: string
          run_id: string | null
          summary: string
          task_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          project_id: string
          run_id?: string | null
          summary: string
          task_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          project_id?: string
          run_id?: string | null
          summary?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agentic_build_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agentic_build_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agentic_build_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_build_messages: {
        Row: {
          confirmed: boolean
          content: string
          created_at: string
          id: string
          input_mode: string
          locale: string
          metadata: Json
          project_id: string
          role: string
          run_id: string | null
        }
        Insert: {
          confirmed?: boolean
          content: string
          created_at?: string
          id?: string
          input_mode?: string
          locale?: string
          metadata?: Json
          project_id: string
          role: string
          run_id?: string | null
        }
        Update: {
          confirmed?: boolean
          content?: string
          created_at?: string
          id?: string
          input_mode?: string
          locale?: string
          metadata?: Json
          project_id?: string
          role?: string
          run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agentic_build_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agentic_build_messages_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_build_previews: {
        Row: {
          checkpoint_id: string | null
          created_at: string
          environment: string
          expires_at: string | null
          health: Json
          id: string
          project_id: string
          runtime_ref: string | null
          status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          checkpoint_id?: string | null
          created_at?: string
          environment?: string
          expires_at?: string | null
          health?: Json
          id?: string
          project_id: string
          runtime_ref?: string | null
          status?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          checkpoint_id?: string | null
          created_at?: string
          environment?: string
          expires_at?: string | null
          health?: Json
          id?: string
          project_id?: string
          runtime_ref?: string | null
          status?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agentic_build_previews_checkpoint_id_fkey"
            columns: ["checkpoint_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_checkpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agentic_build_previews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_build_projects: {
        Row: {
          approved_plan: Json
          artifact_manifest: Json
          created_at: string
          current_checkpoint_id: string | null
          current_release_id: string | null
          design_system: Json
          id: string
          lifecycle_status: string
          locale: string
          metadata: Json
          original_prompt: string | null
          resume_token_hash: string | null
          source_type: string
          status: string
          subscription_requirements: Json
          target_id: string | null
          target_type: string
          template_version_id: string | null
          tenant_id: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved_plan?: Json
          artifact_manifest?: Json
          created_at?: string
          current_checkpoint_id?: string | null
          current_release_id?: string | null
          design_system?: Json
          id?: string
          lifecycle_status?: string
          locale?: string
          metadata?: Json
          original_prompt?: string | null
          resume_token_hash?: string | null
          source_type?: string
          status?: string
          subscription_requirements?: Json
          target_id?: string | null
          target_type: string
          template_version_id?: string | null
          tenant_id?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved_plan?: Json
          artifact_manifest?: Json
          created_at?: string
          current_checkpoint_id?: string | null
          current_release_id?: string | null
          design_system?: Json
          id?: string
          lifecycle_status?: string
          locale?: string
          metadata?: Json
          original_prompt?: string | null
          resume_token_hash?: string | null
          source_type?: string
          status?: string
          subscription_requirements?: Json
          target_id?: string | null
          target_type?: string
          template_version_id?: string | null
          tenant_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agentic_build_projects_checkpoint_fk"
            columns: ["current_checkpoint_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_checkpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agentic_build_projects_release_fk"
            columns: ["current_release_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agentic_build_projects_template_version_fk"
            columns: ["template_version_id"]
            isOneToOne: false
            referencedRelation: "system_template_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agentic_build_projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_build_releases: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          build_id: string | null
          checkpoint_id: string
          commit_sha: string | null
          created_at: string
          deployment_id: string | null
          environment: string
          health: Json
          id: string
          previous_release_id: string | null
          project_id: string
          published_at: string | null
          release_notes: string
          rolled_back_at: string | null
          status: string
          url: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          build_id?: string | null
          checkpoint_id: string
          commit_sha?: string | null
          created_at?: string
          deployment_id?: string | null
          environment?: string
          health?: Json
          id?: string
          previous_release_id?: string | null
          project_id: string
          published_at?: string | null
          release_notes?: string
          rolled_back_at?: string | null
          status?: string
          url?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          build_id?: string | null
          checkpoint_id?: string
          commit_sha?: string | null
          created_at?: string
          deployment_id?: string | null
          environment?: string
          health?: Json
          id?: string
          previous_release_id?: string | null
          project_id?: string
          published_at?: string | null
          release_notes?: string
          rolled_back_at?: string | null
          status?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agentic_build_releases_checkpoint_id_fkey"
            columns: ["checkpoint_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_checkpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agentic_build_releases_previous_release_id_fkey"
            columns: ["previous_release_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agentic_build_releases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_build_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          credits_used: number
          error: string | null
          failed_at: string | null
          id: string
          plan: Json
          project_id: string
          prompt: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          credits_used?: number
          error?: string | null
          failed_at?: string | null
          id?: string
          plan?: Json
          project_id: string
          prompt: string
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          credits_used?: number
          error?: string | null
          failed_at?: string | null
          id?: string
          plan?: Json
          project_id?: string
          prompt?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agentic_build_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_build_tasks: {
        Row: {
          action: string
          attempt_count: number
          completed_at: string | null
          cost_class: string
          created_at: string
          dependencies: string[]
          error: string | null
          heartbeat_at: string | null
          id: string
          idempotency_key: string | null
          input: Json
          lease_expires_at: string | null
          lease_owner: string | null
          max_attempts: number
          next_attempt_at: string
          output: Json
          requires_approval: boolean
          run_id: string
          started_at: string | null
          status: string
          worker: string
        }
        Insert: {
          action: string
          attempt_count?: number
          completed_at?: string | null
          cost_class?: string
          created_at?: string
          dependencies?: string[]
          error?: string | null
          heartbeat_at?: string | null
          id?: string
          idempotency_key?: string | null
          input?: Json
          lease_expires_at?: string | null
          lease_owner?: string | null
          max_attempts?: number
          next_attempt_at?: string
          output?: Json
          requires_approval?: boolean
          run_id: string
          started_at?: string | null
          status?: string
          worker: string
        }
        Update: {
          action?: string
          attempt_count?: number
          completed_at?: string | null
          cost_class?: string
          created_at?: string
          dependencies?: string[]
          error?: string | null
          heartbeat_at?: string | null
          id?: string
          idempotency_key?: string | null
          input?: Json
          lease_expires_at?: string | null
          lease_owner?: string | null
          max_attempts?: number
          next_attempt_at?: string
          output?: Json
          requires_approval?: boolean
          run_id?: string
          started_at?: string | null
          status?: string
          worker?: string
        }
        Relationships: [
          {
            foreignKeyName: "agentic_build_tasks_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agentic_build_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_acceptances: {
        Row: {
          accepted_at: string
          accepted_email: string
          accepted_ip: string | null
          accepted_name: string
          agreement_key: string
          agreement_version: string
          id: string
          subject_id: string
          subject_type: string
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          accepted_email: string
          accepted_ip?: string | null
          accepted_name: string
          agreement_key: string
          agreement_version: string
          id?: string
          subject_id: string
          subject_type: string
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          accepted_email?: string
          accepted_ip?: string | null
          accepted_name?: string
          agreement_key?: string
          agreement_version?: string
          id?: string
          subject_id?: string
          subject_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      agreement_signatures: {
        Row: {
          created_at: string | null
          document_type: string | null
          id: string
          ip_address: string | null
          signed_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          id?: string
          ip_address?: string | null
          signed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          id?: string
          ip_address?: string | null
          signed_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agreement_versions: {
        Row: {
          agreement_type: string
          created_at: string
          created_by: string | null
          current_version: string
          document_hash: string | null
          document_url: string
          effective_date: string
          expiry_date: string | null
          id: string
          is_current: boolean
          requires_re_acceptance: boolean | null
          summary_of_changes: string | null
          version: string
        }
        Insert: {
          agreement_type: string
          created_at?: string
          created_by?: string | null
          current_version?: string
          document_hash?: string | null
          document_url: string
          effective_date?: string
          expiry_date?: string | null
          id?: string
          is_current?: boolean
          requires_re_acceptance?: boolean | null
          summary_of_changes?: string | null
          version?: string
        }
        Update: {
          agreement_type?: string
          created_at?: string
          created_by?: string | null
          current_version?: string
          document_hash?: string | null
          document_url?: string
          effective_date?: string
          expiry_date?: string | null
          id?: string
          is_current?: boolean
          requires_re_acceptance?: boolean | null
          summary_of_changes?: string | null
          version?: string
        }
        Relationships: []
      }
      agreements: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          required_for: string | null
          tenant_id: string | null
          version: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          required_for?: string | null
          tenant_id?: string | null
          version?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          required_for?: string | null
          tenant_id?: string | null
          version?: string | null
        }
        Relationships: []
      }
      ai_agents: {
        Row: {
          avatar: string | null
          capabilities: Json | null
          clone_of: string | null
          config: Json | null
          created_at: string
          description: string | null
          id: string
          is_clone: boolean | null
          metadata: Json
          metrics: Json | null
          model_hint: string | null
          name: string
          owner_id: string | null
          permissions: Json | null
          role: string
          slug: string
          status: string
          tools: string[] | null
          updated_at: string
          voice_enabled: boolean | null
          voice_type: string | null
        }
        Insert: {
          avatar?: string | null
          capabilities?: Json | null
          clone_of?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_clone?: boolean | null
          metadata?: Json
          metrics?: Json | null
          model_hint?: string | null
          name: string
          owner_id?: string | null
          permissions?: Json | null
          role: string
          slug: string
          status?: string
          tools?: string[] | null
          updated_at?: string
          voice_enabled?: boolean | null
          voice_type?: string | null
        }
        Update: {
          avatar?: string | null
          capabilities?: Json | null
          clone_of?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_clone?: boolean | null
          metadata?: Json
          metrics?: Json | null
          model_hint?: string | null
          name?: string
          owner_id?: string | null
          permissions?: Json | null
          role?: string
          slug?: string
          status?: string
          tools?: string[] | null
          updated_at?: string
          voice_enabled?: boolean | null
          voice_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_clone_of_fkey"
            columns: ["clone_of"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_approvals: {
        Row: {
          approved_by: string | null
          created_at: string
          decided_at: string | null
          id: string
          reason: string | null
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_tags: string[]
          status: string
          task_id: string
          tenant_id: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          reason?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_tags?: string[]
          status?: string
          task_id: string
          tenant_id?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          reason?: string | null
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_tags?: string[]
          status?: string
          task_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_approvals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "ai_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_assistant_conversations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_assistant_messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          role: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          role?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          role?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_chat_context: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_chat_history: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          message: string | null
          name: string | null
          response: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          message?: string | null
          name?: string | null
          response?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          message?: string | null
          name?: string | null
          response?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_chat_interactions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_chat_sessions: {
        Row: {
          created_at: string | null
          host_id: string | null
          id: string
          instructor_id: string | null
          program_slug: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          student_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          host_id?: string | null
          id?: string
          instructor_id?: string | null
          program_slug?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          student_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          host_id?: string | null
          id?: string
          instructor_id?: string | null
          program_slug?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          student_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_code_patterns: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          pattern: string
          pattern_type: string | null
          tenant_id: string | null
          usage_count: number
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          pattern: string
          pattern_type?: string | null
          tenant_id?: string | null
          usage_count?: number
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          pattern?: string
          pattern_type?: string | null
          tenant_id?: string | null
          usage_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      ai_conversation_memory: {
        Row: {
          content: string
          created_at: string
          expires_at: string
          id: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string
          id?: string
          role: string
          session_id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_compliance_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_conversation_memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversation_memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_capabilities"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          session_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_course_generation_log: {
        Row: {
          action: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_deployments: {
        Row: {
          build_id: string | null
          build_log: string | null
          commit_sha: string | null
          completed_at: string | null
          created_at: string
          environment: string
          git_sha: string | null
          health_check: Json | null
          health_status: string | null
          health_url: string | null
          id: string
          log_summary: string | null
          metadata: Json
          service: string
          service_name: string | null
          started_at: string
          status: string
          task_id: string | null
          tenant_id: string | null
          triggered_by: string | null
        }
        Insert: {
          build_id?: string | null
          build_log?: string | null
          commit_sha?: string | null
          completed_at?: string | null
          created_at?: string
          environment?: string
          git_sha?: string | null
          health_check?: Json | null
          health_status?: string | null
          health_url?: string | null
          id?: string
          log_summary?: string | null
          metadata?: Json
          service: string
          service_name?: string | null
          started_at?: string
          status?: string
          task_id?: string | null
          tenant_id?: string | null
          triggered_by?: string | null
        }
        Update: {
          build_id?: string | null
          build_log?: string | null
          commit_sha?: string | null
          completed_at?: string | null
          created_at?: string
          environment?: string
          git_sha?: string | null
          health_check?: Json | null
          health_status?: string | null
          health_url?: string | null
          id?: string
          log_summary?: string | null
          metadata?: Json
          service?: string
          service_name?: string | null
          started_at?: string
          status?: string
          task_id?: string | null
          tenant_id?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      ai_diffs: {
        Row: {
          created_at: string
          diff_content: string
          file_path: string
          id: string
          status: string
          task_id: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          diff_content: string
          file_path: string
          id?: string
          status?: string
          task_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          diff_content?: string
          file_path?: string
          id?: string
          status?: string
          task_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_diffs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "ai_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_eval_baselines: {
        Row: {
          approved_by: string | null
          case_id: string
          created_at: string
          git_sha: string | null
          id: string
          metadata: Json
          quality_score: number
          suite: string
        }
        Insert: {
          approved_by?: string | null
          case_id: string
          created_at?: string
          git_sha?: string | null
          id?: string
          metadata?: Json
          quality_score: number
          suite: string
        }
        Update: {
          approved_by?: string | null
          case_id?: string
          created_at?: string
          git_sha?: string | null
          id?: string
          metadata?: Json
          quality_score?: number
          suite?: string
        }
        Relationships: []
      }
      ai_eval_cases: {
        Row: {
          category: string
          created_at: string
          enabled: boolean
          expected_criteria: Json
          id: string
          suite: string
          updated_at: string
          user_input_prompt: string
        }
        Insert: {
          category: string
          created_at?: string
          enabled?: boolean
          expected_criteria?: Json
          id: string
          suite?: string
          updated_at?: string
          user_input_prompt: string
        }
        Update: {
          category?: string
          created_at?: string
          enabled?: boolean
          expected_criteria?: Json
          id?: string
          suite?: string
          updated_at?: string
          user_input_prompt?: string
        }
        Relationships: []
      }
      ai_eval_results: {
        Row: {
          assertions: Json
          case_id: string
          category: string
          created_at: string
          deterministic_passed: boolean
          error_message: string | null
          id: string
          judge: Json | null
          latency_ms: number | null
          model: string | null
          output_excerpt: string | null
          passed: boolean
          provider: string | null
          quality_score: number | null
          run_id: string
          security_passed: boolean
          workflow_passed: boolean
        }
        Insert: {
          assertions?: Json
          case_id: string
          category: string
          created_at?: string
          deterministic_passed: boolean
          error_message?: string | null
          id?: string
          judge?: Json | null
          latency_ms?: number | null
          model?: string | null
          output_excerpt?: string | null
          passed: boolean
          provider?: string | null
          quality_score?: number | null
          run_id: string
          security_passed?: boolean
          workflow_passed?: boolean
        }
        Update: {
          assertions?: Json
          case_id?: string
          category?: string
          created_at?: string
          deterministic_passed?: boolean
          error_message?: string | null
          id?: string
          judge?: Json | null
          latency_ms?: number | null
          model?: string | null
          output_excerpt?: string | null
          passed?: boolean
          provider?: string | null
          quality_score?: number | null
          run_id?: string
          security_passed?: boolean
          workflow_passed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ai_eval_results_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "ai_eval_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_eval_runs: {
        Row: {
          average_quality_score: number | null
          completed_at: string | null
          failed_cases: number
          git_ref: string | null
          git_sha: string | null
          id: string
          metadata: Json
          model: string | null
          passed_cases: number
          provider: string | null
          quality_threshold: number
          started_at: string
          status: string
          suite: string
          total_cases: number
        }
        Insert: {
          average_quality_score?: number | null
          completed_at?: string | null
          failed_cases?: number
          git_ref?: string | null
          git_sha?: string | null
          id?: string
          metadata?: Json
          model?: string | null
          passed_cases?: number
          provider?: string | null
          quality_threshold?: number
          started_at?: string
          status: string
          suite?: string
          total_cases?: number
        }
        Update: {
          average_quality_score?: number | null
          completed_at?: string | null
          failed_cases?: number
          git_ref?: string | null
          git_sha?: string | null
          id?: string
          metadata?: Json
          model?: string | null
          passed_cases?: number
          provider?: string | null
          quality_threshold?: number
          started_at?: string
          status?: string
          suite?: string
          total_cases?: number
        }
        Relationships: []
      }
      ai_events: {
        Row: {
          actor_id: string | null
          correlation_id: string | null
          created_at: string
          data: Json
          event_type: string
          id: string
          metadata: Json
          source: string
          tenant_id: string | null
        }
        Insert: {
          actor_id?: string | null
          correlation_id?: string | null
          created_at?: string
          data?: Json
          event_type: string
          id?: string
          metadata?: Json
          source: string
          tenant_id?: string | null
        }
        Update: {
          actor_id?: string | null
          correlation_id?: string | null
          created_at?: string
          data?: Json
          event_type?: string
          id?: string
          metadata?: Json
          source?: string
          tenant_id?: string | null
        }
        Relationships: []
      }
      ai_file_snapshots: {
        Row: {
          content: string
          created_at: string
          file_path: string
          id: string
          task_id: string | null
          tenant_id: string | null
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          file_path: string
          id?: string
          task_id?: string | null
          tenant_id?: string | null
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          file_path?: string
          id?: string
          task_id?: string | null
          tenant_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_file_snapshots_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "ai_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_gateway_logs: {
        Row: {
          actor_id: string | null
          agent_type: string
          context: Json
          correlation_id: string | null
          created_at: string
          id: string
          intent: string
          latency_ms: number | null
          message: string
          request_id: string
          response: Json | null
          status: string
          tenant_id: string | null
        }
        Insert: {
          actor_id?: string | null
          agent_type: string
          context?: Json
          correlation_id?: string | null
          created_at?: string
          id?: string
          intent?: string
          latency_ms?: number | null
          message: string
          request_id?: string
          response?: Json | null
          status?: string
          tenant_id?: string | null
        }
        Update: {
          actor_id?: string | null
          agent_type?: string
          context?: Json
          correlation_id?: string | null
          created_at?: string
          id?: string
          intent?: string
          latency_ms?: number | null
          message?: string
          request_id?: string
          response?: Json | null
          status?: string
          tenant_id?: string | null
        }
        Relationships: []
      }
      ai_generated_courses: {
        Row: {
          created_at: string | null
          id: string
          level: string | null
          output: string
          tenant_id: string | null
          topic: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: string | null
          output: string
          tenant_id?: string | null
          topic: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string | null
          output?: string
          tenant_id?: string | null
          topic?: string
        }
        Relationships: []
      }
      ai_generation_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          input_config: Json
          max_retries: number | null
          output_result: Json | null
          priority: number | null
          retry_count: number | null
          started_at: string | null
          status: string
          task_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          input_config?: Json
          max_retries?: number | null
          output_result?: Json | null
          priority?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          task_type: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          input_config?: Json
          max_retries?: number | null
          output_result?: Json | null
          priority?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          task_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_generations: {
        Row: {
          created_at: string | null
          entity_id: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          prompt: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          prompt?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          prompt?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_instructor_assignments: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          instructor_id: string | null
          name: string | null
          program_slug: string | null
          status: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          instructor_id?: string | null
          name?: string | null
          program_slug?: string | null
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          instructor_id?: string | null
          name?: string | null
          program_slug?: string | null
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_instructor_interactions: {
        Row: {
          assistant_response: string | null
          created_at: string | null
          description: string | null
          id: string
          instructor_id: string | null
          instructor_name: string | null
          interaction_type: string | null
          name: string | null
          program_id: string | null
          status: string | null
          timestamp: string | null
          updated_at: string | null
          user_id: string | null
          user_message: string | null
        }
        Insert: {
          assistant_response?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          interaction_type?: string | null
          name?: string | null
          program_id?: string | null
          status?: string | null
          timestamp?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_message?: string | null
        }
        Update: {
          assistant_response?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          interaction_type?: string | null
          name?: string | null
          program_id?: string | null
          status?: string | null
          timestamp?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_message?: string | null
        }
        Relationships: []
      }
      ai_instructor_logs: {
        Row: {
          action: string | null
          created_at: string | null
          details: Json | null
          enrollment_id: string | null
          id: string
          ip_address: string | null
          response: Json | null
          student_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          enrollment_id?: string | null
          id?: string
          ip_address?: string | null
          response?: Json | null
          student_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          enrollment_id?: string | null
          id?: string
          ip_address?: string | null
          response?: Json | null
          student_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_instructors: {
        Row: {
          active: boolean | null
          availability_status: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          name: string
          personality_config: Json | null
          role: string
          role_title: string | null
          specialty: string
          system_prompt: string
        }
        Insert: {
          active?: boolean | null
          availability_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          name: string
          personality_config?: Json | null
          role: string
          role_title?: string | null
          specialty: string
          system_prompt: string
        }
        Update: {
          active?: boolean | null
          availability_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          name?: string
          personality_config?: Json | null
          role?: string
          role_title?: string | null
          specialty?: string
          system_prompt?: string
        }
        Relationships: []
      }
      ai_interview_sessions: {
        Row: {
          assessment_notes: string | null
          assessment_score: number | null
          completed_at: string | null
          created_at: string | null
          current_step: string | null
          id: string
          next_steps: string | null
          recommended_programs: string[] | null
          session_data: Json | null
          session_type: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assessment_notes?: string | null
          assessment_score?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_step?: string | null
          id?: string
          next_steps?: string | null
          recommended_programs?: string[] | null
          session_data?: Json | null
          session_type?: string
          status?: string
   …212152 tokens truncated…on_url?: string | null
          id?: string | null
          image_url?: string | null
          industry_demand?: string | null
          is_active?: boolean | null
          name?: string | null
          organization_id?: string | null
          placement_rate?: number | null
          prerequisites?: string | null
          salary_max?: number | null
          salary_min?: number | null
          slug?: string | null
          soc_code?: string | null
          state_code?: string | null
          title?: string | null
          toolkit_cost?: number | null
          total_cost?: number | null
          training_hours?: number | null
          updated_at?: string | null
          what_you_learn?: string[] | null
          wioa_approved?: boolean | null
        }
        Update: {
          career_outcomes?: Json | null
          category?: string | null
          cip_code?: string | null
          completion_rate?: number | null
          created_at?: string | null
          credential_name?: string | null
          credential_type?: string | null
          credentialing_cost?: number | null
          day_in_life?: string | null
          delivery_method?: string | null
          description?: string | null
          dol_registered?: boolean | null
          duration_weeks?: number | null
          employers?: Json | null
          estimated_hours?: number | null
          estimated_weeks?: number | null
          featured?: boolean | null
          full_description?: string | null
          funding_eligibility?: string[] | null
          funding_pathways?: string[] | null
          funding_tags?: string[] | null
          hero_image_url?: string | null
          icon_url?: string | null
          id?: string | null
          image_url?: string | null
          industry_demand?: string | null
          is_active?: boolean | null
          name?: string | null
          organization_id?: string | null
          placement_rate?: number | null
          prerequisites?: string | null
          salary_max?: number | null
          salary_min?: number | null
          slug?: string | null
          soc_code?: string | null
          state_code?: string | null
          title?: string | null
          toolkit_cost?: number | null
          total_cost?: number | null
          training_hours?: number | null
          updated_at?: string | null
          what_you_learn?: string[] | null
          wioa_approved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_admin_financial_assurance_summary: {
        Row: {
          active_count: number | null
          expired_count: number | null
          expiring_soon_count: number | null
          last_updated: string | null
          total_active_coverage: number | null
          total_records: number | null
        }
        Relationships: []
      }
      v_app_slow_queries: {
        Row: {
          avg_ms: number | null
          cache_hit_pct: number | null
          calls: number | null
          max_ms: number | null
          query_preview: string | null
          queryid: number | null
          rolname: unknown
          total_rows: number | null
          total_sec: number | null
        }
        Relationships: []
      }
      v_applications: {
        Row: {
          case_manager_agency: string | null
          city: string | null
          contact_preference: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          has_case_manager: boolean | null
          id: string | null
          last_name: string | null
          phone: string | null
          program_category: string | null
          program_id: string | null
          program_slug: string | null
          program_title: string | null
          status: string | null
          support_notes: string | null
          zip: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "participant_report"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_catalog_index"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_catalog_index"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_integrity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs_for_holder"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "public_program_compliance"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "v_active_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "v_published_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      v_cdl_enrollment_control: {
        Row: {
          enrollment_id: string | null
          enrollment_status: string | null
          funding_source: string | null
          internal_provider_ref: string | null
          payout_amount: number | null
          payout_due_date: string | null
          payout_paid_date: string | null
          payout_status: string | null
          placed_at: string | null
          placement_employer: string | null
          placement_hourly_wage: number | null
          placement_job_title: string | null
          program_slug: string | null
          provider_notified_at: string | null
          provider_notified_by: string | null
          student_email: string | null
          student_name: string | null
          student_phone: string | null
          training_end_date: string | null
          training_start_date: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_enrollments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_compliance_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "program_enrollments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_enrollments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_capabilities"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_enrolled_not_paid: {
        Row: {
          created_at: string | null
          enrollment_id: string | null
          enrollment_state: string | null
          funding_source: string | null
          program_slug: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          student_id: string | null
          user_id: string | null
          verification_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_enrollments_student_id_profiles_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "admin_compliance_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "program_enrollments_student_id_profiles_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_enrollments_student_id_profiles_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_capabilities"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "program_enrollments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_compliance_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "program_enrollments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_enrollments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_capabilities"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_funding_verification_queue: {
        Row: {
          created_at: string | null
          email: string | null
          enrollment_state: string | null
          first_name: string | null
          flag_id: string | null
          flag_reason: string | null
          flag_type: string | null
          flagged_at: string | null
          funding_source: string | null
          id: string | null
          last_name: string | null
          program_id: string | null
          program_slug: string | null
          program_title: string | null
          sla_days: number | null
          sla_escalated_at: string | null
          sla_priority: number | null
          student_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_program_enrollments_program"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "participant_report"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "fk_program_enrollments_program"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_catalog_index"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_program_enrollments_program"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_catalog_index"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "fk_program_enrollments_program"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program_integrity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_program_enrollments_program"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_program_enrollments_program"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs_for_holder"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_program_enrollments_program"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "public_program_compliance"
            referencedColumns: ["program_id"]
          },
          {
            foreignKeyName: "fk_program_enrollments_program"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "v_active_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_program_enrollments_program"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "v_published_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_enrollments_student_id_profiles_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "admin_compliance_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "program_enrollments_student_id_profiles_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_enrollments_student_id_profiles_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_capabilities"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "program_enrollments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_compliance_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "program_enrollments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_enrollments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_capabilities"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_paid_not_enrolled: {
        Row: {
          amount: number | null
          app_id_resolved: string | null
          app_status: string | null
          application_id: string | null
          email: string | null
          kind: string | null
          paid_at: string | null
          program_slug: string | null
          session_id: string | null
          student_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
      v_payment_integrity_dashboard: {
        Row: {
          amount_paid_cents: number | null
          email: string | null
          enrolled_at: string | null
          enrollment_state: string | null
          flag_id: string | null
          flag_reason: string | null
          flag_type: string | null
          flagged_at: string | null
          funding_source: string | null
          program_slug: string | null
          resolution: string | null
          resolved_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_enrollments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_compliance_status"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "program_enrollments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_enrollments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_capabilities"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_published_programs: {
        Row: {
          career_outcomes: Json | null
          category: string | null
          cip_code: string | null
          completion_rate: number | null
          created_at: string | null
          credential_name: string | null
          credential_type: string | null
          credentialing_cost: number | null
          day_in_life: string | null
          delivery_method: string | null
          description: string | null
          dol_registered: boolean | null
          duration_weeks: number | null
          employers: Json | null
          estimated_hours: number | null
          estimated_weeks: number | null
          featured: boolean | null
          full_description: string | null
          funding_eligibility: string[] | null
          funding_pathways: string[] | null
          funding_tags: string[] | null
          hero_image_url: string | null
          icon_url: string | null
          id: string | null
          image_url: string | null
          industry_demand: string | null
          is_active: boolean | null
          name: string | null
          organization_id: string | null
          placement_rate: number | null
          prerequisites: string | null
          salary_max: number | null
          salary_min: number | null
          slug: string | null
          soc_code: string | null
          state_code: string | null
          title: string | null
          toolkit_cost: number | null
          total_cost: number | null
          training_hours: number | null
          updated_at: string | null
          what_you_learn: string[] | null
          wioa_approved: boolean | null
        }
        Insert: {
          career_outcomes?: Json | null
          category?: string | null
          cip_code?: string | null
          completion_rate?: number | null
          created_at?: string | null
          credential_name?: string | null
          credential_type?: string | null
          credentialing_cost?: number | null
          day_in_life?: string | null
          delivery_method?: string | null
          description?: string | null
          dol_registered?: boolean | null
          duration_weeks?: number | null
          employers?: Json | null
          estimated_hours?: number | null
          estimated_weeks?: number | null
          featured?: boolean | null
          full_description?: string | null
          funding_eligibility?: string[] | null
          funding_pathways?: string[] | null
          funding_tags?: string[] | null
          hero_image_url?: string | null
          icon_url?: string | null
          id?: string | null
          image_url?: string | null
          industry_demand?: string | null
          is_active?: boolean | null
          name?: string | null
          organization_id?: string | null
          placement_rate?: number | null
          prerequisites?: string | null
          salary_max?: number | null
          salary_min?: number | null
          slug?: string | null
          soc_code?: string | null
          state_code?: string | null
          title?: string | null
          toolkit_cost?: number | null
          total_cost?: number | null
          training_hours?: number | null
          updated_at?: string | null
          what_you_learn?: string[] | null
          wioa_approved?: boolean | null
        }
        Update: {
          career_outcomes?: Json | null
          category?: string | null
          cip_code?: string | null
          completion_rate?: number | null
          created_at?: string | null
          credential_name?: string | null
          credential_type?: string | null
          credentialing_cost?: number | null
          day_in_life?: string | null
          delivery_method?: string | null
          description?: string | null
          dol_registered?: boolean | null
          duration_weeks?: number | null
          employers?: Json | null
          estimated_hours?: number | null
          estimated_weeks?: number | null
          featured?: boolean | null
          full_description?: string | null
          funding_eligibility?: string[] | null
          funding_pathways?: string[] | null
          funding_tags?: string[] | null
          hero_image_url?: string | null
          icon_url?: string | null
          id?: string | null
          image_url?: string | null
          industry_demand?: string | null
          is_active?: boolean | null
          name?: string | null
          organization_id?: string | null
          placement_rate?: number | null
          prerequisites?: string | null
          salary_max?: number | null
          salary_min?: number | null
          slug?: string | null
          soc_code?: string | null
          state_code?: string | null
          title?: string | null
          toolkit_cost?: number | null
          total_cost?: number | null
          training_hours?: number | null
          updated_at?: string | null
          what_you_learn?: string[] | null
          wioa_approved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _col_exists: {
        Args: { p_col: string; p_table: unknown }
        Returns: boolean
      }
      _col_is_uuid: {
        Args: { p_col: string; p_table: unknown }
        Returns: boolean
      }
      _col_udt: { Args: { p_col: string; p_table: unknown }; Returns: string }
      _enable_rls: { Args: { tbl: unknown }; Returns: undefined }
      _table_exists: {
        Args: { p_schema: string; p_table: string }
        Returns: boolean
      }
      _tmp_get_triggers: {
        Args: never
        Returns: {
          fname: string
          tname: string
        }[]
      }
      activate_license: {
        Args: { p_paid_through: string; p_tenant_id: string }
        Returns: undefined
      }
      add_organization_course_lesson: {
        Args: { p_content: string; p_course_id: string; p_title: string }
        Returns: {
          activities: Json | null
          activity_type: string
          ai_generated: boolean
          approved: boolean
          bullet_points: Json | null
          competency_checks: Json | null
          compliance_profile_key: string | null
          content: Json | null
          content_json: Json
          course_id: string
          created_at: string
          delivery_method: string | null
          domain_key: string | null
          duration_minutes: number | null
          duration_seconds: number | null
          evidence_type: string | null
          fieldwork_eligible: boolean
          generation_status: string
          generator_prompt: string | null
          hour_category: string | null
          id: string
          instructor_notes: string | null
          instructor_requirement: Json | null
          is_published: boolean
          is_required: boolean
          key_terms: Json | null
          last_generated_at: string | null
          learning_objectives: Json | null
          legacy_curriculum_id: string | null
          legacy_lesson_id: string | null
          lesson_type: Database["public"]["Enums"]["lesson_type"]
          locked: boolean
          media_asset_id: string | null
          media_origin: string
          media_quality_evidence: Json
          media_quality_status: string
          media_verified_at: string | null
          minimum_seat_time_minutes: number | null
          module_id: string
          order_index: number
          org_id: string | null
          partner_exam_code: string | null
          passing_score: number | null
          practical_required: boolean
          previous_version_id: string | null
          published_at: string | null
          published_by: string | null
          quiz_questions: Json | null
          rendered_html: string | null
          required_artifacts: string[] | null
          required_reps: number
          required_skill_id: string | null
          requires_instructor_signoff: boolean
          requires_verification: boolean
          resources: Json
          rubric_id: string | null
          scenario_prompt: string | null
          scene_data: Json | null
          script: string | null
          script_text: string | null
          slug: string
          status: string
          title: string
          unlock_rule: Json | null
          updated_at: string
          version: number
          video_config: Json | null
          video_error: string | null
          video_generated_at: string | null
          video_job_id: string | null
          video_status: string
          video_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "course_lessons"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_approve_progress_entries: {
        Args: { p_approver_id?: string; p_ids: string[] }
        Returns: number
      }
      admin_claim_applications_for_user: {
        Args: { p_email: string; p_user_id: string }
        Returns: number
      }
      admin_inactive_learners: {
        Args: { inactive_days?: number; limit_n?: number }
        Returns: {
          email: string
          enrolled_at: string
          enrollment_id: string
          full_name: string
          last_activity: string
          program_id: string
          program_title: string
          user_id: string
        }[]
      }
      admin_provision_tenant: {
        Args: {
          p_name: string
          p_owner_user_id?: string
          p_plan_name?: string
          p_slug: string
        }
        Returns: Json
      }
      admin_purge_audit_logs_for_users: {
        Args: { user_ids: string[] }
        Returns: number
      }
      admin_revenue_summary: {
        Args: {
          last_month_end: string
          last_month_start: string
          month_start: string
        }
        Returns: {
          all_time_cents: number
          last_month_cents: number
          this_month_cents: number
        }[]
      }
      admin_upsert_push_token: {
        Args: {
          p_device_id: string
          p_platform: string
          p_token: string
          p_user_id: string
        }
        Returns: {
          created_at: string | null
          device_id: string
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "push_tokens"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      advance_application_state:
        | {
            Args: {
              p_application_id: string
              p_data?: Json
              p_next_state: Database["public"]["Enums"]["application_state"]
            }
            Returns: Json
          }
        | {
            Args: {
              p_actor_id?: string
              p_application_id: string
              p_data?: Json
              p_next_state: Database["public"]["Enums"]["application_state"]
              p_reason?: string
            }
            Returns: Json
          }
      advance_enrollment_state: {
        Args: { p_enrollment_id: string; p_target_state: string }
        Returns: Json
      }
      advance_to_next_step: {
        Args: { p_enrollment_id: string }
        Returns: string
      }
      apply_authored_course_experience_upgrade: {
        Args: { p_course_id: string; p_lessons: Json }
        Returns: Json
      }
      apply_stripe_subscription_update: {
        Args: {
          p_current_period_end: string
          p_current_period_start: string
          p_status: string
          p_stripe_customer_id: string
          p_stripe_price_id: string
          p_stripe_subscription_id: string
        }
        Returns: undefined
      }
      approve_and_provision_program_holder: {
        Args: { p_actor_id: string; p_holder_id: string; p_program_id: string }
        Returns: Json
      }
      approve_application_and_grant_access_atomic:
        | {
            Args: {
              p_actor_user_id: string
              p_application_id: string
              p_request_id?: string
            }
            Returns: Json
          }
        | {
            Args: { p_application_id: string; p_request_id?: string }
            Returns: Json
          }
      approve_application_atomic: {
        Args: { p_application_id: string; p_request_id?: string }
        Returns: Json
      }
      approve_barber_practical: {
        Args: { p_instructor_id: string; p_submission_id: string }
        Returns: undefined
      }
      approve_cna_atomic: {
        Args: {
          p_application_id: string
          p_correlation_id?: string
          p_partner_id: string
          p_program_id: string
          p_user_id: string
        }
        Returns: Json
      }
      archive_stale_applications: {
        Args: { p_stale_days?: number }
        Returns: {
          application_ids: string[]
          archived_count: number
        }[]
      }
      audited_mutation: {
        Args: {
          p_audit_action?: string
          p_audit_actor_id?: string
          p_audit_ip?: unknown
          p_audit_metadata?: Json
          p_audit_target_id?: string
          p_audit_target_type?: string
          p_audit_user_agent?: string
          p_conflict_on?: string[]
          p_filter?: Json
          p_operation: string
          p_row_data: Json
          p_table: string
        }
        Returns: Json
      }
      auto_clock_out_if_needed: {
        Args: { p_entry_id: string }
        Returns: {
          clock_out_at: string
          reason: string
          was_clocked_out: boolean
        }[]
      }
      automation_in_cooldown: {
        Args: { p_reference_id: string; p_rule_id: string }
        Returns: boolean
      }
      award_badge_by_key: {
        Args: { p_badge_key: string; p_user_id: string }
        Returns: boolean
      }
      award_gamification_points: {
        Args: {
          p_course_id: string
          p_event_type: string
          p_metadata?: Json
          p_points: number
          p_source_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      calculate_apprentice_progress: {
        Args: { apprentice_id: string }
        Returns: {
          estimated_completion: string
          ojt_percent: number
          overall_percent: number
          rti_percent: number
        }[]
      }
      calculate_apprentice_progress_internal: {
        Args: { apprentice_id: string }
        Returns: {
          estimated_completion: string
          ojt_percent: number
          overall_percent: number
          rti_percent: number
        }[]
      }
      calculate_course_progress: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: number
      }
      calculate_course_progress_internal: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: number
      }
      calculate_distance_meters: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      calculate_payroll: {
        Args: {
          p_apprenticeship_id: string
          p_period_end: string
          p_period_start: string
        }
        Returns: string
      }
      calculate_return_fee: {
        Args: {
          p_1099_count?: number
          p_dependent_count?: number
          p_has_schedule_a?: boolean
          p_has_schedule_c?: boolean
          p_has_schedule_d?: boolean
          p_has_schedule_e?: boolean
          p_has_state?: boolean
          p_is_returning_client?: boolean
          p_office_id: string
          p_w2_count?: number
        }
        Returns: number
      }
      calculate_student_risk_status: {
        Args: { p_student_id: string }
        Returns: Json
      }
      can_access_lesson: {
        Args: { p_lesson_id: string; p_user_id: string }
        Returns: boolean
      }
      can_access_lesson_internal: {
        Args: { p_lesson_id: string; p_user_id: string }
        Returns: boolean
      }
      can_follow_community_member: {
        Args: { p_target: string }
        Returns: boolean
      }
      can_publish_course: { Args: { p_course_id: string }; Returns: boolean }
      can_publish_program: { Args: { p_program_id: string }; Returns: boolean }
      can_read_community_media: { Args: { p_folder: string }; Returns: boolean }
      can_read_community_post: { Args: { p_post_id: string }; Returns: boolean }
      can_start_community_message: {
        Args: { p_recipient: string; p_sender: string }
        Returns: boolean
      }
      can_user_enroll: {
        Args: {
          p_license_key?: string
          p_program_id: string
          p_user_id: string
        }
        Returns: Json
      }
      can_verify_progress_entry: {
        Args: { p_partner_id: string }
        Returns: boolean
      }
      certificate_integrity_hash: {
        Args: { c: Database["public"]["Tables"]["certificates"]["Row"] }
        Returns: string
      }
      check_application_access_readiness: {
        Args: { p_application_id: string }
        Returns: Json
      }
      check_audit_trigger_health: {
        Args: never
        Returns: {
          is_enabled: boolean
          table_name: string
          trigger_name: string
          trigger_type: string
        }[]
      }
      check_can_match_apprentice: {
        Args: { apprentice_id: string; shop_id: string }
        Returns: boolean
      }
      check_completion_eligibility: {
        Args: { enrollment_uuid: string }
        Returns: boolean
      }
      check_course_completion: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: {
          can_complete: boolean
          external_complete: boolean
          internal_complete: boolean
          missing_requirements: string[]
        }[]
      }
      check_enrollment_access: {
        Args: { p_program_slug?: string; p_user_id: string }
        Returns: {
          can_access_milady: boolean
          can_access_portal: boolean
          can_track_hours: boolean
          enrollment_status: string
          message: string
        }[]
      }
      check_enrollment_access_internal: {
        Args: { p_program_slug?: string; p_user_id: string }
        Returns: {
          can_access_milady: boolean
          can_access_portal: boolean
          can_track_hours: boolean
          enrollment_status: string
          message: string
        }[]
      }
      check_enrollment_duplicates: { Args: never; Returns: Json }
      check_license_valid: { Args: { p_license_key: string }; Returns: boolean }
      check_missed_checkins: { Args: never; Returns: undefined }
      check_module_unlock: {
        Args: { p_course_id: string; p_module_id: string; p_user_id: string }
        Returns: boolean
      }
      check_module_unlock_internal: {
        Args: { p_course_id: string; p_module_id: string; p_user_id: string }
        Returns: boolean
      }
      check_onboarding_complete: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_onboarding_complete_internal: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_onboarding_completion: {
        Args: { p_role: string; p_user_id: string }
        Returns: boolean
      }
      check_onboarding_completion_internal: {
        Args: { p_role: string; p_user_id: string }
        Returns: boolean
      }
      check_partner_document_completion: {
        Args: { p_partner_id: string }
        Returns: boolean
      }
      check_program_completion: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: {
          program_enrollment_id: string
          program_id: string
          user_id: string
        }[]
      }
      check_trial_expiration: { Args: never; Returns: undefined }
      check_user_agreements:
        | {
            Args: { p_required_types: string[]; p_user_id: string }
            Returns: {
              agreement_type: string
              is_signed: boolean
              signed_at: string
            }[]
          }
        | { Args: { p_role: string; p_user_id: string }; Returns: boolean }
      claim_agentic_build_task: {
        Args: {
          p_lease_seconds?: number
          p_run_id?: string
          p_worker_id: string
        }
        Returns: {
          action: string
          attempt_count: number
          completed_at: string | null
          cost_class: string
          created_at: string
          dependencies: string[]
          error: string | null
          heartbeat_at: string | null
          id: string
          idempotency_key: string | null
          input: Json
          lease_expires_at: string | null
          lease_owner: string | null
          max_attempts: number
          next_attempt_at: string
          output: Json
          requires_approval: boolean
          run_id: string
          started_at: string | null
          status: string
          worker: string
        }[]
        SetofOptions: {
          from: "*"
          to: "agentic_build_tasks"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_application_by_token: {
        Args: { p_submit_token: string }
        Returns: number
      }
      claim_applications_by_email: {
        Args: { p_email: string }
        Returns: number
      }
      claim_applications_for_current_user: { Args: never; Returns: number }
      claim_devstudio_course_job: {
        Args: { p_worker_id: string }
        Returns: {
          attempts: number
          command: string
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          idempotency_key: string | null
          locked_at: string | null
          locked_by: string | null
          log_lines: Json
          max_attempts: number
          progress: number
          result: Json | null
          run_at: string
          stage: string | null
          started_at: string
          status: string
          tool_args: Json | null
          tool_name: string | null
          updated_at: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "devstudio_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_my_applications: { Args: never; Returns: number }
      claim_platform_events_v1: {
        Args: { p_limit?: number }
        Returns: {
          actor_id: string | null
          actor_type: string | null
          attempts: number
          available_at: string
          category: string
          correlation_id: string | null
          created_at: string | null
          event_type: string
          id: string
          idempotency_key: string | null
          last_error: string | null
          locked_at: string | null
          message: string | null
          payload: Json | null
          processed_at: string | null
          processing_status: string
          resolved: boolean | null
          severity: string
          source: string | null
          subject_id: string | null
          subject_type: string | null
          tenant_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "platform_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_provisioning_jobs: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          completed_at: string | null
          correlation_id: string | null
          created_at: string | null
          description: string | null
          id: string
          job_type: string | null
          last_error: string | null
          max_attempts: number
          name: string | null
          payload: Json | null
          payment_intent_id: string | null
          run_at: string | null
          started_at: string | null
          status: string | null
          stripe_event_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "provisioning_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_video_jobs: {
        Args: {
          p_course_id?: string
          p_lease_seconds?: number
          p_limit: number
        }
        Returns: {
          asset_key: string | null
          asset_kind: string
          audio_url: string | null
          bullet_points: Json | null
          completed_at: string | null
          course_id: string
          created_at: string
          dead_lettered_at: string | null
          duration_seconds: number | null
          error_message: string | null
          failure_class: string | null
          heartbeat_at: string | null
          id: string
          last_failure_at: string | null
          last_provider: string | null
          last_provider_model: string | null
          lease_expires_at: string | null
          lease_token: string | null
          lesson_id: string
          lesson_title: string
          next_retry_at: string | null
          previous_video_url: string | null
          procedure_schema: Json
          provider: string
          provider_job_id: string | null
          quality_evidence: Json
          queued_at: string
          retry_count: number
          review_notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          scene_count: number | null
          scene_data: Json | null
          script: string | null
          started_at: string | null
          status: string
          thumbnail_url: string | null
          updated_at: string
          video_url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "video_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      cleanup_expired_ai_memory: { Args: never; Returns: number }
      cleanup_expired_idempotency_keys: { Args: never; Returns: number }
      complete_enrollment_payment: {
        Args: {
          p_amount_cents?: number
          p_enrollment_id: string
          p_stripe_event_id?: string
          p_stripe_payment_intent_id?: string
          p_stripe_session_id?: string
        }
        Returns: Json
      }
      complete_onboarding_step: {
        Args: { p_role: string; p_user_id: string }
        Returns: undefined
      }
      complete_provisioning_job: {
        Args: { p_error?: string; p_job_id: string; p_success: boolean }
        Returns: boolean
      }
      compute_paid_hours: {
        Args: {
          p_clock_in_at: string
          p_clock_out_at: string
          p_lunch_end_at: string
          p_lunch_start_at: string
        }
        Returns: number
      }
      compute_priority_score: {
        Args: {
          p_compliance_risk: number
          p_days_overdue: number
          p_revenue_impact: number
          p_user_blocked: boolean
        }
        Returns: number
      }
      compute_week_ending: { Args: { p_work_date: string }; Returns: string }
      consume_app_credits: {
        Args: {
          p_app_slug: string
          p_cost: number
          p_operation: string
          p_user_id: string
        }
        Returns: {
          balance: number
          success: boolean
        }[]
      }
      consume_tenant_course_builder_credits: {
        Args: {
          p_app_slug: string
          p_cost: number
          p_idempotency_key: string
          p_metadata?: Json
          p_operation: string
          p_tenant_id: string
          p_user_id: string
        }
        Returns: {
          applied: boolean
          balance: number
          success: boolean
        }[]
      }
      course_is_publishable: { Args: { p_course_id: string }; Returns: boolean }
      create_notification_log: {
        Args: { p_body: string; p_data?: Json; p_title: string; p_type: string }
        Returns: {
          body: string
          created_at: string | null
          data: Json | null
          error_message: string | null
          id: string
          sent_at: string | null
          status: string
          title: string
          type: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "notification_logs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_organization_course: {
        Args: { p_description?: string; p_title: string }
        Returns: {
          audit_notes: string | null
          category: string | null
          compliance_profile_key: string | null
          course_code: string | null
          course_name: string | null
          course_slug: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_hours: number | null
          duration_weeks: number | null
          generation_paused: boolean
          generation_progress: number
          generation_status: string
          generator_prompt: string | null
          governing_body: string | null
          governing_region: string | null
          governing_standard_version: string | null
          id: string
          is_active: boolean
          last_generated_at: string | null
          learning_outcomes: Json | null
          legacy_course_id: string | null
          max_students: number | null
          metadata: Json | null
          module_id: string | null
          org_id: string | null
          passing_score: number | null
          prerequisites: Json | null
          program_id: string | null
          published_at: string | null
          published_by: string | null
          retention_policy_days: number | null
          review_notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          submitted_by: string | null
          submitted_for_review_at: string | null
          thumbnail_url: string | null
          title: string
          total_lessons: number | null
          tuition_cost: number | null
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "courses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_program_holder_id: { Args: never; Returns: string }
      current_tenant_id: { Args: never; Returns: string }
      decrement_license_usage: {
        Args: {
          p_enrollment_id: string
          p_license_id: string
          p_student_id: string
        }
        Returns: undefined
      }
      decrement_slot_booked_count: {
        Args: { slot_id: string }
        Returns: undefined
      }
      decrypt_ssn: {
        Args: { encrypted_ssn: string; encryption_key: string }
        Returns: string
      }
      deprovision_program: {
        Args: { p_actor_id: string; p_assignment_id: string }
        Returns: Json
      }
      devstudio_append_log: {
        Args: { p_job_id: string; p_lines: string[] }
        Returns: undefined
      }
      encrypt_ssn: {
        Args: { encryption_key: string; ssn: string }
        Returns: string
      }
      enqueue_automation_actions: { Args: never; Returns: number }
      enqueue_notification: {
        Args: {
          p_entity_id?: string
          p_entity_type?: string
          p_scheduled_for?: string
          p_template_data?: Json
          p_template_key: string
          p_to_email: string
        }
        Returns: string
      }
      enqueue_platform_event_v1: {
        Args: {
          p_actor_id?: string
          p_category: string
          p_correlation_id?: string
          p_event_type: string
          p_idempotency_key?: string
          p_message?: string
          p_payload?: Json
          p_severity?: string
          p_source: string
          p_subject_id: string
          p_subject_type: string
          p_tenant_id?: string
        }
        Returns: string
      }
      enroll_application:
        | {
            Args: { p_actor_id: string; p_application_id: string }
            Returns: Json
          }
        | {
            Args: {
              p_actor_id: string
              p_application_id: string
              p_source?: string
            }
            Returns: Json
          }
      enrollment_grants_lms_access: {
        Args: { p_enrollment_state: string; p_revoked_at?: string }
        Returns: boolean
      }
      ensure_app_trial_wallet: {
        Args: {
          p_app_slug: string
          p_trial_credits?: number
          p_user_id: string
        }
        Returns: number
      }
      escalate_funding_verification_sla: { Args: never; Returns: number }
      escalate_overdue_funding_verifications: { Args: never; Returns: number }
      evaluate_apprentice_hour_milestones: {
        Args: { p_apprentice_id: string }
        Returns: undefined
      }
      evaluate_exam_eligibility: {
        Args: { p_credential_id: string; p_learner_id: string }
        Returns: {
          domain_key: string
          is_eligible: boolean
          sims_passed: number
          sims_required: number
        }[]
      }
      evaluate_exam_eligibility_internal: {
        Args: { p_credential_id: string; p_learner_id: string }
        Returns: {
          domain_key: string
          is_eligible: boolean
          sims_passed: number
          sims_required: number
        }[]
      }
      evaluate_exam_eligibility_v2: {
        Args: {
          p_credential_id: string
          p_learner_id: string
          p_program_id: string
        }
        Returns: {
          out_blocking_reason: string
          out_domain_key: string
          out_domain_name: string
          out_is_domain_covered: boolean
          out_lessons_completed: number
          out_lessons_required: number
          out_weight_percent: number
        }[]
      }
      evaluate_exam_eligibility_v2_internal: {
        Args: {
          p_credential_id: string
          p_learner_id: string
          p_program_id: string
        }
        Returns: {
          out_blocking_reason: string
          out_domain_key: string
          out_domain_name: string
          out_is_domain_covered: boolean
          out_lessons_completed: number
          out_lessons_required: number
          out_weight_percent: number
        }[]
      }
      evaluate_exam_readiness: {
        Args: { p_program_id: string; p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["exam_readiness_result"]
        SetofOptions: {
          from: "*"
          to: "exam_readiness_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      evaluate_exam_readiness_internal: {
        Args: { p_program_id: string; p_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["exam_readiness_result"]
        SetofOptions: {
          from: "*"
          to: "exam_readiness_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      evaluate_gamification_badges: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      evaluate_host_shop_verification: {
        Args: { p_partner_id: string }
        Returns: boolean
      }
      exec_sql: { Args: { sql: string }; Returns: undefined }
      expire_all_overdue_licenses: { Args: never; Returns: Json }
      expire_license: { Args: { p_tenant_id: string }; Returns: undefined }
      expire_old_licenses: { Args: never; Returns: undefined }
      expire_stale_exam_authorizations: {
        Args: never
        Returns: {
          expired_count: number
          program_summary: Json
        }[]
      }
      export_audit_snapshot: { Args: never; Returns: Json }
      external_modules_complete: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: boolean
      }
      external_modules_summary: {
        Args: { p_course_id: string; p_user_id: string }
        Returns: {
          is_complete: boolean
          pending_modules: Json
          total_approved: number
          total_required: number
        }[]
      }
      find_uuid_references: {
        Args: { target: string }
        Returns: {
          column_name: string
          match_count: number
          schema_name: string
          table_name: string
        }[]
      }
      format_script_to_html:
        | { Args: { input: string }; Returns: string }
        | { Args: { input: string; p_title?: string }; Returns: string }
      generate_certificate_number: { Args: never; Returns: string }
      generate_enrollment_steps: {
        Args: { p_enrollment_id: string }
        Returns: number
      }
      generate_notification_token: {
        Args: {
          p_email?: string
          p_expires_days?: number
          p_max_uses?: number
          p_metadata?: Json
          p_purpose: string
          p_target_url: string
          p_user_id?: string
        }
        Returns: string
      }
      generate_program_holder_end_date_alerts: { Args: never; Returns: number }
      generate_student_number: { Args: never; Returns: string }
      get_accreditation_readiness_summary: {
        Args: never
        Returns: {
          last_review_date: string
          readiness_score: number
          total_complete: number
          total_missing: number
          total_pending: number
          total_required: number
        }[]
      }
      get_active_license: {
        Args: { p_tenant_id: string }
        Returns: {
          expires_at: string
          features: Json
          id: string
          max_users: number
          paid_through: string
          plan_type: string
          status: string
          tenant_id: string
        }[]
      }
      get_active_license_internal: {
        Args: { p_tenant_id: string }
        Returns: {
          expires_at: string
          features: Json
          id: string
          max_users: number
          paid_through: string
          plan_type: string
          status: string
          tenant_id: string
        }[]
      }
      get_application_state: {
        Args: { p_application_id: string }
        Returns: Json
      }
      get_community_member: {
        Args: { p_member_id: string }
        Returns: {
          avatar_url: string
          community_allow_follow: boolean
          community_allow_messages: boolean
          community_show_role: boolean
          community_visible: boolean
          full_name: string
          id: string
          role: string
        }[]
      }
      get_community_members: {
        Args: { p_search?: string }
        Returns: {
          avatar_url: string
          community_allow_follow: boolean
          community_allow_messages: boolean
          community_show_role: boolean
          full_name: string
          id: string
          role: string
        }[]
      }
      get_course_asset_path: {
        Args: { asset_type: string; course_slug: string; filename: string }
        Returns: string
      }
      get_current_step: {
        Args: { p_enrollment_id: string }
        Returns: {
          provider_id: string
          provider_name: string
          sequence_order: number
          started_at: string
          status: string
          step_id: string
        }[]
      }
      get_current_tenant_id: { Args: never; Returns: string }
      get_enrollment_next_action: {
        Args: { enrollment_id: string }
        Returns: {
          action_description: string
          action_href: string
          action_label: string
        }[]
      }
      get_impact_summary: { Args: never; Returns: Json }
      get_inactive_learners: {
        Args: { days_inactive?: number }
        Returns: {
          email: string
          full_name: string
          inactive_days: number
          last_active_at: string
          student_id: string
        }[]
      }
      get_latest_published_version: {
        Args: { p_course_id: string }
        Returns: {
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          label: string | null
          org_id: string | null
          published_at: string | null
          snapshot: Json | null
          version: number | null
          version_number: number
        }
        SetofOptions: {
          from: "*"
          to: "course_versions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_my_course_readiness: {
        Args: { p_course_id: string }
        Returns: {
          attempt_count: number
          domain_key: string
          last_attempt_at: string
          latest_score: number
          passed: boolean
          passing_score: number
        }[]
      }
      get_my_organization_ids: { Args: never; Returns: string[] }
      get_my_role: { Args: never; Returns: string }
      get_next_required_action: {
        Args: { p_enrollment_id: string }
        Returns: string
      }
      get_open_badges_signing_key: { Args: never; Returns: string }
      get_org_invite_by_token: {
        Args: { p_token: string }
        Returns: {
          accepted_at: string
          email: string
          expires_at: string
          id: string
          inviter_name: string
          organization_id: string
          organization_name: string
          role: string
        }[]
      }
      get_partner_license_info: {
        Args: { p_partner_id: string }
        Returns: {
          can_create_courses: boolean
          can_upload_scorm: boolean
          current_enrollments: number
          expires_at: string
          license_key: string
          license_type: string
          lms_model: string
          max_enrollments: number
          status: string
        }[]
      }
      get_platform_owner_tenant_id: { Args: never; Returns: string }
      get_platform_secret: { Args: { p_key: string }; Returns: string }
      get_public_microcourse_catalog: {
        Args: never
        Returns: {
          category: string
          currency: string
          description: string
          duration_hours: number
          id: string
          is_free: boolean
          provider_display_name: string
          provider_enrollment_url: string
          retail_price_cents: number
          slug: string
          title: string
        }[]
      }
      get_revenue_all_time: { Args: never; Returns: number }
      get_revenue_last_month: { Args: never; Returns: number }
      get_revenue_this_month: { Args: never; Returns: number }
      get_student_dashboard: { Args: never; Returns: Json }
      get_syllabus_url: {
        Args: { p_bucket: string; p_path: string }
        Returns: string
      }
      get_table_columns:
        | {
            Args: { p_table_name: string }
            Returns: {
              column_default: string
              column_name: string
              data_type: string
              is_nullable: string
            }[]
          }
        | { Args: { p_tables: string[] }; Returns: Json }
      get_table_indexes: { Args: { p_tables: string[] }; Returns: Json }
      get_table_policies: { Args: { p_tables: string[] }; Returns: Json }
      get_tax_appointment_stats: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          cancelled_appointments: number
          completed_appointments: number
          confirmed_appointments: number
          in_person_count: number
          pending_appointments: number
          total_appointments: number
          virtual_count: number
        }[]
      }
      get_tax_document_stats: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          reviewed_count: number
          total_size_mb: number
          total_uploads: number
          unique_users: number
          uploaded_count: number
        }[]
      }
      get_tenant_by_domain: {
        Args: { p_domain: string }
        Returns: {
          license_status: string
          organization_id: string
          organization_name: string
        }[]
      }
      get_user_document_requirement_rules: {
        Args: { p_enrollment_id?: string; p_user_id: string }
        Returns: {
          accepted_formats: string[]
          completed_at: string
          description: string
          due_date: string
          enrollment_id: string
          evidence_url: string
          id: string
          max_file_size: number
          policy_configured: boolean
          priority: string
          requirement_type: string
          status: string
          title: string
        }[]
      }
      get_user_document_requirements: {
        Args: { p_user_id: string }
        Returns: {
          description: string
          document_type: string
          has_uploaded: boolean
          instructions: string
          is_required: boolean
          upload_status: string
        }[]
      }
      get_user_id_by_email: {
        Args: { user_email: string }
        Returns: {
          email: string
          id: string
        }[]
      }
      get_user_tenant_id: { Args: never; Returns: string }
      get_view_def: { Args: { p_view: string }; Returns: string }
      get_weekly_hours: {
        Args: { p_apprentice_id: string; p_week_ending: string }
        Returns: number
      }
      grant_tenant_course_builder_credits: {
        Args: {
          p_app_slug: string
          p_credits: number
          p_idempotency_key: string
          p_metadata?: Json
          p_operation: string
          p_period_end?: string
          p_period_start?: string
          p_tenant_id: string
        }
        Returns: {
          applied: boolean
          balance: number
        }[]
      }
      has_passed_checkpoint: {
        Args: { p_module_id: string; p_user_id: string }
        Returns: boolean
      }
      hash_ssn: { Args: { ssn: string }; Returns: string }
      heartbeat_agentic_build_task: {
        Args: {
          p_lease_seconds?: number
          p_task_id: string
          p_worker_id: string
        }
        Returns: boolean
      }
      heartbeat_video_job: {
        Args: {
          p_job_id: string
          p_lease_seconds?: number
          p_lease_token: string
        }
        Returns: boolean
      }
      html_escape: { Args: { input: string }; Returns: string }
      increment_agentic_run_credits: {
        Args: { p_credits: number; p_run_id: string }
        Returns: number
      }
      increment_license_usage: {
        Args: {
          p_enrollment_id: string
          p_license_id: string
          p_student_id: string
        }
        Returns: undefined
      }
      increment_search_count: {
        Args: { search_query: string }
        Returns: undefined
      }
      increment_slot_booked_count: {
        Args: { slot_id: string }
        Returns: undefined
      }
      initiate_enrollment_payment: {
        Args: {
          p_amount_cents: number
          p_enrollment_id: string
          p_payment_mode: string
        }
        Returns: Json
      }
      intake_rate_check: {
        Args: {
          p_ip: unknown
          p_max_submissions?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_role: { Args: never; Returns: boolean }
      is_conversation_participant: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      is_enrollment_complete: {
        Args: { p_enrollment_id: string }
        Returns: boolean
      }
      is_ferpa_training_current: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_financially_cleared: {
        Args: { p_application_id: string }
        Returns: boolean
      }
      is_instructor: { Args: never; Returns: boolean }
      is_license_active: { Args: { p_tenant_id: string }; Returns: boolean }
      is_onboarding_complete: { Args: { p_user_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_platform_operator: { Args: never; Returns: boolean }
      is_platform_owner_tenant: {
        Args: { p_tenant_id: string }
        Returns: boolean
      }
      is_platform_owner_user: { Args: never; Returns: boolean }
      is_program_completion_eligible: {
        Args: { p_program_id: string; p_user_id: string }
        Returns: boolean
      }
      is_program_completion_eligible_internal: {
        Args: { p_program_id: string; p_user_id: string }
        Returns: boolean
      }
      is_shop_staff: { Args: { _shop_id: string }; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_tax_preparer: { Args: never; Returns: boolean }
      is_within_geofence: {
        Args: { p_lat: number; p_lng: number; p_site_id: string }
        Returns: boolean
      }
      issue_program_completion_certificate_if_eligible: {
        Args: { p_program_id: string; p_user_id: string }
        Returns: boolean
      }
      log_admin_access: {
        Args: {
          p_action: string
          p_reason?: string
          p_table_accessed: string
          p_target_tenant_id: string
        }
        Returns: undefined
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_actor_user_id: string
          p_details?: Json
          p_entity_id: string
          p_entity_type: string
        }
        Returns: undefined
      }
      log_ferpa_access: {
        Args: {
          access_type_param: string
          accessed_by_param: string
          legitimate_interest_param: string
          resource_id_param: string
          resource_type_param: string
          student_id_param: string
        }
        Returns: string
      }
      log_tax_audit_event: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_event_description: string
          p_event_type: string
          p_new_values?: Json
          p_old_values?: Json
        }
        Returns: string
      }
      lookup_stripe_enrollment_map: {
        Args: { p_price_id?: string; p_product_id?: string }
        Returns: {
          auto_enroll: boolean
          enrollment_type: string
          funding_source: string
          is_deposit: boolean
          is_free_enrollment: boolean
          program_id: string
          program_slug: string
          send_welcome_email: boolean
        }[]
      }
      mark_community_messages_read: {
        Args: { p_other_user: string }
        Returns: number
      }
      mark_program_completed: {
        Args: { p_program_enrollment_id: string }
        Returns: undefined
      }
      mark_step_complete: {
        Args: { p_external_enrollment_id?: string; p_step_id: string }
        Returns: string
      }
      match_lessons: {
        Args: {
          filter_course_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          course_id: string
          lesson_id: string
          similarity: number
          source_text: string
        }[]
      }
      my_tenant_id: { Args: never; Returns: string }
      next_module_is_unlocked: {
        Args: { p_course_id: string; p_module_order: number; p_user_id: string }
        Returns: boolean
      }
      portal_data_integrity_report: {
        Args: never
        Returns: {
          check_name: string
          details: Json
          issue_count: number
          ok: boolean
        }[]
      }
      privileged_mfa_posture: {
        Args: never
        Returns: {
          privileged_users: number
          users_with_verified_mfa: number
          users_without_verified_mfa: number
          verified_phone_factors: number
          verified_totp_factors: number
        }[]
      }
      promote_to_course_lessons: {
        Args: { p_program_slug: string }
        Returns: {
          action: string
          lesson_slug: string
        }[]
      }
      promote_to_super_admin: { Args: { user_email: string }; Returns: string }
      provision_additional_program: {
        Args: { p_actor_id: string; p_holder_id: string; p_program_id: string }
        Returns: Json
      }
      provision_program_holder_employer_workspaces: {
        Args: never
        Returns: undefined
      }
      provision_tenant_trial: {
        Args: { p_name: string; p_slug: string }
        Returns: Json
      }
      publish_course: {
        Args: { p_course_id: string }
        Returns: {
          audit_notes: string | null
          category: string | null
          compliance_profile_key: string | null
          course_code: string | null
          course_name: string | null
          course_slug: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_hours: number | null
          duration_weeks: number | null
          generation_paused: boolean
          generation_progress: number
          generation_status: string
          generator_prompt: string | null
          governing_body: string | null
          governing_region: string | null
          governing_standard_version: string | null
          id: string
          is_active: boolean
          last_generated_at: string | null
          learning_outcomes: Json | null
          legacy_course_id: string | null
          max_students: number | null
          metadata: Json | null
          module_id: string | null
          org_id: string | null
          passing_score: number | null
          prerequisites: Json | null
          program_id: string | null
          published_at: string | null
          published_by: string | null
          retention_policy_days: number | null
          review_notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          submitted_by: string | null
          submitted_for_review_at: string | null
          thumbnail_url: string | null
          title: string
          total_lessons: number | null
          tuition_cost: number | null
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "courses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_course_from_staging: {
        Args: { p_course_id: string; p_program_id?: string }
        Returns: Json
      }
      publish_course_package_atomic: {
        Args: {
          p_course_slug: string
          p_course_title: string
          p_mode: string
          p_modules: Json
          p_program_id: string
        }
        Returns: Json
      }
      publish_organization_course: {
        Args: { p_course_id: string }
        Returns: {
          audit_notes: string | null
          category: string | null
          compliance_profile_key: string | null
          course_code: string | null
          course_name: string | null
          course_slug: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_hours: number | null
          duration_weeks: number | null
          generation_paused: boolean
          generation_progress: number
          generation_status: string
          generator_prompt: string | null
          governing_body: string | null
          governing_region: string | null
          governing_standard_version: string | null
          id: string
          is_active: boolean
          last_generated_at: string | null
          learning_outcomes: Json | null
          legacy_course_id: string | null
          max_students: number | null
          metadata: Json | null
          module_id: string | null
          org_id: string | null
          passing_score: number | null
          prerequisites: Json | null
          program_id: string | null
          published_at: string | null
          published_by: string | null
          retention_policy_days: number | null
          review_notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          submitted_by: string | null
          submitted_for_review_at: string | null
          thumbnail_url: string | null
          title: string
          total_lessons: number | null
          tuition_cost: number | null
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "courses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_program: { Args: { p_program_id: string }; Returns: undefined }
      query_json: { Args: { sql: string }; Returns: Json }
      queue_due_theory_schedule_notifications: {
        Args: { p_now?: string }
        Returns: number
      }
      raise_admin_alert: {
        Args: {
          p_apprentice_id: string
          p_message: string
          p_metadata?: Json
          p_partner_id: string
          p_progress_entry_id: string
          p_severity: string
          p_site_id: string
          p_type: string
        }
        Returns: undefined
      }
      reauthorize_exam_if_ready: {
        Args: { p_program_id: string; p_staff_id?: string; p_user_id: string }
        Returns: {
          authorization_id: string
          reason: string
          success: boolean
        }[]
      }
      recommend_certifying_body: {
        Args: { p_context: string; p_exam_type?: string }
        Returns: string
      }
      record_application_state_event: {
        Args: {
          p_actor_id?: string
          p_application_id: string
          p_application_type?: string
          p_from_state: Database["public"]["Enums"]["application_state"]
          p_metadata?: Json
          p_reason?: string
          p_to_state: Database["public"]["Enums"]["application_state"]
        }
        Returns: string
      }
      record_checkpoint_attempt: {
        Args: {
          p_answers?: Json
          p_course_id: string
          p_lesson_id: string
          p_module_order: number
          p_passing_score?: number
          p_score: number
        }
        Returns: Json
      }
      record_course_automated_approval: {
        Args: {
          p_course_id: string
          p_evidence: Json
          p_gate_version: string
          p_initiated_by?: string
        }
        Returns: string
      }
      record_course_production_stage: {
        Args: {
          p_course_id: string
          p_error?: string
          p_evidence?: Json
          p_job_id: string
          p_run_state: string
          p_worker_kind: string
          p_worker_status: string
        }
        Returns: string
      }
      record_platform_usage_v1: {
        Args: {
          p_actor_id?: string
          p_external_ref?: string
          p_idempotency_key: string
          p_metadata?: Json
          p_metric: string
          p_occurred_at?: string
          p_quantity: number
          p_source: string
          p_tenant_id: string
          p_unit: string
        }
        Returns: string
      }
      refresh_admin_priority_queue: { Args: never; Returns: undefined }
      refresh_governed_employer_candidate_referrals: {
        Args: never
        Returns: undefined
      }
      refund_tenant_course_builder_credits: {
        Args: {
          p_app_slug: string
          p_credits: number
          p_idempotency_key: string
          p_metadata?: Json
          p_operation: string
          p_tenant_id: string
          p_user_id: string
        }
        Returns: {
          applied: boolean
          balance: number
        }[]
      }
      respond_host_shop_match_request: {
        Args: {
          p_request_id: string
          p_responder_id: string
          p_shop_notes?: string
          p_status: string
        }
        Returns: Json
      }
      retry_dead_letter_job: {
        Args: { p_admin_user_id: string; p_job_id: string }
        Returns: boolean
      }
      review_document_with_audit: {
        Args: {
          p_action: string
          p_actor_id: string
          p_document_id: string
          p_rejection_reason?: string
        }
        Returns: Json
      }
      revoke_application_access_atomic:
        | {
            Args: {
              p_actor_user_id: string
              p_application_id: string
              p_request_id?: string
            }
            Returns: Json
          }
        | {
            Args: { p_application_id: string; p_request_id?: string }
            Returns: Json
          }
      rls_test_report: {
        Args: never
        Returns: {
          detail: string
          passed: boolean
          test_name: string
        }[]
      }
      rls_two_tenant_test: {
        Args: never
        Returns: {
          detail: string
          passed: boolean
          test_name: string
        }[]
      }
      rpc_approve_partner: {
        Args: {
          p_admin_user_id: string
          p_idempotency_key: string
          p_partner_application_id: string
          p_partner_email: string
          p_program_ids: string[]
        }
        Returns: Json
      }
      rpc_enroll_student: {
        Args: {
          p_idempotency_key: string
          p_metadata?: Json
          p_program_id: string
          p_source?: string
          p_user_id: string
        }
        Returns: Json
      }
      rpc_link_partner_user: {
        Args: {
          p_auth_user_id: string
          p_email: string
          p_idempotency_key: string
          p_partner_id: string
        }
        Returns: Json
      }
      same_community_tenant: {
        Args: { p_other_user: string }
        Returns: boolean
      }
      schema_inspect: {
        Args: { p_table: string }
        Returns: {
          column_default: string
          column_name: string
          data_type: string
          is_nullable: string
        }[]
      }
      search_course_embeddings: {
        Args: {
          p_content_types?: string[]
          p_course_id?: string
          p_limit?: number
          p_threshold?: number
          query_embedding: string
        }
        Returns: {
          content_type: string
          course_id: string
          id: string
          lesson_id: string
          metadata: Json
          similarity: number
          source_text: string
        }[]
      }
      search_platform_knowledge: {
        Args: {
          filter_type?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
          source_path: string
          source_type: string
          title: string
        }[]
      }
      set_audit_context: {
        Args: {
          actor_user_id?: string
          request_id?: string
          system_actor?: string
        }
        Returns: undefined
      }
      set_platform_secret: {
        Args: {
          p_category?: string
          p_description?: string
          p_key: string
          p_value: string
        }
        Returns: undefined
      }
      sfc_get_status: {
        Args: { p_tracking_id: string }
        Returns: {
          created_at: string
          efile_submission_id: string
          last_error: string
          status: string
          tracking_id: string
          updated_at: string
        }[]
      }
      sim_readiness_score: {
        Args: { p_credential_id: string; p_learner_id: string }
        Returns: Json
      }
      sim_readiness_score_internal: {
        Args: { p_credential_id: string; p_learner_id: string }
        Returns: Json
      }
      snapshot_course_version: {
        Args: { p_course_id: string; p_created_by?: string; p_label?: string }
        Returns: {
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          label: string | null
          org_id: string | null
          published_at: string | null
          snapshot: Json | null
          version: number | null
          version_number: number
        }
        SetofOptions: {
          from: "*"
          to: "course_versions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_application: {
        Args: {
          p_email?: string
          p_first_name?: string
          p_last_name?: string
          p_phone?: string
          p_user_id?: string
        }
        Returns: Json
      }
      submit_application: {
        Args: { p_agree_terms?: boolean; p_application_id: string }
        Returns: Json
      }
      submit_program_holder_application: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_number_of_students?: string
          p_organization_name: string
          p_organization_type?: string
          p_partnership_goals?: string
          p_phone: string
          p_programs_offered?: string
          p_reference_number?: string
          p_support_notes?: string
          p_user_id: string
          p_website?: string
        }
        Returns: Json
      }
      sum_training_hours: { Args: never; Returns: number }
      suspend_license: {
        Args: { p_reason?: string; p_tenant_id: string }
        Returns: undefined
      }
      sync_barber_wage_obligation: {
        Args: { p_enrollment_id: string }
        Returns: undefined
      }
      update_enrollment_progress_manual: {
        Args: { p_course_id: string; p_progress: number; p_user_id: string }
        Returns: undefined
      }
      update_geofence_state: {
        Args: { p_entry_id: string; p_lat: number; p_lng: number }
        Returns: {
          auto_clocked_out: boolean
          clock_out_at: string
          outside_since: string
          within_geofence: boolean
        }[]
      }
      upsert_license_from_stripe: {
        Args: {
          p_current_period_end?: string
          p_current_period_start?: string
          p_plan_name: string
          p_status: string
          p_stripe_customer_id: string
          p_stripe_price_id: string
          p_stripe_subscription_id: string
          p_tenant_id: string
        }
        Returns: undefined
      }
      upsert_push_token: {
        Args: { p_device_id: string; p_platform: string; p_token: string }
        Returns: {
          created_at: string | null
          device_id: string
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "push_tokens"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_store_subscription: {
        Args: {
          p_cancel_at_period_end: boolean
          p_canceled_at?: string
          p_current_period_end: string
          p_current_period_start: string
          p_ended_at?: string
          p_metadata?: Json
          p_status: string
          p_stripe_customer_id: string
          p_stripe_price_id: string
          p_stripe_subscription_id: string
          p_trial_end?: string
          p_trial_start?: string
          p_user_id: string
        }
        Returns: Json
      }
      upsert_stripe_session: {
        Args: {
          _amount: number
          _application_id: string
          _created_at: string
          _currency: string
          _email: string
          _kind: string
          _payment_intent: string
          _program_slug: string
          _raw: Json
          _session_id: string
          _student_id: string
          _user_id: string
        }
        Returns: undefined
      }
      use_notification_token: {
        Args: { p_token: string }
        Returns: {
          email: string
          metadata: Json
          purpose: string
          target_url: string
          user_id: string
          valid: boolean
        }[]
      }
      validate_application_state_transition: {
        Args: {
          current_state: Database["public"]["Enums"]["application_state"]
          next_state: Database["public"]["Enums"]["application_state"]
        }
        Returns: boolean
      }
      verify_apprenticeship_rti_entry: {
        Args: {
          p_decision: string
          p_entry_id: string
          p_minutes_verified: number
          p_notes?: string
        }
        Returns: {
          course_id: string | null
          created_at: string
          delivery_method: string
          enrollment_id: string
          evidence_notes: string | null
          evidence_url: string | null
          id: string
          instruction_date: string
          instructor_user_id: string | null
          lesson_id: string | null
          minutes_claimed: number
          minutes_verified: number | null
          rejection_reason: string | null
          requirement_id: string
          standard_key: string
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "apprenticeship_rti_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verify_audit_integrity: { Args: never; Returns: Json }
      verify_certificate_integrity: {
        Args: { p_certificate_number: string }
        Returns: Json
      }
      verify_enrollment_complete: {
        Args: { p_user_id: string }
        Returns: {
          requirement: string
          status: string
          verified: boolean
        }[]
      }
      verify_enrollment_complete_internal: {
        Args: { p_user_id: string }
        Returns: {
          requirement: string
          status: string
          verified: boolean
        }[]
      }
      wioa_participants_for_quarter: {
        Args: { quarter_end: string; quarter_start: string }
        Returns: {
          annual_salary: number
          credential_attained: boolean
          credential_issued_at: string
          credential_name: string
          date_of_birth: string
          disability_status: boolean
          education_level_at_entry: string
          employed_q2_after_exit: boolean
          employed_q4_after_exit: boolean
          employer_name: string
          employment_date: string
          employment_status_at_entry: string
          enrollment_date: string
          exit_date: string
          first_name: string
          funding_source: string
          gender: string
          hourly_wage: number
          job_title: string
          last_name: string
          measurable_skill_gain: boolean
          median_earnings_q2: number
          participant_id: string
          race_ethnicity: string
          ssn_last4: string
          user_id: string
          veteran_status: boolean
          zip_code: string
        }[]
      }
      wioa_summary_metrics: {
        Args: {
          p_end_date?: string
          p_funding?: string
          p_program_id?: string
          p_start_date?: string
        }
        Returns: {
          active_enrollments: number
          avg_hourly_wage: number
          completed: number
          credentials_issued: number
          employer_sponsored: number
          exited: number
          job_placements: number
          self_pay: number
          total_participants: number
          wioa_funded: number
          wrg_funded: number
        }[]
      }
      wioa_summary_metrics_internal: {
        Args: {
          p_end_date?: string
          p_funding?: string
          p_program_id?: string
          p_start_date?: string
        }
        Returns: {
          active_enrollments: number
          avg_hourly_wage: number
          completed: number
          credentials_issued: number
          employer_sponsored: number
          exited: number
          job_placements: number
          self_pay: number
          total_participants: number
          wioa_funded: number
          wrg_funded: number
        }[]
      }
    }
    Enums: {
      agreement_type:
        | "enrollment"
        | "handbook"
        | "program_holder_mou"
        | "employer_agreement"
        | "staff_agreement"
        | "license"
        | "data_sharing"
        | "ferpa"
        | "participation"
        | "media_release"
        | "eula"
        | "tos"
        | "aup"
        | "disclosures"
        | "nda"
        | "mou"
        | "apprenticeship_agreement"
      application_state:
        | "started"
        | "eligibility_complete"
        | "documents_complete"
        | "review_ready"
        | "submitted"
        | "rejected"
      course_status: "draft" | "published" | "archived"
      document_status: "pending" | "verified" | "rejected"
      enrollment_status:
        | "pending"
        | "in_progress"
        | "active"
        | "completed"
        | "cancelled"
        | "suspended"
      exam_provider:
        | "certiport"
        | "esco_epa608"
        | "mainstream_epa608"
        | "careersafe_osha"
        | "other"
      exam_result: "pass" | "fail" | "incomplete" | "pending"
      exam_session_status:
        | "checked_in"
        | "in_progress"
        | "completed"
        | "voided"
        | "no_show"
      external_module_status:
        | "not_started"
        | "in_progress"
        | "submitted"
        | "approved"
      id_type:
        | "drivers_license"
        | "state_id"
        | "passport"
        | "military_id"
        | "other"
      lesson_step_type:
        | "lesson"
        | "quiz"
        | "assignment"
        | "checkpoint"
        | "reflection"
        | "lab"
        | "video"
        | "reading"
      lesson_type:
        | "lesson"
        | "quiz"
        | "checkpoint"
        | "lab"
        | "assignment"
        | "exam"
        | "certification"
      notification_channel: "email" | "sms"
      notification_status: "queued" | "processing" | "sent" | "failed"
      onboarding_status: "not_started" | "in_progress" | "completed" | "blocked"
      partner_approval_status:
        | "pending"
        | "approved_pending_user"
        | "approved"
        | "denied"
        | "suspended"
      partner_delivery_mode: "api" | "link" | "hybrid"
      signature_method: "checkbox" | "typed" | "drawn"
      step_type_enum:
        | "lesson"
        | "quiz"
        | "checkpoint"
        | "lab"
        | "assignment"
        | "exam"
        | "certification"
      user_role:
        | "student"
        | "admin"
        | "program_holder"
        | "delegate"
        | "instructor"
        | "auditor"
    }
    CompositeTypes: {
      exam_readiness_result: {
        is_ready: boolean | null
        avg_checkpoint_score: number | null
        min_checkpoint_score: number | null
        checkpoints_passed: number | null
        checkpoints_total: number | null
        lessons_completed: number | null
        lessons_total: number | null
        competencies_met: number | null
        competencies_total: number | null
        lab_signoff_met: boolean | null
        failure_reasons: string[] | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      agreement_type: [
        "enrollment",
        "handbook",
        "program_holder_mou",
        "employer_agreement",
        "staff_agreement",
        "license",
        "data_sharing",
        "ferpa",
        "participation",
        "media_release",
        "eula",
        "tos",
        "aup",
        "disclosures",
        "nda",
        "mou",
        "apprenticeship_agreement",
      ],
      application_state: [
        "started",
        "eligibility_complete",
        "documents_complete",
        "review_ready",
        "submitted",
        "rejected",
      ],
      course_status: ["draft", "published", "archived"],
      document_status: ["pending", "verified", "rejected"],
      enrollment_status: [
        "pending",
        "in_progress",
        "active",
        "completed",
        "cancelled",
        "suspended",
      ],
      exam_provider: [
        "certiport",
        "esco_epa608",
        "mainstream_epa608",
        "careersafe_osha",
        "other",
      ],
      exam_result: ["pass", "fail", "incomplete", "pending"],
      exam_session_status: [
        "checked_in",
        "in_progress",
        "completed",
        "voided",
        "no_show",
      ],
      external_module_status: [
        "not_started",
        "in_progress",
        "submitted",
        "approved",
      ],
      id_type: [
        "drivers_license",
        "state_id",
        "passport",
        "military_id",
        "other",
      ],
      lesson_step_type: [
        "lesson",
        "quiz",
        "assignment",
        "checkpoint",
        "reflection",
        "lab",
        "video",
        "reading",
      ],
      lesson_type: [
        "lesson",
        "quiz",
        "checkpoint",
        "lab",
        "assignment",
        "exam",
        "certification",
      ],
      notification_channel: ["email", "sms"],
      notification_status: ["queued", "processing", "sent", "failed"],
      onboarding_status: ["not_started", "in_progress", "completed", "blocked"],
      partner_approval_status: [
        "pending",
        "approved_pending_user",
        "approved",
        "denied",
        "suspended",
      ],
      partner_delivery_mode: ["api", "link", "hybrid"],
      signature_method: ["checkbox", "typed", "drawn"],
      step_type_enum: [
        "lesson",
        "quiz",
        "checkpoint",
        "lab",
        "assignment",
        "exam",
        "certification",
      ],
      user_role: [
        "student",
        "admin",
        "program_holder",
        "delegate",
        "instructor",
        "auditor",
      ],
    },
  },
} as const
