# Schema vs Insert Contract Matrix
# Generated: 2026-02-26T08:36:32Z

## TABLE: admin_audit_events

- **app/admin/program-holders/[id]/page.tsx:216** [SERVER_ACTION]
  columns: action,actor_user_id,metadata,target_id,target_type

- **app/admin/program-holders/[id]/page.tsx:242** [SERVER_ACTION]
  columns: action,actor_user_id,metadata,p_actor_id,p_holder_id,p_program_id,target_id,target_type

- **app/api/admin/documents/signed-url/route.ts:109** [API_ROUTE]
  columns: action,actor_user_id,admin_role,document_owner_id,document_type,file_path,metadata,resolution,target_id,target_type

- **lib/admin/document-access.ts:49** [LIB_FUNCTION]
  columns: action,actor_user_id,context,document_owner_id,document_type,metadata,target_id,target_type

- **lib/retention/document-retention.ts:148** [LIB_FUNCTION]
  columns: action,actor_user_id,created_at,docId,document_type,id,metadata,original_created_at,reason,retention_days,target_id,target_type,user_id

---

## TABLE: audit_logs

- **app/ferpa/records/search/page.tsx:115** [SERVER_COMPONENT]
  columns: action,day,details,ip_address,month,user_id,year

- **app/admin/certificates/actions.ts:88** [SERVER_ACTION]
  columns: action,details,resource_id,resource_type,user_id

- **app/admin/certificates/actions.ts:115** [SERVER_ACTION]
  columns: action,details,resource_id,resource_type,user_id

- **app/c/[token]/page.tsx:67** [SERVER_COMPONENT]
  columns: event_type,metadata,resource_id,resource_type,share_link_id

- **app/api/ferpa/training/submit/route.ts:94** [API_ROUTE]
  columns: action,body,details,headers,method,resource_id,resource_type

- **app/api/admin/programs/route.ts:55** [API_ROUTE]
  columns: action,actor_id,actor_role,after_state,resource_id,resource_type

- **app/api/admin/programs/[id]/route.ts:64** [API_ROUTE]
  columns: action,actor_id,actor_role,after_state,before_state,resource_id,resource_type

- **app/api/admin/programs/[id]/route.ts:95** [API_ROUTE]
  columns: action,actor_id,actor_role,after_state,before_state,resource_id,resource_type

- **app/api/admin/creators/reject/route.ts:147** [API_ROUTE]
  columns: action,actor_id,creator_email,email_sent,message,metadata,success,target_id,timestamp

- **app/api/admin/certificates/bulk/route.ts:82** [API_ROUTE]
  columns: action,details,resource_type,user_id

- **app/api/admin/applications/route.ts:56** [API_ROUTE]
  columns: action,actor_id,actor_role,after_state,resource_id,resource_type

- **app/api/admin/applications/[id]/route.ts:282** [API_ROUTE]
  columns: action,actor_id,actor_role,after_state,applicationId,enrollmentId,notes,resource_id,resource_type

- **app/api/admin/applications/[id]/route.ts:311** [API_ROUTE]
  columns: actor_id,actor_role,after_state,before_state,enrollment,resource_id,resource_type

- **app/api/admin/applications/[id]/route.ts:343** [API_ROUTE]
  columns: action,actor_id,actor_role,before_state,resource_id,resource_type

- **app/api/admin/cohorts/route.ts:95** [API_ROUTE]
  columns: action,actor_id,actor_role,after_state,resource_id,resource_type

- **app/api/admin/cohorts/route.ts:147** [API_ROUTE]
  columns: action,actor_id,actor_role,after_state,before_state,resource_id,resource_type

- **app/api/admin/cohorts/route.ts:196** [API_ROUTE]
  columns: action,actor_id,actor_role,before_state,resource_id,resource_type

- **app/api/admin/students/route.ts:125** [API_ROUTE]
  columns: action,actor_id,actor_role,after_state,resource_id,resource_type

- **app/api/enroll/approve/route.ts:289** [API_ROUTE]
  columns: action,actor_id,actor_role,entity,entity_id,message,metadata,program_id,steps_generated,title,user_id

- **app/api/board/referrals/route.ts:111** [API_ROUTE]
  columns: action,actor_email,actor_id,boardOrg,metadata,resource_id,resource_type

- **app/api/compliance/items/route.ts:100** [API_ROUTE]
  columns: action,actor_email,actor_id,metadata,resource_id,resource_type

