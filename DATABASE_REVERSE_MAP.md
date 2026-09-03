# DATABASE → PAGE REVERSE MAPPING
================================================================================


## account_deletion_requests
  - API:/account/delete

## account_export_events
  - API:/account/export

## accreditation_evidence
  - PAGE:/admin/accreditation

## accreditation_standards
  - PAGE:/admin/accreditation

## achievements
  - API:/activity/watch-tick
  - API:/leaderboard
  - API:/learner/dashboard
  - API:/student/achievements
  - API:/users/[userId]/badges
  - PAGE:/achievements

## addon_subscriptions
  - PAGE:/admin/billing

## admin_alerts
  - API:/cron/anomaly-detection
  - API:/cron/check-licenses
  - API:/cron/check-stuck-approvals
  - API:/cron/compliance-expiration
  - API:/cron/daily-attendance-alerts
  - API:/cron/end-of-day-summary
  - API:/cron/escalate-funding-sla
  - API:/cron/funding-escalation
  - API:/cron/guardrail-evaluation
  - API:/cron/low-hours-pace
  - API:/cron/missed-checkins
  - API:/cron/payment-monitoring
  - API:/cron/school-application-followup
  - API:/cron/testing-no-show
  - API:/cron/webhook-health-check
  - API:/cron/weekly-verdicts
  - API:/internal/ai-operator
  - API:/internal/at-risk-detection
  - API:/internal/hours-pace-check
  - API:/internal/missed-clockout
  - API:/timeclock/action
  - API:/webhooks/stripe
  - PAGE:/admin/operations
  - PAGE:/admin/timeclock

## admin_applications_queue
  - API:/enrollment/decision
  - API:/enrollment/reevaluate
  - PAGE:/admin/applications/queue

## advising_requests
  - API:/advising-request

## affiliate_applications
  - PAGE:/admin/affiliates

## affiliate_payouts
  - PAGE:/admin/affiliates

## affiliates
  - PAGE:/admin/affiliates

## agreement_acceptances
  - API:/apprentice/handbook
  - API:/cases/[caseId]/signatures
  - API:/enrollments/apprentice
  - API:/enrollments/host-shop

## agreement_versions
  - API:/legal/accept
  - API:/legal/sign

## agreements
  - API:/program-holder/mou/sign
  - API:/program-holder/upload-license

## ai_assistant_conversations
  - API:/ai-assistant/chat

## ai_assistant_messages
  - API:/ai-assistant/chat

## ai_audit_log
  - API:/payments/split

## ai_chat_context
  - API:/chat/ai-response

## ai_chat_interactions
  - API:/ai-chat

## ai_chat_sessions
  - API:/ai/chat

## ai_conversation_memory
  - API:/admin/ai-assistant
  - API:/cron/memory-cleanup

## ai_conversations
  - API:/zora

## ai_guardrail_logs
  - API:/cron/guardrail-evaluation

## ai_instructor_interactions
  - API:/ai/instructor

## ai_instructor_logs
  - API:/ai-instructor

## ai_interview_sessions
  - API:/enrollment/decision
  - API:/enrollment/reevaluate

## analytics_events
  - API:/chat/message
  - API:/newsletter

## announcements
  - API:/announcements

## api_keys
  - PAGE:/admin/api-keys

## app_settings
  - API:/auth/quickbooks/callback
  - API:/quickbooks/contractor-payment

## application_payments
  - API:/application-fee/webhook

## applications
  - API:/admin/reports/dashboard-stats
  - API:/affirm/webhook
  - API:/application-fee/webhook
  - API:/applications
  - API:/applications/[id]/reject
  - API:/applications/[id]/verify
  - API:/applications/lookup
  - API:/applications/track
  - API:/applications/wioa
  - API:/apprenticeship/enroll/checkout
  - API:/automation/test/shop-routing
  - API:/barber/webhook
  - API:/case-manager/reports/wioa/export
  - API:/compliance/report
  - API:/cosmetology/webhook
  - API:/cron/enrollment-automation
  - API:/cron/school-application-followup
  - API:/cron/stale-applications
  - API:/enroll/apply
  - API:/enroll/auto
  - API:/enroll/checkout
  - API:/enroll/complete
  - API:/enrollment/approve
  - API:/enrollment/decision
  - API:/enrollment/reevaluate
  - API:/inquiries
  - API:/intake
  - API:/intake/application
  - API:/intake/apply
  - API:/intake/status
  - API:/onboarding/complete
  - API:/onboarding/step-complete
  - API:/orientation/schedule
  - API:/outcomes
  - API:/payments/create-session
  - API:/programs/[program]/inquiry
  - API:/programs/barber-apprenticeship/apply
  - API:/programs/barber-apprenticeship/confirm
  - API:/public/metrics
  - API:/schedule-consultation
  - API:/sezzle/checkout
  - API:/sezzle/virtual-card/process
  - API:/sezzle/webhook
  - API:/system/reconcile-payment
  - API:/workforce-board/reports
  - API:/workone/seed
  - PAGE:/admin/activity
  - PAGE:/admin/applications
  - PAGE:/admin/reports/charts
  - PAGE:/admin/review-queue
  - PAGE:/admin/wioa/eligibility
  - PAGE:/admin/workone-queue
  - PAGE:/case-manager/participants
  - PAGE:/case-manager/participants/[id]
  - PAGE:/case-manager/reports/wioa
  - PAGE:/employer/reports
  - PAGE:/employer/reports/submit
  - PAGE:/ferpa
  - PAGE:/lms/(app)/apply/status
  - PAGE:/lms/(app)/dashboard
  - PAGE:/onboarding/learner

## appointment_types
  - PAGE:/booking/booking

## appointments
  - API:/booking/enrollment
  - API:/instructors/available
  - API:/schedule-consultation
  - PAGE:/admin/crm
  - PAGE:/admin/crm/appointments
  - PAGE:/admin/crm/crm
  - PAGE:/admin/crm/crm/appointments

## apprentice_applications
  - API:/enrollments/apprentice

## apprentice_document_types
  - API:/apprentice/documents

## apprentice_forms
  - PAGE:/apprentice/documents

## apprentice_funding_profile
  - API:/time/entries

## apprentice_hours
  - API:/pwa/api-pwa/cosmetology/hours-history
  - API:/pwa/api-pwa/cosmetology/progress
  - API:/pwa/api-pwa/esthetician/hours-history
  - API:/pwa/api-pwa/esthetician/progress
  - API:/pwa/api-pwa/nail-tech/hours-history
  - API:/pwa/api-pwa/nail-tech/progress
  - API:/pwa/cosmetology/hours-history
  - API:/pwa/cosmetology/progress
  - API:/pwa/esthetician/hours-history
  - API:/pwa/esthetician/progress
  - API:/pwa/nail-tech/hours-history
  - API:/pwa/nail-tech/progress

## apprentice_placements
  - API:/competency/pending-reps
  - API:/partner/attendance/weekly
  - API:/pwa/api-pwa/shop-owner/pending-reps
  - API:/pwa/shop-owner/pending-reps
  - API:/supervisor/verify-rep
  - PAGE:/(partner)/partners/admin/placements
  - PAGE:/host-shop/dashboard/attendance/record

## apprentice_progress
  - API:/pwa/api-pwa/shop-owner/approve-hours
  - API:/pwa/shop-owner/approve-hours

## apprentice_sites
  - API:/timeclock/action
  - API:/timeclock/context
  - API:/timeclock/heartbeat
  - PAGE:/admin/timeclock

## apprentice_skill_progress
  - PAGE:/apprentice/skills

## apprentice_skills
  - PAGE:/apprentice/competencies
  - PAGE:/apprentice/competencies/log
  - PAGE:/apprentice/hours/log
  - PAGE:/apprentice/skills

## apprentice_weekly_reports
  - API:/program-holder/reports/submit

## apprentices
  - API:/apprentice/program-slug
  - API:/apprentice/transfer-request
  - API:/barber/webhook
  - API:/checkin
  - API:/checkin/checkout
  - API:/checkin/status
  - API:/cron/missed-checkins
  - API:/employer/hiring-trends
  - API:/employer/retention-stats
  - API:/enroll/approve
  - API:/onboarding/complete
  - API:/timeclock/action
  - API:/timeclock/context
  - PAGE:/admin/timeclock
  - PAGE:/apprentice/competencies/log
  - PAGE:/apprentice/documents
  - PAGE:/apprentice/hours/log
  - PAGE:/apprentice/skills
  - PAGE:/apprentice/transfer-hours

## apprenticeship_daily_theory
  - API:/apprenticeship/daily-theory

## apprenticeship_enrollments
  - API:/apprentice/email-alerts
  - PAGE:/admin/apprenticeships
  - PAGE:/employer/apprenticeships

## apprenticeship_hours
  - PAGE:/admin/student-hours
  - PAGE:/apprentice/state-board

## apprenticeship_intake
  - API:/intake

## apprenticeship_programs
  - API:/onboarding/complete
  - PAGE:/onboarding/learner

## apprenticeships
  - API:/apprenticeship/hours/approve
  - API:/apprenticeship/hours/reject
  - API:/competency/pending-reps
  - API:/partner/apprentices
  - API:/partner/hours
  - API:/pwa/api-pwa/shop-owner/pending-reps
  - API:/pwa/shop-owner/pending-reps
  - API:/supervisor/verify-rep
  - PAGE:/employer/apprenticeships
  - PAGE:/employer/company
  - PAGE:/employer/dashboard

## approval_chain_instances
  - API:/cron/check-stuck-approvals

## assignment_submissions
  - API:/assignments/[id]/submit
  - PAGE:/lms/(app)/analytics
  - PAGE:/lms/(app)/assignments
  - PAGE:/lms/(app)/grades

## assignments
  - API:/assignments
  - PAGE:/calendar/calendar
  - PAGE:/lms/(app)/assignments
  - PAGE:/lms/(app)/calendar

## at_risk_students
  - PAGE:/admin/at-risk

## attendance
  - PAGE:/admin/staff-portal/attendance/record
  - PAGE:/admin/students/[id]/binder
  - PAGE:/staff/attendance/record

## attendance_hours
  - PAGE:/admin/staff-portal/attendance/export
  - PAGE:/lms/(app)/attendance
  - PAGE:/staff/attendance
  - PAGE:/staff/attendance/export

## attendance_log
  - API:/pwa/api-pwa/cosmetology/checkin
  - API:/pwa/api-pwa/esthetician/checkin
  - API:/pwa/api-pwa/nail-tech/checkin
  - API:/pwa/cosmetology/checkin
  - API:/pwa/esthetician/checkin
  - API:/pwa/nail-tech/checkin

## attendance_records
  - API:/attendance/verify
  - API:/cron/compliance-expiration
  - API:/cron/daily-attendance-alerts
  - API:/partner/attendance

## attendance_sessions
  - PAGE:/admin/staff-portal/attendance
  - PAGE:/host-shop/dashboard/attendance

## audit_logs
  - API:/apprenticeship/hours/reject
  - API:/audit-logs
  - API:/board/referrals
  - API:/compliance/evidence
  - API:/compliance/items
  - API:/credentials/issue
  - API:/credentials/verify
  - API:/demo/reset
  - API:/employer/reports/submit
  - API:/enroll/approve
  - API:/ferpa/training/submit
  - API:/intake/application
  - API:/intake/eligibility
  - API:/intake/interest
  - API:/legal/sign
  - API:/onboarding/payroll-setup
  - API:/partner/attendance
  - API:/program-holder/mou/sign-typed
  - API:/program-holder/reports/submit
  - API:/program-holder/students/accept
  - API:/program-holder/students/decline
  - API:/security/log
  - API:/signature/documents
  - API:/signature/documents/[id]/sign
  - PAGE:/admin/activity
  - PAGE:/admin/analytics/engagement
  - PAGE:/admin/ferpa
  - PAGE:/admin/ferpa/audit-log
  - PAGE:/c/[token]

## audit_snapshot
  - API:/audit/export

## automated_decisions
  - API:/automation/test/document-processing
  - API:/automation/test/partner-approval
  - API:/automation/test/shop-routing

## avatar_chat_interactions
  - API:/chat/avatar-assistant

## badges
  - API:/achievements
  - API:/discussions/thread
  - API:/gamification/badges
  - PAGE:/lms/(app)/badges

## barber_completion_status
  - API:/barber/completion-status

## barber_hour_events
  - API:/barber/session

## barber_hour_ledger
  - API:/barber/session

## barber_payments
  - API:/barber/webhook
  - PAGE:/admin/integrations/stripe

## barber_practical_categories
  - API:/barber/practicals

## barber_practical_submissions
  - API:/barber/practicals

## barber_student_practicals
  - API:/barber/practicals

## barber_subscriptions
  - API:/affirm/webhook
  - API:/barber/activate-subscription
  - API:/barber/setup-intent
  - API:/barber/update-payment
  - API:/barber/webhook
  - API:/cron/barber-billing
  - API:/cron/barber-reinstate
  - API:/sezzle/webhook
  - PAGE:/admin/integrations/stripe
  - PAGE:/apprentice/billing
  - PAGE:/programs/barber-apprenticeship/orientation

## barber_training_sessions
  - API:/barber/session

## barbershop_partner_applications
  - API:/admin/barber-shop-applications/status
  - API:/partners/barber-host-shop/apply
  - API:/partners/barber-host-shop/my-application
  - API:/partners/barber-host-shop/sign-mou
  - PAGE:/admin/barber-shop-applications
  - PAGE:/host-shop/dashboard
  - PAGE:/partner/dashboard

## billing_accounts
  - API:/stripe/connect/create

## billing_events
  - API:/barber/webhook
  - API:/cosmetology/webhook

## blog_posts
  - API:/blog
  - API:/blog/generate
  - API:/blog/posts
  - API:/social-media/generate
  - API:/social-media/scheduler
  - PAGE:/admin/blog
  - PAGE:/blog/[slug]
  - PAGE:/blog/author/[author]
  - PAGE:/blog/blog
  - PAGE:/blog/blog/[slug]
  - PAGE:/blog/blog/author/[author]
  - PAGE:/blog/blog/category/[category]
  - PAGE:/blog/category/[category]
  - PAGE:/press
  - PAGE:/press/press

## booth_rental_agreements
  - API:/booth-rental/sign-mou

## booth_rental_subscriptions
  - API:/booth-rental/sign-mou
  - PAGE:/admin/staff-portal/booth-renters
  - PAGE:/staff/booth-renters

## bridge_payment_plans
  - API:/compliance-audit

## calculator_usage
  - API:/calculators/wage-progression

## calendar_events
  - API:/calendar
  - API:/calendar/events
  - API:/learner/dashboard
  - PAGE:/lms/(app)/calendar

## calendly_bookings
  - API:/chatbot/calendly-webhook

## call_requests
  - API:/call-requests

## callback_requests
  - API:/phone/call

## campaign_templates
  - API:/crm/templates

## campaigns
  - API:/crm/send-campaign
  - PAGE:/admin/crm
  - PAGE:/admin/crm/campaigns
  - PAGE:/admin/crm/crm
  - PAGE:/admin/crm/crm/campaigns

## career_counseling_conversations
  - API:/career-counseling/chat
  - API:/enrollment/decision

## career_counseling_messages
  - API:/career-counseling/chat

## career_course_purchases
  - API:/webhooks/stripe/career-courses

