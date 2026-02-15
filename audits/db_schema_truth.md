# Elevate LMS — Database Schema Truth

Generated: 2026-02-14
Source: Supabase OpenAPI spec (service role) + row counts via PostgREST
Method: Direct queries against live production database (project cuxzzpsyufcewtmicszk)

## Summary

| Metric | Count |
|--------|-------|
| Total public tables/views | 551 |
| Tables with data (rows > 0) | 118 |
| Empty tables | 433 |
| Tables with tenant_id | 44 |
| Tables with organization_id | 17 |
| Either-scoped tables | 58 |

## Tables with Data (118)

### users (669 rows) [scope: O]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| email | text | no |  |
| created_at | timestamp without time zone | no |  |
| app_role | text | no |  |
| organization_id | uuid | yes | -> organizations |
| updated_at | timestamp with time zone | no |  |

### lessons (540 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | yes |  |
| course_id | uuid | yes | -> courses |
| order_number | integer | yes |  |
| title | text | yes |  |
| content | text | yes |  |
| video_url | text | yes |  |
| duration_minutes | integer | yes |  |
| topics | text[] | yes |  |
| quiz_questions | jsonb | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### training_lessons (540 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| course_id | uuid | no | -> courses |
| lesson_number | integer | no |  |
| title | text | no |  |
| content | text | yes |  |
| video_url | text | yes |  |
| duration_minutes | integer | yes |  |
| topics | text[] | yes |  |
| quiz_questions | jsonb | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### profiles (514 rows) [scope: T+O]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| email | text | yes |  |
| full_name | text | yes |  |
| role | text | yes |  |
| enrollment_status | text | no |  |
| phone | text | yes |  |
| address | text | yes |  |
| city | text | yes |  |
| state | text | yes |  |
| zip | text | yes |  |
| avatar_url | text | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |
| organization_id | uuid | yes | -> organizations |
| tenant_id | uuid | yes | -> tenants |

### user_capabilities (514 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| user_id | uuid | yes | -> profiles |
| role | text | yes |  |
| is_program_holder | boolean | yes |  |

### partner_courses (329 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| provider_id | uuid | no | -> providers |
| course_name | text | no |  |
| course_code | text | yes |  |
| external_course_code | text | yes |  |
| description | text | yes |  |
| hours | numeric | yes |  |
| level | text | yes |  |
| credential_type | text | yes |  |
| price | numeric | yes |  |
| active | boolean | no |  |
| metadata | jsonb | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |
| base_cost_cents | integer | no |  |
| retail_price_cents | integer | no |  |
| platform_margin_cents | integer | no |  |
| markup_percent | numeric | no |  |
| stripe_price_id | text | yes |  |
| enrollment_link | text | yes |  |
| hsi_course_id | text | yes |  |

### partner_lms_courses (329 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | yes |  |
| provider_id | uuid | yes | -> providers |
| course_name | text | yes |  |
| course_code | text | yes |  |
| external_course_code | text | yes |  |
| description | text | yes |  |
| hours | numeric | yes |  |
| level | text | yes |  |
| credential_type | text | yes |  |
| price | numeric | yes |  |
| active | boolean | yes |  |
| metadata | jsonb | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |
| base_cost_cents | integer | yes |  |
| retail_price_cents | integer | yes |  |
| platform_margin_cents | integer | yes |  |
| markup_percent | numeric | yes |  |
| stripe_price_id | text | yes |  |
| enrollment_link | text | yes |  |
| hsi_course_id | text | yes |  |

### stripe_webhook_events (214 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| stripe_event_id | text | no |  |
| event_type | text | no |  |
| status | text | no |  |
| payload | jsonb | yes |  |
| metadata | jsonb | yes |  |
| error_message | text | yes |  |
| processed_at | timestamp with time zone | yes |  |
| created_at | timestamp with time zone | yes |  |

### scraping_attempts (107 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | integer | no |  |
| detection_type | character varying | no |  |
| url | text | no |  |
| ip_address | character varying | yes |  |
| user_agent | text | yes |  |
| additional_data | jsonb | yes |  |
| detected_at | timestamp without time zone | no |  |
| logged_at | timestamp without time zone | yes |  |
| blocked | boolean | yes |  |
| ip_banned | boolean | yes |  |
| alert_sent | boolean | yes |  |
| notes | text | yes |  |
| created_at | timestamp without time zone | yes |  |

### enrollments (91 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | yes |  |
| user_id | uuid | yes | -> profiles |
| course_id | uuid | yes | -> courses |
| status | text | yes |  |
| progress | integer | yes |  |
| enrolled_at | timestamp with time zone | yes |  |
| completed_at | timestamp with time zone | yes |  |

### training_enrollments (91 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| user_id | uuid | no | -> profiles |
| course_id | uuid | no | -> courses |
| status | text | yes |  |
| progress | integer | yes |  |
| enrolled_at | timestamp with time zone | yes |  |
| completed_at | timestamp with time zone | yes |  |

### external_partner_modules (88 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| course_id | uuid | no | -> courses |
| title | text | no |  |
| partner_name | text | no |  |
| partner_type | text | yes |  |
| delivery_mode | public.partner_delivery_mode | no |  |
| launch_url | text | no |  |
| external_course_code | text | yes |  |
| description | text | yes |  |
| hours | numeric | yes |  |
| requires_proof | boolean | yes |  |
| is_required | boolean | yes |  |
| sort_order | integer | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### program_partner_lms (79 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| program_id | uuid | no | -> programs |
| provider_id | uuid | no | -> providers |
| is_required | boolean | yes |  |
| sequence_order | integer | yes |  |
| requires_payment | boolean | yes |  |
| payment_amount | numeric | yes |  |
| auto_enroll_on_program_start | boolean | yes |  |
| send_welcome_email | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |

### application_checklist (76 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| application_id | uuid | yes | -> applications |
| created_icc_account | boolean | yes |  |
| scheduled_workone_appointment | boolean | yes |  |
| workone_appointment_date | date | yes |  |
| workone_location | text | yes |  |
| attended_workone_appointment | boolean | yes |  |
| funding_verified | boolean | yes |  |
| advisor_assigned | boolean | yes |  |
| enrollment_started | boolean | yes |  |
| enrollment_completed | boolean | yes |  |
| last_updated | timestamp with time zone | yes |  |

### applications (76 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| first_name | text | no |  |
| last_name | text | no |  |
| phone | text | no |  |
| email | text | no |  |
| city | text | no |  |
| zip | text | no |  |
| program_interest | text | no |  |
| has_case_manager | boolean | no |  |
| case_manager_agency | text | yes |  |
| support_notes | text | yes |  |
| contact_preference | text | no |  |
| advisor_email | text | yes |  |
| status | text | yes |  |
| created_at | timestamp with time zone | yes |  |
| employer_sponsor_id | uuid | yes | -> employer_sponsorss |
| submit_token | uuid | yes |  |
| program_id | uuid | yes | -> programs |
| user_id | uuid | yes | -> profiles |
| pathway_slug | text | yes |  |
| source | text | yes |  |

### v_applications (76 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | yes |  |
| created_at | timestamp with time zone | yes |  |
| status | text | yes |  |
| first_name | text | yes |  |
| last_name | text | yes |  |
| phone | text | yes |  |
| email | text | yes |  |
| city | text | yes |  |
| zip | text | yes |  |
| contact_preference | text | yes |  |
| has_case_manager | boolean | yes |  |
| case_manager_agency | text | yes |  |
| support_notes | text | yes |  |
| program_id | uuid | yes | -> programs |
| program_title | text | yes |  |
| program_slug | text | yes |  |
| program_category | text | yes |  |

### courses (60 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | yes |  |
| course_name | text | yes |  |
| course_code | text | yes |  |
| description | text | yes |  |
| duration_hours | integer | yes |  |
| price | numeric | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### training_courses (60 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| course_name | text | no |  |
| course_code | text | yes |  |
| description | text | yes |  |
| duration_hours | integer | yes |  |
| price | numeric | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | no |  |
| updated_at | timestamp with time zone | no |  |