- **app/api/compliance/evidence/route.ts:79** [API_ROUTE]
  columns: action,actor_email,actor_id,metadata,resource_id,resource_type

- **app/api/signature/documents/route.ts:62** [API_ROUTE]
  columns: action,actor_email,actor_id,document,metadata,resource_id,resource_type,signUrl

- **app/api/signature/documents/[id]/sign/route.ts:65** [API_ROUTE]
  columns: action,actor_email,actor_id,documentId,metadata,resource_id,resource_type,title

- **app/api/legal/sign/route.ts:153** [API_ROUTE]
  columns: action,agreements_signed,metadata,name,resource_id,resource_type,signed,signer,success,user_id

- **app/api/partners/select-role/route.ts:81** [API_ROUTE]
  columns: action,actor_user_id,changes,entity,err,ip_address,success,user_agent

- **app/api/partners/sync/route.ts:135** [API_ROUTE]
  columns: action,details,errors,failed,forced,results,status,successful,synced,total,total_courses

- **app/api/intake/application/route.ts:131** [API_ROUTE]
  columns: applicationId,event_type,expectedResponse,leadId,message,metadata,nextStep,programId,program_id,program_title,resource_id,resource_type,status,success

- **app/api/intake/eligibility/route.ts:176** [API_ROUTE]
  columns: eligible,event_type,fundingTypes,funding_types,leadId,message,metadata,nextStep,resource_id,resource_type,state,success

- **app/api/intake/interest/route.ts:110** [API_ROUTE]
  columns: career_interest,event_type,leadId,message,metadata,nextStep,resource_id,resource_type,source,stage,success

- **app/api/program-holder/reports/submit/route.ts:96** [API_ROUTE]
  columns: action,hours_worked,message,metadata,report_id,resource_id,resource_type,success,user_id,week_ending

- **app/api/program-holder/students/accept/route.ts:104** [API_ROUTE]
  columns: action,metadata,program_id,resource_id,resource_type,student_id,user_id

- **app/api/program-holder/students/decline/route.ts:105** [API_ROUTE]
  columns: action,metadata,program_id,reason,resource_id,resource_type,student_id,user_id

- **app/api/partner/attendance/route.ts:141** [API_ROUTE]
  columns: action,actor_email,actor_id,hours,metadata,resource_id,resource_type

- **app/api/apprenticeship/hours/reject/route.ts:77** [API_ROUTE]
  columns: action,actor_id,created_at,details,entity_id,entity_type

- **app/api/credentials/issue/route.ts:91** [API_ROUTE]
  columns: code,credential,credentialId,credential_type,event_type,expires_at,id,issuedBy,issued_at,metadata,program_id,resource_id,resource_type,studentId,student_id,success,user_id

- **app/api/credentials/verify/route.ts:89** [API_ROUTE]
  columns: code,credential,event_type,expires_at,id,ip,issued_at,metadata,resource_id,resource_type,revoked_at,revoked_reason,student,user_id,valid,viewer_role

- **app/api/funding/admin/resend/route.ts:99** [API_ROUTE]
  columns: action,meta,subject,who

- **app/api/funding/admin/confirm/route.ts:104** [API_ROUTE]
  columns: action,background,display,margin,meta,padding,subject,who

- **app/api/funding/admin/action/route.ts:71** [API_ROUTE]
  columns: action,decided_at,meta,status,subject,who

- **app/api/funding/admin/action/route.ts:88** [API_ROUTE]
  columns: action,meta,subject,who

- **app/api/onboarding/payroll-setup/route.ts:121** [API_ROUTE]
  columns: action,actor_user_id,changes,entity,err,ip_address,success,user_agent

- **lib/credential-generator.ts:71** [LIB_FUNCTION]
  columns: credentialId,credential_type,event_type,issuer_org_id,metadata,program_id,resource_id,resource_type,studentId,user_id

- **lib/credential-generator.ts:163** [LIB_FUNCTION]
  columns: event_type,metadata,resource_id,resource_type,user_id

- **lib/audit.ts:24** [LIB_FUNCTION]
  columns: USER_CREATED,action,ip_address,metadata,resource_id,resource_type,tenant_id,user_agent,user_id

- **lib/compliance/wioa-automation.ts:51** [LIB_FUNCTION]
  columns: action,metadata,resource_type,user_id