## career_courses
  - API:/checkout/career-courses

## cart_items
  - API:/cart/add
  - API:/cart/remove
  - API:/cart/update
  - API:/store/api-store/cart-checkout
  - API:/store/cart-checkout
  - API:/store/cart/sync
  - PAGE:/store/cart
  - PAGE:/store/checkout

## carts
  - API:/cart

## case_management
  - API:/wioa/case-management
  - API:/wioa/case-management/[id]

## case_manager_assignments
  - API:/case-manager/participants/[id]
  - API:/case-manager/participants/[id]/notes
  - API:/case-manager/reports/wioa/export
  - API:/placements
  - PAGE:/case-manager/dashboard
  - PAGE:/case-manager/participants
  - PAGE:/case-manager/participants/[id]
  - PAGE:/case-manager/reports/wioa
  - PAGE:/partners/workforce
  - PAGE:/workforce/dashboard

## case_manager_notes
  - API:/case-manager/participants/[id]
  - API:/case-manager/participants/[id]/notes

## case_tasks
  - API:/cases/[caseId]/tasks

## cert_revocation_log
  - API:/certificates/revocations

## certificate_templates
  - PAGE:/admin/certificates/bulk
  - PAGE:/admin/certificates/issue

## certificates
  - API:/accreditation/report
  - API:/case-manager/participants/[id]
  - API:/certificates
  - API:/certificates/[certificateId]/download
  - API:/certificates/bulk-issue
  - API:/certificates/download
  - API:/certificates/generate
  - API:/certificates/issue
  - API:/certificates/issue-program
  - API:/certificates/pdf
  - API:/certificates/replace
  - API:/certificates/verify
  - API:/courses/[courseId]/complete
  - API:/emails/certificate
  - API:/mobile/profile
  - API:/mobile/summary
  - API:/outcomes/stats
  - API:/public/metrics
  - API:/users/[userId]/progress
  - API:/verify
  - API:/verify/certificate/[certificateId]
  - API:/webhooks/store
  - API:/webhooks/stripe
  - PAGE:/admin/accreditation/report
  - PAGE:/admin/reports/samples
  - PAGE:/admin/students/[id]/binder
  - PAGE:/certificates/[certificateId]
  - PAGE:/lms/(app)/achievements
  - PAGE:/lms/(app)/certificates
  - PAGE:/lms/(app)/certification
  - PAGE:/lms/(app)/dashboard
  - PAGE:/lms/(app)/portfolio
  - PAGE:/lms/(app)/profile
  - PAGE:/provider/dashboard
  - PAGE:/verify/verify/[certificateId]
  - PAGE:/workforce-board/dashboard

## certification_requests
  - API:/certification/pathways
  - API:/webhooks/exam-payment

## certification_submissions
  - API:/certifications/progress

## certification_types
  - PAGE:/admin/certificates/bulk

## certifications
  - API:/certifications/upload

## certiport_exam_requests
  - API:/certiport-exam/assign-voucher
  - API:/certiport-exam/request
  - PAGE:/certiport-exam/certiport-exam

## chat_messages
  - API:/ai/chat

## checkin_sessions
  - API:/checkin
  - API:/checkin/checkout
  - API:/checkin/status
  - API:/shop/checkin/qr

## checkout_contexts
  - API:/affirm/capture
  - API:/affirm/checkout
  - API:/affirm/webhook

## checkpoint_scores
  - API:/lms/courses/[courseId]/exam-readiness
  - API:/lms/progress/complete
  - API:/pwa/api-pwa/cosmetology/progress
  - API:/pwa/api-pwa/esthetician/progress
  - API:/pwa/api-pwa/nail-tech/progress
  - API:/pwa/cosmetology/progress
  - API:/pwa/esthetician/progress
  - API:/pwa/nail-tech/progress
  - PAGE:/transcript

## cmi_students
  - PAGE:/admin/cmi

## cohort_enrollments
  - API:/org/accept-invite

## cohort_sessions
  - API:/attendance/verify

## cohorts
  - API:/waitlist
  - PAGE:/admin/cohorts
  - PAGE:/admin/enrollments
  - PAGE:/admin/staff-portal/attendance/export
  - PAGE:/admin/staff-portal/attendance/take
  - PAGE:/staff/attendance
  - PAGE:/staff/attendance/export
  - PAGE:/staff/attendance/take

## communications
  - PAGE:/admin/communications

## community_events
  - API:/events

## community_members
  - API:/community/join

## competencies
  - API:/lessons/[lessonId]/complete

## competency_audit_log
  - API:/lms/submissions/review

## competency_log
  - API:/competency/pending-reps
  - API:/lessons/[lessonId]/ojt-log
  - API:/lessons/[lessonId]/ojt-status
  - API:/pwa/api-pwa/shop-owner/pending-reps
  - API:/pwa/shop-owner/pending-reps
  - API:/supervisor/verify-rep
  - PAGE:/apprentice/competencies
  - PAGE:/apprentice/competencies/log
  - PAGE:/apprentice/hours/log

## completions
  - PAGE:/admin/accreditation/report
  - PAGE:/admin/reports/samples

## compliance_alerts
  - PAGE:/admin/compliance
  - PAGE:/admin/ferpa

## compliance_audit_log
  - API:/compliance/export

## compliance_audits
  - API:/compliance-audit
  - PAGE:/compliance
  - PAGE:/compliance/report

## compliance_documents
  - PAGE:/admin/governance/authoritative-docs

## compliance_evidence
  - API:/compliance/evidence

## compliance_items
  - API:/compliance/evidence
  - API:/compliance/items
  - API:/compliance/report
  - PAGE:/admin/compliance

## content_blocks
  - PAGE:/thankyou

## content_items
  - API:/content-library
  - API:/content-library/[id]
  - API:/content-library/upload

## contract_templates
  - PAGE:/admin/compliance/automation

## conversations
  - API:/ai-tutor/chat

## conversions
  - API:/donate/webhook

## cosmetology_subscriptions
  - API:/cosmetology/activate-subscription
  - API:/cosmetology/setup-intent
  - API:/cosmetology/webhook
  - PAGE:/admin/integrations/stripe
  - PAGE:/apprentice/billing
  - PAGE:/programs/cosmetology-apprenticeship/orientation

## coupons
  - API:/admin/promo-codes

## course_announcements
  - API:/courses/[courseId]/announcements

## course_completion_status
  - API:/certificates/generate

## course_completions
  - API:/privacy/export

## course_content
  - API:/scorm/upload

## course_enrollments
  - API:/instructor/campaigns/send
  - API:/instructor/my-students
  - API:/privacy/export
  - API:/webhooks/stripe

## course_generation_jobs
  - API:/course-generator/gap-scan
  - API:/course-generator/jobs

## course_leaderboard
  - API:/courses/[courseId]/leaderboard

## course_lessons
  - API:/ai/generate-and-publish-course
  - API:/courses/[courseId]/complete
  - API:/courses/[courseId]/lessons/public
  - API:/courses/create
  - API:/generate-video
  - API:/internal/lesson-pace-check
  - API:/lms/courses/[courseId]/exam-readiness
  - API:/lms/evidence
  - API:/lms/lesson-attempt
  - API:/lms/progress/complete
  - API:/lms/submissions
  - API:/quizzes/[quizId]
  - API:/videos/generate
  - API:/videos/regenerate
  - PAGE:/lms/(app)/dashboard
  - PAGE:/preview/barber-videos

## course_materials
  - API:/courses/[courseId]/lessons/[lessonId]/resources
  - PAGE:/lms/(app)/library

## course_modules
  - API:/ai/generate-and-publish-course
  - API:/courses/[courseId]/lessons/public
  - API:/courses/[courseId]/modules
  - API:/courses/authoring
  - API:/lms/quizzes/[quizId]/start

## course_reviews
  - API:/courses/[courseId]/reviews
  - API:/courses/[courseId]/reviews/[reviewId]/helpful

## course_templates
  - PAGE:/create-course

## course_versions
  - API:/internal/course-health

## courses
  - API:/admin/lms/courses
  - API:/admin/lms/courses/[courseId]
  - API:/admin/lms/courses/[courseId]/publish
  - API:/ai/generate-and-publish-course
  - API:/checkout/create-payment-intent
  - API:/courses/[courseId]
  - API:/courses/[courseId]/announcements
  - API:/courses/[courseId]/complete
  - API:/courses/[courseId]/lessons/public
  - API:/courses/authoring
  - API:/courses/index
  - API:/courses/list
  - API:/enrollments/create
  - API:/generate-video
  - API:/internal/course-health
  - API:/lessons/[lessonId]/complete
  - API:/lms/courses/[courseId]/exam-readiness
  - API:/lms/enrollment-status
  - API:/lms/progress/complete
  - API:/lms/progress/start
  - API:/lms/quizzes/[quizId]/start
  - API:/lms/recommendations
  - API:/onboarding/launch
  - API:/v1/import
  - API:/videos/generate
  - API:/videos/regenerate
  - PAGE:/admin/certificates/issue
  - PAGE:/admin/curriculum
  - PAGE:/admin/enrollments
  - PAGE:/admin/gradebook
  - PAGE:/admin/programs
  - PAGE:/admin/reports/enrollment
  - PAGE:/admin/reports/samples
  - PAGE:/lms/(app)/achievements
  - PAGE:/lms/(app)/analytics
  - PAGE:/lms/(app)/calendar
  - PAGE:/lms/(app)/grades
  - PAGE:/lms/(app)/integrations
  - PAGE:/lms/(app)/learning-paths
  - PAGE:/lms/(app)/library
  - PAGE:/lms/(app)/portfolio
  - PAGE:/lms/(app)/progress
  - PAGE:/lms/(app)/schedule

## credential_attempts
  - API:/credentials/exam-checkout
  - API:/credentials/funding-decision
  - PAGE:/lms/(app)/certification

## credential_registry
  - PAGE:/admin/credentials

## credential_share_links
  - PAGE:/c/[token]

## credential_uploads
  - API:/certification/[id]/upload

## credentials
  - API:/credentials/exam-checkout
  - API:/credentials/issue
  - API:/credentials/verify
  - API:/cron/expire-credentials
  - API:/employer/matches
  - API:/reports/credentials
  - API:/webhooks/exam-payment
  - PAGE:/c/[token]
  - PAGE:/case-manager/participants/[id]

## crm_deals
  - PAGE:/admin/crm/crm/deals
  - PAGE:/admin/crm/deals

## crm_follow_ups
  - PAGE:/admin/crm/crm/follow-ups
  - PAGE:/admin/crm/follow-ups

## cron_job_runs
  - API:/cron/anomaly-detection
  - API:/internal/service-health
  - PAGE:/admin/operations

## curriculum_lessons
  - API:/lms/quizzes/[quizId]/start
  - API:/pwa/api-pwa/cosmetology/progress
  - API:/pwa/api-pwa/esthetician/progress
  - API:/pwa/api-pwa/nail-tech/progress
  - API:/pwa/cosmetology/progress
  - API:/pwa/esthetician/progress
  - API:/pwa/nail-tech/progress
  - PAGE:/admin/curriculum

## curriculum_licenses
  - PAGE:/pricing

## customer_billing
  - API:/store/api-store/customer-portal
  - API:/store/api-store/subscribe
  - API:/store/customer-portal

## customer_service_protocols
  - PAGE:/admin/staff-portal/customer-service
  - PAGE:/staff/customer-service

## customer_service_tickets
  - API:/support/ticket
  - PAGE:/admin/staff-portal/customer-service
  - PAGE:/staff/customer-service

## customer_workspaces
  - API:/operator/chat
  - API:/workspaces/delete
  - API:/workspaces/deploy
  - PAGE:/admin/platform

## daily_streaks
  - API:/activity/watch-tick
  - API:/learner/dashboard
  - API:/student/streak

## delegates
  - API:/delegate/notes/add
  - API:/delegates/add
  - API:/delegates/list
  - API:/delegates/update
  - PAGE:/admin/delegates

## delivery_logs
  - PAGE:/admin/autopilot

## deployment_options
  - PAGE:/store/deployment

## direct_message_conversations
  - PAGE:/messages

## discussion_posts
  - API:/forums
  - API:/forums/[forumId]
  - API:/forums/[forumId]/threads/[threadId]

## discussion_threads
  - API:/community/discussions
  - API:/discussions/thread
  - API:/discussions/threads
  - API:/forums
  - API:/forums/[forumId]
  - API:/forums/[forumId]/threads/[threadId]
  - API:/mobile/summary

## document_requirements
  - PAGE:/employer/documents

## documentation
  - PAGE:/platform/architecture

## documents
  - API:/apprentice/documents
  - API:/automation/test/document-processing
  - API:/certifications/upload
  - API:/cron/check-expiring-documents
  - API:/cron/compliance-expiration
  - API:/documents/ai-prefill
  - API:/documents/upload
  - API:/documents/verify
  - API:/documents/verify/bulk
  - API:/enrollment/decision
  - API:/enrollment/upload-document
  - API:/external-pathways/[courseId]/complete
  - API:/identity/upload-manual
  - API:/intake/upload
  - API:/onboarding/validate-document
  - API:/partners/barber-host-shop/apply
  - API:/programs/[program]/external-courses/[courseId]/complete
  - API:/upload
  - API:/verification/submit
  - PAGE:/admin/compliance/automation
  - PAGE:/admin/documents
  - PAGE:/admin/documents/review
  - PAGE:/admin/ferpa
  - PAGE:/admin/ferpa/access-requests
  - PAGE:/admin/ferpa/consent-forms
  - PAGE:/admin/internal-docs
  - PAGE:/admin/wioa/verify
  - PAGE:/apprentice/documents
  - PAGE:/apprentice/handbook
  - PAGE:/documents
  - PAGE:/downloads
  - PAGE:/employer/documents
  - PAGE:/onboarding/learner
  - PAGE:/onboarding/learner/verify-identity
  - PAGE:/onboarding/school
  - PAGE:/store/compliance
  - PAGE:/verify-identity

## donations
  - API:/donate/webhook

## downloads
  - API:/store/api-store/download/[productId]
  - API:/store/download/[productId]

## email_campaigns
  - API:/crm/campaigns/send
  - API:/email-marketing/campaigns/schedule
  - API:/email-marketing/campaigns/send
  - API:/email/analytics
  - API:/email/campaigns
  - API:/email/campaigns/send
  - API:/email/scheduler

## email_logs
  - API:/crm/campaigns/send
  - API:/email/analytics
  - API:/email/campaigns/send
  - API:/email/workflows/processor

## email_queue
  - API:/donate/webhook
  - API:/reviews
  - API:/reviews/[id]/respond

## email_templates
  - PAGE:/admin/communications
  - PAGE:/admin/communications/new
  - PAGE:/admin/communications/templates

## email_workflows
  - API:/email/workflows
  - API:/email/workflows/processor

## emails
  - API:/email

## employees
  - API:/admin/hr/employees/[id]/pay-rate
  - API:/hr/payroll
  - PAGE:/admin/employees
  - PAGE:/admin/hr
  - PAGE:/admin/hr/employees

## employer_documents
  - PAGE:/documents

## employer_onboarding
  - API:/employers/onboard
  - API:/employers/onboard/[id]
  - PAGE:/admin/employers/onboarding
  - PAGE:/onboarding/employer/hiring-needs

