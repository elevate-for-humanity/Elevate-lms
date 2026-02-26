# Admin Page Data Wiring Inventory
# Generated: 2026-02-26T09:28:51Z

Legend:
  LIVE    = queries Supabase tables via .from()/.rpc()
  STATIC  = hardcoded data, no DB queries
  PARTIAL = some data from DB, some hardcoded
  STUB    = page exists but data is placeholder/mock

## /admin/accreditation
  Status: LIVE | Reads: 5 | Writes: 0
0 | Audit: 0
0
  Tables: job_placements,profiles,program_enrollments,programs

## /admin/accreditation/report
  Status: LIVE | Reads: 5 | Writes: 0
0 | Audit: 0
0
  Tables: certificates,completions,program_enrollments,programs,training_courses

## /admin/activity
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 2
  Tables: audit_logs

## /admin/advanced-tools
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: settings

## /admin/affiliates/new
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/affiliates
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: affiliate_applications,affiliate_payouts

## /admin/ai-console
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: conversations,profiles

## /admin/ai-tutor-logs
  Status: LIVE | Reads: 5 | Writes: 0
0 | Audit: 0
0
  Tables: public_ai_tutor_logs

## /admin/analytics/engagement
  Status: LIVE | Reads: 5 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,program_enrollments

## /admin/analytics/learning
  Status: LIVE | Reads: 6 | Writes: 0
0 | Audit: 0
0
  Tables: certificates,profiles,program_enrollments,training_courses

## /admin/analytics
  Status: LIVE | Reads: 5 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,program_enrollments,programs,training_courses

## /admin/analytics/programs
  Status: LIVE | Reads: 6 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,program_enrollments,programs

## /admin/api-keys
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: api_keys

## /admin/applicants-live
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/applicants
  Status: LIVE | Reads: 7 | Writes: 0
0 | Audit: 0
0
  Tables: applications,profiles

## /admin/applications/[type]/[id]
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: admin_applications_queue,application_state_events,profiles

## /admin/applications
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: applications,profiles

## /admin/applications/review/[id]
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: applications,profiles,training_courses

## /admin/apprenticeships
  Status: LIVE | Reads: 3 | Writes: 1 | Audit: 0
0
  Tables: apprenticeship_enrollments,ojt_hours_log

## /admin/at-risk
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,program_enrollments,student_risk_status

## /admin/audit-logs
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/automation-qa
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: automated_decisions,review_queue

## /admin/automation
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: delivery_logs,notifications,profiles,program_enrollments

## /admin/autopilot
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/barriers
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: participant_barriers,profiles

## /admin/blog
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: blog_posts

## /admin/campaigns/new
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/campaigns
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: marketing_campaigns

## /admin/career-courses/create
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/cash-advances
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: cash_advance_applications,profiles

## /admin/cash-advances/pending
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: cash_advances,profiles

## /admin/cash-advances/reports
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: cash_advances,profiles

## /admin/cash-advances/settings
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/certificates/bulk
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: certificate_templates,profiles,program_enrollments

## /admin/certificates/issue
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: certificate_templates,profiles,training_courses

## /admin/certificates
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: certificates,issued_certificates,profiles

## /admin/certifications/bulk
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: certification_types,profiles,user_certifications

## /admin/certifications
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/cohorts
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/completions
  Status: LIVE | Reads: 5 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,program_enrollments

## /admin/compliance-audit
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/compliance/agreements
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: license_agreement_acceptances,profiles

## /admin/compliance/deletions
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/compliance/exports
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/compliance/financial-assurance
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: financial_assurances

## /admin/compliance
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/contacts
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: contact_submissions,profiles

## /admin/copilot/deploy
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/copilot
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: copilot_deployments,profiles

## /admin/course-builder/assessments
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/course-builder/media
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/course-builder
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,programs,training_courses

## /admin/course-builder/templates
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/course-generator
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/course-import
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/course-templates
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/courses/[courseId]/content
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,training_courses,training_lessons

## /admin/courses/[courseId]/edit
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,programs,training_courses