- **lib/logging/auditLog.ts:45** [LIB_FUNCTION]
  columns: USER_LOGIN,action,actor_id,actor_role,entity,entity_id,ip_address,metadata,user_agent

- **lib/program-schema.ts:119** [LIB_FUNCTION]
  columns: archived_at,event_type,metadata,resource_id,resource_type,status,title,user_id

- **lib/program-schema.ts:157** [LIB_FUNCTION]
  columns: event_type,resource_id,resource_type,user_id

- **lib/monitoring/error-tracker.ts:75** [LIB_FUNCTION]
  columns: action_type,description,details,endpoint,ip_address,method,requestBody,stack,statusCode,userAgent,user_id

- **lib/monitoring/error-tracker.ts:109** [LIB_FUNCTION]
  columns: action_type,description,details,duration,endpoint,ipAddress,ip_address,limit,method,remaining,statusCode,user_id

- **lib/monitoring/error-tracker.ts:138** [LIB_FUNCTION]
  columns: action_type,description,details,endpoint,ip_address,limit,remaining,severity

- **lib/monitoring/error-tracker.ts:167** [LIB_FUNCTION]
  columns: action_type,description,details,endpoint,ip_address,severity,user_id

- **lib/credentials/credential-system.ts:536** [LIB_FUNCTION]
  columns: action,course_id,credential_id,credential_name,metadata,resource_id,resource_type,user_id

- **lib/audit-logger.ts:68** [LIB_FUNCTION]
  columns: created_at,event_type,success,user_id

- **lib/audit/ferpa.ts:71** [LIB_FUNCTION]
  columns: accessor_role,action,created_at,details,ferpa,ip_address,reason,resource_id,resource_type,student_id,success,user_agent,user_id

- **lib/audit/logger.ts:57** [LIB_FUNCTION]
  columns: action,actorId,actor_id,created_at,enrollmentId,ip_address,metadata,target_id,target_type,user_agent

- **lib/audit/logAction.ts:18** [LIB_FUNCTION]
  columns: action,created_at,details,resource_id,resource_type,success,user_id

- **lib/auditLog.ts:93** [LIB_FUNCTION]
  columns: 

- **lib/automation/partner-approval.ts:215** [LIB_FUNCTION]
  columns: actor_id,approved,decision_id,event_type,failed_documents,metadata,missing_documents,pending_documents,program_id,reason_codes,resource_id,resource_type,review_queue_id,status,success

- **lib/automation/evidence-processor.ts:397** [LIB_FUNCTION]
  columns: action,actor_id,created_at,decisionId,document_type,metadata,processing_time_ms,ruleset_version,success,target_id,target_type

- **lib/automation/evidence-processor.ts:501** [LIB_FUNCTION]
  columns: action,actor_id,created_at,document_type,failed_rules,metadata,processing_time_ms,reviewQueueId,review_queue_id,ruleset_version,target_id,target_type

- **lib/automation/evidence-processor.ts:635** [LIB_FUNCTION]
  columns: action,created_at,document_id,hours_applied,metadata,source_school,target_id,target_type

- **lib/automation/shop-routing.ts:335** [LIB_FUNCTION]
  columns: actor_id,decision_id,event_type,metadata,recommendations,recommendations_count,resource_id,resource_type,review_queue_id,success,top_score

- **lib/automation/shop-routing.ts:422** [LIB_FUNCTION]
  columns: actor_id,event_type,metadata,resource_id,resource_type,success

---

## TABLE: franchise_audit_log

- **app/api/franchise/returns/[returnId]/route.ts:144** [API_ROUTE]
  columns: action,actor_id,created_at,details,entity_id,entity_type,new_preparer_id,office_id,old_preparer_id,reason,updated_at

- **lib/franchise/return-service.ts:383** [LIB_FUNCTION]
  columns: entity_id,entity_type,event_type,new_values,old_values

- **lib/franchise/ero-service.ts:373** [LIB_FUNCTION]
  columns: actor_id,created_at,entity_id,entity_type,office_id

- **lib/franchise/preparer-service.ts:397** [LIB_FUNCTION]
  columns: action,created_at,entity_id,entity_type,new_values,old_values

- **lib/franchise/office-service.ts:297** [LIB_FUNCTION]
  columns: action,created_at,entity_id,entity_type,new_values,old_values

- **lib/franchise/client-service.ts:356** [LIB_FUNCTION]
  columns: action,created_at,entity_id,entity_type,new_values,old_values

---