## employer_onboarding_progress
  - PAGE:/admin/employers/onboarding
  - PAGE:/onboarding/employer/orientation

## employer_portal
  - API:/employer/reports/submit

## employer_sponsorships
  - API:/employer-sponsorship
  - API:/enrollments/create-enforced

## employers
  - API:/email/campaigns/send
  - API:/employer/matches
  - PAGE:/admin/analytics/employers
  - PAGE:/admin/employers
  - PAGE:/admin/jobs
  - PAGE:/employer/company
  - PAGE:/employer/settings
  - PAGE:/onboarding/employer/hiring-needs

## employment_outcomes
  - API:/outcomes
  - API:/reporting/recent-activity
  - API:/wioa/employment
  - API:/wioa/reporting

## enrollment_cases
  - API:/cases
  - API:/cases/[caseId]
  - API:/cases/[caseId]/signatures

## enrollment_documents
  - PAGE:/documents

## enrollment_events
  - API:/certificates/bulk-issue
  - API:/certificates/issue
  - API:/certificates/replace

## enrollment_idempotency
  - API:/enrollments/create

## enrollment_jobs
  - PAGE:/admin/enrollment-jobs

## enrollment_status_history
  - API:/enrollment/status

## enrollment_steps
  - API:/webhooks/partners/[partner]

## enrollments
  - API:/board/compliance-report
  - API:/v1/import
  - API:/workforce-board/reports
  - PAGE:/admin/activity
  - PAGE:/admin/reports/charts
  - PAGE:/admin/students/[id]/binder
  - PAGE:/programs/esthetician-apprenticeship/documents

## entities
  - API:/grants/draft
  - API:/grants/match

## etpl_metrics
  - API:/etpl/export

## event_registrations
  - API:/events/[id]/register

## events
  - API:/events
  - API:/events/[id]/register

## exam_attempt_questions
  - API:/exams/start
  - API:/exams/submit

## exam_attempts
  - API:/account/export
  - API:/exams/start
  - API:/exams/submit

## exam_authorization_queue
  - PAGE:/admin/exam-authorizations

## exam_authorizations
  - API:/cron/expire-exam-authorizations
  - API:/lms/courses/[courseId]/exam-readiness

## exam_booking_leads
  - API:/testing/leads

## exam_bookings
  - API:/admin/testing-center
  - API:/testing/book
  - API:/testing/booking-status
  - API:/testing/bookings/[id]
  - API:/testing/retake
  - API:/testing/webhook
  - PAGE:/admin/testing-center

## exam_enforcement_holds
  - API:/proctor/sessions
  - API:/proctor/sessions/[id]

## exam_events
  - API:/exams/events

## exam_fee_payments
  - API:/webhooks/exam-payment

## exam_funding_authorizations
  - API:/credentials/exam-checkout

## exam_readiness
  - API:/case-manager/students
  - API:/credentials/complete

## exam_sessions
  - API:/admin/testing-center
  - API:/courses/[courseId]/complete
  - API:/cron/testing-no-show
  - API:/exams/upload-recording
  - API:/lms/progress/complete
  - API:/lms/quizzes/[quizId]/start
  - API:/proctor/sessions
  - API:/proctor/sessions/[id]
  - PAGE:/admin/testing-center

## exams
  - API:/exams/start

## external_course_completions
  - API:/external-pathways/[courseId]/complete
  - API:/programs/[program]/external-courses/[courseId]/checkout
  - API:/programs/[program]/external-courses/[courseId]/complete
  - PAGE:/admin/external-course-completions
  - PAGE:/lms/(app)/dashboard

## external_credentials
  - API:/credentials/complete

## external_program_enrollments
  - API:/enrollment/documents/complete

## faqs
  - API:/content/homepage
  - PAGE:/license/pricing

## features
  - PAGE:/admin/billing/feature-flags

## ferpa_training_records
  - API:/ferpa/training/submit
  - PAGE:/admin/ferpa/training

## files
  - API:/files

## financial_assurance_records
  - PAGE:/admin/compliance/financial-assurance

## follow_ups
  - PAGE:/admin/crm
  - PAGE:/admin/crm/crm

## form_submissions
  - API:/forms/submit

## forms
  - API:/forms/submit

## forum_posts
  - API:/forums/posts
  - PAGE:/lms/(app)/badges
  - PAGE:/programs/[program]/discussions

## forum_threads
  - API:/forums/posts
  - API:/forums/threads
  - PAGE:/programs/[program]/discussions

## forums
  - API:/forums

## funding_options
  - PAGE:/funding/wioa

## funding_payments
  - API:/funding/create-checkout

## funding_sources
  - PAGE:/funding/dol

## global_leaderboard
  - API:/leaderboard/global

## google_classroom_sync
  - API:/integrations/google-classroom/sync

## government_job_feed
  - API:/jobs/government-feed
  - PAGE:/jobs/jobs

## grade_items
  - API:/grade/upsert

## grades
  - API:/grade/upsert
  - API:/privacy/export

## grant_applications
  - API:/grants/draft
  - PAGE:/admin/compliance/automation
  - PAGE:/admin/grants/applications
  - PAGE:/admin/grants/revenue
  - PAGE:/admin/grants/workflow
  - PAGE:/admin/reports/financial
  - PAGE:/admin/submissions
  - PAGE:/apps/grants

## grant_entities
  - PAGE:/admin/grants/workflow

## grant_matches
  - API:/grants/match

## grant_notifications
  - API:/grants/notifications

## grant_opportunities
  - API:/grants/draft
  - API:/grants/match
  - API:/grants/sync
  - PAGE:/admin/grants/intake
  - PAGE:/admin/grants/opportunities
  - PAGE:/admin/reports/financial
  - PAGE:/admin/submissions
  - PAGE:/apps/grants

## grant_sources
  - API:/grants/sync

## grant_submissions
  - PAGE:/admin/grants/submissions

## grants
  - PAGE:/admin/grants
  - PAGE:/admin/grants/workflow

## handbook_acknowledgments
  - API:/apprentice/handbook
  - API:/compliance/export
  - API:/compliance/record
  - API:/handbook/acknowledge
  - PAGE:/admin/program-holder-acknowledgements
  - PAGE:/admin/staff-portal
  - PAGE:/onboarding/handbook
  - PAGE:/onboarding/learner
  - PAGE:/onboarding/school
  - PAGE:/staff

## handbook_sections
  - PAGE:/apprentice/handbook

## handbooks
  - PAGE:/platform/student-portal/handbook

## help_articles
  - API:/help/search

## host_shop_applications
  - API:/enrollments/host-shop
  - API:/host-shop/webhook

## host_shop_partnerships
  - API:/host-shop/subscription/webhook

## hour_entries
  - API:/apprentice/hours-summary
  - API:/apprenticeship/hours
  - API:/apprenticeship/hours/approve
  - API:/apprenticeship/hours/reject
  - API:/case-manager/students
  - API:/checkin/checkout
  - API:/employer/hours
  - API:/employer/hours/approve
  - API:/internal/hours-pace-check
  - API:/internal/missed-clockout
  - API:/learner/dashboard
  - API:/partner/hours
  - API:/program-holder/hours
  - API:/program-holder/hours/approve
  - API:/student/dashboard
  - API:/student/hours
  - API:/student/log-hours
  - API:/time/approve
  - API:/time/entries
  - API:/time/export
  - API:/timeclock/action
  - API:/timeclock/context
  - PAGE:/apprentice
  - PAGE:/apprentice/hours
  - PAGE:/employer/hours

## hour_transfer_requests
  - API:/apprentice/transfer-request
  - API:/documents/verify/bulk
  - PAGE:/apprentice/transfer-hours

## hsi_course_products
  - API:/hsi/create-checkout

## id_verifications
  - API:/verification/submit
  - PAGE:/admin/verifications
  - PAGE:/admin/verifications/review

## identity_verifications
  - API:/identity/upload-manual

## incentives
  - PAGE:/admin/incentives

## individual_employment_plans
  - API:/wioa/iep
  - API:/wioa/iep/[id]
  - PAGE:/admin/wioa/iep

## inquiries
  - API:/admin/reports/dashboard-stats
  - API:/community/inquiry
  - API:/inquiry

## instructor_assignments
  - PAGE:/instructor/instructors/performance

## instructor_attestations
  - API:/certificates/generate
  - API:/instructor/attestations

## instructor_profiles
  - PAGE:/instructor/instructors/performance

## intake_records
  - API:/enrollments/create-enforced
  - API:/intake/workflow

## intakes
  - API:/intakes

## integrations
  - PAGE:/store/integrations

## interactive_quizzes
  - API:/quizzes/[quizId]

## interactive_video_quiz_answers
  - API:/lms/video-quiz-results

## interviews
  - API:/employer/interviews

## invoices
  - API:/stripe/invoice/create
  - PAGE:/billing
  - PAGE:/lms/(app)/settings/billing

## ita_vouchers
  - API:/workforce-board/funding
  - API:/workforce-board/reports
  - PAGE:/admin/funding

## job_applications
  - API:/careers/assessment
  - API:/hr/emails
  - PAGE:/admin/jobs
  - PAGE:/careers/careers/[id]
  - PAGE:/case-manager/analytics
  - PAGE:/case-manager/applications
  - PAGE:/employer/analytics
  - PAGE:/employer/applications
  - PAGE:/employer/company
  - PAGE:/employer/dashboard
  - PAGE:/employer/postings/[id]
  - PAGE:/employer/wotc

## job_opportunities
  - PAGE:/employer/opportunities

## job_placements
  - API:/workforce-board/reports
  - PAGE:/admin/analytics/employers
  - PAGE:/admin/jobs
  - PAGE:/employer/placements
  - PAGE:/employer/reports
  - PAGE:/employer/reports/submit

## job_postings
  - API:/employer/matches
  - PAGE:/admin/analytics/employers
  - PAGE:/admin/jobs
  - PAGE:/careers/careers
  - PAGE:/case-manager/analytics
  - PAGE:/case-manager/applications
  - PAGE:/employer/analytics
  - PAGE:/employer/applications
  - PAGE:/employer/company
  - PAGE:/employer/dashboard
  - PAGE:/employer/jobs
  - PAGE:/employer/postings
  - PAGE:/employer/postings/[id]
  - PAGE:/employer/postings/[id]/edit
  - PAGE:/employer/wotc

## job_queue
  - API:/jobs/process
  - PAGE:/admin/system/jobs

## jobs
  - API:/ai/job-match
  - PAGE:/employer/reports

## jotform_submissions
  - API:/webhooks/jotform

## jri_participants
  - PAGE:/admin/jri/participants
  - PAGE:/admin/jri/reports

## knowledge_documents
  - API:/cron/embed-knowledge

## knowledge_embeddings
  - API:/cron/memory-cleanup

## leaderboard
  - API:/gamification/leaderboard

## leads
  - API:/funnel/lead
  - API:/intake/application
  - API:/intake/apply
  - API:/intake/eligibility
  - API:/intake/interest
  - API:/intake/leads
  - PAGE:/admin/crm
  - PAGE:/admin/crm/crm
  - PAGE:/admin/crm/crm/leads
  - PAGE:/admin/crm/crm/leads/[id]
  - PAGE:/admin/crm/leads
  - PAGE:/admin/reports/leads

## learner_credentials
  - API:/employer/matches
  - API:/provider/export
  - PAGE:/case-manager/dashboard

## learning_activity
  - API:/activity/watch-tick
  - API:/mobile/profile
  - API:/student/streak

## learning_goals
  - API:/activity/watch-tick
  - API:/student/goals
  - API:/student/streak

## learning_paths
  - API:/learning-paths
  - PAGE:/admin/learning-paths

## leave_requests
  - PAGE:/admin/hr
  - PAGE:/admin/hr/leave

## legal_documents
  - PAGE:/legal/acceptable-use
  - PAGE:/legal/creator-agreement
  - PAGE:/legal/eula
  - PAGE:/legal/governance
  - PAGE:/legal/governance/compliance
  - PAGE:/legal/governance/lms-standards
  - PAGE:/legal/governance/onboarding-ux
  - PAGE:/legal/governance/platform-overview
  - PAGE:/legal/governance/security
  - PAGE:/legal/governance/store-payments
  - PAGE:/legal/license-agreement
  - PAGE:/legal/marketplace-terms
  - PAGE:/legal/mou
  - PAGE:/refund-policy

## lesson_answers
  - API:/lessons/[lessonId]/qa

## lesson_competencies
  - API:/lessons/[lessonId]/complete

## lesson_completions
  - API:/learner/dashboard
  - API:/offline/sync
  - API:/student/progress

## lesson_content_blocks
  - API:/courses/authoring/save

## lesson_notes
  - API:/lessons/[lessonId]/notes

## lesson_progress
  - API:/achievements
  - API:/certificates/complete-module
  - API:/certificates/generate
  - API:/certiport-exam/request
  - API:/courses/[courseId]/complete
  - API:/courses/[courseId]/lessons/[lessonId]/progress
  - API:/instructor/attestations
  - API:/instructor/engagement-stats
  - API:/internal/lesson-pace-check
  - API:/learner/progress
  - API:/lms/progress
  - API:/lms/progress/complete
  - API:/lms/submissions/review
  - API:/mobile/courses
  - API:/mobile/profile
  - API:/mobile/summary
  - API:/progress
  - API:/pwa/api-pwa/barber/training
  - API:/pwa/api-pwa/cosmetology/progress
  - API:/pwa/api-pwa/esthetician/progress
  - API:/pwa/api-pwa/nail-tech/progress
  - API:/pwa/barber/training
  - API:/pwa/cosmetology/progress
  - API:/pwa/esthetician/progress
  - API:/pwa/nail-tech/progress
  - API:/users/[userId]/progress
  - API:/video/progress
  - PAGE:/admin/analytics/learning
  - PAGE:/admin/host-shop/dashboard
  - PAGE:/lms/(app)/dashboard
  - PAGE:/portal/[portalKey]
  - PAGE:/programs/hvac-technician/course
  - PAGE:/transcript

## lesson_questions
  - API:/lessons/[lessonId]/qa

## library_resources
  - PAGE:/lms/(app)/library

## license_agreement_acceptances
  - API:/compliance/export
  - API:/compliance/record
  - API:/legal/accept
  - API:/legal/sign
  - API:/onboarding/accept-agreement
  - API:/onboarding/instructor/sign-agreement
  - PAGE:/onboarding/instructor/agreement
  - PAGE:/onboarding/learner
  - PAGE:/onboarding/legal
  - PAGE:/onboarding/mou

## license_events
  - API:/provisioning/tenant
  - API:/trial/begin-onboarding
  - API:/trial/start-managed

## license_leads
  - PAGE:/checkout

## license_purchases
  - API:/store/api-store/licenses/create-payment-intent
  - API:/store/api-store/licenses/get-by-payment
  - API:/store/api-store/licenses/webhook
  - API:/store/licenses/create-payment-intent
  - API:/store/licenses/get-by-payment
  - PAGE:/admin/store

## license_requests
  - API:/license-request
  - API:/licenses/request
  - PAGE:/admin/inbox

## license_tiers
  - PAGE:/license/pricing

## license_validations
  - API:/store/api-store/license/validate
  - API:/store/license/validate