## /admin/courses/[courseId]/quizzes/[quizId]/questions
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,quiz_questions,quizzes

## /admin/courses/[courseId]/quizzes
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,quizzes,training_courses

## /admin/courses/builder
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/courses/bulk-operations
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,training_courses

## /admin/courses/create
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: course_categories,profiles,programs

## /admin/courses/manage
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,training_courses

## /admin/courses
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,training_courses,training_enrollments

## /admin/courses/partners
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/crm/appointments/new
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/crm/appointments
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/crm/campaigns/new
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/crm/campaigns
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: campaigns,profiles

## /admin/crm/contacts/new
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/crm/contacts
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: crm_contacts

## /admin/crm/deals/new
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/crm/deals
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/crm/follow-ups
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: crm_follow_ups

## /admin/crm/leads/new
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/crm/leads
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: leads

## /admin/crm
  Status: LIVE | Reads: 7 | Writes: 0
0 | Audit: 0
0
  Tables: appointments,campaigns,follow_ups,leads,profiles

## /admin/curriculum
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/curriculum/upload
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/dashboard/etpl
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/dashboard
  Status: LIVE | Reads: 15 | Writes: 0
0 | Audit: 0
0
  Tables: certificates,profiles,program_enrollments,programs,training_courses,training_lessons

## /admin/data-processor
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/delegates
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: delegates,profiles

## /admin/dev-studio
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/docs/mou
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/docs
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/document-center/[category]
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: documents,profiles

## /admin/document-center
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/documents
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: documents,profiles

## /admin/documents/review/[id]
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: documents,profiles

## /admin/documents/review
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: documents,profiles

## /admin/documents/upload
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/editor
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/email-marketing/analytics
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/email-marketing/automation/new
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/email-marketing/automation
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/email-marketing/campaigns/new
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/email-marketing
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/employers-playbook
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/employers/[id]/proposal
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: employers,profiles

## /admin/employers/onboarding
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: employer_onboarding

## /admin/employers
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: employers,profiles

## /admin/enrollment-jobs
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: enrollment_jobs,profiles

## /admin/enrollments
  Status: LIVE | Reads: 5 | Writes: 0
0 | Audit: 0
0
  Tables: cohorts,profiles,training_courses,training_enrollments

## /admin/etpl-alignment
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/external-modules/approvals
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: external_modules,profiles

## /admin/external-modules
  Status: LIVE | Reads: 4 | Writes: 2 | Audit: 0
0
  Tables: external_modules

## /admin/external-progress
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/ferpa
  Status: LIVE | Reads: 5 | Writes: 0
0 | Audit: 3
  Tables: audit_logs,documents,profiles

## /admin/ferpa/training
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: ferpa_training_records,profiles

## /admin/files
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/funding-playbook
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/funding
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/governance/authoritative-docs
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: compliance_documents

## /admin/governance/compliance
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/governance/contact
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/governance/data
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/governance/legal
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/governance/operational-controls
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/governance
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/governance/security
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/governance/seo-indexing
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/gradebook/[courseId]
  Status: LIVE | Reads: 5 | Writes: 0
0 | Audit: 0
0
  Tables: assignment_submissions,profiles,program_enrollments,quiz_attempts,training_courses

## /admin/gradebook
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,training_courses

## /admin/grants/intake
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/grants/new
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/grants
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: grant_applications,grant_opportunities

## /admin/grants/revenue
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/grants/submissions
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: grant_submissions,profiles

## /admin/grants/workflow
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: grant_applications,grant_entities,grants,profiles

## /admin/hours-export
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/hr/employees/[id]
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: employees,performance_reviews,profiles,time_off_requests

## /admin/hr/employees/new
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/hr/employees
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: employees,profiles

## /admin/hr/leave
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: leave_requests,profiles

## /admin/hr
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/hr/payroll
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/hr/time
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/hsi-enrollments
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: partner_course_enrollments,profiles

## /admin/hvac-activation
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/impact
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/import
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/inbox
  Status: LIVE | Reads: 5 | Writes: 2 | Audit: 0