## TABLE: partner_audit_log

- **app/api/pwa/shop-owner/log-hours/route.ts:110** [API_ROUTE]
  columns: action,entity_type,partner_id,user_id

---

## TABLE: ai_audit_log

- **app/api/payments/split/route.ts:118** [API_ROUTE]
  columns: action,details,elevate,program_slug,split,student_id,success,total,vendor,vendor_name

- **lib/vendors/milady-payment.ts:64** [LIB_FUNCTION]
  columns: action,amount,details,enrollment_id,message,method,program_slug,status,student_id,success

- **lib/vendors/milady-payment.ts:86** [LIB_FUNCTION]
  columns: action,details,enrollmentId,enrollment_id,invoiceId,program_slug,student_id,success

- **lib/autopilot/test-enrollment-flow.ts:254** [LIB_FUNCTION]
  columns: action,details,instructor,instructor_slug,program_slug,source,student_id

- **lib/ai/assign.ts:41** [LIB_FUNCTION]
  columns: action,details,program_slug,student_id

---

## TABLE: license_audit_log

- **lib/licensing/audit.ts:55** [LIB_FUNCTION]
  columns: created_at,event,ip_address,licenseId,license_id,metadata,tenantId,tenant_id,user_agent,user_id

---

## TABLE: security_logs

- **app/unauthorized/page.tsx:32** [SERVER_COMPONENT]
  columns: 

- **app/api/security/log/route.ts:58** [API_ROUTE]
  columns: event_type,ip_address,severity,timestamp,url,user_agent

---

## TABLE: automated_decisions

- **app/api/admin/review-queue/resolve/route.ts:191** [API_ROUTE]
  columns: action,actor,actorId,actorRole,decision,input_snapshot,reason_codes,resolution,resolved_at,resolved_by,ruleset_version,status,subject_id,subject_type

- **app/api/automation/test/partner-approval/route.ts:164** [API_ROUTE]
  columns: actor,confidence_score,created_at,decision_type,entity_id,entity_type,has_all_docs,has_mou,input_snapshot,license_expired,processing_time_ms,reason_codes,ruleset_version,test_case

- **app/api/automation/test/shop-routing/route.ts:222** [API_ROUTE]
  columns: actor,apprentice_location,confidence_score,created_at,decision_type,entity_id,entity_type,input_snapshot,processing_time_ms,reason_codes,recommendations,review_type,ruleset_version,test_case

- **app/api/automation/test/document-processing/route.ts:153** [API_ROUTE]
  columns: actor,confidence_score,created_at,decision_type,entity_id,entity_type,extracted_data,input_snapshot,priority,processing_time_ms,reason_codes,review_type,ruleset_version,test_case

- **lib/automation/evidence-processor.ts:618** [LIB_FUNCTION]
  columns: action,actor,confidence_score,created_at,decision_type,document_id,entity_id,entity_type,hours_applied,input_snapshot,metadata,outcome,reason_codes,ruleset_version,source_school,target_id,target_type

- **lib/automation/shop-routing.ts:412** [LIB_FUNCTION]
  columns: actor,actor_id,decision,event_type,input_snapshot,metadata,reason_codes,resource_id,resource_type,subject_id,subject_type,success

---

## TABLE: review_queue

- **app/api/automation/test/partner-approval/route.ts:187** [API_ROUTE]
  columns: actualOutcome,created_at,entity_id,entity_type,expectedOutcome,failed_rules,partnerId,passed,priority,review_type,status,success,system_recommendation,testCase

- **app/api/automation/test/shop-routing/route.ts:244** [API_ROUTE]
  columns: actualOutcome,applicationId,confidence_score,created_at,entity_id,entity_type,expectedOutcome,extracted_data,passed,priority,recommendationCount,review_type,status,success,system_recommendation,testCase

- **app/api/automation/test/document-processing/route.ts:174** [API_ROUTE]
  columns: actualOutcome,confidence,confidence_score,created_at,documentId,entity_id,entity_type,expectedOutcome,extractedFields,extracted_data,failed_rules,passed,priority,review_type,status,success,system_recommendation,testCase

---

## TABLE: enrollment_events

- **app/api/cert/issue/route.ts:96** [API_ROUTE]
  columns: funding_program_id,kind

- **app/api/cert/issue/route.ts:143** [API_ROUTE]
  columns: funding_program_id,kind