## licenses
  - API:/cron/check-licenses
  - API:/cron/expire-licenses
  - API:/license/upgrade
  - API:/license/webhook
  - API:/onboarding/provision-tenant
  - API:/provisioning/tenant
  - API:/store/api-store/clone
  - API:/store/api-store/license/generate
  - API:/store/api-store/license/validate
  - API:/store/api-store/licenses/get-by-payment
  - API:/store/api-store/licenses/webhook
  - API:/store/api-store/webhook
  - API:/store/clone
  - API:/store/license/generate
  - API:/store/license/validate
  - API:/store/licenses/get-by-payment
  - API:/trial/begin-onboarding
  - PAGE:/admin/billing
  - PAGE:/admin/licenses

## live_chat_messages
  - API:/chat/message
  - API:/chat/messages

## live_chat_sessions
  - API:/chat/message
  - API:/chat/session

## live_classes
  - API:/live-classes

## live_sessions
  - API:/live/zoom

## lms_courses
  - API:/certificates/bulk-issue
  - API:/certificates/issue
  - API:/certificates/pdf
  - API:/checkout/create
  - API:/checkout/learner
  - API:/courses/create
  - API:/courses/save
  - API:/enroll/approve
  - API:/enroll/auto
  - API:/enrollment/documents/complete
  - API:/instructor/campaigns/send
  - API:/instructor/my-students
  - API:/lms/enrollment-status
  - API:/lti/launch
  - API:/programs/[program]/courses
  - API:/public/metrics
  - API:/store/cart-checkout
  - API:/stripe/create-checkout
  - API:/v1/courses
  - API:/verify
  - API:/verify/certificate/[certificateId]
  - API:/webhooks/store
  - PAGE:/admin/accreditation/report
  - PAGE:/admin/staff-portal/courses/create
  - PAGE:/host-shop/dashboard/attendance/record
  - PAGE:/lms/(app)/certification
  - PAGE:/lms/(app)/enroll
  - PAGE:/programs/[program]/courses
  - PAGE:/staff/courses/create

## lms_lessons
  - API:/certiport-exam/request
  - API:/courses/authoring/save
  - API:/lessons/[lessonId]/complete
  - API:/mobile/courses
  - API:/mobile/profile
  - API:/progress
  - PAGE:/programs/hvac-technician/course
  - PAGE:/transcript

## lms_progress
  - API:/cron/career-course-emails
  - API:/cron/end-of-day-summary
  - API:/cron/inactivity-reminders
  - API:/cron/morning-reminders
  - API:/cron/weekly-reminders
  - API:/internal/lesson-pace-check
  - API:/lms/progress/complete
  - API:/lms/progress/start

## lms_sync_log
  - API:/partner/enroll

## locations
  - PAGE:/booking/booking

## login_events
  - API:/events/login

## lti_platforms
  - API:/lti/launch
  - API:/lti/login

## managed_licenses
  - API:/trial/start-managed
  - PAGE:/admin/platform

## marketing_contacts
  - API:/booking/schedule
  - API:/contact
  - PAGE:/admin/crm/contacts
  - PAGE:/admin/crm/crm/contacts

## marketplace_creators
  - API:/webhooks/marketplace
  - PAGE:/admin/marketplace
  - PAGE:/admin/marketplace/creators
  - PAGE:/admin/marketplace/payouts

## marketplace_products
  - API:/checkout/marketplace
  - PAGE:/admin/marketplace
  - PAGE:/admin/marketplace/products
  - PAGE:/creator/products

## marketplace_reports
  - API:/marketplace/report

## marketplace_sales
  - API:/webhooks/marketplace
  - PAGE:/creator/products

## me
  - PAGE:/admin/staff-portal/messages
  - PAGE:/host-shop/dashboard/messages

## media
  - API:/content-library/upload
  - API:/exams/upload-recording
  - API:/media/files

## meeting_action_items
  - API:/recaps/[id]
  - API:/recaps/action-items/[itemId]/toggle
  - API:/recaps/generate

## meeting_recaps
  - API:/recaps/[id]
  - API:/recaps/generate
  - API:/recaps/list

## meetings
  - API:/meetings/create

## messages
  - API:/messages
  - API:/messages/[id]
  - PAGE:/lms/(app)/chat
  - PAGE:/lms/(app)/messages
  - PAGE:/lms/(app)/messages/career
  - PAGE:/lms/(app)/messages/instructor

## micro_class_enrollments
  - API:/micro-classes/webhook

## module_certificates
  - API:/certificates/issue-module
  - API:/courses/complete
  - PAGE:/certificates/verify/[certificateId]
  - PAGE:/verify/verify/[certificateId]

## module_completion_rules
  - API:/internal/course-health

## modules
  - API:/courses/authoring/save
  - API:/learner/dashboard
  - API:/mobile/courses
  - API:/mobile/profile
  - PAGE:/admin/modules
  - PAGE:/transcript

## monitoring_alerts
  - PAGE:/admin/monitoring

## mou_agreements
  - PAGE:/onboarding/school

## mou_documents
  - PAGE:/admin/docs/mou

## mou_signatures
  - API:/partners/barber-host-shop/sign-mou
  - API:/partners/cosmetology-host-shop/sign-mou
  - API:/program-holder/mou-pdf
  - API:/program-holder/mou/sign-typed
  - API:/program-holder/sign-mou
  - PAGE:/admin/mou

## mou_templates
  - API:/admin/mou
  - API:/program-holder/mou-pdf
  - PAGE:/admin/mou

## mous
  - API:/program-holder/mou/download

## nail_partner_applications
  - API:/partners/nail-technician-apprenticeship/my-application

## newsletter_subscribers
  - API:/newsletter

## notes
  - API:/notes
  - API:/notes/[id]

## notification_logs
  - API:/apprentice/email-alerts
  - API:/notifications/broadcast
  - PAGE:/admin/notifications

## notification_outbox
  - API:/intake/apply
  - API:/partner/applications/[id]/approve

## notifications
  - API:/apprenticeship/hours/approve
  - API:/apprenticeship/hours/reject
  - API:/barber/webhook
  - API:/courses/[courseId]/announcements
  - API:/cron/anomaly-detection
  - API:/cron/funding-followup
  - API:/cron/inactivity-reminders
  - API:/cron/morning-reminders
  - API:/cron/onboarding-followup
  - API:/cron/onboarding-reminder
  - API:/cron/process-notifications
  - API:/enroll/approve
  - API:/enroll/auto
  - API:/enroll/complete
  - API:/internal/at-risk-detection
  - API:/internal/hours-pace-check
  - API:/internal/lesson-pace-check
  - API:/internal/missed-clockout
  - API:/jobs/process
  - API:/notifications
  - API:/proctor/sessions/[id]
  - API:/program-holder/notifications/[id]/mark-read
  - API:/timeclock/action
  - PAGE:/admin/autopilot
  - PAGE:/admin/notifications
  - PAGE:/lms/(app)/notifications
  - PAGE:/notifications

## ocr_extractions
  - API:/ocr/extract

## ojt_hours
  - PAGE:/admin/host-shop/dashboard

## ojt_hours_log
  - API:/apprentice/email-alerts
  - API:/ojt/hours

## ojt_reimbursements
  - API:/ojt/submit

## onboarding_documents
  - API:/onboarding/sign-document
  - PAGE:/onboarding/start

## onboarding_packets
  - API:/onboarding/sign-document
  - PAGE:/onboarding/start

## onboarding_progress
  - API:/compliance/export
  - API:/cron/onboarding-followup
  - API:/cron/onboarding-reminder
  - API:/enrollment/approve
  - API:/onboarding/complete-step
  - API:/onboarding/step-complete
  - PAGE:/onboarding/learner/orientation
  - PAGE:/onboarding/start

## onboarding_signatures
  - API:/onboarding/sign-document
  - PAGE:/onboarding/start

## onboarding_submissions
  - API:/onboarding/submit

## operator_tasks
  - API:/operator/tasks
  - PAGE:/admin/platform

## order_items
  - PAGE:/store/success

## orders
  - PAGE:/store/success

## org_invites
  - API:/org/accept-invite
  - API:/org/invite
  - API:/org/invite/[inviteId]

## organization_settings
  - API:/org/create

## organization_subscriptions
  - API:/subscriptions/cancel
  - API:/trials/convert
  - PAGE:/admin/billing
  - PAGE:/admin/billing/subscriptions

## organization_users
  - API:/org/accept-invite
  - API:/org/create
  - API:/org/invite

## organizations
  - API:/cron/trial-lifecycle
  - API:/licenses/checkout
  - API:/operator/chat
  - API:/org/create
  - API:/provisioning/tenant
  - API:/trial/begin-onboarding
  - API:/trial/start-managed
  - API:/trials/convert
  - API:/websites/[websiteId]/publish
  - PAGE:/provider/dashboard
  - PAGE:/provider/settings

## orientation_completions
  - API:/onboarding/instructor/complete-orientation
  - PAGE:/onboarding/instructor/orientation
  - PAGE:/onboarding/learner
  - PAGE:/onboarding/learner/orientation
  - PAGE:/programs/cosmetology-apprenticeship/orientation

## page_sections
  - API:/page-builder/pages/[id]

## page_views
  - PAGE:/application-success
  - PAGE:/apply/confirmation
  - PAGE:/apply/employer/success
  - PAGE:/apply/staff/success
  - PAGE:/payment/affirm/cancel
  - PAGE:/payment/cancel
  - PAGE:/reset/done

## pages
  - API:/page-builder/pages/[id]

## parent_student_links
  - PAGE:/parent-portal
  - PAGE:/parent-portal/dashboard

## participant_barriers
  - PAGE:/admin/barriers

## participant_eligibility
  - API:/wioa/eligibility
  - API:/wioa/reporting

## participant_report
  - PAGE:/admin/reports/wioa

## partner_applications
  - API:/ai/build-remote
  - API:/partner/applications
  - API:/partner/applications/[id]/approve
  - API:/partner/applications/[id]/deny
  - PAGE:/admin/partners
  - PAGE:/admin/partners/applications
  - PAGE:/admin/partners/applications/[id]

## partner_attendance
  - API:/partner/attendance/weekly
  - PAGE:/host-shop/dashboard/attendance

## partner_audit_log
  - API:/pwa/api-pwa/shop-owner/log-hours
  - API:/pwa/shop-owner/log-hours

## partner_certificates
  - PAGE:/verify/verify/[certificateId]

## partner_completions
  - API:/partner/progress
  - PAGE:/admin/reports/charts

## partner_course_enrollments
  - PAGE:/admin/partner-enrollments

## partner_course_mappings
  - API:/partner/enroll

## partner_courses
  - API:/checkout/program
  - PAGE:/programs/catalog

## partner_document_requirements
  - API:/partner/documents

## partner_documents
  - API:/automation/test/partner-approval
  - API:/partner-upload
  - API:/partner/documents
  - API:/partners/upload-document

## partner_enrollment_summary
  - API:/partner/progress

## partner_enrollments
  - API:/courses/complete
  - PAGE:/admin/reports/partners

## partner_export_logs
  - API:/partner/exports/completions

## partner_inquiries
  - API:/partner-inquiry
  - PAGE:/admin/inbox
  - PAGE:/admin/partner-inquiries
  - PAGE:/admin/reports/partners

## partner_lms_courses
  - API:/enrollments/checkout
  - API:/partner-courses/create-checkout
  - API:/partner/courses
  - API:/partner/enroll
  - PAGE:/admin/partners/lms-integrations/[id]
  - PAGE:/lms/(app)/enroll

## partner_lms_enrollments
  - API:/partner-launch/[enrollmentId]
  - API:/partner/enroll
  - API:/student/partner-enrollments
  - API:/webhooks/partners/[partner]
  - PAGE:/admin/partners/lms-integrations/[id]
  - PAGE:/lms/(app)/enroll
  - PAGE:/partner-learning/[enrollmentId]

## partner_lms_providers
  - PAGE:/admin/partners/lms-integrations/[id]
  - PAGE:/workforce-board/dashboard

## partner_lms_sync_logs
  - PAGE:/admin/partners/lms-integrations/[id]

## partner_mous
  - API:/admin/mou
  - API:/automation/test/partner-approval
  - API:/automation/test/shop-routing
  - PAGE:/admin/mou

## partner_program_access
  - API:/partner/apprentices
  - API:/partner/documents
  - PAGE:/host-shop/dashboard/programs

## partner_users
  - API:/apprenticeship/hours/approve
  - API:/apprenticeship/hours/reject
  - API:/competency/pending-reps
  - API:/instructor/attestations
  - API:/partner/apprentices
  - API:/partner/documents
  - API:/partner/hours
  - API:/partner/progress
  - API:/partner/settings
  - API:/partners/upload-document
  - API:/pwa/api-pwa/barber/log-hours
  - API:/pwa/api-pwa/barber/profile
  - API:/pwa/api-pwa/barber/progress
  - API:/pwa/api-pwa/cosmetology/profile
  - API:/pwa/api-pwa/shop-owner/apprentices
  - API:/pwa/api-pwa/shop-owner/apprentices/[id]
  - API:/pwa/api-pwa/shop-owner/approve-hours
  - API:/pwa/api-pwa/shop-owner/dashboard
  - API:/pwa/api-pwa/shop-owner/log-hours
  - API:/pwa/api-pwa/shop-owner/pending-hours
  - API:/pwa/api-pwa/shop-owner/pending-reps
  - API:/pwa/api-pwa/shop-owner/progress
  - API:/pwa/barber/log-hours
  - API:/pwa/barber/profile
  - API:/pwa/barber/progress
  - API:/pwa/cosmetology/profile
  - API:/pwa/shop-owner/apprentices
  - API:/pwa/shop-owner/apprentices/[id]
  - API:/pwa/shop-owner/approve-hours
  - API:/pwa/shop-owner/dashboard
  - API:/pwa/shop-owner/log-hours
  - API:/pwa/shop-owner/pending-hours
  - API:/pwa/shop-owner/pending-reps
  - API:/pwa/shop-owner/progress
  - API:/supervisor/verify-rep
  - PAGE:/host-shop/dashboard
  - PAGE:/host-shop/dashboard/attendance
  - PAGE:/host-shop/dashboard/attendance/record
  - PAGE:/host-shop/dashboard/programs
  - PAGE:/host-shop/dashboard/programs/[program]
  - PAGE:/host-shop/dashboard/settings
  - PAGE:/host-shop/login
  - PAGE:/partner/dashboard

## partners
  - API:/admin/mou
  - API:/automation/test/partner-approval
  - API:/automation/test/shop-routing
  - API:/content/homepage
  - API:/email/campaigns/send
  - API:/mou/cdl
  - API:/mou/employer
  - API:/onboarding/sign-document
  - API:/partner-upload
  - API:/partner/documents
  - API:/partner/onboarding-status
  - API:/partner/settings
  - API:/partners
  - API:/partners/barber-host-shop/my-application
  - API:/partners/barber-host-shop/sign-mou
  - API:/partners/cosmetology-host-shop/my-application
  - API:/partners/cosmetology-host-shop/sign-mou
  - API:/partners/nail-technician-apprenticeship/my-application
  - API:/pwa/api-pwa/barber/progress
  - API:/pwa/api-pwa/cosmetology/progress
  - API:/pwa/api-pwa/esthetician/progress
  - API:/pwa/api-pwa/nail-tech/progress
  - API:/pwa/api-pwa/shop-owner/dashboard
  - API:/pwa/barber/progress
  - API:/pwa/cosmetology/progress
  - API:/pwa/esthetician/progress
  - API:/pwa/nail-tech/progress
  - API:/pwa/shop-owner/dashboard
  - PAGE:/about/partners/partners
  - PAGE:/admin/partners
  - PAGE:/admin/reports/partners
  - PAGE:/host-shop/dashboard/settings
  - PAGE:/partner-upload/[token]