### programs (55 rows) [scope: T+O]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| slug | text | no |  |
| title | text | no |  |
| category | text | no |  |
| description | text | yes |  |
| estimated_weeks | integer | yes |  |
| estimated_hours | integer | yes |  |
| funding_tags | text[] | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| full_description | text | yes |  |
| what_you_learn | text[] | yes |  |
| day_in_life | text | yes |  |
| salary_min | integer | yes |  |
| salary_max | integer | yes |  |
| credential_type | text | yes |  |
| credential_name | text | yes |  |
| employers | text[] | yes |  |
| funding_pathways | text[] | yes |  |
| delivery_method | text | yes |  |
| training_hours | integer | yes |  |
| prerequisites | text | yes |  |
| career_outcomes | text[] | yes |  |
| industry_demand | text | yes |  |
| image_url | text | yes |  |
| hero_image_url | text | yes |  |
| icon_url | text | yes |  |
| featured | boolean | yes |  |
| wioa_approved | boolean | yes |  |
| dol_registered | boolean | yes |  |
| placement_rate | integer | yes |  |
| completion_rate | integer | yes |  |
| total_cost | numeric | yes |  |
| toolkit_cost | numeric | yes |  |
| credentialing_cost | numeric | yes |  |
| name | text | yes |  |
| duration_weeks | integer | yes |  |
| updated_at | timestamp with time zone | yes |  |
| cip_code | text | yes |  |
| soc_code | text | yes |  |
| funding_eligibility | text[] | yes |  |
| state_code | text | yes |  |
| organization_id | uuid | yes | -> organizations |
| category_norm | text | yes |  |
| cover_image_url | text | yes |  |
| cover_image_alt | text | yes |  |
| excerpt | text | yes |  |
| tenant_id | uuid | yes | -> tenants |
| partner_name | text | yes |  |
| partner_id | uuid | yes | -> partners |
| published | boolean | yes |  |
| lms_model | text | yes |  |
| requires_license | boolean | yes |  |
| license_type | text | yes |  |
| lms_config | jsonb | yes |  |
| is_store_template | boolean | yes |  |
| store_config | jsonb | yes |  |
| store_id | uuid | yes | -> stores |
| funding_eligible | boolean | yes |  |
| is_free | boolean | yes |  |
| status | text | yes |  |
| canonical_program_id | uuid | yes | -> canonical_programs |

### stripe_price_enrollment_map (54 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| stripe_price_id | text | yes |  |
| program_slug | text | no |  |
| is_deposit | boolean | yes |  |
| auto_enroll | boolean | yes |  |
| description | text | yes |  |
| stripe_product_id | text | yes |  |

### document_requirements (52 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| role | text | no |  |
| document_type | text | no |  |
| is_required | boolean | no |  |
| description | text | yes |  |
| instructions | text | yes |  |
| accepted_formats | text[] | yes |  |
| max_file_size | integer | yes |  |
| created_at | timestamp with time zone | no |  |
| updated_at | timestamp with time zone | no |  |

### career_course_modules (48 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| course_id | uuid | yes | -> courses |
| title | text | no |  |
| description | text | yes |  |
| script | text | yes |  |
| video_url | text | yes |  |
| duration_minutes | integer | yes |  |
| sort_order | integer | yes |  |
| is_preview | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |

### modules (43 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| program_id | uuid | no | -> programs |
| title | text | no |  |
| summary | text | yes |  |
| order_index | integer | no |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |
| description | text | yes |  |

### v_active_programs (43 rows) [scope: O]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | yes |  |
| slug | text | yes |  |
| title | text | yes |  |
| category | text | yes |  |
| description | text | yes |  |
| estimated_weeks | integer | yes |  |
| estimated_hours | integer | yes |  |
| funding_tags | text[] | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| full_description | text | yes |  |
| what_you_learn | text[] | yes |  |
| day_in_life | text | yes |  |
| salary_min | integer | yes |  |
| salary_max | integer | yes |  |
| credential_type | text | yes |  |
| credential_name | text | yes |  |
| employers | text[] | yes |  |
| funding_pathways | text[] | yes |  |
| delivery_method | text | yes |  |
| training_hours | integer | yes |  |
| prerequisites | text | yes |  |
| career_outcomes | text[] | yes |  |
| industry_demand | text | yes |  |
| image_url | text | yes |  |
| hero_image_url | text | yes |  |
| icon_url | text | yes |  |
| featured | boolean | yes |  |
| wioa_approved | boolean | yes |  |
| dol_registered | boolean | yes |  |
| placement_rate | integer | yes |  |
| completion_rate | integer | yes |  |
| total_cost | numeric | yes |  |
| toolkit_cost | numeric | yes |  |
| credentialing_cost | numeric | yes |  |
| name | text | yes |  |
| duration_weeks | integer | yes |  |
| updated_at | timestamp with time zone | yes |  |
| cip_code | text | yes |  |
| soc_code | text | yes |  |
| funding_eligibility | text[] | yes |  |
| state_code | text | yes |  |
| organization_id | uuid | yes | -> organizations |

### v_published_programs (43 rows) [scope: O]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | yes |  |
| slug | text | yes |  |
| title | text | yes |  |
| category | text | yes |  |
| description | text | yes |  |
| estimated_weeks | integer | yes |  |
| estimated_hours | integer | yes |  |
| funding_tags | text[] | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| full_description | text | yes |  |
| what_you_learn | text[] | yes |  |
| day_in_life | text | yes |  |
| salary_min | integer | yes |  |
| salary_max | integer | yes |  |
| credential_type | text | yes |  |
| credential_name | text | yes |  |
| employers | text[] | yes |  |
| funding_pathways | text[] | yes |  |
| delivery_method | text | yes |  |
| training_hours | integer | yes |  |
| prerequisites | text | yes |  |
| career_outcomes | text[] | yes |  |
| industry_demand | text | yes |  |
| image_url | text | yes |  |
| hero_image_url | text | yes |  |
| icon_url | text | yes |  |
| featured | boolean | yes |  |
| wioa_approved | boolean | yes |  |
| dol_registered | boolean | yes |  |
| placement_rate | integer | yes |  |
| completion_rate | integer | yes |  |
| total_cost | numeric | yes |  |
| toolkit_cost | numeric | yes |  |
| credentialing_cost | numeric | yes |  |
| name | text | yes |  |
| duration_weeks | integer | yes |  |
| updated_at | timestamp with time zone | yes |  |
| cip_code | text | yes |  |
| soc_code | text | yes |  |
| funding_eligibility | text[] | yes |  |
| state_code | text | yes |  |
| organization_id | uuid | yes | -> organizations |
| category_norm | text | yes |  |

### products (40 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | character varying | no |  |
| slug | character varying | no |  |
| description | text | yes |  |
| price | numeric | no |  |
| type | character varying | yes |  |
| category | character varying | yes |  |
| image_url | text | yes |  |
| stripe_price_id | character varying | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| audiences | text[] | yes |  |
| features | text[] | yes |  |
| tags | text[] | yes |  |
| is_featured | boolean | yes |  |
| badge | text | yes |  |
| sort_order | integer | yes |  |
| inventory_quantity | integer | yes |  |
| track_inventory | boolean | yes |  |
| requires_shipping | boolean | yes |  |

### career_course_features (28 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| course_id | uuid | yes | -> courses |
| feature | text | no |  |
| sort_order | integer | yes |  |
| created_at | timestamp with time zone | yes |  |

### indiana_hour_categories (25 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| code | text | no |  |
| name | text | no |  |
| description | text | yes |  |
| hour_type | text | no |  |
| min_hours | numeric | yes |  |
| max_hours | numeric | yes |  |
| created_at | timestamp with time zone | yes |  |