- **app/api/cert/replace/route.ts:85** [API_ROUTE]
  columns: course_id,funding_program_id,kind,user_id

- **app/api/cert/bulk-issue/route.ts:115** [API_ROUTE]
  columns: course_id,funding_program_id,kind,user_id

- **app/api/cert/bulk-issue/route.ts:163** [API_ROUTE]
  columns: course_id,funding_program_id,kind,user_id

---

## TABLE: case_events

- **lib/workflow/case-management.ts:100** [LIB_FUNCTION]
  columns: actor_id,actor_role,after_state,case_id,event_type,metadata

---

## TABLE: license_events

- **app/api/cron/trial-lifecycle/route.ts:68** [API_ROUTE]
  columns: event_data,event_type,license_id,organization_id

- **app/api/cron/trial-lifecycle/route.ts:91** [API_ROUTE]
  columns: event_data,event_type,license_id,organization_id

- **app/api/cron/trial-lifecycle/route.ts:120** [API_ROUTE]
  columns: created_at,days_since_creation,event_data,event_type,license_id,organization_id

- **app/api/cron/trial-lifecycle/route.ts:152** [API_ROUTE]
  columns: event_data,event_type,license_id,ok,organization_id,timestamp

- **app/api/cron/process-provisioning-jobs/route.ts:63** [API_ROUTE]
  columns: event_data,event_type,organization_id

- **app/api/provisioning/tenant/route.ts:198** [API_ROUTE]
  columns: custom_domain,event_data,event_type,license_id,organization_id,plan_id,subdomain

- **app/api/trial/begin-onboarding/route.ts:78** [API_ROUTE]
  columns: correlation_id,event_data,event_type,license_id,organization_id,source

- **app/api/trial/start-managed/route.ts:235** [API_ROUTE]
  columns: admin_email,correlation_id,event_data,event_type,license_id,ok,organization_id,plan_id,source,tenantUrl

- **lib/trial/reconcile-onboarding.ts:68** [LIB_FUNCTION]
  columns: event_data,event_type,license_id,organization_id,reason,source

---

## TABLE: login_events

- **app/api/events/login/route.ts:28** [API_ROUTE]
  columns: user_id

---

## TABLE: payment_logs

- **app/api/webhooks/stripe/route.ts:543** [API_ROUTE]
  columns: amount,currency,funding_source,kind,metadata,program_id,program_slug,status,stripe_payment_id,stripe_session_id,student_id

- **app/api/webhooks/stripe/route.ts:972** [API_ROUTE]
  columns: action,actorRole,amount,application_id,currency,entity,entityId,metadata,programSlug,program_slug,status,stripe_payment_id,stripe_session_id

- **app/api/webhooks/stripe/route.ts:1047** [API_ROUTE]
  columns: amount,currency,metadata,status,stripe_payment_id,stripe_session_id

- **app/api/webhooks/stripe/route.ts:1134** [API_ROUTE]
  columns: amount,currency,metadata,status,stripe_payment_id,stripe_session_id

- **app/api/apprenticeship/enroll/checkout/route.ts:158** [API_ROUTE]
  columns: amount,application_id,checkout_url,metadata,payment_option,session_id,status,stripe_session_id,user_id

- **app/api/payments/create-session/route.ts:288** [API_ROUTE]
  columns: amount,metadata,payment_type,preferred_method,program_id,program_name,program_slug,sessionId,session_id,status,stripe_customer_id,success,url,user_id

- **lib/stripe/tuition-checkout.ts:385** [LIB_FUNCTION]
  columns: metadata,status,stripe_subscription_id,student_id

- **lib/partner-workflows/payments.ts:186** [LIB_FUNCTION]
  columns: amount,currency,enrollment_id,metadata,status,stripe_session_id

- **lib/partner-workflows/payments.ts:219** [LIB_FUNCTION]
  columns: amount,currency,enrollment_id,metadata,requiresPayment,status,stripe_session_id

---

## TABLE: provisioning_events

- **lib/store/audit.ts:32** [LIB_FUNCTION]
  columns: correlation_id,metadata,paymentIntentId,payment_intent_id,status,step,supabase,tenant_id

- **lib/jobs/handlers/email-send.ts:48** [LIB_FUNCTION]
  columns: correlationId,correlation_id,durationMs,emailType,jobId,metadata,status,step,tenant_id,to

- **lib/jobs/handlers/email-send.ts:69** [LIB_FUNCTION]
  columns: correlation_id,emailType,jobId,metadata,status,step,tenant_id,to