## pathways
  - PAGE:/pathways/pathways/[slug]

## pay_rate_history
  - API:/admin/hr/employees/[id]/pay-rate

## pay_stubs
  - API:/hr/payroll
  - API:/program-holder/payroll/stub/[stubId]/download

## payment_integrity_flags
  - API:/system/reconcile-payment
  - PAGE:/admin/funding-verification
  - PAGE:/admin/integrations/stripe

## payment_logs
  - API:/admin/reports/dashboard-stats
  - API:/apprenticeship/enroll/checkout
  - API:/learner/payments
  - API:/payments/create-session
  - API:/programs/checkout
  - PAGE:/lms/(app)/dashboard
  - PAGE:/lms/(app)/payments

## payment_methods
  - PAGE:/lms/(app)/settings/billing

## payment_options
  - PAGE:/payment

## payment_records
  - API:/licenses/purchase

## payment_splits
  - API:/payments/split

## payment_transactions
  - PAGE:/admin/analytics/revenue

## payments
  - API:/cron/anomaly-detection
  - API:/cron/end-of-day-summary
  - API:/payments
  - API:/sezzle/virtual-card/capture
  - API:/sezzle/virtual-card/process
  - API:/sezzle/webhook

## payout_schedules
  - API:/cron/payment-monitoring
  - API:/cron/payout-deadline-alert

## payroll_profiles
  - API:/admin/hr/employees/[id]/pay-rate
  - API:/onboarding/payroll-setup
  - API:/payroll/w9
  - PAGE:/admin/staff-portal
  - PAGE:/onboarding/start
  - PAGE:/staff

## payroll_runs
  - API:/hr/payroll
  - PAGE:/admin/hr
  - PAGE:/admin/hr/payroll

## performance_reviews
  - PAGE:/admin/hr

## phone_logs
  - API:/phone/call

## placement_records
  - API:/case-manager/placements
  - API:/case-manager/placements/[id]/verify
  - API:/case-manager/reports/wioa/export
  - API:/placements
  - API:/placements/[id]
  - API:/provider/export
  - PAGE:/case-manager/dashboard
  - PAGE:/case-manager/participants/[id]
  - PAGE:/case-manager/placements
  - PAGE:/case-manager/reports/wioa
  - PAGE:/partners/workforce
  - PAGE:/workforce/dashboard

## plan_features
  - API:/admin/subscriptions/plans/features

## platform_apps
  - PAGE:/platform/apps

## platform_events
  - API:/internal/ai-operator
  - API:/internal/workflow-event-processor

## platform_features
  - PAGE:/platform/partner-portal

## platform_settings
  - PAGE:/admin/ferpa/directory-info
  - PAGE:/admin/settings
  - PAGE:/admin/settings/email
  - PAGE:/admin/settings/general
  - PAGE:/admin/settings/notifications
  - PAGE:/admin/settings/payments
  - PAGE:/admin/settings/security
  - PAGE:/admin/settings/site-stats

## point_transactions
  - API:/gamification/points

## practical_requirements
  - API:/lms/practical-requirements

## pricing_plans
  - PAGE:/platform/overview
  - PAGE:/platform/program-holders
  - PAGE:/platform/sponsors

## processed_webhook_events
  - API:/store/api-store/webhook

## product_clones
  - API:/store/api-store/clone-codebase
  - API:/store/clone-codebase

## products
  - API:/store/api-store/checkout
  - API:/store/api-store/clone-codebase
  - API:/store/api-store/create-product
  - API:/store/api-store/products
  - API:/store/api-store/webhook
  - API:/store/cart/sync
  - API:/store/checkout
  - API:/store/clone-codebase
  - API:/store/create-payment-intent
  - API:/store/create-product
  - API:/store/products
  - PAGE:/store/add-ons
  - PAGE:/store/add-ons/analytics-pro
  - PAGE:/store/add-ons/compliance-automation
  - PAGE:/store/checkout/cancel
  - PAGE:/store/guides/capital-readiness/enterprise

## profiles
  - API:/account/notifications
  - API:/account/subscription
  - API:/accreditation/report
  - API:/admin/users
  - API:/ai-instructor
  - API:/applications/[id]/reject
  - API:/apprentice/documents
  - API:/apprenticeship/enroll/checkout
  - API:/apprenticeship/hours/approve
  - API:/apprenticeship/hours/reject
  - API:/apps/upgrade
  - API:/audit-logs
  - API:/auth/check-admin
  - API:/auth/check-role
  - API:/auth/landing
  - API:/auth/verify-admin-role
  - API:/automation/test/document-processing
  - API:/automation/test/partner-approval
  - API:/automation/test/shop-routing
  - API:/barber/activate-subscription
  - API:/barber/setup-intent
  - API:/barber/webhook
  - API:/blog/generate
  - API:/blog/posts
  - API:/board/referrals
  - API:/booth-rental/checkout
  - API:/careers/assessment
  - API:/case-manager/participants/[id]
  - API:/case-manager/placements
  - API:/case-manager/placements/[id]/verify
  - API:/case-manager/reports/wioa/export
  - API:/case-manager/students
  - API:/cases/[caseId]
  - API:/cases/[caseId]/signatures
  - API:/certificates/bulk-issue
  - API:/certificates/download
  - API:/certificates/generate
  - API:/certificates/issue
  - API:/certificates/issue-module
  - API:/certificates/issue-program
  - API:/certificates/replace
  - API:/certificates/revocations
  - API:/certiport-exam/assign-voucher
  - API:/certiport-exam/request
  - API:/compliance-audit
  - API:/compliance/evidence
  - API:/compliance/export
  - API:/compliance/record
  - API:/compliance/report
  - API:/content-library
  - API:/content-library/[id]
  - API:/content-library/upload
  - API:/cosmetology/activate-subscription
  - API:/cosmetology/setup-intent
  - API:/courses
  - API:/courses/[courseId]
  - API:/courses/[courseId]/complete
  - API:/courses/[courseId]/leaderboard
  - API:/courses/[courseId]/reviews
  - API:/courses/authoring
  - API:/courses/complete
  - API:/courses/create
  - API:/courses/save
  - API:/credentials/exam-checkout
  - API:/crm/campaigns/send
  - API:/cron/low-hours-pace
  - API:/cron/missed-checkins
  - API:/cron/onboarding-reminder
  - API:/debug/supabase
  - API:/delegate/notes/add
  - API:/delegates/add
  - API:/delegates/holders
  - API:/delegates/list
  - API:/delegates/update
  - API:/demo/reset
  - API:/discussions/reply
  - API:/documents/ai-prefill
  - API:/documents/upload
  - API:/documents/verify
  - API:/documents/verify/bulk
  - API:/email-marketing/campaigns/schedule
  - API:/email-marketing/campaigns/send
  - API:/emails/welcome
  - API:/employer-sponsorship
  - API:/employer/hours
  - API:/employer/hours/approve
  - API:/employer/interviews
  - API:/employer/matches
  - API:/employer/reports/submit
  - API:/employer/workforce/live
  - API:/enroll/apply
  - API:/enroll/approve
  - API:/enroll/auto
  - API:/enroll/checkout
  - API:/enroll/complete
  - API:/enroll/finalize-payment
  - API:/enrollment/status
  - API:/enrollment/submit-documents
  - API:/enrollments/complete-program
  - API:/etpl/export
  - API:/forums/[forumId]
  - API:/forums/[forumId]/threads/[threadId]
  - API:/funding/create-checkout
  - API:/gamification/badges
  - API:/gamification/leaderboard
  - API:/grade/upsert
  - API:/hr/emails
  - API:/identity/upload-manual
  - API:/identity/verify-ssn
  - API:/instructor/attestations
  - API:/instructor/campaigns/send
  - API:/instructor/my-students
  - API:/instructors/available
  - API:/intake
  - API:/intake/workflow
  - API:/intakes
  - API:/internal/at-risk-detection
  - API:/internal/course-health
  - API:/internal/dropout-score
  - API:/internal/orphan-check
  - API:/internal/service-health
  - API:/leaderboard/global
  - API:/learner/dashboard
  - API:/legal/sign
  - API:/license/upgrade
  - API:/licenses/checkout
  - API:/live-classes
  - API:/lms/enrollment-status
  - API:/lms/evidence/[evidenceId]/review
  - API:/lms/progress/complete
  - API:/lms/quizzes/[quizId]/start
  - API:/lms/recommendations
  - API:/lms/submissions/review
  - API:/media/buckets
  - API:/media/delete
  - API:/media/enhance-video
  - API:/media/enhance-video-full
  - API:/meetings/create
  - API:/mobile/profile
  - API:/monitoring/bundle
  - API:/next-steps
  - API:/ojt/submit
  - API:/onboarding/accept-agreement
  - API:/onboarding/complete
  - API:/onboarding/complete-step
  - API:/onboarding/instructor/complete-orientation
  - API:/onboarding/instructor/sign-agreement
  - API:/onboarding/payroll-setup
  - API:/onboarding/provision-tenant
  - API:/onboarding/sign-document
  - API:/org/invite
  - API:/outreach/send
  - API:/partner/applications
  - API:/partner/applications/[id]/approve
  - API:/partner/attendance
  - API:/partner/courses
  - API:/partner/enroll
  - API:/partner/enrollments
  - API:/payments
  - API:/payments/create-session
  - API:/payroll/export
  - API:/placements
  - API:/privacy/delete
  - API:/privacy/export
  - API:/proctor/sessions
  - API:/proctor/sessions/[id]
  - API:/profile/update
  - API:/program-holder/acknowledge-handbook
  - API:/program-holder/acknowledge-rights
  - API:/program-holder/campaigns/send
  - API:/program-holder/create-verification
  - API:/program-holder/documents/upload
  - API:/program-holder/enroll-participant
  - API:/program-holder/hours
  - API:/program-holder/hours/approve
  - API:/program-holder/me
  - API:/program-holder/mou-data
  - API:/program-holder/mou/download
  - API:/program-holder/mou/sign
  - API:/program-holder/mou/sign-typed
  - API:/program-holder/notification-preferences
  - API:/program-holder/onboarding-complete
  - API:/program-holder/profile
  - API:/program-holder/reports/submit
  - API:/program-holder/settings
  - API:/program-holder/setup
  - API:/program-holder/sign-mou
  - API:/program-holder/status
  - API:/program-holder/students
  - API:/program-holder/students/accept
  - API:/program-holder/students/decline
  - API:/program-holder/upload-license
  - API:/programs/[program]/external-courses/[courseId]/checkout
  - API:/programs/checkout
  - API:/programs/enroll/checkout
  - API:/provider/export
  - API:/provider/programs/list
  - API:/provider/programs/submit
  - API:/public/metrics
  - API:/pwa/api-pwa/barber/profile
  - API:/pwa/api-pwa/barber/progress
  - API:/pwa/api-pwa/cosmetology/profile
  - API:/pwa/api-pwa/shop-owner/apprentices
  - API:/pwa/api-pwa/shop-owner/apprentices/[id]
  - API:/pwa/api-pwa/shop-owner/dashboard
  - API:/pwa/api-pwa/shop-owner/pending-reps
  - API:/pwa/api-pwa/shop-owner/progress
  - API:/pwa/barber/profile
  - API:/pwa/barber/progress
  - API:/pwa/cosmetology/profile
  - API:/pwa/shop-owner/apprentices
  - API:/pwa/shop-owner/apprentices/[id]
  - API:/pwa/shop-owner/dashboard
  - API:/pwa/shop-owner/pending-reps
  - API:/pwa/shop-owner/progress
  - API:/r2/upload
  - API:/recaps/[id]
  - API:/recaps/action-items/[itemId]/toggle
  - API:/recaps/generate
  - API:/recaps/list
  - API:/reporting/dol-dwd
  - API:/reporting/recent-activity
  - API:/reviews
  - API:/reviews/[id]/respond
  - API:/scorm/enrollment/[enrollmentId]
  - API:/scorm/upload
  - API:/shop/apply
  - API:/signature/documents
  - API:/soc/mark
  - API:/social-media/generate
  - API:/social/schedule
  - API:/store/api-store/process-queue
  - API:/store/license/generate
  - API:/store/platform-checkout
  - API:/store/process-queue
  - API:/subscriptions/cancel
  - API:/supervisor/claim-account
  - API:/supervisor/verify-rep
  - API:/support/tickets
  - API:/support/tickets/[id]
  - API:/system/reconcile-payment
  - API:/tenants/create
  - API:/testing/bookings/[id]
  - API:/time/approve
  - API:/time/export
  - API:/timeclock/action
  - API:/timeclock/context
  - API:/upload
  - API:/users/[userId]/progress
  - API:/v1/enrollments
  - API:/v1/import
  - API:/v1/users
  - API:/verify
  - API:/verify/certificate/[certificateId]
  - API:/webhooks/exam-payment
  - API:/webhooks/stripe
  - API:/webhooks/stripe/career-courses
  - API:/workforce-referral
  - API:/workone/[id]
  - API:/workone/list
  - API:/workone/seed
  - API:/wotc/update
  - API:/xapi/statement
  - PAGE:/account
  - PAGE:/account/billing
  - PAGE:/account/settings/notifications
  - PAGE:/achievements
  - PAGE:/admin/accreditation/report
  - PAGE:/admin/activity
  - PAGE:/admin/analytics
  - PAGE:/admin/analytics/analytics
  - PAGE:/admin/analytics/engagement
  - PAGE:/admin/analytics/learning
  - PAGE:/admin/at-risk
  - PAGE:/admin/autopilot
  - PAGE:/admin/barber-shop-applications
  - PAGE:/admin/blog
  - PAGE:/admin/certificates
  - PAGE:/admin/certificates/bulk
  - PAGE:/admin/cmi
  - PAGE:/admin/compliance/deletions
  - PAGE:/admin/compliance/exports
  - PAGE:/admin/crm
  - PAGE:/admin/crm/campaigns
  - PAGE:/admin/crm/crm
  - PAGE:/admin/crm/crm/campaigns
  - PAGE:/admin/delegates
  - PAGE:/admin/docs
  - PAGE:/admin/documents/review
  - PAGE:/admin/enrollments
  - PAGE:/admin/exam-authorizations
  - PAGE:/admin/external-course-completions
  - PAGE:/admin/external-progress
  - PAGE:/admin/ferpa
  - PAGE:/admin/ferpa/training
  - PAGE:/admin/funding
  - PAGE:/admin/grants/submissions
  - PAGE:/admin/grants/workflow
  - PAGE:/admin/host-shop/dashboard
  - PAGE:/admin/hr/leave
  - PAGE:/admin/hr/payroll
  - PAGE:/admin/integrations/google-classroom
  - PAGE:/admin/notifications
  - PAGE:/admin/partner-enrollments
  - PAGE:/admin/partner-inquiries
  - PAGE:/admin/partners/lms-integrations
  - PAGE:/admin/payout-queue
  - PAGE:/admin/payroll-cards
  - PAGE:/admin/program-holder-documents
  - PAGE:/admin/program-holders/verification
  - PAGE:/admin/provider-applications
  - PAGE:/admin/providers
  - PAGE:/admin/reports
  - PAGE:/admin/reports/caseload
  - PAGE:/admin/reports/enrollment
  - PAGE:/admin/reports/financial
  - PAGE:/admin/reports/leads
  - PAGE:/admin/reports/partners
  - PAGE:/admin/reports/samples
  - PAGE:/admin/reports/users
  - PAGE:/admin/review-queue
  - PAGE:/admin/shops/geocoding
  - PAGE:/admin/staff-portal
  - PAGE:/admin/staff-portal/attendance
  - PAGE:/admin/staff-portal/attendance/record
  - PAGE:/admin/staff-portal/attendance/take
  - PAGE:/admin/staff-portal/dashboard
  - PAGE:/admin/staff-portal/settings
  - PAGE:/admin/staff-portal/users
  - PAGE:/admin/student-hours
  - PAGE:/admin/students
  - PAGE:/admin/submissions
  - PAGE:/admin/submissions/attachments
  - PAGE:/admin/submissions/compliance
  - PAGE:/admin/submissions/content
  - PAGE:/admin/submissions/exceptions
  - PAGE:/admin/submissions/facts
  - PAGE:/admin/submissions/org
  - PAGE:/admin/submissions/partners
  - PAGE:/admin/submissions/past-performance
  - PAGE:/admin/submissions/templates
  - PAGE:/admin/system/jobs
  - PAGE:/admin/system/webhooks
  - PAGE:/admin/timeclock
  - PAGE:/admin/verifications
  - PAGE:/admin/verifications/review
  - PAGE:/admin/wioa/documents
  - PAGE:/admin/workone-queue
  - PAGE:/analytics
  - PAGE:/apprentice
  - PAGE:/auth/reset-password
  - PAGE:/auth/set-password
  - PAGE:/case-manager/candidates
  - PAGE:/case-manager/dashboard
  - PAGE:/case-manager/participants
  - PAGE:/case-manager/participants/[id]
  - PAGE:/case-manager/reports/wioa
  - PAGE:/dashboard
  - PAGE:/employer/candidates
  - PAGE:/employer/company
  - PAGE:/employer/dashboard
  - PAGE:/employer/jobs
  - PAGE:/employer/placements
  - PAGE:/employer/settings
  - PAGE:/ferpa
  - PAGE:/funding/confirm
  - PAGE:/host-shop/dashboard
  - PAGE:/host-shop/dashboard/attendance
  - PAGE:/host-shop/dashboard/attendance/record
  - PAGE:/host-shop/dashboard/board
  - PAGE:/host-shop/dashboard/programs
  - PAGE:/host-shop/dashboard/programs/[program]
  - PAGE:/host-shop/dashboard/settings
  - PAGE:/host-shop/login
  - PAGE:/lms/(app)/achievements
  - PAGE:/lms/(app)/certificates
  - PAGE:/lms/(app)/chat
  - PAGE:/lms/(app)/collaborate/meetings
  - PAGE:/lms/(app)/enrollment-pending
  - PAGE:/lms/(app)/grades
  - PAGE:/lms/(app)/integrations
  - PAGE:/lms/(app)/learning-paths
  - PAGE:/lms/(app)/orientation
  - PAGE:/lms/(app)/placement
  - PAGE:/lms/(app)/portfolio
  - PAGE:/lms/(app)/profile
  - PAGE:/lms/(app)/settings
  - PAGE:/lms/(app)/settings/billing
  - PAGE:/lms/(app)/settings/notifications
  - PAGE:/lms/(app)/settings/profile
  - PAGE:/login
  - PAGE:/onboarding
  - PAGE:/onboarding/employer/hiring-needs
  - PAGE:/onboarding/instructor/agreement
  - PAGE:/onboarding/instructor/orientation
  - PAGE:/onboarding/learner
  - PAGE:/onboarding/learner/complete
  - PAGE:/onboarding/learner/funding
  - PAGE:/onboarding/learner/orientation
  - PAGE:/onboarding/learner/schedule
  - PAGE:/onboarding/legal
  - PAGE:/onboarding/mou
  - PAGE:/onboarding/payroll-setup
  - PAGE:/onboarding/school
  - PAGE:/onboarding/school/orientation
  - PAGE:/onboarding/start
  - PAGE:/parent-portal/dashboard
  - PAGE:/partner/dashboard
  - PAGE:/partners/workforce
  - PAGE:/portal/[portalKey]
  - PAGE:/programs/[program]/discussions
  - PAGE:/programs/cosmetology-apprenticeship/orientation
  - PAGE:/provider/compliance
  - PAGE:/provider/dashboard
  - PAGE:/provider/programs
  - PAGE:/provider/settings
  - PAGE:/staff
  - PAGE:/staff/attendance/record
  - PAGE:/staff/attendance/take
  - PAGE:/staff/dashboard
  - PAGE:/staff/students
  - PAGE:/staff/users
  - PAGE:/store/checkout
  - PAGE:/transcript
  - PAGE:/tutoring
  - PAGE:/unauthorized
  - PAGE:/update-password
  - PAGE:/workforce-board/dashboard
  - PAGE:/workforce/dashboard
  - PAGE:/workforce/participants