### achievements (22 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | text | no |  |
| description | text | yes |  |
| icon | text | yes |  |
| category | text | yes |  |
| points | integer | yes |  |
| criteria | jsonb | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### license_agreement_acceptances (21 rows) [scope: O]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| user_id | uuid | no | -> profiles |
| organization_id | uuid | yes | -> organizations |
| role_at_signing | text | no |  |
| agreement_type | public.agreement_type | no |  |
| document_version | text | no |  |
| signer_name | text | no |  |
| signer_email | text | no |  |
| signature_method | text | no |  |
| signature_data | text | yes |  |
| accepted_at | timestamp with time zone | no |  |
| ip_address | inet | yes |  |
| user_agent | text | yes |  |
| legal_acknowledgment | boolean | no |  |

### partner_courses_catalog (21 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| provider_id | uuid | no | -> providers |
| course_name | text | no |  |
| description | text | yes |  |
| category | text | yes |  |
| wholesale_price | numeric | yes |  |
| retail_price | numeric | yes |  |
| duration_hours | numeric | yes |  |
| is_active | boolean | no |  |
| created_at | timestamp with time zone | yes |  |

### shop_required_docs_status (20 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| shop_id | uuid | yes | -> shops |
| shop_name | text | yes |  |
| program_slug | text | yes |  |
| state | text | yes |  |
| document_type | text | yes |  |
| display_name | text | yes |  |
| description | text | yes |  |
| required | boolean | yes |  |
| approved | boolean | yes |  |
| file_url | text | yes |  |
| uploaded_by | uuid | yes |  |
| uploaded_at | timestamp with time zone | yes |  |
| approved_by | uuid | yes |  |
| approved_at | timestamp with time zone | yes |  |

### permissions (16 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | character varying | no |  |
| description | text | yes |  |
| resource | character varying | no |  |
| action | character varying | no |  |
| created_at | timestamp with time zone | yes |  |

### search_index (15 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| item_id | text | no |  |
| title | text | no |  |
| description | text | no |  |
| href | text | no |  |
| category | text | no |  |
| audiences | text[] | no |  |
| keywords | text[] | no |  |
| image | text | yes |  |
| price | text | yes |  |
| badge | text | yes |  |
| is_active | boolean | yes |  |
| sort_order | integer | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### partner_lms_providers (14 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| provider_name | text | no |  |
| provider_type | text | no |  |
| website_url | text | yes |  |
| support_email | text | yes |  |
| active | boolean | no |  |
| api_config | jsonb | yes |  |
| metadata | jsonb | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### training_programs (14 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | text | no |  |
| slug | text | yes |  |
| category | text | yes |  |
| description | text | yes |  |
| tuition_cost | integer | yes |  |
| exam_fee | integer | yes |  |
| materials_cost | integer | yes |  |
| duration_weeks | integer | yes |  |
| duration | text | yes |  |
| funding_type | text | yes |  |
| is_active | boolean | yes |  |
| stripe_product_id | text | yes |  |
| stripe_price_id | text | yes |  |
| created_at | timestamp with time zone | yes |  |
| required_hours | integer | yes |  |

### analytics_events (11 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| user_id | uuid | yes | -> profiles |
| event_type | text | yes |  |
| event_data | jsonb | yes |  |
| created_at | timestamp with time zone | yes |  |

### donations (10 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| donor_name | text | no |  |
| donor_email | text | yes |  |
| amount | numeric | no |  |
| currency | text | yes |  |
| payment_status | text | yes |  |
| stripe_payment_intent_id | text | yes |  |
| stripe_subscription_id | text | yes |  |
| is_recurring | boolean | yes |  |
| receipt_sent | boolean | yes |  |
| receipt_sent_at | timestamp with time zone | yes |  |
| user_id | uuid | yes | -> profiles |
| metadata | jsonb | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |
| donor_phone | text | yes |  |
| campaign_id | uuid | yes | -> campaigns |
| stripe_checkout_session_id | text | yes |  |
| recurring_frequency | text | yes |  |
| anonymous | boolean | yes |  |
| message | text | yes |  |

### faqs (10 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| question | text | no |  |
| answer | text | no |  |
| category | text | yes |  |
| program_slug | text | yes |  |
| display_order | integer | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### shop_document_requirements (10 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| program_slug | text | no |  |
| state | text | no |  |
| document_type | text | no |  |
| required | boolean | no |  |
| display_name | text | no |  |
| description | text | yes |  |
| created_at | timestamp with time zone | no |  |

### shop_products (10 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | character varying | no |  |
| slug | character varying | no |  |
| description | text | yes |  |
| price | numeric | no |  |
| category | character varying | no |  |
| stock_quantity | integer | yes |  |
| rating | numeric | yes |  |
| review_count | integer | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| image_url | text | yes |  |
| is_featured | boolean | yes |  |
| stripe_product_id | text | yes |  |
| stripe_price_id | text | yes |  |

### enrollment_steps (9 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| enrollment_id | uuid | no | -> enrollments |
| provider_id | uuid | no | -> providers |
| sequence_order | integer | no |  |
| status | text | yes |  |
| started_at | timestamp with time zone | yes |  |
| completed_at | timestamp with time zone | yes |  |
| error_message | text | yes |  |
| external_enrollment_id | text | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### guide_messages (9 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| page_id | text | no |  |
| message_id | text | no |  |
| message_type | text | no |  |
| message | text | no |  |
| action_label | text | yes |  |
| action_href | text | yes |  |
| sort_order | integer | no |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |

### locations (8 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | text | no |  |
| location_type | text | yes |  |
| address_line1 | text | yes |  |
| address_line2 | text | yes |  |
| city | text | yes |  |
| state | text | yes |  |
| zip_code | text | yes |  |
| phone | text | yes |  |
| email | text | yes |  |
| hours_of_operation | jsonb | yes |  |
| latitude | numeric | yes |  |
| longitude | numeric | yes |  |
| is_main_office | boolean | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### newsletter_subscribers (8 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| email | text | no |  |
| first_name | text | yes |  |
| last_name | text | yes |  |
| source | text | yes |  |
| tags | text[] | yes |  |
| created_at | timestamp with time zone | no |  |

### product_categories (8 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| slug | text | no |  |
| name | text | no |  |
| description | text | yes |  |
| image | text | yes |  |
| parent_id | uuid | yes | -> parents |
| sort_order | integer | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### staff_training_modules (8 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| title | text | no |  |
| description | text | yes |  |
| content | text | yes |  |
| video_url | text | yes |  |
| duration_minutes | integer | yes |  |
| category | text | yes |  |
| required_for_roles | text[] | yes |  |
| is_active | boolean | yes |  |
| order_index | integer | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### store_cards (8 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| card_id | text | no |  |
| title | text | no |  |
| subtitle | text | no |  |
| description | text | no |  |
| href | text | no |  |
| image | text | no |  |
| icon | text | no |  |
| tour_id | text | no |  |
| tier | text | no |  |
| sort_order | integer | no |  |
| tour_description | text | no |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### course_modules (7 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| course_id | uuid | yes | -> courses |
| title | text | no |  |
| description | text | yes |  |
| order_index | integer | no |  |
| duration_minutes | integer | yes |  |
| content | text | yes |  |
| video_url | text | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### credentialing_partners (7 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | text | no |  |
| type | text | no |  |
| description | text | yes |  |
| website | text | yes |  |
| created_at | timestamp with time zone | yes |  |

### credentials (7 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| partner_id | uuid | yes | -> partners |
| name | text | no |  |
| type | text | no |  |
| description | text | yes |  |
| created_at | timestamp with time zone | yes |  |

### product_recommendations (7 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| source_product_id | text | no |  |
| target_product_id | text | no |  |
| recommendation_type | text | no |  |
| reason | text | no |  |
| savings | text | yes |  |
| sort_order | integer | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |

### program_required_courses (7 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| program_id | uuid | no | -> programs |
| partner_course_id | uuid | no | -> partner_courses |
| is_required | boolean | yes |  |
| order_index | integer | yes |  |
| created_at | timestamp with time zone | yes |  |

### course_credentials (6 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| course_id | uuid | yes | -> courses |
| credential_id | uuid | yes | -> credentials |
| is_primary | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |

### help_categories (6 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | character varying | no |  |
| slug | character varying | no |  |
| description | text | yes |  |
| icon | character varying | yes |  |
| sort_order | integer | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |

### roles (6 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | character varying | no |  |
| description | text | yes |  |
| is_system | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### team_members (6 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | text | no |  |
| title | text | no |  |
| department | text | yes |  |
| bio | text | yes |  |
| image_url | text | yes |  |
| email | text | yes |  |
| phone | text | yes |  |
| linkedin_url | text | yes |  |
| display_order | integer | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### tenants (6 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | text | no |  |
| slug | text | yes |  |
| created_at | timestamp with time zone | no |  |
| updated_at | timestamp with time zone | no |  |
| status | text | yes |  |

### assignments (5 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| course_id | uuid | yes | -> courses |
| lesson_id | uuid | yes | -> lessons |
| title | text | no |  |
| description | text | yes |  |
| instructions | text | yes |  |
| max_points | numeric | yes |  |
| due_date | timestamp with time zone | yes |  |
| allow_late_submission | boolean | yes |  |
| late_penalty_percent | numeric | yes |  |
| submission_type | text | yes |  |
| max_file_size_mb | integer | yes |  |
| allowed_file_types | text[] | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### avatar_sales_messages (5 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| product_id | text | no |  |
| intro | text | no |  |
| value_highlight | text | no |  |
| objection_handler | text | no |  |
| call_to_action | text | no |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### discussion_forums (5 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| course_id | uuid | yes | -> courses |
| lesson_id | uuid | yes | -> lessons |
| title | text | no |  |
| description | text | yes |  |
| is_locked | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### help_articles (5 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| title | character varying | no |  |
| slug | character varying | no |  |
| content | text | no |  |
| excerpt | text | yes |  |
| category | character varying | no |  |
| category_slug | character varying | no |  |
| read_time_minutes | integer | yes |  |
| is_published | boolean | yes |  |
| is_featured | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |

### interactive_quizzes (5 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| lesson_id | uuid | no | -> lessons |
| title | text | no |  |
| description | text | yes |  |
| passing_score | integer | yes |  |
| time_limit_minutes | integer | yes |  |
| max_attempts | integer | yes |  |
| show_correct_answers | boolean | yes |  |
| shuffle_questions | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### job_postings (5 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| employer_id | uuid | yes | -> employers |
| title | text | no |  |
| description | text | yes |  |
| requirements | text | yes |  |
| responsibilities | text | yes |  |
| salary_range | text | yes |  |
| salary_min | numeric | yes |  |
| salary_max | numeric | yes |  |
| location | text | yes |  |
| remote_allowed | boolean | yes |  |
| job_type | text | yes |  |
| experience_level | text | yes |  |
| education_required | text | yes |  |
| skills_required | text[] | yes |  |
| benefits | text | yes |  |
| application_deadline | date | yes |  |
| status | text | yes |  |
| posted_by | uuid | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### leads (5 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| first_name | text | no |  |
| last_name | text | no |  |
| email | text | no |  |
| phone | text | yes |  |
| program_interest | text | yes |  |
| source | text | yes |  |
| status | text | no |  |
| notes | text | yes |  |
| assigned_to | uuid | yes |  |
| last_contacted_at | timestamp with time zone | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### lesson_progress (5 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| user_id | uuid | yes | -> profiles |
| lesson_id | uuid | no | -> lessons |
| course_id | uuid | no | -> courses |
| completed | boolean | yes |  |
| completed_at | timestamp with time zone | yes |  |
| time_spent_seconds | integer | yes |  |
| last_position_seconds | integer | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### licenses (5 rows) [scope: T]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| license_key | text | no |  |
| domain | text | yes |  |
| customer_email | text | no |  |
| tenant_id | uuid | yes | -> tenants |
| tier | text | yes |  |
| status | text | yes |  |
| max_users | integer | yes |  |
| max_deployments | integer | yes |  |
| features | text[] | yes |  |
| expires_at | timestamp with time zone | yes |  |
| metadata | jsonb | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |
| stripe_customer_id | text | yes |  |
| stripe_subscription_id | text | yes |  |
| current_period_end | timestamp with time zone | yes |  |
| suspended_at | timestamp with time zone | yes |  |
| canceled_at | timestamp with time zone | yes |  |

### marketing_campaigns (5 rows) [scope: T]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| tenant_id | uuid | yes | -> tenants |
| name | character varying | no |  |
| campaign_type | character varying | no |  |
| subject | character varying | yes |  |
| content | text | yes |  |
| status | character varying | yes |  |
| scheduled_at | timestamp with time zone | yes |  |
| sent_at | timestamp with time zone | yes |  |
| created_by | uuid | yes |  |
| created_at | timestamp with time zone | yes |  |

### marketing_contacts (5 rows) [scope: T]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| tenant_id | uuid | yes | -> tenants |
| email | character varying | no |  |
| first_name | character varying | yes |  |
| last_name | character varying | yes |  |
| tags | text[] | yes |  |
| subscribed | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |

### qa_checklists (5 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | text | no |  |
| description | text | yes |  |
| category | text | yes |  |
| items | jsonb | yes |  |
| created_by | uuid | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### shop_categories (5 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | character varying | no |  |
| slug | character varying | no |  |
| description | text | yes |  |
| sort_order | integer | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |

### testimonials (5 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | text | no |  |
| role | text | yes |  |
| company | text | yes |  |
| quote | text | no |  |
| image_url | text | yes |  |
| program_slug | text | yes |  |
| service_type | text | yes |  |
| rating | integer | yes |  |
| featured | boolean | yes |  |
| approved | boolean | yes |  |
| display_order | integer | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### admin_applications_queue (4 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| application_type | text | yes |  |
| application_id | uuid | yes | -> applications |
| created_at | timestamp with time zone | yes |  |
| state | text | yes |  |
| state_updated_at | timestamp with time zone | yes |  |
| intake | jsonb | yes |  |

### apprenticeship_programs (4 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| slug | text | no |  |
| name | text | no |  |
| state | text | no |  |
| required_hours | integer | no |  |
| program_fee | numeric | no |  |
| vendor_name | text | yes |  |
| vendor_cost | numeric | yes |  |
| licensing_agency | text | yes |  |
| occupation_code | text | yes |  |
| is_etpl_approved | boolean | yes |  |
| is_active | boolean | yes |  |
| description | text | yes |  |
| disclaimer | text | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### career_courses (4 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| slug | text | no |  |
| title | text | no |  |
| subtitle | text | yes |  |
| description | text | yes |  |
| price | numeric | no |  |
| original_price | numeric | yes |  |
| image_url | text | yes |  |
| duration_hours | numeric | yes |  |
| lesson_count | integer | yes |  |
| is_active | boolean | yes |  |
| is_bestseller | boolean | yes |  |
| is_bundle | boolean | yes |  |
| bundle_course_ids | uuid[] | yes |  |
| stripe_price_id | text | yes |  |
| stripe_product_id | text | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### community_events (4 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| title | text | no |  |
| description | text | yes |  |
| event_type | text | yes |  |
| start_date | timestamp with time zone | no |  |
| end_date | timestamp with time zone | yes |  |
| location | text | yes |  |
| is_virtual | boolean | yes |  |
| max_attendees | integer | yes |  |
| is_featured | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |

### learning_paths (4 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | text | no |  |
| description | text | yes |  |
| path_type | text | yes |  |
| programs | jsonb | no |  |
| estimated_weeks | integer | yes |  |
| difficulty | text | yes |  |
| is_featured | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### page_guides (4 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| page_id | text | no |  |
| page_name | text | no |  |
| avatar_name | text | no |  |
| avatar_image | text | no |  |
| quick_tips | text[] | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### promo_codes (4 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| code | text | no |  |
| description | text | yes |  |
| discount_type | text | no |  |
| discount_value | numeric | no |  |
| min_purchase | numeric | yes |  |
| max_uses | integer | yes |  |
| current_uses | integer | yes |  |
| valid_from | timestamp with time zone | yes |  |
| valid_until | timestamp with time zone | yes |  |
| is_active | boolean | yes |  |
| applies_to | text | yes |  |
| specific_course_ids | uuid[] | yes |  |
| created_by | uuid | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### social_media_accounts (4 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| platform | text | no |  |
| account_name | text | no |  |
| account_id | text | yes |  |
| access_token | text | yes |  |
| refresh_token | text | yes |  |
| token_expires_at | timestamp with time zone | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### student_applications (4 rows) [scope: T]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| tenant_id | uuid | yes | -> tenants |
| user_id | uuid | yes | -> profiles |
| full_name | text | no |  |
| email | text | no |  |
| phone | text | yes |  |
| status | text | yes |  |
| data | jsonb | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |
| intake | jsonb | no |  |
| state | text | yes |  |
| state_updated_at | timestamp with time zone | yes |  |