0
  Tables: license_requests,partner_inquiries,user_profiles

## /admin/incentives/create
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/incentives
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/instructors
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/instructors/performance
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/intake
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/integrations/google-classroom
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/integrations
  Status: LIVE | Reads: 2 | Writes: 1 | Audit: 0
0
  Tables: integrations

## /admin/integrations/salesforce
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/internal-docs
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/jobs/new
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/jobs
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: employers,job_postings

## /admin/jri
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: jri_participants,profiles

## /admin/leads/new
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/leads
  Status: LIVE | Reads: 5 | Writes: 0
0 | Audit: 0
0
  Tables: leads

## /admin/learner/[id]
  Status: LIVE | Reads: 5 | Writes: 0
0 | Audit: 0
0
  Tables: certificates,lesson_progress,profiles,program_enrollments

## /admin/learner
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/lessons
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,training_courses,training_lessons

## /admin/license-requests
  Status: LIVE | Reads: 3 | Writes: 1 | Audit: 0
0
  Tables: license_requests,user_profiles

## /admin/license
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/licenses/create
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: tenants

## /admin/licenses
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/licensing
  Status: LIVE | Reads: 3 | Writes: 1 | Audit: 0
0
  Tables: licenses,tenants

## /admin/live-chat
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/marketing
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: leads,marketing_campaigns

## /admin/marketplace/creators
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: marketplace_creators

## /admin/marketplace
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/marketplace/payouts
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: marketplace_creators

## /admin/marketplace/products
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: marketplace_products

## /admin/media-studio
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0

## /admin/migrations
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/mobile-sync
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/moderation
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: forum_posts

## /admin/modules/new
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,programs

## /admin/modules
  Status: LIVE | Reads: 6 | Writes: 0
0 | Audit: 0
0
  Tables: modules,profiles,programs

## /admin/monitoring
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/monitoring/setup
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 19

## /admin/mou
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: partner_mous,profiles

## /admin/next-steps
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/notifications
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/operations
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/outcomes
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/partner-enrollments
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: partner_course_enrollments,profiles

## /admin/partner-inquiries
  Status: LIVE | Reads: 3 | Writes: 1 | Audit: 0
0
  Tables: partner_inquiries,profiles

## /admin/partners/lms-integrations/[id]
  Status: LIVE | Reads: 5 | Writes: 0
0 | Audit: 0
0
  Tables: partner_lms_courses,partner_lms_enrollments,partner_lms_providers,partner_lms_sync_logs,profiles

## /admin/partners/lms-integrations
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/partners
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: partners,profiles

## /admin/payroll-cards
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/payroll
  Status: LIVE | Reads: 4 | Writes: 1 | Audit: 0
0
  Tables: apprentice_payroll,apprenticeship_enrollments
  RPCs: calculate_payroll

## /admin/performance-dashboard
  Status: LIVE | Reads: 9 | Writes: 0
0 | Audit: 0
0
  Tables: crm_contacts,leads,training_courses,wotc_applications

## /admin/portal-map
  Status: LIVE | Reads: 1 | Writes: 1 | Audit: 0
0
  Tables: pages

## /admin/program-generator
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/program-holder-acknowledgements
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/program-holder-documents
  Status: LIVE | Reads: 2 | Writes: 1 | Audit: 0
0
  Tables: program_holder_documents

## /admin/program-holders/[id]/countersign-mou
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,programs

## /admin/program-holders/[id]
  Status: LIVE | Reads: 17 | Writes: 4 | Audit: 3
  Tables: admin_audit_events,profiles,program_holder_programs,program_holders,programs
  RPCs: approve_and_provision_program_holder,deprovision_program,provision_additional_program

## /admin/program-holders
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,program_holder_programs,program_holders

## /admin/program-holders/verification/[id]/review
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: program_holder_banking,program_holder_documents,program_holder_verification,program_holders

## /admin/program-holders/verification
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: program_holder_banking,program_holder_documents,program_holders