## program_certification_pathways
  - API:/certification/pathways

## program_competency_domains
  - API:/lms/courses/[courseId]/exam-readiness

## program_completion
  - API:/employer/matches
  - API:/provider/export

## program_completion_certificates
  - API:/achievements
  - API:/reports/completions
  - API:/workforce-board/reports
  - PAGE:/admin/analytics
  - PAGE:/admin/analytics/analytics
  - PAGE:/admin/analytics/learning
  - PAGE:/admin/analytics/programs
  - PAGE:/admin/certificates
  - PAGE:/admin/reports
  - PAGE:/analytics
  - PAGE:/certificates/verify/[certificateId]
  - PAGE:/portal/[portalKey]
  - PAGE:/success-stories/success-stories
  - PAGE:/verify/verify/[certificateId]

## program_courses
  - PAGE:/programs/[program]/training

## program_credentials
  - API:/lessons/[lessonId]/complete
  - API:/lms/progress/complete

## program_discussion_replies
  - API:/discussions/reply
  - PAGE:/programs/[program]/discussions/[threadId]

## program_discussions
  - API:/discussions/like
  - PAGE:/programs/[program]/discussions
  - PAGE:/programs/[program]/discussions/[threadId]

## program_enrollments
  - API:/account/export
  - API:/accreditation/report
  - API:/achievements
  - API:/admin/reports/dashboard-stats
  - API:/affirm/webhook
  - API:/ai-instructor
  - API:/apprentice/program-slug
  - API:/apprenticeship/enroll/checkout
  - API:/attendance/verify
  - API:/barber/setup-intent
  - API:/barber/webhook
  - API:/billing/portal
  - API:/case-manager/participants/[id]
  - API:/case-manager/students
  - API:/certificates/bulk-issue
  - API:/certificates/complete-module
  - API:/certificates/generate
  - API:/certificates/issue
  - API:/certificates/issue-program
  - API:/certificates/replace
  - API:/certiport-exam/request
  - API:/checkout/create
  - API:/compliance-audit
  - API:/compliance/report
  - API:/cosmetology/setup-intent
  - API:/courses/[courseId]/announcements
  - API:/courses/[courseId]/check-completion
  - API:/courses/[courseId]/complete
  - API:/courses/[courseId]/lessons/public
  - API:/cron/barber-reinstate
  - API:/cron/enrollment-automation
  - API:/cron/low-hours-pace
  - API:/debug/supabase
  - API:/demo/reset
  - API:/documents/verify
  - API:/emails/welcome
  - API:/employer-sponsorship
  - API:/enroll/approve
  - API:/enroll/auto
  - API:/enroll/checkout
  - API:/enroll/cna
  - API:/enroll/complete
  - API:/enroll/finalize-payment
  - API:/enrollment-count
  - API:/enrollment-stats
  - API:/enrollment/complete-orientation
  - API:/enrollment/documents/complete
  - API:/enrollment/next-action
  - API:/enrollment/orientation/complete
  - API:/enrollment/reevaluate
  - API:/enrollment/save-progress
  - API:/enrollment/status
  - API:/enrollment/submit-documents
  - API:/enrollment/upload-document
  - API:/enrollments
  - API:/enrollments/[id]
  - API:/enrollments/checkout
  - API:/enrollments/complete-program
  - API:/enrollments/create
  - API:/enrollments/create-enforced
  - API:/instructor/course-performance
  - API:/internal/lesson-pace-check
  - API:/learner/payments
  - API:/learner/progress
  - API:/lessons/[lessonId]/checkpoint
  - API:/lessons/[lessonId]/complete
  - API:/lessons/[lessonId]/ojt-log
  - API:/lms/evidence
  - API:/lms/progress/complete
  - API:/lms/progress/start
  - API:/lms/quizzes/[quizId]/start
  - API:/lms/recommendations
  - API:/lms/submissions
  - API:/lms/submissions/review
  - API:/mobile/courses
  - API:/mobile/profile
  - API:/mobile/summary
  - API:/offline/sync
  - API:/onboarding/complete
  - API:/onboarding/complete-step
  - API:/outcomes/stats
  - API:/partner/attendance
  - API:/partner/enrollments
  - API:/payments/split
  - API:/program-holder/enroll-participant
  - API:/progress
  - API:/provider/export
  - API:/public/metrics
  - API:/pwa/api-pwa/barber/progress
  - API:/pwa/api-pwa/cosmetology/progress
  - API:/pwa/api-pwa/esthetician/progress
  - API:/pwa/api-pwa/nail-tech/progress
  - API:/pwa/barber/progress
  - API:/pwa/cosmetology/progress
  - API:/pwa/esthetician/progress
  - API:/pwa/nail-tech/progress
  - API:/quizzes/[quizId]
  - API:/reporting/dol-dwd
  - API:/reporting/recent-activity
  - API:/reports/enrollments
  - API:/reports/funding
  - API:/reports/wioa-quarterly
  - API:/scorm/tracking
  - API:/sezzle/webhook
  - API:/student/dashboard
  - API:/student/enrollments
  - API:/student/hours
  - API:/student/log-hours
  - API:/student/progress
  - API:/system/reconcile-payment
  - API:/timeclock/action
  - API:/timeclock/context
  - API:/users/[userId]/progress
  - API:/v1/enrollments
  - API:/webhooks/partners/[partner]
  - API:/webhooks/store
  - API:/webhooks/stripe
  - API:/wioa/reporting
  - PAGE:/admin/accreditation/report
  - PAGE:/admin/analytics
  - PAGE:/admin/analytics/analytics
  - PAGE:/admin/analytics/learning
  - PAGE:/admin/analytics/programs
  - PAGE:/admin/at-risk
  - PAGE:/admin/autopilot
  - PAGE:/admin/certificates/bulk
  - PAGE:/admin/enrollments
  - PAGE:/admin/funding
  - PAGE:/admin/host-shop/dashboard
  - PAGE:/admin/integrations/stripe
  - PAGE:/admin/intelligence/forecast
  - PAGE:/admin/jri
  - PAGE:/admin/payout-queue
  - PAGE:/admin/reports
  - PAGE:/admin/reports/caseload
  - PAGE:/admin/reports/samples
  - PAGE:/admin/reports/wioa
  - PAGE:/admin/staff-portal/attendance/record
  - PAGE:/admin/staff-portal/courses
  - PAGE:/admin/staff-portal/dashboard
  - PAGE:/admin/students
  - PAGE:/analytics
  - PAGE:/apprentice/competencies/log
  - PAGE:/apprentice/hours
  - PAGE:/apprentice/hours/log
  - PAGE:/apprentice/state-board
  - PAGE:/calendar/calendar
  - PAGE:/case-manager/candidates
  - PAGE:/case-manager/dashboard
  - PAGE:/case-manager/participants
  - PAGE:/case-manager/participants/[id]
  - PAGE:/certiport-exam/certiport-exam
  - PAGE:/employer/candidates
  - PAGE:/enrollment/confirmed
  - PAGE:/enrollment/documents
  - PAGE:/enrollment/orientation
  - PAGE:/ferpa
  - PAGE:/lms/(app)/achievements
  - PAGE:/lms/(app)/analytics
  - PAGE:/lms/(app)/assignments
  - PAGE:/lms/(app)/attendance
  - PAGE:/lms/(app)/badges
  - PAGE:/lms/(app)/calendar
  - PAGE:/lms/(app)/certification
  - PAGE:/lms/(app)/dashboard
  - PAGE:/lms/(app)/enroll
  - PAGE:/lms/(app)/enrollment-pending
  - PAGE:/lms/(app)/grades
  - PAGE:/lms/(app)/integrations
  - PAGE:/lms/(app)/learning-paths
  - PAGE:/lms/(app)/library
  - PAGE:/lms/(app)/payments
  - PAGE:/lms/(app)/portfolio
  - PAGE:/lms/(app)/profile
  - PAGE:/lms/(app)/programs
  - PAGE:/lms/(app)/progress
  - PAGE:/lms/(app)/quizzes
  - PAGE:/lms/(app)/schedule
  - PAGE:/onboarding/learner
  - PAGE:/onboarding/learner/complete
  - PAGE:/onboarding/learner/orientation
  - PAGE:/parent-portal/dashboard
  - PAGE:/partners/workforce
  - PAGE:/portal/[portalKey]
  - PAGE:/programs/[program]/discussions
  - PAGE:/programs/[program]/discussions/[threadId]
  - PAGE:/programs/[program]/documents
  - PAGE:/programs/[program]/enrollment-success
  - PAGE:/programs/[program]/training
  - PAGE:/programs/barber-apprenticeship/documents
  - PAGE:/programs/barber-apprenticeship/enrollment-success
  - PAGE:/programs/cosmetology-apprenticeship/enrollment-success
  - PAGE:/programs/cosmetology-apprenticeship/orientation
  - PAGE:/programs/esthetician-apprenticeship/enrollment-success
  - PAGE:/provider/dashboard
  - PAGE:/staff/attendance/record
  - PAGE:/staff/courses
  - PAGE:/staff/dashboard
  - PAGE:/success-stories/success-stories
  - PAGE:/transcript
  - PAGE:/workforce-board/dashboard
  - PAGE:/workforce/dashboard

## program_exam_ready_rules
  - API:/lms/courses/[courseId]/exam-readiness

## program_external_completions
  - PAGE:/programs/[program]/training

## program_external_courses
  - API:/external-pathways/[courseId]/complete
  - API:/programs/[program]/external-courses
  - API:/programs/[program]/external-courses/[courseId]/checkout
  - API:/programs/[program]/external-courses/[courseId]/complete
  - PAGE:/lms/(app)/dashboard
  - PAGE:/programs/[program]/training

## program_holder_acknowledgements
  - API:/partners/barber-host-shop/policy-acknowledgment
  - API:/partners/cosmetology-host-shop/policy-acknowledgment
  - API:/program-holder/acknowledge-agreement
  - API:/program-holder/acknowledge-handbook
  - API:/program-holder/acknowledge-rights
  - API:/program-holder/documents/upload
  - API:/program-holder/onboarding-complete
  - PAGE:/admin/program-holder-acknowledgements