### forum_threads (3 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| category_id | uuid | yes | -> categorys |
| user_id | uuid | no | -> profiles |
| title | character varying | no |  |
| content | text | no |  |
| is_pinned | boolean | yes |  |
| is_locked | boolean | yes |  |
| view_count | integer | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### program_holder_applications (3 rows) [scope: T]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| tenant_id | uuid | yes | -> tenants |
| user_id | uuid | yes | -> profiles |
| organization_name | text | no |  |
| contact_name | text | no |  |
| email | text | no |  |
| phone | text | yes |  |
| status | text | yes |  |
| data | jsonb | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### success_stories (3 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | text | no |  |
| program_completed | text | yes |  |
| graduation_date | date | yes |  |
| current_job_title | text | yes |  |
| current_employer | text | yes |  |
| starting_salary | text | yes |  |
| story | text | no |  |
| quote | text | yes |  |
| image_url | text | yes |  |
| video_url | text | yes |  |
| featured | boolean | yes |  |
| approved | boolean | yes |  |
| display_order | integer | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### timeclock_cron_runs (3 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | bigint | no |  |
| ran_at | timestamp with time zone | no |  |
| updated_count | integer | no |  |

### application_state_events (2 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| application_type | text | no |  |
| application_id | uuid | no | -> applications |
| from_state | text | yes |  |
| to_state | text | no |  |
| actor_id | uuid | yes | -> profiles |
| reason | text | yes |  |
| metadata | jsonb | no |  |
| created_at | timestamp with time zone | no |  |

### apprentices (2 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| referral_id | uuid | yes | -> referralss |
| employer_id | uuid | yes | -> employers |
| rapids_id | text | yes |  |
| start_date | date | yes |  |
| status | text | yes |  |
| created_at | timestamp with time zone | yes |  |
| user_id | uuid | yes | -> profiles |
| barber_subscription_id | uuid | yes | -> barber_subscriptions |
| mou_signed_at | timestamp with time zone | yes |  |
| dashboard_invite_sent_at | timestamp with time zone | yes |  |

### audit_snapshot (2 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| apprentice_id | uuid | yes | -> apprentices |
| referral_source | text | yes |  |
| program | text | yes |  |
| referral_date | timestamp with time zone | yes |  |
| employer | text | yes |  |
| funding_source | text | yes |  |
| funding_status | text | yes |  |
| rapids_status | text | yes |  |
| wotc_submitted | boolean | yes |  |
| ojt_status | text | yes |  |

### certificates (2 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| user_id | uuid | yes | -> profiles |
| course_id | uuid | no | -> courses |
| enrollment_id | uuid | yes | -> enrollments |
| certificate_number | text | yes |  |
| issued_at | timestamp with time zone | yes |  |
| expires_at | timestamp with time zone | yes |  |
| pdf_url | text | yes |  |
| verification_url | text | yes |  |
| metadata | jsonb | yes |  |
| created_at | timestamp with time zone | yes |  |

### coupons (2 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| code | text | no |  |
| description | text | yes |  |
| discount_type | text | no |  |
| discount_value | numeric | no |  |
| minimum_order_amount | numeric | yes |  |
| maximum_discount | numeric | yes |  |
| usage_limit | integer | yes |  |
| usage_count | integer | yes |  |
| expires_at | timestamp with time zone | yes |  |
| is_active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |

### etpl_metrics (2 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| quarter | timestamp with time zone | yes |  |
| enrollments | bigint | yes |  |
| completions | bigint | yes |  |
| exits | bigint | yes |  |

### shop_staff (2 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| shop_id | uuid | no | -> shops |
| user_id | uuid | no | -> profiles |
| role | text | no |  |
| created_at | timestamp with time zone | no |  |
| active | boolean | no |  |
| deactivated_at | timestamp with time zone | yes |  |
| deactivated_by | uuid | yes |  |

### shops (2 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | text | no |  |
| ein | text | yes |  |
| address1 | text | yes |  |
| address2 | text | yes |  |
| city | text | yes |  |
| state | text | no |  |
| zip | text | yes |  |
| phone | text | yes |  |
| email | text | yes |  |
| active | boolean | no |  |
| created_at | timestamp with time zone | no |  |
| updated_at | timestamp with time zone | no |  |

### x (2 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| created_at | timestamp with time zone | no |  |

### ai_instructors (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | text | no |  |
| role | text | no |  |
| specialty | text | no |  |
| system_prompt | text | no |  |
| active | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |

### apprentice_placements (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| student_id | uuid | no | -> profiles |
| program_slug | text | no |  |
| shop_id | uuid | no | -> shops |
| supervisor_user_id | uuid | yes | -> profiles |
| start_date | date | no |  |
| end_date | date | yes |  |
| status | text | no |  |
| created_at | timestamp with time zone | no |  |
| updated_at | timestamp with time zone | no |  |

### apprentice_sites (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | text | no |  |
| latitude | numeric | no |  |
| longitude | numeric | no |  |
| radius_meters | integer | no |  |
| is_active | boolean | no |  |
| created_at | timestamp with time zone | no |  |
| updated_at | timestamp with time zone | no |  |
| shop_id | uuid | yes | -> shops |

### apprentice_weekly_reports (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| placement_id | uuid | no | -> placements |
| week_start | date | no |  |
| week_end | date | no |  |
| hours_total | numeric | no |  |
| hours_ojt | numeric | no |  |
| hours_related | numeric | no |  |
| attendance_notes | text | yes |  |
| competencies_notes | text | yes |  |
| submitted_by_user_id | uuid | no | -> profiles |
| submitted_at | timestamp with time zone | no |  |
| status | text | no |  |
| sponsor_review_notes | text | yes |  |
| sponsor_reviewed_at | timestamp with time zone | yes |  |
| sponsor_reviewed_by | uuid | yes |  |
| created_at | timestamp with time zone | no |  |

### apprenticeship_enrollments (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| student_id | uuid | no | -> profiles |
| program_id | uuid | no | -> programs |
| employer_name | text | no |  |
| supervisor_name | text | no |  |
| start_date | date | no |  |
| status | text | yes |  |
| total_hours_required | integer | yes |  |
| total_hours_completed | numeric | yes |  |
| created_at | timestamp with time zone | yes |  |
| employer_id | uuid | yes | -> employers |
| site_id | uuid | yes | -> sites |

### audit_logs (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| action | text | no |  |
| actor_id | uuid | yes | -> profiles |
| target_type | text | yes |  |
| target_id | text | yes |  |
| metadata | jsonb | yes |  |
| ip_address | inet | yes |  |
| user_agent | text | yes |  |
| created_at | timestamp with time zone | yes |  |