- **lib/jobs/handlers/license-provision.ts:72** [LIB_FUNCTION]
  columns: advanced_reporting,ai_features,api_access,basic,bulk_operations,correlation_id,custom_domain,metadata,payment_intent_id,priority_support,sso,status,step,tenant_id,trial,white_label

- **lib/licensing/provisioning.ts:56** [LIB_FUNCTION]
  columns: correlation_id,environment,metadata,payment_intent_id,tenant_id

---

## TABLE: notification_logs

- **app/api/notifications/broadcast/route.ts:81** [API_ROUTE]
  columns: sent_at,status,user_id

- **app/api/notifications/broadcast/route.ts:105** [API_ROUTE]
  columns: error_message,status,success,summary,total,user_id

---

## TABLE: email_logs

- **app/api/crm/campaigns/send/route.ts:192** [API_ROUTE]
  columns: campaign_id,error_message,recipient_email,sent_at,status

- **app/api/crm/campaigns/send/route.ts:200** [API_ROUTE]
  columns: campaign_id,error_message,recipient_email,sent_count,status,success

- **app/api/email/workflows/processor/route.ts:287** [API_ROUTE]
  columns: error_message,recipient_email,recipient_id,sent_at,status,subject,workflow_id

- **app/api/email/workflows/processor/route.ts:304** [API_ROUTE]
  columns: error_message,recipient_email,recipient_id,status,subject,workflow_id

- **app/api/email/campaigns/send/route.ts:80** [API_ROUTE]
  columns: campaign_id,email,recipient_email,recipient_id,sent_at,status,subject,success

- **app/api/email/campaigns/send/route.ts:100** [API_ROUTE]
  columns: campaign_id,error_message,recipient_email,recipient_id,sent_at,status,subject,success,total_sent

- **lib/stripe/tuition-webhook-handler.ts:217** [LIB_FUNCTION]
  columns: email_type,recipient_email,sent_at,status,subject,user_id

- **lib/email/monitor.ts:27** [LIB_FUNCTION]
  columns: created_at,error_message,provider,sent_at,status,subject,to

- **lib/welcome-packet/index.ts:230** [LIB_FUNCTION]
  columns: completed,completed_at,itemId,packetId,recipient,sent_at,studentId,subject

---

## TABLE: user_activity_events

- **app/api/analytics/events/route.ts:29** [API_ROUTE]
  columns: event_payload,event_type,ip_address,tenant_id,user_agent,user_id

---

## TABLE: program_holder_verification

- **app/program-holder/verify-identity/IdentityVerificationFlow.tsx:126** [SERVER_COMPONENT]
  columns: created_at,program_holder_id,status,verification_status,verification_type

- **app/api/program-holder/create-verification/route.ts:69** [API_ROUTE]
  columns: created_at,program_holder_id,sessionId,status,stripe_verification_session_id,url,verification_status,verification_type

---

## TABLE: unauthorized_access_log

- **app/api/track-usage/route.ts:169** [API_ROUTE]
  columns: detected_at,domain,ip_address,logged_at,referrer,status,url,user_agent

---

## RPC CALLS (potential governed writes)

- **app/admin/program-holders/[id]/page.tsx:150** rpc('approve_and_provision_program_holder')
- **app/admin/program-holders/[id]/page.tsx:264** rpc('provision_additional_program')
- **app/admin/program-holders/[id]/page.tsx:292** rpc('deprovision_program')
- **app/student-portal/onboarding/approved/page.tsx:37** rpc('verify_enrollment_complete')
- **app/api/enroll/approve/route.ts:269** rpc('')
- **app/api/partner/applications/[id]/approve/route.ts:78** rpc('rpc_approve_partner')
- **app/api/partner/applications/[id]/approve/route.ts:162** rpc('rpc_link_partner_user')
- **lib/jobs/queue.ts:108** rpc('claim_provisioning_jobs')
- **lib/jobs/queue.ts:126** rpc('complete_provisioning_job')
- **lib/jobs/queue.ts:143** rpc('complete_provisioning_job')

## DIRECT admin_audit_events WRITES (bypass check)

- app/admin/program-holders/[id]/page.tsx:216
- app/admin/program-holders/[id]/page.tsx:242
- app/api/admin/documents/signed-url/route.ts:109
- lib/admin/document-access.ts:49
- lib/retention/document-retention.ts:148