## program_holder_banking
  - PAGE:/admin/program-holders/verification

## program_holder_call_log
  - API:/program-holder/call-log

## program_holder_documents
  - API:/program-holder/documents/upload
  - API:/program-holder/onboarding-complete
  - PAGE:/admin/program-holder-documents
  - PAGE:/admin/program-holders/verification

## program_holder_notes
  - API:/delegate/notes/add

## program_holder_programs
  - PAGE:/admin/program-holders

## program_holder_students
  - API:/program-holder/call-log
  - API:/program-holder/students/accept
  - API:/program-holder/students/decline

## program_holder_verification
  - API:/identity/upload-manual
  - API:/identity/verify-ssn
  - API:/program-holder/create-verification
  - API:/webhooks/stripe-identity

## program_holders
  - API:/delegates/holders
  - API:/enroll/approve
  - API:/identity/upload-manual
  - API:/identity/verify-ssn
  - API:/program-holder/call-log
  - API:/program-holder/create-verification
  - API:/program-holder/documents/upload
  - API:/program-holder/enroll-participant
  - API:/program-holder/hours
  - API:/program-holder/hours/approve
  - API:/program-holder/me
  - API:/program-holder/mou-data
  - API:/program-holder/mou/download
  - API:/program-holder/mou/sign
  - API:/program-holder/mou/sign-typed
  - API:/program-holder/onboarding-complete
  - API:/program-holder/reports/submit
  - API:/program-holder/settings
  - API:/program-holder/setup
  - API:/program-holder/sign-mou
  - API:/program-holder/status
  - API:/program-holder/students
  - API:/program-holder/students/accept
  - API:/program-holder/students/decline
  - API:/program-holder/upload-license
  - API:/time/approve
  - API:/time/export
  - PAGE:/admin/payout-queue
  - PAGE:/admin/program-holder-acknowledgements
  - PAGE:/admin/program-holders
  - PAGE:/admin/program-holders/verification

## program_licenses
  - API:/licenses/purchase
  - API:/partner/courses

## program_outcomes
  - API:/programs/[program]

## program_pricing
  - API:/programs/pricing

## program_requirements
  - API:/programs/[program]

## programs
  - API:/accreditation/report
  - API:/admin/reports/dashboard-stats
  - API:/applications
  - API:/apprentice/program-slug
  - API:/barber/webhook
  - API:/blog/generate
  - API:/board/compliance-report
  - API:/certificates/generate
  - API:/checkout/learner
  - API:/checkout/program
  - API:/cosmetology/webhook
  - API:/debug/supabase
  - API:/demo/reset
  - API:/employer/matches
  - API:/enroll/apply
  - API:/enroll/approve
  - API:/enroll/auto
  - API:/enroll/checkout
  - API:/enroll/cna
  - API:/enrollment/documents/complete
  - API:/enrollments/create-enforced
  - API:/funding/create-checkout
  - API:/funnel/programs
  - API:/intake/application
  - API:/internal/program-proof/[slug]
  - API:/internal/system-health
  - API:/licenses/purchase
  - API:/outcomes/stats
  - API:/payments/create-session
  - API:/program-holder/enroll-participant
  - API:/programs
  - API:/programs/[program]
  - API:/programs/[program]/external-courses
  - API:/programs/[program]/external-courses/[courseId]/checkout
  - API:/programs/[program]/external-courses/[courseId]/complete
  - API:/programs/checkout
  - API:/programs/enroll/checkout
  - API:/programs/featured
  - API:/programs/list
  - API:/provider/export
  - API:/provider/programs/submit
  - API:/pwa/api-pwa/cosmetology/progress
  - API:/pwa/api-pwa/esthetician/progress
  - API:/pwa/api-pwa/nail-tech/progress
  - API:/pwa/cosmetology/progress
  - API:/pwa/esthetician/progress
  - API:/pwa/nail-tech/progress
  - API:/sezzle/virtual-card/process
  - PAGE:/admin/accreditation/report
  - PAGE:/admin/analytics
  - PAGE:/admin/analytics/analytics
  - PAGE:/admin/analytics/learning
  - PAGE:/admin/analytics/programs
  - PAGE:/admin/certificates
  - PAGE:/admin/cohorts
  - PAGE:/admin/curriculum
  - PAGE:/admin/intelligence/forecast
  - PAGE:/admin/modules
  - PAGE:/admin/programs
  - PAGE:/admin/programs/catalog
  - PAGE:/admin/reports/charts
  - PAGE:/admin/reports/samples
  - PAGE:/admin/staff-portal/courses
  - PAGE:/admin/student-hours
  - PAGE:/admin/students/export
  - PAGE:/advising
  - PAGE:/analytics
  - PAGE:/apply
  - PAGE:/calendar/calendar
  - PAGE:/careers/careers
  - PAGE:/compliance/wioa
  - PAGE:/employer/programs/[id]
  - PAGE:/enroll/[programId]
  - PAGE:/funding/grant-programs
  - PAGE:/host-shop/dashboard/programs
  - PAGE:/host-shop/dashboard/programs/[program]
  - PAGE:/lms/(app)/apply
  - PAGE:/onboarding/learner
  - PAGE:/partners/barber-host-shop/apply
  - PAGE:/partners/workforce
  - PAGE:/pathways/pathways/outcomes
  - PAGE:/pricing
  - PAGE:/programs/[program]
  - PAGE:/programs/[program]/courses
  - PAGE:/programs/[program]/discussions
  - PAGE:/programs/[program]/discussions/[threadId]
  - PAGE:/programs/[program]/training
  - PAGE:/provider/dashboard
  - PAGE:/provider/programs
  - PAGE:/staff/courses
  - PAGE:/thankyou
  - PAGE:/tuition-fees
  - PAGE:/workforce-board/dashboard
  - PAGE:/workforce/dashboard

## progress
  - API:/case-manager/participants/[id]

## progress_entries
  - API:/cron/missed-checkins
  - API:/employer/workforce/live
  - API:/internal/missed-clockout
  - API:/partner/apprentices
  - API:/pwa/api-pwa/barber/history
  - API:/pwa/api-pwa/barber/log-hours
  - API:/pwa/api-pwa/barber/profile
  - API:/pwa/api-pwa/barber/progress
  - API:/pwa/api-pwa/barber/training
  - API:/pwa/api-pwa/cosmetology/history
  - API:/pwa/api-pwa/cosmetology/profile
  - API:/pwa/api-pwa/shop-owner/apprentices
  - API:/pwa/api-pwa/shop-owner/apprentices/[id]
  - API:/pwa/api-pwa/shop-owner/approve-hours
  - API:/pwa/api-pwa/shop-owner/dashboard
  - API:/pwa/api-pwa/shop-owner/log-hours
  - API:/pwa/api-pwa/shop-owner/pending-hours
  - API:/pwa/api-pwa/shop-owner/progress
  - API:/pwa/barber/history
  - API:/pwa/barber/log-hours
  - API:/pwa/barber/profile
  - API:/pwa/barber/progress
  - API:/pwa/barber/training
  - API:/pwa/cosmetology/history
  - API:/pwa/cosmetology/profile
  - API:/pwa/shop-owner/apprentices
  - API:/pwa/shop-owner/apprentices/[id]
  - API:/pwa/shop-owner/approve-hours
  - API:/pwa/shop-owner/dashboard
  - API:/pwa/shop-owner/log-hours
  - API:/pwa/shop-owner/pending-hours
  - API:/pwa/shop-owner/progress
  - API:/timeclock/action
  - API:/timeclock/context
  - API:/timeclock/heartbeat
  - PAGE:/admin/apprenticeships
  - PAGE:/admin/timeclock
  - PAGE:/apprentice/timeclock

## promo_codes
  - API:/checkout/career-courses
  - API:/promo-codes/validate

## provider_application_documents
  - API:/admin/provider-applications/documents
  - API:/provider/apply

## provider_applications
  - API:/payroll/w9
  - API:/provider/applications/[appId]/review
  - API:/provider/apply
  - PAGE:/admin/provider-applications
  - PAGE:/admin/providers

## provider_compliance_artifacts
  - PAGE:/provider/compliance
  - PAGE:/provider/dashboard

## provider_exports
  - API:/provider/export

## provider_onboarding_steps
  - PAGE:/provider/dashboard

## provider_program_approvals
  - API:/provider/programs/[id]/review
  - API:/provider/programs/list
  - API:/provider/programs/submit

## provisioning_jobs
  - API:/cron/process-provisioning-jobs
  - PAGE:/admin/platform

## public_ai_tutor_logs
  - API:/ai-tutor/public

## public_job_board
  - PAGE:/jobs/jobs

## purchases
  - API:/store/api-store/download/[productId]
  - API:/store/api-store/webhook
  - API:/store/download/[productId]
  - API:/webhooks/store
  - PAGE:/admin/store
  - PAGE:/store/success

## push_notification_send_log
  - API:/notifications/send

## push_subscriptions
  - API:/notifications/broadcast
  - API:/notifications/subscribe
  - API:/notifications/unsubscribe
  - API:/push/send
  - API:/push/subscribe
  - API:/push/unsubscribe

## qa_checklist_completions
  - PAGE:/admin/staff-portal/qa-checklist
  - PAGE:/staff/qa-checklist

## qa_checklists
  - PAGE:/admin/staff-portal/qa-checklist
  - PAGE:/staff/qa-checklist

## quiz_attempt_answers
  - API:/lms/quizzes/[quizId]/submit

## quiz_attempts
  - API:/achievements
  - API:/lessons/[lessonId]/complete
  - API:/lms/quizzes/[quizId]/start
  - API:/lms/quizzes/[quizId]/submit
  - API:/quizzes/[quizId]
  - PAGE:/lms/(app)/achievements
  - PAGE:/lms/(app)/analytics
  - PAGE:/lms/(app)/badges
  - PAGE:/lms/(app)/dashboard
  - PAGE:/lms/(app)/grades
  - PAGE:/lms/(app)/quizzes

## quiz_questions
  - API:/lms/quizzes/[quizId]/submit
  - API:/quizzes/[quizId]
  - API:/quizzes/lesson/[lessonId]/questions
  - API:/quizzes/save

## quiz_submissions
  - API:/offline/sync

## quizzes
  - API:/lms/quizzes/[quizId]/start
  - API:/lms/quizzes/[quizId]/submit
  - API:/quizzes/save
  - PAGE:/lms/(app)/quizzes

## rapids_apprentices
  - API:/reports/rapids

## rapids_progress_updates
  - PAGE:/admin/rapids

## rapids_registrations
  - API:/apprentice/hours-summary
  - API:/programs/barber-apprenticeship/apply
  - PAGE:/admin/rapids

## rapids_submissions
  - PAGE:/admin/rapids

## rapids_tracking
  - API:/rapids/safe-update
  - API:/rapids/update

## reels
  - API:/social-media/scheduler

## referral_pipeline_summary
  - PAGE:/admin/referrals

## referrals
  - API:/board/referrals

## reports
  - PAGE:/admin/reports/reports
  - PAGE:/reports

## resource_bookmarks
  - PAGE:/lms/(app)/library

## review_helpful_votes
  - API:/courses/[courseId]/reviews/[reviewId]/helpful

## review_queue
  - API:/automation/test/document-processing
  - API:/automation/test/partner-approval
  - API:/automation/test/shop-routing
  - PAGE:/admin/review-queue

## reviews
  - API:/reviews
  - API:/reviews/[id]/respond

## saas_addon_catalog
  - PAGE:/account/addons
  - PAGE:/admin/billing/addons

## sam_alerts
  - PAGE:/apps/sam-gov

## sam_documents
  - PAGE:/apps/sam-gov

## sam_entities
  - PAGE:/apps/sam-gov

## sam_opportunities
  - API:/sam-gov/sync

## scheduled_messages
  - PAGE:/admin/communications

## school_applications
  - API:/schools/mesmerized-by-beauty/apply

## scorm_attempts
  - API:/scorm/attempts/[attemptId]/data

## scorm_cmi_data
  - API:/scorm/attempts/[attemptId]/data

## scorm_enrollments
  - API:/partner/enroll
  - API:/scorm/enrollment/[enrollmentId]
  - API:/scorm/tracking

## scorm_packages
  - API:/scorm/player
  - API:/scorm/upload
  - PAGE:/lms/(app)/scorm

## scorm_progress
  - PAGE:/lms/(app)/scorm

## scorm_tracking
  - API:/scorm/tracking

## scraping_attempts
  - API:/alert-scraper

## secure_identity
  - PAGE:/onboarding/learner/documents

## security_scan_events
  - API:/security/scan-event

## settings
  - PAGE:/thankyou

## shared_documents
  - PAGE:/lms/(app)/collaborate/documents

## shop_applications
  - PAGE:/admin/shops

## shop_checkin_codes
  - API:/checkin
  - API:/onboarding/complete
  - API:/shop/checkin/qr

## shop_documents
  - API:/shop/documents/upload

## shop_onboarding
  - API:/shop/apply
  - API:/shop/documents/upload

## shop_placements
  - API:/pwa/api-pwa/shop-owner/pending-reps
  - API:/pwa/shop-owner/pending-reps
  - API:/supervisor/verify-rep

## shop_recommendations
  - API:/automation/test/shop-routing

## shop_required_docs_status
  - PAGE:/admin/shops

## shop_staff
  - API:/partner/attendance/weekly
  - API:/shop/apply
  - API:/shop/documents/upload
  - PAGE:/employer/shop/create

## shop_supervisors
  - API:/competency/pending-reps
  - API:/pwa/api-pwa/shop-owner/pending-reps
  - API:/pwa/shop-owner/pending-reps
  - API:/supervisor/claim-account
  - API:/supervisor/verify-rep

## shops
  - API:/onboarding/complete
  - API:/shop/apply
  - API:/shop/checkin/qr
  - API:/shop/details
  - API:/timeclock/context
  - PAGE:/(partner)/partners/admin/shops
  - PAGE:/admin/shops
  - PAGE:/admin/shops/geocoding

## signature_documents
  - API:/signature/documents
  - API:/signature/documents/[id]
  - API:/signature/documents/[id]/sign
  - PAGE:/admin/signatures
  - PAGE:/sign/[documentId]

## signatures
  - API:/signature/documents/[id]/sign
  - PAGE:/admin/signatures
  - PAGE:/sign/[documentId]

## sim_attempts
  - API:/simulations/[simKey]/attempts
  - API:/simulations/[simKey]/attempts/[attemptId]

## site_settings
  - PAGE:/apply/program-holder
  - PAGE:/apply/staff
  - PAGE:/signup

## skill_categories
  - PAGE:/apprentice/competencies
  - PAGE:/apprentice/competencies/log
  - PAGE:/apprentice/hours/log
  - PAGE:/apprentice/skills

## sms_messages
  - API:/sms/send

## soc_controls
  - API:/soc/mark

## social_media_campaigns
  - API:/social-media/campaigns
  - API:/social-media/scheduler

## social_media_posts
  - API:/social-media/post
  - API:/social-media/scheduler

## social_media_settings
  - API:/auth/facebook/callback
  - API:/auth/instagram/callback
  - API:/auth/linkedin/callback
  - API:/auth/youtube/callback

## social_posts
  - API:/social/schedule

## sop_templates
  - PAGE:/admin/sops

## sos_attachment_library
  - PAGE:/admin/submissions
  - PAGE:/admin/submissions/attachments