### barber_subscriptions (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| user_id | uuid | yes | -> profiles |
| enrollment_id | uuid | yes | -> enrollments |
| apprentice_id | uuid | yes | -> apprentices |
| stripe_subscription_id | text | yes |  |
| stripe_customer_id | text | yes |  |
| stripe_checkout_session_id | text | yes |  |
| customer_email | text | yes |  |
| customer_name | text | yes |  |
| status | text | yes |  |
| setup_fee_paid | boolean | yes |  |
| setup_fee_amount | integer | yes |  |
| weekly_payment_cents | integer | yes |  |
| weeks_remaining | integer | yes |  |
| hours_per_week | integer | yes |  |
| transferred_hours_verified | integer | yes |  |
| billing_cycle_anchor | timestamp with time zone | yes |  |
| current_period_start | timestamp with time zone | yes |  |
| current_period_end | timestamp with time zone | yes |  |
| welcome_email_sent_at | timestamp with time zone | yes |  |
| milady_email_sent_at | timestamp with time zone | yes |  |
| dashboard_invite_sent_at | timestamp with time zone | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### checkout_contexts (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| provider | text | no |  |
| order_id | text | yes |  |
| customer_email | text | no |  |
| customer_name | text | yes |  |
| customer_phone | text | yes |  |
| program_slug | text | no |  |
| application_id | text | yes |  |
| transfer_hours | integer | yes |  |
| hours_per_week | integer | yes |  |
| has_host_shop | boolean | yes |  |
| host_shop_name | text | yes |  |
| amount_cents | integer | no |  |
| payment_type | text | yes |  |
| status | text | yes |  |
| completed_at | timestamp with time zone | yes |  |
| provider_charge_id | text | yes |  |
| provider_response | jsonb | yes |  |
| created_at | timestamp with time zone | yes |  |
| expires_at | timestamp with time zone | yes |  |

### employers (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| business_name | text | no |  |
| contact_name | text | yes |  |
| email | text | yes |  |
| phone | text | yes |  |
| license_number | text | yes |  |
| trade | text | yes |  |
| approved | boolean | yes |  |
| created_at | timestamp with time zone | yes |  |
| owner_user_id | uuid | yes | -> profiles |

### license_events (1 rows) [scope: T+O]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| license_id | uuid | yes | -> licenses |
| organization_id | uuid | yes | -> organizations |
| event_type | text | no |  |
| event_data | jsonb | yes |  |
| stripe_event_id | text | yes |  |
| created_at | timestamp with time zone | yes |  |
| tenant_id | uuid | yes | -> tenants |
| processed_at | timestamp with time zone | yes |  |

### license_usage (1 rows) [scope: T]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| tenant_id | uuid | yes | -> tenants |
| tenant_name | text | yes |  |
| plan_name | text | yes |  |
| status | text | yes |  |
| seats_limit | integer | yes |  |
| seats_used | integer | yes |  |
| seats_remaining | integer | yes |  |
| features | jsonb | yes |  |
| current_period_start | timestamp with time zone | yes |  |
| current_period_end | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### organization_settings (1 rows) [scope: O]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| organization_id | uuid | no | -> organizations |
| config | jsonb | no |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### organization_users (1 rows) [scope: O]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| organization_id | uuid | no | -> organizations |
| user_id | uuid | no | -> profiles |
| role | text | no |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### organizations (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| slug | text | no |  |
| name | text | no |  |
| type | text | no |  |
| status | text | no |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### partner_enrollment_summary (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | yes |  |
| student_id | uuid | yes | -> profiles |
| student_name | text | yes |  |
| student_email | text | yes |  |
| course_name | text | yes |  |
| provider_name | text | yes |  |
| status | text | yes |  |
| progress_percentage | numeric | yes |  |
| enrolled_at | timestamp with time zone | yes |  |
| completed_at | timestamp with time zone | yes |  |
| module_count | bigint | yes |  |
| avg_module_progress | numeric | yes |  |

### partner_export_logs (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| user_id | uuid | no | -> profiles |
| user_email | text | yes |  |
| shop_ids | uuid[] | no |  |
| row_count | integer | no |  |
| export_type | text | no |  |
| exported_at | timestamp with time zone | no |  |
| created_at | timestamp with time zone | no |  |

### partner_inquiries (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| name | text | yes |  |
| email | text | yes |  |
| phone | text | yes |  |
| organization | text | yes |  |
| message | text | yes |  |
| status | text | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### partner_lms_enrollments (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| provider_id | uuid | no | -> providers |
| student_id | uuid | no | -> profiles |
| course_id | uuid | no | -> courses |
| program_id | uuid | yes | -> programs |
| status | text | yes |  |
| progress_percentage | numeric | yes |  |
| enrolled_at | timestamp with time zone | yes |  |
| completed_at | timestamp with time zone | yes |  |
| external_enrollment_id | text | no |  |
| external_account_id | text | yes |  |
| external_certificate_id | text | yes |  |
| metadata | jsonb | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |
| funding_source | text | yes |  |
| certificate_issued_at | timestamp with time zone | yes |  |

### program_enrollments (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| user_id | uuid | yes | -> profiles |
| student_id | uuid | yes | -> profiles |
| program_id | uuid | no | -> programs |
| program_slug | text | yes |  |
| email | text | yes |  |
| full_name | text | yes |  |
| phone | text | yes |  |
| amount_paid_cents | integer | yes |  |
| funding_source | text | yes |  |
| stripe_payment_intent_id | text | yes |  |
| stripe_checkout_session_id | text | yes |  |
| status | text | yes |  |
| enrollment_state | text | yes |  |
| enrollment_confirmed_at | timestamp with time zone | yes |  |
| orientation_completed_at | timestamp with time zone | yes |  |
| documents_completed_at | timestamp with time zone | yes |  |
| next_required_action | text | yes |  |
| enrolled_at | timestamp with time zone | yes |  |
| started_at | timestamp with time zone | yes |  |
| completed_at | timestamp with time zone | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### program_holders (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| organization_name | character varying | no |  |
| status | character varying | yes |  |
| created_at | timestamp with time zone | yes |  |
| user_id | uuid | yes | -> profiles |
| contact_name | text | yes |  |
| contact_email | text | yes |  |
| contact_phone | text | yes |  |
| mou_signed | boolean | yes |  |
| mou_signed_at | timestamp with time zone | yes |  |
| payout_status | text | no |  |
| is_using_internal_lms | boolean | yes |  |

### state_compliance (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| state_code | text | no |  |
| state_name | text | no |  |
| required_hours | integer | no |  |
| classroom_hours | integer | no |  |
| on_the_job_hours | integer | no |  |
| exam_required | boolean | yes |  |
| active | boolean | yes |  |
| notes | text | yes |  |
| created_at | timestamp with time zone | yes |  |
| updated_at | timestamp with time zone | yes |  |

### store_instances (1 rows) [scope: -]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| store_name | text | no |  |
| store_url | text | no |  |
| owner_id | uuid | no | -> owners |
| parent_store_id | uuid | yes | -> parent_stores |
| license_id | uuid | yes | -> licenses |
| is_active | boolean | yes |  |
| settings | jsonb | yes |  |
| created_at | timestamp with time zone | no |  |
| updated_at | timestamp with time zone | no |  |

### tenant_licenses (1 rows) [scope: T]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| tenant_id | uuid | no | -> tenants |
| stripe_customer_id | text | yes |  |
| stripe_subscription_id | text | yes |  |
| stripe_price_id | text | yes |  |
| plan_name | text | no |  |
| status | text | no |  |
| seats_limit | integer | no |  |
| seats_used | integer | no |  |
| features | jsonb | no |  |
| current_period_start | timestamp with time zone | yes |  |
| current_period_end | timestamp with time zone | yes |  |
| created_at | timestamp with time zone | no |  |
| updated_at | timestamp with time zone | no |  |

### tenant_memberships (1 rows) [scope: T]

| Column | Type | Nullable | FK Candidate |
|--------|------|----------|--------------|
| id | uuid | no |  |
| tenant_id | uuid | no | -> tenants |
| user_id | uuid | no | -> profiles |
| role | text | no |  |
| created_at | timestamp with time zone | no |  |

## Empty Tables (433)