## /admin/programs/[code]/dashboard
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,program_enrollments,programs

## /admin/programs/builder
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,training_courses

## /admin/programs/catalog
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: programs

## /admin/programs/new
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/programs
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,programs

## /admin/progress
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,program_enrollments

## /admin/promo-codes
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/quiz-builder
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/quizzes
  Status: LIVE | Reads: 5 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,quiz_attempts,quiz_questions,quizzes,training_courses

## /admin/rapids/apprentices
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/rapids
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: apprenticeships

## /admin/reporting
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/reports/caseload
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/reports/charts
  Status: LIVE | Reads: 7 | Writes: 0
0 | Audit: 0
0
  Tables: applications,enrollments,partner_completions,profiles,programs

## /admin/reports/enrollment
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: program_enrollments,training_courses

## /admin/reports/financial
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: grant_applications,grant_opportunities,wotc_applications

## /admin/reports/leads
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: leads

## /admin/reports
  Status: LIVE | Reads: 6 | Writes: 0
0 | Audit: 0
0
  Tables: leads,profiles,program_enrollments,training_courses

## /admin/reports/partners
  Status: LIVE | Reads: 6 | Writes: 0
0 | Audit: 0
0
  Tables: partner_enrollments,partner_inquiries,partners,profiles

## /admin/reports/samples
  Status: LIVE | Reads: 6 | Writes: 0
0 | Audit: 0
0
  Tables: certificates,completions,profiles,program_enrollments,programs,training_courses

## /admin/reports/users
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/retention
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/review-queue/[id]
  Status: LIVE | Reads: 10 | Writes: 0
0 | Audit: 0
0
  Tables: applications,automated_decisions,documents,documents_extractions,partners,profiles,review_queue,shop_routing_scores,transfer_hours

## /admin/review-queue
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,review_queue

## /admin/sap
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: attendance_records,grades,profiles,program_enrollments

## /admin/security
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/settings
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/shops/geocoding
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,shops

## /admin/shops
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,shop_applications,shop_required_docs_status,shops

## /admin/signatures/new
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/signatures
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,signatures

## /admin/site-health
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/social-media/campaigns/new
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/social-media
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/store/catalog
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/store/clones
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/store
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/students/export
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/students
  Status: LIVE | Reads: 5 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,program_enrollments

## /admin/success
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,success_stories

## /admin/support
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/syllabus-generator
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/system-health
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/system-monitor
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/system-status
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: creator_courses,program_enrollments

## /admin/tax-filing/applications/new
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/tax-filing/applications
  Status: LIVE | Reads: 4 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,tax_applications

## /admin/tax-filing
  Status: LIVE | Reads: 5 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,tax_filing_applications,tax_preparers

## /admin/tax-filing/preparers
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/tax-filing/reports
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/tax-filing/training
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/tenants
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,tenants

## /admin/test-emails
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/test-payments
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/transfer-hours
  Status: LIVE | Reads: 5 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,transfer_hours

## /admin/users/new
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/users
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/verifications/review/[id]
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: id_verifications,profiles

## /admin/verifications/review
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: id_verifications,profiles

## /admin/video-generator
  Status: STATIC | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/video-manager
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/videos
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: media,profiles

## /admin/videos/upload
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/waitlist
  Status: LIVE | Reads: 2 | Writes: 0
0 | Audit: 0
0
  Tables: profiles,waitlist

## /admin/wioa/documents
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: wioa_documents

## /admin/wioa/eligibility
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: wioa_applications

## /admin/wioa
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: program_enrollments

## /admin/wioa/reports
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: certificates,program_enrollments

## /admin/wioa/verify
  Status: LIVE | Reads: 3 | Writes: 0
0 | Audit: 0
0
  Tables: documents,wioa_participants

## /admin/workflows
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: profiles

## /admin/wotc/new
  Status: STUB | Reads: 0
0 | Writes: 0
0 | Audit: 0
0

## /admin/wotc
  Status: LIVE | Reads: 1 | Writes: 0
0 | Audit: 0
0
  Tables: wotc_applications