## sos_compliance_records
  - PAGE:/admin/submissions/compliance

## sos_content_blocks
  - PAGE:/admin/submissions
  - PAGE:/admin/submissions/content

## sos_document_templates
  - PAGE:/admin/submissions/templates

## sos_opportunities
  - PAGE:/admin/submissions

## sos_organization_facts
  - PAGE:/admin/settings/organization-profile
  - PAGE:/admin/submissions
  - PAGE:/admin/submissions/facts

## sos_organization_profiles
  - PAGE:/admin/submissions/org

## sos_organizations
  - PAGE:/admin/settings/organization-profile
  - PAGE:/admin/submissions/attachments
  - PAGE:/admin/submissions/compliance
  - PAGE:/admin/submissions/content
  - PAGE:/admin/submissions/facts
  - PAGE:/admin/submissions/org
  - PAGE:/admin/submissions/partners
  - PAGE:/admin/submissions/past-performance
  - PAGE:/admin/submissions/templates

## sos_partner_entities
  - PAGE:/admin/submissions/partners

## sos_past_performance
  - PAGE:/admin/submissions/past-performance

## sos_review_tasks
  - PAGE:/admin/submissions
  - PAGE:/admin/submissions/exceptions

## ssn_verifications
  - API:/identity/verify-ssn

## staff
  - API:/notifications/broadcast
  - PAGE:/booking/booking

## staff_attendance
  - PAGE:/admin/staff-portal/attendance

## staff_processes
  - PAGE:/admin/staff-portal/processes
  - PAGE:/staff/processes

## staff_training_progress
  - PAGE:/admin/staff-portal/training
  - PAGE:/staff/training

## staff_users
  - PAGE:/admin/staff-portal/attendance
  - PAGE:/admin/staff-portal/settings

## staffs
  - PAGE:/admin/staff-portal/settings

## state_board_readiness
  - API:/apprentice/hours-summary

## step_submissions
  - API:/cron/weekly-verdicts
  - API:/lms/evidence/[evidenceId]/review
  - API:/lms/submissions
  - API:/lms/submissions/review

## store_entitlements
  - API:/download/capital-readiness
  - API:/webhooks/stripe

## store_prices
  - API:/store/api-store/subscribe
  - API:/trials/convert

## store_products
  - API:/store/api-store/cart-checkout
  - API:/store/api-store/publish
  - API:/store/cart-checkout
  - API:/store/publish
  - API:/webhooks/stripe
  - PAGE:/admin/store
  - PAGE:/pricing

## store_subscription_pricing
  - PAGE:/store/subscriptions

## store_subscriptions
  - API:/store/api-store/subscribe
  - PAGE:/store/subscriptions

## stripe_sessions_staging
  - API:/system/reconcile-payment
  - PAGE:/admin/integrations/stripe

## stripe_webhook_events
  - API:/donate/webhook
  - API:/webhooks/exam-payment
  - API:/webhooks/stripe
  - API:/webhooks/stripe-identity

## student_ai_assignments
  - API:/ai/chat

## student_competency_progress
  - API:/lessons/[lessonId]/complete

## student_documents
  - PAGE:/admin/students/[id]/binder

## student_enrollments
  - API:/apprentice/hours-summary
  - API:/apprentice/transfer-hours
  - API:/cron/end-of-day-summary
  - API:/internal/hours-pace-check
  - API:/learner/dashboard
  - API:/programs/[program]/external-courses/[courseId]/checkout
  - API:/programs/enroll/checkout
  - API:/pwa/api-pwa/barber/progress
  - API:/pwa/api-pwa/cosmetology/progress
  - API:/pwa/api-pwa/esthetician/progress
  - API:/pwa/api-pwa/nail-tech/progress
  - API:/pwa/barber/progress
  - API:/pwa/cosmetology/progress
  - API:/pwa/esthetician/progress
  - API:/pwa/nail-tech/progress
  - API:/time/entries
  - API:/webhooks/stripe
  - API:/workforce-board/performance-trends
  - PAGE:/apprentice/state-board

## student_funding_assignments
  - API:/cron/escalate-funding-sla
  - API:/cron/funding-escalation
  - API:/cron/funding-followup

## student_lesson_evidence
  - API:/lms/evidence

## student_next_steps
  - API:/next-steps

## student_onboarding
  - API:/ai/chat
  - API:/student/acknowledge-handbook

## student_practical_progress
  - API:/lms/practical-progress

## student_progress
  - PAGE:/lms/(app)/achievements
  - PAGE:/lms/(app)/analytics
  - PAGE:/lms/(app)/integrations
  - PAGE:/lms/(app)/learning-paths
  - PAGE:/lms/(app)/progress

## student_risk_status
  - API:/internal/at-risk-detection
  - API:/internal/dropout-score
  - API:/internal/lesson-pace-check
  - PAGE:/admin/intelligence

## student_tasks
  - API:/student/dashboard

## students
  - API:/email/campaigns/send
  - API:/email/workflows/processor
  - API:/notifications/broadcast
  - API:/onboarding/complete
  - PAGE:/admin/students/[id]/binder
  - PAGE:/hire-graduates/hire-graduates

## studio_workspaces
  - API:/workspace
  - API:/workspace/[id]

## study_group_members
  - API:/mobile/summary
  - API:/study-groups
  - API:/study-groups/[id]/join

## study_groups
  - API:/study-groups
  - API:/study-groups/[id]/join

## study_sessions
  - PAGE:/lms/(app)/collaborate/meetings

## sub_office_agreements
  - API:/suboffice/apply

## subscription_features
  - API:/admin/subscriptions/features

## subscription_invoices
  - API:/webhooks/subscriptions

## subscription_plans
  - API:/admin/subscriptions/plans
  - PAGE:/admin/billing
  - PAGE:/admin/billing/plans

## subscriptions
  - API:/payments
  - API:/webhooks/subscriptions

## support_messages
  - API:/support/tickets
  - API:/support/tickets/[id]

## support_tickets
  - API:/support/tickets
  - API:/support/tickets/[id]
  - PAGE:/lms/(app)/support

## supportive_services
  - API:/wioa/reporting
  - API:/wioa/support-services

## survey_responses
  - API:/surveys

## surveys
  - API:/surveys

## system_settings
  - PAGE:/platform/enterprise
  - PAGE:/platform/how-it-works
  - PAGE:/platform/licensing
  - PAGE:/platform/managed
  - PAGE:/platform/partners

## tenant_billing
  - API:/billing/report-usage

## tenant_branding
  - API:/onboarding/provision-tenant

## tenant_domains
  - PAGE:/provider/dashboard

## tenant_memberships
  - API:/stripe/checkout

## tenant_settings
  - API:/admin/tenants/[id]/clone

## tenant_usage
  - API:/billing/report-usage

## tenants
  - API:/admin/tenants/[id]/clone
  - API:/onboarding/provision-tenant
  - API:/tenants/create
  - API:/tenants/provision
  - API:/v1/tenant/branding
  - PAGE:/admin/licenses/create
  - PAGE:/admin/providers
  - PAGE:/admin/tenants
  - PAGE:/provider/settings

## testimonials
  - API:/content/homepage
  - API:/content/testimonials
  - API:/testimonials

## testing_appointment_reminders
  - API:/internal/testing-reminders
  - API:/testing/calendly-webhook

## testing_appointments
  - API:/cron/morning-reminders
  - API:/testing/calendly-webhook

## testing_enforcement
  - API:/testing/enforcement
  - API:/testing/enforcement/checkout
  - API:/testing/retake
  - API:/testing/webhook

## testing_leads
  - API:/cron/testing-lead-followup

## testing_providers
  - PAGE:/testing/[provider]

## testing_sessions
  - PAGE:/admin/testing

## testing_slots
  - API:/admin/testing-center
  - API:/testing/book
  - API:/testing/slots
  - API:/testing/slots/public
  - API:/testing/webhook
  - PAGE:/admin/testing-center

## them
  - PAGE:/admin/staff-portal/messages
  - PAGE:/host-shop/dashboard/messages

## time_entries
  - API:/hr/payroll
  - API:/payroll/export

## time_off_requests
  - PAGE:/admin/hr

## training_courses
  - API:/demo/reset
  - API:/store/api-store/cart-checkout
  - PAGE:/admin/curriculum

## training_enrollments
  - PAGE:/admin/reports/enrollment

## training_lessons
  - PAGE:/admin/curriculum

## training_modules
  - PAGE:/admin/modules
  - PAGE:/admin/staff-portal/training
  - PAGE:/staff/training

## training_simulations
  - API:/simulations/[simKey]/attempts

## transcripts
  - PAGE:/lms/(app)/certificates

## transfer_hour_requests
  - API:/apprentice/transfer-hours

## transfer_hours
  - PAGE:/admin/transfer-hours

## trial
  - API:/license/upgrade

## trial_signups
  - API:/stripe/trial-checkout
  - API:/trials/convert

## two_factor_auth
  - API:/auth/2fa/status

## unauthorized_access_log
  - API:/track-usage

## uploads
  - API:/uploads

## user_achievements
  - PAGE:/achievements

## user_activity_events
  - API:/privacy/export

## user_app_subscriptions
  - API:/apps/trial/start
  - API:/apps/trial/status
  - PAGE:/apps/grants
  - PAGE:/apps/grants/start-trial
  - PAGE:/apps/sam-gov
  - PAGE:/apps/sam-gov/start-trial
  - PAGE:/apps/website-builder
  - PAGE:/apps/website-builder/start-trial

## user_badges
  - API:/achievements
  - API:/discussions/thread
  - API:/gamification/badges
  - API:/users/[userId]/badges
  - PAGE:/lms/(app)/achievements
  - PAGE:/lms/(app)/badges

## user_certifications
  - PAGE:/admin/certificates/bulk

## user_entitlements
  - API:/store/api-store/download/[productId]
  - API:/store/download/[productId]
  - API:/webhooks/store

## user_feedback
  - API:/feedback

## user_files
  - PAGE:/lms/(app)/files

## user_learning_paths
  - API:/learning-paths

## user_lesson_attempts
  - API:/lms/lesson-attempt

## user_licenses
  - PAGE:/account/licenses

## user_onboarding_status
  - PAGE:/onboarding/legal

## user_points
  - API:/gamification/points
  - API:/learner/dashboard
  - PAGE:/leaderboard

## user_profiles
  - API:/course-generator/gap-scan
  - API:/course-generator/jobs
  - API:/devstudio/control-plane
  - PAGE:/admin/inbox

## user_roles
  - PAGE:/unauthorized

## user_saved_grants
  - PAGE:/apps/grants

## user_skills
  - PAGE:/admin/staff-portal
  - PAGE:/admin/staff-portal/skills
  - PAGE:/staff
  - PAGE:/staff/skills

## user_streaks
  - API:/mobile/summary

## user_tutorials
  - API:/tutorials

## user_websites
  - API:/onboarding/launch
  - API:/websites/[websiteId]/config
  - API:/websites/[websiteId]/publish
  - PAGE:/apps/website-builder
  - PAGE:/apps/website-builder/edit/[websiteId]

## users
  - API:/account/delete
  - API:/account/export
  - API:/lti/launch
  - PAGE:/account/profile
  - PAGE:/messages
  - PAGE:/profile

## v_admin_financial_assurance_summary
  - PAGE:/admin/compliance/financial-assurance

## v_funding_verification_queue
  - PAGE:/admin/funding-verification

## verify_audit
  - API:/verify

## video_bookmarks
  - API:/lessons/[lessonId]/bookmarks

## video_playback_events
  - API:/video/events

## videos
  - PAGE:/admin/videos
  - PAGE:/lms/(app)/video
  - PAGE:/videos
  - PAGE:/videos/[videoId]

## voicemails
  - API:/phone/call

## w9_submissions
  - API:/onboarding/payroll-setup
  - API:/payroll/w9
  - API:/provider/apply
  - PAGE:/admin/hr/payroll

## waitlist
  - API:/waitlist
  - API:/waitlist/cna
  - PAGE:/admin/waitlist

## webhook_events_processed
  - API:/webhooks/store
  - API:/webhooks/stripe

## webhook_retry_log
  - API:/webhooks/store
  - API:/webhooks/stripe

## wioa_cases
  - API:/workforce-board/cases

## wioa_compliance_reports
  - API:/compliance/report
  - API:/employer/reports/submit
  - PAGE:/admin/compliance

## wioa_documents
  - PAGE:/admin/wioa/documents

## wioa_participant_records
  - API:/case-manager/reports/wioa/export
  - PAGE:/case-manager/reports/wioa

## wioa_participants
  - API:/case-manager/reports/wioa/export
  - API:/workforce-board/participants
  - API:/workforce-board/reports
  - PAGE:/admin/compliance
  - PAGE:/admin/wioa
  - PAGE:/admin/wioa/verify
  - PAGE:/case-manager/participants/[id]
  - PAGE:/case-manager/reports/wioa

## workflow_dead_letters
  - API:/admin/workflows/dead-letters/[id]/replay
  - API:/cron/anomaly-detection
  - API:/internal/service-health
  - PAGE:/admin/operations

## workflow_enrollments
  - API:/email/workflows/processor

## workflow_runs
  - API:/admin/workflows/[id]
  - API:/admin/workflows/dead-letters/[id]/replay
  - API:/admin/workflows/runs
  - API:/admin/workflows/runs/[runId]/replay
  - API:/internal/service-health
  - API:/internal/workflow-schedule-processor
  - PAGE:/admin/operations

## workflow_step_logs
  - API:/internal/service-health
  - PAGE:/admin/operations

## workflow_steps
  - API:/admin/workflows
  - API:/admin/workflows/[id]
  - API:/admin/workflows/[id]/steps
  - API:/admin/workflows/[id]/steps/[stepId]

## workflow_triggers
  - API:/admin/workflows
  - API:/admin/workflows/[id]
  - API:/admin/workflows/[id]/triggers
  - API:/admin/workflows/[id]/triggers/[triggerId]
  - API:/internal/workflow-event-processor
  - API:/internal/workflow-schedule-processor

## workflows
  - API:/admin/tenants/[id]/clone
  - API:/admin/workflows
  - API:/admin/workflows/[id]
  - API:/workflows/webhook/[key]
  - PAGE:/admin/operations

## workforce_analytics
  - PAGE:/platform/workforce-analytics

## workforce_cases
  - PAGE:/admin/workforce
  - PAGE:/admin/workforce/cases

## workforce_funding
  - PAGE:/admin/workforce

## workforce_participants
  - PAGE:/admin/workforce
  - PAGE:/admin/workforce/compliance
  - PAGE:/admin/workforce/outcomes
  - PAGE:/admin/workforce/participants
  - PAGE:/admin/workforce/reports

## workforce_referrals
  - API:/intake
  - API:/workforce-referral
  - PAGE:/admin/referrals
  - PAGE:/admin/workone-queue

## workone_checklist
  - API:/workone/[id]
  - API:/workone/list
  - API:/workone/seed

## workspace_deployments
  - API:/workspaces/deploy

## wotc_applications
  - PAGE:/admin/reports/financial
  - PAGE:/admin/wotc

## wotc_credits
  - PAGE:/admin/host-shop/dashboard

## wotc_tracking
  - API:/wotc/update

## xapi_statements
  - API:/xapi
  - API:/xapi/statement