| Table | Columns | Scope |
|-------|---------|-------|
| academic_integrity_violations | 9 | - |
| accessibility_preferences | 12 | - |
| adaptive_learning_paths | 8 | - |
| admin_activity_log | 9 | - |
| admin_alerts | 12 | - |
| admin_checkout_sessions | 7 | - |
| admin_notifications | 4 | - |
| affiliate_applications | 12 | - |
| affiliate_payouts | 12 | - |
| ai_generated_courses | 6 | T |
| alert_notifications | 19 | - |
| announcements | 13 | - |
| api_keys | 10 | T |
| api_request_logs | 8 | - |
| application_submissions | 17 | - |
| apprentice_notifications | 9 | - |
| apprentice_payroll | 12 | - |
| apprentice_wage_updates | 7 | - |
| apprenticeship_hours | 23 | - |
| apprenticeship_hours_summary | 8 | - |
| apprenticeship_portfolio | 7 | - |
| apprenticeships | 13 | - |
| approved_payment_links | 9 | - |
| assignment_submissions | 14 | - |
| attendance_records | 9 | - |
| badge_definitions | 10 | - |
| badges | 9 | - |
| bank_accounts | 7 | - |
| banner_analytics | 4 | - |
| barber_shops | 16 | - |
| barbershop_partner_applications | 31 | - |
| benefits_enrollments | 8 | - |
| benefits_plans | 11 | T |
| billing_cycles | 10 | T |
| blog_posts | 13 | - |
| calendar_events | 15 | - |
| call_requests | 12 | - |
| callback_requests | 9 | - |
| campaigns | 12 | - |
| career_applications | 12 | - |
| career_course_purchases | 9 | - |
| cart_items | 5 | - |
| case_manager_assignments | 2 | - |
| case_managers | 5 | - |
| cash_advances | 11 | - |
| certificate_downloads | 4 | - |
| chat_conversations | 9 | - |
| chat_messages | 7 | - |
| clients | 16 | - |
| cobra_enrollments | 8 | - |
| community_posts | 4 | - |
| competencies | 4 | - |
| competency_evidence | 7 | - |
| complaints | 12 | - |
| content_library | 13 | - |
| content_views | 4 | - |
| conversions | 6 | - |
| copilot_deployments | 8 | - |
| course_access | 6 | - |
| course_competencies | 5 | - |
| course_recommendations | 7 | - |
| course_syllabi | 9 | - |
| course_tasks | 11 | - |
| course_templates | 9 | - |
| credential_verification | 19 | - |
| credentials_attained | 20 | - |
| crm_contacts | 14 | - |
| crm_interactions | 10 | - |
| cross_tenant_access | 12 | - |
| customer_service_protocols | 8 | - |
| customer_service_tickets | 13 | - |
| daily_activities | 8 | - |
| data_retention_policies | 7 | T |
| data_sharing_agreements | 21 | - |
| delegate_assignments | 9 | - |
| delegates | 9 | - |
| delivery_logs | 9 | - |
| departments | 8 | T |
| dependents | 9 | - |
| digital_purchases | 13 | - |
| direct_deposit_accounts | 9 | - |
| discussion_posts | 7 | - |
| discussion_threads | 10 | - |
| dmca_takedown_requests | 22 | - |
| document_audit_log | 6 | - |
| document_signatures | 9 | - |
| documents | 16 | - |
| ecr_snapshots | 12 | - |
| email_notifications | 9 | - |
| email_queue | 10 | - |
| employee_documents | 9 | - |
| employee_goals | 10 | - |
| employees | 25 | T |
| employer_applications | 14 | T |
| employer_onboarding | 7 | - |
| employer_profiles | 4 | - |
| employer_sponsors | 8 | - |
| employment_outcomes | 26 | - |
| employment_tracking | 20 | - |
| enrollment_agreements | 8 | - |
| enrollment_idempotency | 5 | - |
| enrollment_payments | 11 | - |
| enrollment_status_history | 8 | - |
| entities | 12 | - |
| event_registrations | 6 | - |
| events | 14 | - |
| external_lms_enrollments | 10 | - |
| external_module_progress | 15 | - |
| external_modules | 11 | - |
| external_partner_progress | 16 | - |
| failed_login_attempts | 6 | - |
| ferpa_access_log | 10 | - |
| ferpa_compliance_checklist | 13 | - |
| ferpa_consent_forms | 16 | - |
| ferpa_disclosure_log | 11 | - |
| ferpa_student_acknowledgments | 11 | - |
| ferpa_training_records | 15 | - |
| ferpa_violation_reports | 16 | - |
| financial_aid_calculations | 4 | - |
| followup_schedule | 15 | - |
| forum_categories | 9 | - |
| forum_posts | 8 | - |
| forum_reactions | 6 | - |
| forum_replies | 8 | - |
| forum_topics | 13 | - |
| forum_upvotes | 4 | - |
| forum_votes | 6 | - |
| forums | 4 | - |
| franchise_audit_log | 12 | - |
| franchise_clients | 29 | - |
| franchise_ero_configs | 11 | - |
| franchise_fee_schedules | 27 | - |
| franchise_offices | 30 | - |
| franchise_preparer_payouts | 18 | - |
| franchise_preparers | 31 | - |
| franchise_return_submissions | 30 | - |
| franchise_royalties | 19 | - |
| funding_applications | 17 | - |
| funding_cases | 10 | - |
| funding_payments | 10 | - |
| generated_pages | 4 | - |
| google_classroom_sync | 4 | - |
| grade_records | 14 | - |
| grades | 4 | - |
| grant_opportunities | 15 | - |
| grant_sources | 5 | - |
| holidays | 7 | T |
| hour_tracking | 12 | - |
| hsi_enrollment_queue | 17 | - |
| income_sources | 14 | - |
| indiana_timeclock_daily_export | 24 | - |
| indiana_timeclock_weekly_summary_export | 8 | - |
| individual_employment_plans | 30 | - |
| interactive_elements | 6 | - |
| invoices | 12 | T |
| ip_access_control | 8 | T |
| job_applications | 9 | - |
| job_placements | 10 | - |
| job_queue | 9 | - |
| leaderboard_entries | 10 | - |
| learner_compliance | 12 | - |
| learning_activity | 8 | - |
| learning_activity_streaks | 7 | - |
| learning_analytics | 7 | - |
| learning_streaks | 9 | - |
| leave_balances | 9 | - |
| leave_policies | 8 | T |
| leave_requests | 11 | - |
| legal_actions | 26 | - |
| lesson_completions | 7 | - |
| lesson_content_blocks | 7 | - |
| lesson_resources | 11 | - |
| license_purchases | 14 | T |
| license_requests | 9 | - |
| license_usage_log | 6 | - |
| license_validations | 4 | - |
| license_violations | 5 | T |
| live_chat_messages | 7 | - |
| live_chat_sessions | 9 | - |
| live_class_attendance | 7 | - |
| live_classes | 17 | - |
| live_session_attendance | 4 | - |
| lms_organizations | 16 | - |
| lms_progress | 12 | - |
| lms_security_audit_log | 9 | - |
| lms_sync_log | 11 | - |
| makeup_work_requests | 10 | - |
| marketing_campaign_sends | 7 | - |
| marketing_pages | 9 | - |
| marketing_sections | 6 | - |
| marketplace_creators | 15 | - |
| marketplace_products | 13 | - |
| marketplace_sales | 14 | - |
| media | 4 | - |
| meeting_action_items | 7 | - |
| meeting_recaps | 14 | O |
| messages | 8 | - |
| migration_audit | 3 | - |
| milady_enrollments | 11 | - |
| moderation_actions | 7 | - |
| moderation_reports | 9 | - |
| moderation_rules | 8 | T |
| monitoring_alerts | 17 | - |
| mou_signatures | 7 | - |
| mou_templates | 7 | - |
| notification_events | 9 | - |
| notification_log | 8 | - |
| notification_logs | 10 | - |
| notification_preferences | 10 | - |
| notifications | 11 | - |
| ocr_extractions | 8 | - |
| ojt_hours_log | 10 | - |
| ojt_logs | 10 | - |
| ojt_reimbursements | 9 | - |
| onboarding_checklist | 9 | - |
| onboarding_documents | 8 | - |
| onboarding_packets | 7 | - |
| onboarding_progress | 8 | - |
| onboarding_signatures | 6 | - |
| onboarding_steps | 7 | - |
| open_timeclock_shifts | 11 | - |
| order_items | 7 | - |
| orders | 6 | - |
| org_invites | 8 | O |
| organization_subscriptions | 13 | O |
| page_versions | 4 | - |
| page_views | 8 | - |
| participant_demographics | 20 | - |
| participant_eligibility | 22 | - |
| partner_applications | 17 | - |
| partner_audit_log | 6 | - |
| partner_certificates | 7 | - |
| partner_completions | 14 | - |
| partner_course_enrollments | 12 | - |
| partner_course_mappings | 10 | - |
| partner_credentials | 15 | - |
| partner_enrollments | 9 | - |
| partner_program_access | 4 | - |
| partner_program_courses | 6 | - |
| partner_users | 6 | - |
| partners | 20 | - |
| password_history | 4 | - |
| pay_stubs | 11 | - |
| payment_records | 10 | - |
| payments | 12 | O |
| payout_rate_configs | 7 | - |
| payroll_profiles | 10 | - |
| payroll_runs | 12 | T |
| peer_review_assignments | 6 | - |
| peer_reviews | 9 | - |
| performance_metrics | 7 | - |
| performance_reviews | 12 | - |
| permission_audit_log | 11 | - |
| permission_group_members | 4 | - |
| permission_groups | 6 | T |
| phone_logs | 11 | - |
| platform_stats | 6 | - |
| point_transactions | 8 | - |
| positions | 10 | T |
| process_steps | 8 | - |
| processed_stripe_events | 6 | - |
| processes | 10 | - |
| proctored_exams | 9 | - |
| proctoring_sessions | 10 | - |
| product_reports | 9 | - |
| product_reviews | 10 | - |
| program_courses | 6 | - |
| program_holder_documents | 21 | O |
| program_holder_notes | 8 | - |
| program_holder_payouts | 15 | - |
| program_holder_students | 7 | - |
| program_holder_verification | 13 | - |
| program_licenses | 19 | - |
| program_modules | 4 | - |
| program_revenue | 11 | - |
| progress_entries | 38 | - |
| promo_code_uses | 7 | - |
| provisioning_events | 9 | T |
| purchases | 5 | - |
| push_notification_tokens | 6 | - |
| push_tokens | 7 | - |
| qa_checklist_completions | 8 | - |
| quarterly_performance | 28 | - |
| quiz_answer_options | 8 | - |
| quiz_attempts | 17 | - |
| quiz_questions | 13 | - |
| quizzes | 23 | - |
| rapids_registrations | 13 | - |
| rapids_tracking | 7 | - |
| referral_codes | 10 | - |
| referrals | 10 | - |
| refund_tracking | 13 | - |
| refunds | 11 | - |
| resource_downloads | 4 | - |
| reviews | 17 | - |
| role_permissions | 4 | - |
| role_templates | 8 | - |
| salary_history | 8 | - |
| sap_records | 10 | - |
| scorm_completion_summary | 12 | - |
| scorm_enrollments | 16 | - |
| scorm_packages | 14 | - |
| scorm_registrations | 11 | - |
| scorm_state | 6 | - |
| scorm_tracking | 5 | - |
| security_audit_logs | 9 | - |
| service_tickets | 11 | - |
| sfc_tax_documents | 14 | - |
| sfc_tax_return_public_status | 8 | - |
| sfc_tax_return_public_status_v2 | 8 | - |
| sfc_tax_returns | 21 | - |
| sfc_tax_returns_public_lookup | 22 | - |
| shift_schedules | 8 | - |
| shop_applications | 20 | - |
| shop_documents | 9 | - |
| shop_onboarding | 7 | - |
| shop_orders | 10 | - |
| shop_placements | 13 | - |
| shop_reports | 14 | - |
| shop_signatures | 9 | - |
| shop_supervisors | 11 | - |
| signatures | 8 | - |
| site_content | 9 | - |
| site_settings | 4 | - |
| sms_messages | 4 | - |
| sms_reminders | 5 | - |
| sms_templates | 5 | - |
| social_media_posts | 15 | - |
| social_media_queue | 8 | - |
| sso_connections | 8 | - |
| sso_login_attempts | 8 | - |
| sso_providers | 16 | T |
| sso_sessions | 8 | - |
| staff_applications | 11 | T |
| staff_processes | 9 | - |
| staff_training_progress | 9 | - |
| state_board_readiness | 19 | - |
| store_branding | 11 | - |
| student_badges | 5 | - |
| student_credentials | 7 | - |
| student_enrollments | 35 | - |
| student_hours | 5 | - |
| student_next_steps | 24 | O |
| student_onboarding | 12 | - |
| student_points | 11 | - |
| student_progress | 10 | - |
| student_records | 15 | - |
| student_tasks | 5 | - |
| students | 17 | - |
| studio_chat_history | 8 | - |
| studio_comments | 11 | - |
| studio_commit_cache | 5 | - |
| studio_deploy_tokens | 5 | - |
| studio_favorites | 7 | - |
| studio_recent_files | 7 | - |
| studio_repos | 7 | - |
| studio_sessions | 9 | - |
| studio_settings | 10 | - |
| studio_shares | 11 | - |
| study_group_members | 4 | - |
| study_groups | 4 | - |
| subscriptions | 11 | T |
| supersonic_applications | 21 | - |
| supersonic_appointments | 16 | - |
| supersonic_careers | 18 | - |
| supersonic_tax_documents | 15 | - |
| supersonic_training_keys | 16 | - |
| supportive_services | 20 | - |
| tasks | 5 | - |
| tax_applications | 10 | - |
| tax_appointments | 18 | - |
| tax_calculations | 15 | - |
| tax_document_uploads | 14 | - |
| tax_documents | 15 | - |
| tax_filings | 13 | - |
| tax_intake | 14 | - |
| tax_returns | 26 | - |
| tax_withholdings | 10 | - |
| tenant_branding | 17 | T |
| tenant_domains | 13 | T |
| tenant_invitations | 11 | T |
| tenant_members | 11 | T |
| tenant_settings | 25 | T |
| tenant_stripe_customers | 3 | T |
| tenant_subscriptions | 19 | T |
| tenant_usage | 11 | T |
| tenant_usage_daily | 8 | T |
| time_entries | 11 | - |
| timeclock_ui_state | 22 | - |
| timesheets | 10 | - |
| training_progress | 9 | - |
| transfer_hour_requests | 18 | - |
| transfer_hours | 9 | - |
| trial_signups | 12 | O |
| turnstile_verifications | 4 | - |
| two_factor_attempts | 7 | - |
| two_factor_auth | 9 | - |
| unauthorized_access_log | 26 | - |
| uploaded_documents | 6 | - |
| user_achievements | 5 | - |
| user_activity | 4 | - |
| user_activity_events | 10 | - |
| user_badges | 5 | - |
| user_learning_paths | 4 | - |
| user_onboarding | 10 | - |
| user_permissions | 8 | T |
| user_points | 8 | - |
| user_profiles | 11 | - |
| user_progress | 15 | - |
| user_resumes | 13 | - |
| user_roles | 8 | T |
| user_sessions | 8 | - |
| user_skills | 4 | - |
| user_streaks | 7 | - |
| user_tutorials | 9 | - |
| vendor_payments | 10 | - |
| video_captions | 6 | - |
| video_chapters | 7 | - |
| video_engagement | 4 | - |
| video_progress | 8 | - |
| video_transcripts | 8 | - |
| vita_appointments | 9 | - |
| voicemails | 8 | - |
| webhook_deliveries | 9 | - |
| webhooks | 11 | - |
| welcome_packets | 7 | - |
| wioa_participants | 80 | - |
| wioa_services | 19 | - |
| wishlists | 4 | - |
| withdrawals | 13 | - |
| workone_checklist | 11 | O |
| wotc_tracking | 8 | - |
| xapi_statements | 10 | - |

## Queries Used

```
1. Schema extraction:
   GET {SUPABASE_URL}/rest/v1/ (with service role Authorization header)
   Returns OpenAPI spec with all table definitions, column names, types, nullability

2. Row counts:
   For each table: supabase.from(table).select('*', { count: 'exact', head: true })

3. FK detection:
   Heuristic: columns ending in _id with uuid type mapped to likely parent table

4. Scope detection:
   Presence of tenant_id and/or organization_id columns in table definition
```
