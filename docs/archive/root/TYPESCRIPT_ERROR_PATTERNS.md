# TypeScript Error Patterns - LINE BY LINE AUDIT
## Total: 484 Errors


## 2339 - 117 errors

```
components/lms/ContentLibrary.tsx(185,31): error TS2339: Property 'files' does not exist on type 'EventTarget & (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)'.
```
```
components/lms/ContentLibrary.tsx(185,62): error TS2339: Property 'files' does not exist on type 'EventTarget & (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)'.
```
```
components/support/IntercomWidget.tsx(45,13): error TS2339: Property 'addEventListener' does not exist on type 'IntercomWindow'.
```
```
components/ui/SearchAutocomplete.tsx(24,3): error TS2339: Property 'placeholder' does not exist on type 'SearchAutocompleteProps'.
```
```
lib/ai-instructor/assign.ts(105,12): error TS2339: Property 'data' does not exist on type 'Logger'.
```
```
lib/ai/course-gap-detection.ts(125,83): error TS2339: Property 'program_id' does not exist on type 'ProgramRow'.
```
```
lib/ai/workforce-gap-scanner.ts(245,31): error TS2339: Property 'id' does not exist on type 'never'.
```
```
lib/ai/workforce-gap-scanner.ts(291,31): error TS2339: Property 'id' does not exist on type 'never'.
```
```
lib/ai/workforce-gap-scanner.ts(314,31): error TS2339: Property 'id' does not exist on type 'never'.
```
```
lib/ai/workforce-gap-scanner.ts(335,32): error TS2339: Property 'has_final_exam' does not exist on type 'never'.
```
```
lib/ai/workforce-gap-scanner.ts(335,67): error TS2339: Property 'has_practical_assessment' does not exist on type 'never'.
```
```
lib/ai/workforce-gap-scanner.ts(337,17): error TS2339: Property 'has_final_exam' does not exist on type 'never'.
```
```
lib/ai/workforce-gap-scanner.ts(350,17): error TS2339: Property 'has_practical_assessment' does not exist on type 'never'.
```
```
lib/audit.ts(52,8): error TS2339: Property 'catch' does not exist on type 'PromiseLike<void>'.
```
```
lib/auth/syncUserProfile.ts(53,6): error TS2339: Property 'from' does not exist on type 'Promise<SupabaseClient<any, "public", "public", any, any>>'.
```
```
lib/auth/syncUserProfile.ts(68,20): error TS2339: Property 'from' does not exist on type 'Promise<SupabaseClient<any, "public", "public", any, any>>'.
```
```
lib/auth/syncUserProfile.ts(71,20): error TS2339: Property 'from' does not exist on type 'Promise<SupabaseClient<any, "public", "public", any, any>>'.
```
```
lib/automation/evidence-processor.ts(280,37): error TS2339: Property 'data' does not exist on type 'OCRResult'.
```
```
lib/automation/evidence-processor.ts(281,37): error TS2339: Property 'documentType' does not exist on type 'OCRResult'.
```
```
lib/automation/progressSync.ts(14,30): error TS2339: Property 'get' does not exist on type 'Promise<ReadonlyRequestCookies>'.
```
```
lib/autopilot/ai-course-builder.ts(42,28): error TS2339: Property 'chat' does not exist on type 'never'.
```
```
lib/avatar-scripts.ts(331,20): error TS2339: Property 'followUp' does not exist on type '{ opening: string; nextAction: string; }'.
```
```
lib/avatar-scripts.ts(332,52): error TS2339: Property 'followUp' does not exist on type '{ opening: string; nextAction: string; }'.
```
```
lib/billing/enforceLimit.ts(11,23): error TS2339: Property 'license' does not exist on type 'OrgConfig'.
```
```
lib/billing/enforceLimit.ts(29,23): error TS2339: Property 'license' does not exist on type 'OrgConfig'.
```
```
lib/billing/licenseAllows.ts(9,16): error TS2339: Property 'license' does not exist on type 'OrgConfig'.
```
```
lib/cfd/service.ts(651,29): error TS2339: Property 'match' does not exist on type 'never'.
```
```
lib/cfd/service.ts(653,36): error TS2339: Property 'match' does not exist on type 'never'.
```
```
lib/communication/forums.ts(280,27): error TS2339: Property 'reply_count' does not exist on type '{ locked: any; }'.
```
```
lib/course-builder/versioning.ts(90,31): error TS2339: Property 'version' does not exist on type 'ParserError<`Expected identifier at \`${GenericStringError}\``>'.
```
```
lib/course-factory/integration/types.ts(467,24): error TS2339: Property 'interactionSpecs' does not exist on type 'BlueprintModule'.
```
```
lib/course-factory/publisher.ts(181,29): error TS2339: Property 'description' does not exist on type 'BlueprintModule'.
```
```
lib/course-factory/publisher.ts(194,27): error TS2339: Property 'description' does not exist on type 'BlueprintModule'.
```
```
lib/curriculum/audit-alignment.ts(382,24): error TS2339: Property 'competency_key' does not exist on type 'GenericStringError'.
```
```
lib/curriculum/audit-alignment.ts(402,29): error TS2339: Property 'competency_name' does not exist on type 'GenericStringError'.
```
```
lib/curriculum/export/pdf-exporter.tsx(35,11): error TS2339: Property 'checklist' does not exist on type '{ passed: boolean; missingItems: string[]; warnings: string[]; }'.
```
```
lib/curriculum/export/pdf-exporter.tsx(35,22): error TS2339: Property 'summary' does not exist on type '{ passed: boolean; missingItems: string[]; warnings: string[]; }'.
```
```
lib/curriculum/load-blueprint.ts(19,55): error TS2339: Property 'default' does not exist on type 'typeof import("/workspace/project/Elevate-lms/lib/curriculum/blueprints/barber-apprenticeship")'.
```
```
lib/curriculum/load-blueprint.ts(23,45): error TS2339: Property 'default' does not exist on type 'typeof import("/workspace/project/Elevate-lms/lib/curriculum/blueprints/crs-indiana")'.
```
```
lib/curriculum/package/generator.ts(65,12): error TS2339: Property 'order' does not exist on type '{ slug: string; title: string; lessons: { slug: string; title: string; content: string; objectives: string[]; competencyKeys: string[]; durationMinutes: number; }[]; }'.
```
```
lib/db/courses.ts(608,43): error TS2339: Property 'learning_objectives' does not exist on type '{ lesson_title: string; lesson_objectives: string[]; estimated_minutes: number; narration_script: string; slide_outline: { slide_number: number; title: string; bullets: string[]; speaker_notes: string; visual_suggestion?: string; }[]; practice_exercise: { ...; }; knowledge_check: { ...; }[]; instructor_notes: string...'.
```
```
lib/db/courses.ts(610,32): error TS2339: Property 'examples' does not exist on type '{ lesson_title: string; lesson_objectives: string[]; estimated_minutes: number; narration_script: string; slide_outline: { slide_number: number; title: string; bullets: string[]; speaker_notes: string; visual_suggestion?: string; }[]; practice_exercise: { ...; }; knowledge_check: { ...; }[]; instructor_notes: string...'.
```
```
lib/db/courses.ts(611,38): error TS2339: Property 'quiz_questions' does not exist on type '{ lesson_title: string; lesson_objectives: string[]; estimated_minutes: number; narration_script: string; slide_outline: { slide_number: number; title: string; bullets: string[]; speaker_notes: string; visual_suggestion?: string; }[]; practice_exercise: { ...; }; knowledge_check: { ...; }[]; instructor_notes: string...'.
```
```
lib/db/save-blueprint-canonical.ts(92,42): error TS2339: Property 'quiz_questions' does not exist on type '{ lesson_title: string; lesson_objectives: string[]; estimated_minutes: number; narration_script: string; slide_outline: { slide_number: number; title: string; bullets: string[]; speaker_notes: string; visual_suggestion?: string; }[]; practice_exercise: { ...; }; knowledge_check: { ...; }[]; instructor_notes: string...'.
```
```
lib/db/save-blueprint-canonical.ts(93,29): error TS2339: Property 'quiz_questions' does not exist on type '{ lesson_title: string; lesson_objectives: string[]; estimated_minutes: number; narration_script: string; slide_outline: { slide_number: number; title: string; bullets: string[]; speaker_notes: string; visual_suggestion?: string; }[]; practice_exercise: { ...; }; knowledge_check: { ...; }[]; instructor_notes: string...'.
```
```
lib/db/save-blueprint-canonical.ts(100,52): error TS2339: Property 'learning_objectives' does not exist on type '{ lesson_title: string; lesson_objectives: string[]; estimated_minutes: number; narration_script: string; slide_outline: { slide_number: number; title: string; bullets: string[]; speaker_notes: string; visual_suggestion?: string; }[]; practice_exercise: { ...; }; knowledge_check: { ...; }[]; instructor_notes: string...'.
```
```
lib/db/save-blueprint-canonical.ts(102,41): error TS2339: Property 'examples' does not exist on type '{ lesson_title: string; lesson_objectives: string[]; estimated_minutes: number; narration_script: string; slide_outline: { slide_number: number; title: string; bullets: string[]; speaker_notes: string; visual_suggestion?: string; }[]; practice_exercise: { ...; }; knowledge_check: { ...; }[]; instructor_notes: string...'.
```
```
lib/db/schema-guard.ts(113,33): error TS2339: Property 'name' does not exist on type 'ColumnInfo'.
```
```
lib/db/schema-guard.ts(113,46): error TS2339: Property 'type' does not exist on type 'ColumnInfo'.
```
```
lib/email/automated-triggers.ts(218,46): error TS2339: Property 'appointmentConfirmation' does not exist on type '{ studentAppointment: { from: string; subject: string; getHtml: (data: { firstName: string; date: string; time: string; format: "zoom" | "phone"; zoomLink?: string; rescheduleLink?: string; }) => string; getText: (data: { ...; }) => string; }; appointmentReminder24h: { ...; }; appointmentReminder1h: { ...; }; }'.
```

... and 67 more

## 2322 - 79 errors

```
components/lms/CourseModuleAccordion.tsx(308,23): error TS2322: Type 'string' is not assignable to type 'never'.
```
```
components/lms/LessonActivityMenu.tsx(163,17): error TS2322: Type 'string' is not assignable to type 'never'.
```
```
components/lms/LessonPlayer.tsx(158,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/lms/LessonPlayer.tsx(177,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/lms/LessonPlayer.tsx(192,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/lms/LessonPlayer.tsx(307,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/lms/LessonRecap.tsx(37,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/lms/LessonRecap.tsx(49,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/lms/LessonVideoWithSimulation.tsx(74,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/lms/NotificationBell.tsx(84,14): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/lms/TimedPracticeExam.tsx(91,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/lms/UniversalPracticeExam.tsx(130,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/portal/ApprenticePortalShell.tsx(292,30): error TS2322: Type 'string' is not assignable to type 'never'.
```
```
components/programs/ProgramDetailPage.tsx(143,19): error TS2322: Type '{ videoSrcDesktop: string; posterImage: string; voiceoverSrc: string; microLabel: string; analyticsName: string; belowHeroHeadline: string; belowHeroSubheadline: string; ctas: HeroBannerCta[]; trustIndicators: string[]; transcript: string; }' is not assignable to type 'IntrinsicAttributes & HeroVideoProps'.
```
```
components/programs/ProgramSpecSheet.tsx(81,17): error TS2322: Type 'string' is not assignable to type 'never'.
```
```
components/programs/ProgramTruthBadges.tsx(47,13): error TS2322: Type 'string' is not assignable to type 'never'.
```
```
components/site/HeaderMobileMenu.client.tsx(121,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/site/LanguageSwitcher.client.tsx(36,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/site/LanguageSwitcher.client.tsx(46,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/support/IntercomWidget.tsx(59,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/support/ZendeskWidget.tsx(33,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/ui/AnimatedCounter.tsx(39,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/ui/FundingToast.tsx(17,14): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/ui/InView.tsx(86,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/ui/LazyVideo.tsx(42,11): error TS2322: Type '{ src: string; poster: string; autoPlayOnMount: boolean; loop: boolean; controls: boolean; }' is not assignable to type 'IntrinsicAttributes & UltraVideoPlayerProps'.
```
```
components/ui/MobileNavWrapper.tsx(49,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/ui/MobileNavWrapper.tsx(72,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/ui/Modal.tsx(32,14): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/ui/PageVideoHero.tsx(34,7): error TS2322: Type '{ children: ReactNode; videoSrcDesktop: string; posterImage: string; belowHeroHeadline: string; belowHeroSubheadline: string; className: string; }' is not assignable to type 'IntrinsicAttributes & HeroVideoProps'.
```
```
components/ui/ScrollReveal.tsx(43,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/ui/StaggerChildren.tsx(48,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/ui/StickyMobileCTA/StickyMobileCTA.tsx(59,12): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/ui/animated-list.tsx(39,16): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
components/ui/bento-grid.tsx(55,15): error TS2322: Type 'string' is not assignable to type 'never'.
```
```
components/ui/number-ticker.tsx(38,14): error TS2322: Type '() => void' is not assignable to type 'void'.
```
```
lib/admin/get-admin-dashboard-data.ts(1056,7): error TS2322: Type '{ id: any; first_name: any; last_name: any; full_name: any; email: any; program_interest: any; status: any; created_at: any; submitted_at: any; age_days: number; urgent: boolean; href: string; }[]' is not assignable to type 'number'.
```
```
lib/auth/route-guards.ts(11,75): error TS2322: Type '"apprentice"' is not assignable to type 'UserRole'.
```
```
lib/auth/route-guards.ts(12,28): error TS2322: Type '"apprentice"' is not assignable to type 'UserRole'.
```
```
lib/auth/route-guards.ts(20,27): error TS2322: Type '"workforce"' is not assignable to type 'UserRole'.
```
```
lib/auth/route-guards.ts(22,26): error TS2322: Type '"provider"' is not assignable to type 'UserRole'.
```
```
lib/auth/student-access.ts(93,9): error TS2322: Type 'User' is not assignable to type 'Record<string, unknown>'.
```
```
lib/auth/student-access.ts(115,9): error TS2322: Type 'User' is not assignable to type 'Record<string, unknown>'.
```
```
lib/auth/student-access.ts(144,7): error TS2322: Type 'User' is not assignable to type 'Record<string, unknown>'.
```
```
lib/bulkOperations.ts(28,7): error TS2322: Type '"enrollment.create"' is not assignable to type 'AuditAction'.
```
```
lib/bulkOperations.ts(68,7): error TS2322: Type '"enrollment.delete"' is not assignable to type 'AuditAction'.
```
```
lib/bulkOperations.ts(135,7): error TS2322: Type '"certificate.issue"' is not assignable to type 'AuditAction'.
```
```
lib/bulkOperations.ts(181,7): error TS2322: Type '"grade.update"' is not assignable to type 'AuditAction'.
```
```
lib/bulkOperations.ts(226,7): error TS2322: Type '"user.delete"' is not assignable to type 'AuditAction'.
```
```
lib/certificates/generator.ts(179,20): error TS2322: Type 'Uint8Array<ArrayBufferLike>' is not assignable to type 'BlobPart'.
```
```
lib/consent.ts(99,3): error TS2322: Type 'string' is not assignable to type 'boolean'.
```

... and 29 more

## 2353 - 55 errors

```
components/RichTextEditor.tsx(62,9): error TS2353: Object literal may only specify known properties, and 'history' does not exist in type 'Partial<StarterKitOptions>'.
```
```
components/programs/ProgramApplyForm.tsx(43,9): error TS2353: Object literal may only specify known properties, and 'role' does not exist in type '{ programId: string; firstName: string; lastName: string; email: string; phone: string; personalStatement?: string; fundingSource?: string; }'.
```
```
data/programs/cna.ts(32,3): error TS2353: Object literal may only specify known properties, and 'regularPrice' does not exist in type 'ProgramSchema'.
```
```
lib/admin/bulk-import.ts(296,7): error TS2353: Object literal may only specify known properties, and 'actor_id' does not exist in type 'AuditEvent'.
```
```
lib/ai/providers/azure.ts(96,7): error TS2353: Object literal may only specify known properties, and 'provider' does not exist in type 'ChatCompletionResult'.
```
```
lib/api/cron-handler.ts(51,50): error TS2353: Object literal may only specify known properties, and 'duration_ms' does not exist in type 'Error'.
```
```
lib/api/safe-error.ts(51,27): error TS2353: Object literal may only specify known properties, and 'error' does not exist in type 'Error'.
```
```
lib/api/safe-error.ts(66,7): error TS2353: Object literal may only specify known properties, and 'code' does not exist in type 'Error'.
```
```
lib/certificates/flag-on-refund.ts(123,9): error TS2353: Object literal may only specify known properties, and 'actor_id' does not exist in type 'AuditEvent'.
```
```
lib/course-factory/publisher.ts(201,56): error TS2353: Object literal may only specify known properties, and 'module' does not exist in type 'Error'.
```
```
lib/course-factory/publisher.ts(255,58): error TS2353: Object literal may only specify known properties, and 'lesson' does not exist in type 'Error'.
```
```
lib/course-factory/publisher.ts(264,56): error TS2353: Object literal may only specify known properties, and 'lesson' does not exist in type 'Error'.
```
```
lib/curriculum/blueprints/barber/module-2.ts(32,11): error TS2353: Object literal may only specify known properties, and 'learningObjectives' does not exist in type 'BlueprintLessonRef'.
```
```
lib/curriculum/blueprints/building-services.ts(93,7): error TS2353: Object literal may only specify known properties, and 'interactionSpecs' does not exist in type 'BlueprintModule'.
```
```
lib/curriculum/blueprints/building-services.ts(131,7): error TS2353: Object literal may only specify known properties, and 'interactionSpecs' does not exist in type 'BlueprintModule'.
```
```
lib/curriculum/blueprints/building-services.ts(170,7): error TS2353: Object literal may only specify known properties, and 'interactionSpecs' does not exist in type 'BlueprintModule'.
```
```
lib/curriculum/blueprints/building-services.ts(208,7): error TS2353: Object literal may only specify known properties, and 'interactionSpecs' does not exist in type 'BlueprintModule'.
```
```
lib/curriculum/blueprints/building-services.ts(245,7): error TS2353: Object literal may only specify known properties, and 'interactionSpecs' does not exist in type 'BlueprintModule'.
```
```
lib/curriculum/blueprints/building-services.ts(284,7): error TS2353: Object literal may only specify known properties, and 'interactionSpecs' does not exist in type 'BlueprintModule'.
```
```
lib/curriculum/blueprints/building-services.ts(322,7): error TS2353: Object literal may only specify known properties, and 'interactionSpecs' does not exist in type 'BlueprintModule'.
```
```
lib/curriculum/blueprints/culinary.ts(93,7): error TS2353: Object literal may only specify known properties, and 'interactionSpecs' does not exist in type 'BlueprintModule'.
```
```
lib/curriculum/blueprints/culinary.ts(132,7): error TS2353: Object literal may only specify known properties, and 'interactionSpecs' does not exist in type 'BlueprintModule'.
```
```
lib/curriculum/blueprints/culinary.ts(172,7): error TS2353: Object literal may only specify known properties, and 'interactionSpecs' does not exist in type 'BlueprintModule'.
```
```
lib/curriculum/blueprints/culinary.ts(212,7): error TS2353: Object literal may only specify known properties, and 'interactionSpecs' does not exist in type 'BlueprintModule'.
```
```
lib/curriculum/blueprints/culinary.ts(251,7): error TS2353: Object literal may only specify known properties, and 'interactionSpecs' does not exist in type 'BlueprintModule'.
```
```
lib/curriculum/blueprints/culinary.ts(290,7): error TS2353: Object literal may only specify known properties, and 'interactionSpecs' does not exist in type 'BlueprintModule'.
```
```
lib/curriculum/blueprints/peer-recovery-specialist.ts(21,5): error TS2353: Object literal may only specify known properties, and 'minModules' does not exist in type 'BlueprintGenerationRules'.
```
```
lib/curriculum/builders/buildCanonicalCourseFromBlueprint.ts(582,7): error TS2353: Object literal may only specify known properties, and 'code' does not exist in type 'Error'.
```
```
lib/curriculum/package/generator.ts(631,9): error TS2353: Object literal may only specify known properties, and 'generated' does not exist in type 'ApprovalPacketSection'.
```
```
lib/curriculum/package/generator.ts(638,9): error TS2353: Object literal may only specify known properties, and 'generated' does not exist in type 'ApprovalPacketSection'.
```
```
lib/curriculum/package/generator.ts(645,9): error TS2353: Object literal may only specify known properties, and 'generated' does not exist in type 'ApprovalPacketSection'.
```
```
lib/curriculum/package/generator.ts(652,9): error TS2353: Object literal may only specify known properties, and 'generated' does not exist in type 'ApprovalPacketSection'.
```
```
lib/curriculum/package/generator.ts(659,9): error TS2353: Object literal may only specify known properties, and 'generated' does not exist in type 'ApprovalPacketSection'.
```
```
lib/enrollment/create-enrollment.ts(240,9): error TS2353: Object literal may only specify known properties, and 'actor_id' does not exist in type 'AuditEvent'.
```
```
lib/error-handler.ts(19,5): error TS2353: Object literal may only specify known properties, and 'timestamp' does not exist in type 'Error'.
```
```
lib/gdpr.ts(93,7): error TS2353: Object literal may only specify known properties, and 'actor_id' does not exist in type 'AuditEvent'.
```
```
lib/gdpr.ts(178,7): error TS2353: Object literal may only specify known properties, and 'actor_id' does not exist in type 'AuditEvent'.
```
```
lib/licensing/enforcement.ts(187,5): error TS2353: Object literal may only specify known properties, and 'actor_id' does not exist in type 'AuditEvent'.
```
```
lib/licensing/enforcement.ts(231,5): error TS2353: Object literal may only specify known properties, and 'actor_id' does not exist in type 'AuditEvent'.
```
```
lib/licensing/enforcement.ts(258,5): error TS2353: Object literal may only specify known properties, and 'actor_id' does not exist in type 'AuditEvent'.
```
```
lib/licensing/enforcement.ts(288,5): error TS2353: Object literal may only specify known properties, and 'actor_id' does not exist in type 'AuditEvent'.
```
```
lib/licensing/provisioning.ts(337,7): error TS2353: Object literal may only specify known properties, and 'actor_id' does not exist in type 'AuditEvent'.
```
```
lib/licensing/provisioning.ts(366,7): error TS2353: Object literal may only specify known properties, and 'actor_id' does not exist in type 'AuditEvent'.
```
```
lib/licensing/provisioning.ts(428,5): error TS2353: Object literal may only specify known properties, and 'actor_id' does not exist in type 'AuditEvent'.
```
```
lib/licensing/provisioning.ts(467,5): error TS2353: Object literal may only specify known properties, and 'actor_id' does not exist in type 'AuditEvent'.
```
```
lib/lms/engine/completion.ts(111,76): error TS2353: Object literal may only specify known properties, and 'userId' does not exist in type 'Error'.
```
```
lib/navigation/navigation-config.ts(195,3): error TS2353: Object literal may only specify known properties, and 'apprentice' does not exist in type 'Record<UserRole, NavSection[]>'.
```
```
lib/navigation/navigation-config.ts(443,3): error TS2353: Object literal may only specify known properties, and 'apprentice' does not exist in type 'Record<UserRole, string>'.
```
```
lib/navigation/navigation-config.ts(463,3): error TS2353: Object literal may only specify known properties, and 'apprentice' does not exist in type 'Record<UserRole, ActionItem[]>'.
```
```
lib/notifications/push-service.ts(149,77): error TS2353: Object literal may only specify known properties, and 'endpoint' does not exist in type 'Error'.
```

... and 5 more

## 2345 - 54 errors

```
components/lms/LessonContentRenderer.tsx(87,91): error TS2345: Argument of type '{ lessonId: string; courseId: string; lessonType: LessonRenderMode; lessonTitle: string; missingField: string; }' is not assignable to parameter of type 'Error'.
```
```
components/site/HeaderMobileMenu.client.tsx(147,74): error TS2345: Argument of type 'NavSubItem[]' is not assignable to parameter of type 'NavItem[]'.
```
```
lib/api/route.ts(40,58): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/api/with-error-handling.ts(77,31): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/audit/ferpa.ts(91,52): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/auth/syncUserProfile.ts(49,25): error TS2345: Argument of type 'Promise<SupabaseClient<any, "public", "public", any, any>>' is not assignable to parameter of type '{ rpc: (fn: string, params: Record<string, unknown>) => PromiseLike<{ error: unknown; }>; }'.
```
```
lib/autopilot/test-enrollment-flow.ts(413,34): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Record<string, any>'.
```
```
lib/capabilities.ts(191,48): error TS2345: Argument of type 'string' is not assignable to parameter of type 'never'.
```
```
lib/curriculum/audit-alignment.ts(403,56): error TS2345: Argument of type 'GenericStringError' is not assignable to parameter of type '{ required_phrases: string[]; distinction_side_a: string[]; distinction_side_b: string[]; distractor_phrases: string[]; requires_distinction: boolean; }'.
```
```
lib/curriculum/builders/buildCanonicalCourseFromBlueprint.ts(413,13): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/curriculum/builders/buildCanonicalCourseFromBlueprint.ts(561,69): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/curriculum/builders/buildCanonicalCourseFromBlueprint.ts(676,78): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/curriculum/builders/buildCanonicalCourseFromBlueprint.ts(681,76): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/curriculum/export/pdf-exporter.tsx(145,7): error TS2345: Argument of type 'FunctionComponentElement<PDFDocumentProps>' is not assignable to parameter of type 'ReactElement<DocumentProps, string | JSXElementConstructor<any>>'.
```
```
lib/data/events.ts(77,55): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/data/events.ts(102,51): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/data/events.ts(120,46): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/data/jobs.ts(80,49): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/data/jobs.ts(96,46): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/data/news.ts(54,53): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/data/news.ts(71,51): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/data/news.ts(87,49): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/dynamic-imports.tsx(39,41): error TS2345: Argument of type '() => Promise<typeof import("/workspace/project/Elevate-lms/components/PDFViewer")>' is not assignable to parameter of type 'DynamicOptions<{}> | Loader<{}>'.
```
```
lib/dynamic-imports.tsx(51,38): error TS2345: Argument of type '() => Promise<typeof import("/workspace/project/Elevate-lms/components/AIInstructorPanel")>' is not assignable to parameter of type 'DynamicOptions<{}> | Loader<{}>'.
```
```
lib/email/send-onboarding.ts(89,71): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/email/sendOrgInviteEmail.ts(35,54): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/enrollment-service.ts(145,59): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/enrollment-service.ts(190,60): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/enrollment-service.ts(232,82): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/enrollment-service.ts(273,75): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/enrollment-service.ts(310,74): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/enrollment/complete-enrollment.ts(154,65): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'Error'.
```
```
lib/enrollment/orchestrate-enrollment.ts(132,67): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Record<string, any>'.
```
```
lib/grants/eligibility-engine.ts(131,46): error TS2345: Argument of type '{ uei: any; }' is not assignable to parameter of type 'string'.
```
```
lib/insurance/scan-approve-strict.ts(103,38): error TS2345: Argument of type '{ extractedText: string; expectedBusinessName: string; expectedShopAddress: string; expectedCertificateHolder: string; minGlPerOccurrence: number; minGlAggregate: number; minProLiabilityPerClaim: number; ocrConfidence: number; workerRelationship: "w2_employees" | ... 2 more ... | "not_sure"; }' is not assignable to parameter of type '{ extractedText: string; minGlPerOccurrence: number; minGlAggregate: number; minProLiabilityPerClaim: number; minOcrConfidence: number; expectedBusinessName?: string; expectedShopAddress?: string; expectedCertificateHolder?: string; ocrConfidence?: number; workerRelationship?: "w2_employees" | ... 2 more ... | "not_...'.
```
```
lib/integrations/grants-gov.ts(111,45): error TS2345: Argument of type 'number' is not assignable to parameter of type 'Error'.
```
```
lib/integrations/grants-gov.ts(197,45): error TS2345: Argument of type 'number' is not assignable to parameter of type 'Error'.
```
```
lib/integrations/salesforce.ts(86,48): error TS2345: Argument of type 'number' is not assignable to parameter of type 'Error'.
```
```
lib/integrations/salesforce.ts(112,50): error TS2345: Argument of type 'number' is not assignable to parameter of type 'Error'.
```
```
lib/integrations/salesforce.ts(134,50): error TS2345: Argument of type 'number' is not assignable to parameter of type 'Error'.
```
```
lib/integrations/salesforce.ts(175,60): error TS2345: Argument of type 'number' is not assignable to parameter of type 'Error'.
```
```
lib/integrations/sam-gov.ts(37,42): error TS2345: Argument of type 'number' is not assignable to parameter of type 'Error'.
```
```
lib/lms/course-service.ts(204,70): error TS2345: Argument of type 'string' is not assignable to parameter of type 'Error'.
```
```
lib/monitoring/error-tracker.ts(179,51): error TS2345: Argument of type '{ type: "unauthorized_access" | "invalid_token" | "suspicious_activity" | "brute_force"; description: string; endpoint: string; ipAddress?: string; userId?: string; severity: "low" | "medium" | "high" | "critical"; }' is not assignable to parameter of type 'Error'.
```
```
lib/multiTenant/compliance.ts(22,25): error TS2345: Argument of type 'Promise<SupabaseClient<any, "public", "public", any, any>>' is not assignable to parameter of type '{ rpc: (fn: string, params: Record<string, unknown>) => PromiseLike<{ error: unknown; }>; }'.
```
```
lib/multiTenant/compliance.ts(45,25): error TS2345: Argument of type 'Promise<SupabaseClient<any, "public", "public", any, any>>' is not assignable to parameter of type '{ rpc: (fn: string, params: Record<string, unknown>) => PromiseLike<{ error: unknown; }>; }'.
```
```
lib/paris/course-orchestrator.ts(212,27): error TS2345: Argument of type 'GeneratedCourse' is not assignable to parameter of type '{ modules: GeneratedModule[]; }'.
```
```
lib/programs/load-program-catalog.ts(245,55): error TS2345: Argument of type '{ message: string; }' is not assignable to parameter of type 'Error'.
```
```
lib/programs/load-program-catalog.ts(284,65): error TS2345: Argument of type '{ message: string; }' is not assignable to parameter of type 'Error'.
```
```
lib/qa/auto-healing-agent.ts(187,42): error TS2345: Argument of type '{ status: string; started_at: string; }' is not assignable to parameter of type 'never'.
```

... and 4 more

## 2304 - 50 errors

```
components/lms/PostVideoQuiz.tsx(385,41): error TS2304: Cannot find name 'computeScore'.
```
```
components/ui/SearchAutocomplete.tsx(108,24): error TS2304: Cannot find name 'Content'.
```
```
components/ui/Tooltip.tsx(223,22): error TS2304: Cannot find name 'placeholder'.
```
```
lib/audit.ts(66,40): error TS2304: Cannot find name 'failureRecord'.
```
```
lib/auth.ts(19,10): error TS2304: Cannot find name 'createClient'.
```
```
lib/auth/require-org-admin.ts(30,10): error TS2304: Cannot find name 'createClient'.
```
```
lib/auth/require-program-holder.ts(30,24): error TS2304: Cannot find name 'requireAdminClient'.
```
```
lib/automation/progressSync.ts(22,26): error TS2304: Cannot find name 'requireAdminClient'.
```
```
lib/automation/progressSync.ts(59,26): error TS2304: Cannot find name 'requireAdminClient'.
```
```
lib/automation/shop-routing.ts(125,20): error TS2304: Cannot find name 'getSupabaseAdmin'.
```
```
lib/automation/shop-routing.ts(356,20): error TS2304: Cannot find name 'getSupabaseAdmin'.
```
```
lib/autopilot/formatter.ts(17,25): error TS2304: Cannot find name 'json'.
```
```
lib/autopilot/lesson-to-scenes.ts(16,14): error TS2304: Cannot find name 'OpenAI'.
```
```
lib/autopilot/lesson-to-scenes.ts(17,23): error TS2304: Cannot find name 'OpenAI'.
```
```
lib/avatar-scripts.ts(326,16): error TS2304: Cannot find name 'GLOBAL_SYSTEM_RULES'.
```
```
lib/config.ts(55,22): error TS2304: Cannot find name 'requireAdminClient'.
```
```
lib/course-builder/program-auto-course.ts(104,29): error TS2304: Cannot find name 'blueprintMod'.
```
```
lib/course-builder/program-auto-course.ts(221,15): error TS2304: Cannot find name 'blueprintMod'.
```
```
lib/course-utils.ts(27,8): error TS2304: Cannot find name 'course'.
```
```
lib/course-utils.ts(28,8): error TS2304: Cannot find name 'course'.
```
```
lib/course-utils.ts(29,22): error TS2304: Cannot find name 'course'.
```
```
lib/course-utils.ts(31,3): error TS2304: Cannot find name 'course'.
```
```
lib/curriculum/builders/buildCourseFromBlueprint.ts(54,31): error TS2304: Cannot find name 'createClient'.
```
```
lib/data/programs.ts(18,29): error TS2304: Cannot find name 'Program'.
```
```
lib/data/programs.ts(43,57): error TS2304: Cannot find name 'Program'.
```
```
lib/data/programs.ts(54,49): error TS2304: Cannot find name 'Program'.
```
```
lib/demo/requireDemo.ts(10,27): error TS2304: Cannot find name 'DemoRole'.
```
```
lib/demo/requireDemo.ts(20,9): error TS2304: Cannot find name 'DemoRole'.
```
```
lib/demo/requireDemo.ts(48,37): error TS2304: Cannot find name 'DemoRole'.
```
```
lib/demo/requireDemo.ts(92,39): error TS2304: Cannot find name 'DemoRole'.
```
```
lib/enrollment/create-enrollment.ts(60,33): error TS2304: Cannot find name 'requireAdminClient'.
```
```
lib/enrollment/gate.ts(52,20): error TS2304: Cannot find name 'resolveCourseId'.
```
```
lib/enrollment/gate.ts(61,22): error TS2304: Cannot find name 'SLUG_TO_PORTAL'.
```
```
lib/industry/standards-loader.ts(117,7): error TS2304: Cannot find name 'logger'.
```
```
lib/industry/standards-loader.ts(126,5): error TS2304: Cannot find name 'logger'.
```
```
lib/industry/standards-loader.ts(134,7): error TS2304: Cannot find name 'logger'.
```
```
lib/license/requireActiveLicense.ts(37,22): error TS2304: Cannot find name 'BillingAuthority'.
```
```
lib/license/requireActiveLicense.ts(43,29): error TS2304: Cannot find name 'BillingAuthority'.
```
```
lib/license/requireActiveLicense.ts(49,24): error TS2304: Cannot find name 'BillingAuthority'.
```
```
lib/licensing/middleware.ts(24,22): error TS2304: Cannot find name 'BillingAuthority'.
```
```
lib/lms/engine/completion.ts(217,26): error TS2304: Cannot find name 'SupabaseClient'.
```
```
lib/middleware/withLicense.ts(15,21): error TS2304: Cannot find name 'BillingAuthority'.
```
```
lib/notifications/processor.ts(19,17): error TS2304: Cannot find name 'TemplateKey'.
```
```
lib/ops/autonomous-ops-agent.ts(217,13): error TS2304: Cannot find name 'setAuditContext'.
```
```
lib/ops/autonomous-ops-agent.ts(221,13): error TS2304: Cannot find name 'setAuditContext'.
```
```
lib/ops/autonomous-ops-agent.ts(240,11): error TS2304: Cannot find name 'setAuditContext'.
```
```
lib/ops/autonomous-ops-agent.ts(242,11): error TS2304: Cannot find name 'setAuditContext'.
```
```
lib/paris/import-engine/github-analyzer.ts(231,19): error TS2304: Cannot find name 'server'.
```
```
lib/paris/voice-commands.tsx(235,5): error TS2304: Cannot find name 'setLastResult'.
```
```
lib/studio/orchestration.ts(410,38): error TS2304: Cannot find name 'StudioType'.
```

## 2307 - 21 errors

```
lib/autopilot/autopilot.ts(18,41): error TS2307: Cannot find module '../../workers/self-healing-autopilot.js' or its corresponding type declarations.
```
```
lib/devstudio/env.ts(1,28): error TS2307: Cannot find module './webcontainer/runtime' or its corresponding type declarations.
```
```
lib/devstudio/fs/index.ts(1,28): error TS2307: Cannot find module '../webcontainer/runtime' or its corresponding type declarations.
```
```
lib/devstudio/platform-control-plane/index.ts(19,8): error TS2307: Cannot find module '../ai-studio-charter' or its corresponding type declarations.
```
```
lib/hero-config.ts(11,55): error TS2307: Cannot find module '@/components/ui/HeroSection' or its corresponding type declarations.
```
```
lib/hooks/useAuth.ts(73,48): error TS2307: Cannot find module '@/app/auth/forgot-password/actions' or its corresponding type declarations.
```
```
lib/paris/course-orchestrator.ts(43,31): error TS2307: Cannot find module '@/lib/ai/video-generator' or its corresponding type declarations.
```
```
lib/paris/dev-studio.ts(6,15): error TS2307: Cannot find module '../import-engine' or its corresponding type declarations.
```
```
lib/paris/dev-studio.ts(7,15): error TS2307: Cannot find module '../workforce' or its corresponding type declarations.
```
```
lib/paris/dev-studio.ts(8,15): error TS2307: Cannot find module '../marketing' or its corresponding type declarations.
```
```
lib/paris/dev-studio.ts(10,44): error TS2307: Cannot find module '../import-engine' or its corresponding type declarations.
```
```
lib/paris/dev-studio.ts(11,59): error TS2307: Cannot find module '../workforce' or its corresponding type declarations.
```
```
lib/paris/dev-studio.ts(12,76): error TS2307: Cannot find module '../marketing' or its corresponding type declarations.
```
```
lib/paris/dev-studio.ts(13,57): error TS2307: Cannot find module '../workforce/types' or its corresponding type declarations.
```
```
lib/paris/dev-studio.ts(14,52): error TS2307: Cannot find module '../marketing/types' or its corresponding type declarations.
```
```
lib/paris/index.ts(34,15): error TS2307: Cannot find module './media-studio' or its corresponding type declarations.
```
```
lib/paris/media-designer.ts(9,31): error TS2307: Cannot find module '@/lib/ai/video-generator' or its corresponding type declarations.
```
```
lib/paris/media-designer.ts(10,35): error TS2307: Cannot find module '@/lib/ai/voice-generator' or its corresponding type declarations.
```
```
lib/paris/media-designer.ts(11,32): error TS2307: Cannot find module '@/lib/ai/slide-generator' or its corresponding type declarations.
```
```
lib/paris/media-designer.ts(12,34): error TS2307: Cannot find module '@/lib/ai/workbook-generator' or its corresponding type declarations.
```
```
lib/paris/media-studio/api.ts(16,8): error TS2307: Cannot find module '../types' or its corresponding type declarations.
```

## 2554 - 14 errors

```
components/video/UltraVideoPlayer.tsx(144,30): error TS2554: Expected 1 arguments, but got 0.
```
```
components/video/UltraVideoPlayer.tsx(145,31): error TS2554: Expected 1 arguments, but got 0.
```
```
lib/ai/course-generator.ts(241,82): error TS2554: Expected 0-1 arguments, but got 2.
```
```
lib/ai/course-generator.ts(268,75): error TS2554: Expected 0-1 arguments, but got 2.
```
```
lib/api/validation-schemas.ts(272,9): error TS2554: Expected 0-1 arguments, but got 2.
```
```
lib/curriculum/export/pdf-exporter.tsx(150,46): error TS2554: Expected 0-1 arguments, but got 2.
```
```
lib/ellie/executor.ts(61,19): error TS2554: Expected 0-1 arguments, but got 2.
```
```
lib/ellie/executor.ts(75,19): error TS2554: Expected 0-1 arguments, but got 2.
```
```
lib/enrollment/partner-routing.ts(146,89): error TS2554: Expected 0-1 arguments, but got 2.
```
```
lib/enrollment/partner-routing.ts(158,75): error TS2554: Expected 0-1 arguments, but got 2.
```
```
lib/enrollment/partner-routing.ts(208,82): error TS2554: Expected 0-1 arguments, but got 2.
```
```
lib/enrollment/partner-routing.ts(218,68): error TS2554: Expected 0-1 arguments, but got 2.
```
```
lib/portal/router.ts(199,79): error TS2554: Expected 2 arguments, but got 3.
```
```
lib/workflows/engine.ts(367,125): error TS2554: Expected 1-2 arguments, but got 3.
```

## 2352 - 12 errors

```
components/ui/design-system/Button.tsx(69,43): error TS2352: Conversion of type '{ form?: string | undefined; formAction?: string | ((formData: FormData) => void | Promise<void>) | React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_FORM_ACTIONS[keyof React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_FORM_ACTIONS] | undefined; ... 284 more ...; className: string; }' to type 'string' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
```
```
lib/admin/course-admin-overview.ts(81,26): error TS2352: Conversion of type '{ slug: any; }[]' to type '{ slug: string; }' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
```
```
lib/ai/course-gap-detection.ts(125,37): error TS2352: Conversion of type '{ id: any; title: any; program_id: any; status: any; }[]' to type 'ProgramRow[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
```
```
lib/data/jobs.ts(83,10): error TS2352: Conversion of type 'GenericStringError[]' to type 'JobPosting[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
```
```
lib/data/jobs.ts(99,10): error TS2352: Conversion of type 'GenericStringError' to type 'JobPosting' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
```
```
lib/db/programs.ts(172,10): error TS2352: Conversion of type '{ id: any; slug: any; title: any; description: any; short_description: any; image_url: any; hero_image_url: any; estimated_weeks: any; credential_name: any; funding_tags: any; wioa_approved: any; ... 16 more ...; program_requirements: { ...; }[]; }' to type 'DbProgram' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
```
```
lib/jobs/handlers/email-send.ts(34,19): error TS2352: Conversion of type 'Record<string, unknown>' to type 'EmailPayload' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
```
```
lib/observability/correlation.ts(27,23): error TS2352: Conversion of type 'Customer | PaymentIntent | Refund | PaymentMethod | Subscription | Price | Invoice | CashBalance | ... 72 more ... | ReceivedDebit' to type 'Record<string, unknown>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
```
```
lib/observability/correlation.ts(38,21): error TS2352: Conversion of type 'Record<string, unknown>' to type 'Session' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
```
```
lib/observability/correlation.ts(44,20): error TS2352: Conversion of type 'Record<string, unknown>' to type 'Charge' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
```
```
lib/observability/correlation.ts(49,21): error TS2352: Conversion of type 'Record<string, unknown>' to type 'Invoice & { payment_intent?: string; }' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
```
```
lib/platform/organization-features.ts(91,17): error TS2352: Conversion of type '{ feature_codes: any; }[]' to type '{ feature_codes: string[]; }' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
```

## 2305 - 12 errors

```
lib/auth-server.ts(6,10): error TS2305: Module '"@/lib/admin/guards"' has no exported member 'requireAuth'.
```
```
lib/barber/load-barber-dashboard.ts(8,48): error TS2305: Module '"@/lib/barber/branding"' has no exported member 'BARBER_LMS_COURSE_PATH'.
```
```
lib/compliance/index.ts(14,3): error TS2305: Module '"./enforcement"' has no exported member 'getUserAgreements'.
```
```
lib/compliance/index.ts(16,3): error TS2305: Module '"./enforcement"' has no exported member 'logComplianceEvent'.
```
```
lib/compliance/index.ts(17,3): error TS2305: Module '"./enforcement"' has no exported member 'REQUIRED_AGREEMENTS'.
```
```
lib/course-factory/integration/types.ts(7,53): error TS2305: Module '"../../curriculum/blueprints/types"' has no exported member 'InteractionSpecs'.
```
```
lib/course-factory/integration/types.ts(8,15): error TS2305: Module '"../../curriculum/blueprints/types"' has no exported member 'EnrollmentType'.
```
```
lib/paris/course-orchestrator.ts(38,10): error TS2305: Module '"@/lib/ai/course-generator"' has no exported member 'generateQuiz'.
```
```
lib/paris/course-orchestrator.ts(39,10): error TS2305: Module '"@/lib/ai/course-gap-detection"' has no exported member 'detectCourseGaps'.
```
```
lib/paris/course-orchestrator.ts(42,10): error TS2305: Module '"@/lib/ai/image-generator"' has no exported member 'generateImage'.
```
```
lib/paris/media-designer.ts(8,10): error TS2305: Module '"@/lib/ai/image-generator"' has no exported member 'generateImage'.
```
```
lib/stripe/handlers/testing-checkout-completed.ts(13,3): error TS2305: Module '"@/lib/stripe/webhook-schemas"' has no exported member 'TestingEnforcementMeta'.
```

## 2741 - 10 errors

```
components/lms/LessonActivityMenu.tsx(35,7): error TS2741: Property 'ask' is missing in type '{ video: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>; reading: React.ForwardRefExoticComponent<Omit<...> & React.RefAttributes<...>>; ... 6 more ...; resources: React.ForwardRefExoticComponent<...>; }' but required in type 'Record<ActivityId, ElementType<any, keyof IntrinsicElements>>'.
```
```
components/lms/LessonActivityMenu.tsx(47,7): error TS2741: Property 'ask' is missing in type '{ video: string; reading: string; flashcards: string; lab: string; scenario: string; practice: string; checkpoint: string; notes: string; resources: string; }' but required in type 'Record<ActivityId, string>'.
```
```
lib/apprenticeship-programs/program-syllabus.ts(21,3): error TS2741: Property 'syllabusPath' is missing in type '{ slug: "cosmetology-apprenticeship"; title: string; rtiLabel: string; hostRequirement: string; }' but required in type 'ProgramSyllabusInfo'.
```
```
lib/cfd/service.ts(800,11): error TS2741: Property 'toleranceResults' is missing in type '{ jobId: string; taskId: string; requiredFilesPresent: undefined[]; dictionarySyntaxValid: undefined[]; solverConverged: false; residualHistory: undefined[]; pass: false; evaluatedAt: string; }' but required in type 'CFDValidationReport'.
```
```
lib/paris/course-orchestrator.ts(221,7): error TS2741: Property 'modules' is missing in type 'GeneratedCourse' but required in type '{ modules: GeneratedModule[]; }'.
```
```
lib/paris/course-orchestrator.ts(247,5): error TS2741: Property 'version' is missing in type '{ success: false; credential: CredentialDefinition; modules: undefined[]; practiceExam: GeneratedExam; qualityScore: number; validation: ValidationResult; errors: string[]; }' but required in type 'CourseBuildResult'.
```
```
lib/paris/import-engine/compatibility-reporter.ts(20,7): error TS2741: Property 'angular' is missing in type '{ nextjs: { score: number; effort: "low"; notes: string[]; }; react: { score: number; effort: "low"; notes: string[]; }; vue: { score: number; effort: "high"; notes: string[]; }; nuxt: { score: number; effort: "high"; notes: string[]; }; ... 14 more ...; unknown: { ...; }; }' but required in type 'Record<Framework, { score: number; effort: "low" | "medium" | "high" | "very_high"; notes: string[]; }>'.
```
```
lib/paris/import-engine/github-analyzer.ts(657,7): error TS2741: Property 'notes' is missing in type '{ name: string; compatible: true; }' but required in type '{ name: string; compatible: boolean; notes: string; }'.
```
```
lib/paris/import-engine/github-analyzer.ts(659,7): error TS2741: Property 'notes' is missing in type '{ name: string; compatible: true; }' but required in type '{ name: string; compatible: boolean; notes: string; }'.
```
```
lib/paris/import-engine/github-analyzer.ts(663,7): error TS2741: Property 'notes' is missing in type '{ name: string; compatible: true; }' but required in type '{ name: string; compatible: boolean; notes: string; }'.
```

## 2740 - 9 errors

```
components/lms/LessonContentRenderer.tsx(156,19): error TS2740: Type '{}' is missing the following properties from type 'any[]': length, pop, push, concat, and 28 more.
```
```
components/lms/LessonContentRenderer.tsx(201,17): error TS2740: Type '{}' is missing the following properties from type 'any[]': length, pop, push, concat, and 28 more.
```
```
components/lms/LessonContentRenderer.tsx(314,19): error TS2740: Type '{}' is missing the following properties from type 'any[]': length, pop, push, concat, and 28 more.
```
```
components/lms/LessonContentRenderer.tsx(350,19): error TS2740: Type '{}' is missing the following properties from type 'any[]': length, pop, push, concat, and 28 more.
```
```
lib/db/index.ts(10,5): error TS2740: Type 'Promise<SupabaseClient<any, "public", "public", any, any>>' is missing the following properties from type 'SupabaseClient<any, "public", "public", any, any>': supabaseUrl, supabaseKey, auth, realtime, and 21 more.
```
```
lib/native-modules.ts(132,5): error TS2740: Type '{ default: PDFDocument; version: number; compress: boolean; info: DocumentInfo; options: PDFDocumentOptions; page: PDFPage; x: number; ... 120 more ...; endOutline(): void; }' is missing the following properties from type 'PDFDocument': _read, read, setEncoding, pause, and 36 more.
```
```
lib/native-modules.ts(204,5): error TS2740: Type '{ default: PDFDocument; version: number; compress: boolean; info: DocumentInfo; options: PDFDocumentOptions; page: PDFPage; x: number; ... 120 more ...; endOutline(): void; }' is missing the following properties from type 'PDFDocument': _read, read, setEncoding, pause, and 36 more.
```
```
lib/native-modules.ts(205,14): error TS2740: Type '{ default: PDFDocument; version: number; compress: boolean; info: DocumentInfo; options: PDFDocumentOptions; page: PDFPage; x: number; ... 120 more ...; endOutline(): void; }' is missing the following properties from type 'PDFDocument': _read, read, setEncoding, pause, and 36 more.
```
```
lib/paris/qa-designer.ts(191,5): error TS2740: Type '{ name: string; score: number; threshold: number; passed: boolean; details: string; issues: string[]; }' is missing the following properties from type 'LicensingMetadata': curriculumId, version, copyright, licenseType, and 2 more.
```

## 2769 - 6 errors

```
lib/ai/course-gap-detection.ts(126,36): error TS2769: No overload matches this call.
```
```
lib/ai/workforce-gap-scanner.ts(525,6): error TS2769: No overload matches this call.
```
```
lib/ai/workforce-gap-scanner.ts(548,40): error TS2769: No overload matches this call.
```
```
lib/ai/workforce-gap-scanner.ts(562,49): error TS2769: No overload matches this call.
```
```
lib/qa/auto-healing-agent.ts(212,74): error TS2769: No overload matches this call.
```
```
lib/qa/auto-healing-agent.ts(265,47): error TS2769: No overload matches this call.
```

## 7030 - 4 errors

```
components/marketing/HeroVideo.tsx(145,74): error TS7030: Not all code paths return a value.
```
```
components/video/UltraVideoPlayer.tsx(195,61): error TS7030: Not all code paths return a value.
```
```
components/video/UltraVideoPlayer.tsx(231,45): error TS7030: Not all code paths return a value.
```
```
lib/auth/idle-timeout.ts(19,53): error TS7030: Not all code paths return a value.
```

## 2724 - 4 errors

```
lib/apiAdapter.ts(1,10): error TS2724: '"@/lib/supabase/server"' has no exported member named 'createServerClient'. Did you mean 'createClient'?
```
```
lib/compliance/index.ts(10,3): error TS2724: '"./enforcement"' has no exported member named 'checkComplianceStatusWithClient'. Did you mean 'checkComplianceStatus'?
```
```
lib/compliance/index.ts(19,8): error TS2724: '"./enforcement"' has no exported member named 'AgreementAcceptance'. Did you mean 'recordAgreementAcceptance'?
```
```
lib/curriculum/package/generator.ts(34,3): error TS2724: '"./types"' has no exported member named 'ClockHourCategory'. Did you mean 'HourCategory'?
```

## 1117 - 4 errors

```
lib/avatar-scripts.ts(133,3): error TS1117: An object literal cannot have multiple properties with the same name.
```
```
lib/avatar-scripts.ts(144,3): error TS1117: An object literal cannot have multiple properties with the same name.
```
```
lib/email/monitor.ts(73,7): error TS1117: An object literal cannot have multiple properties with the same name.
```
```
lib/navigation/navigation-config.ts(385,3): error TS1117: An object literal cannot have multiple properties with the same name.
```

## 2440 - 3 errors

```
lib/autopilot/ai-course-builder.ts(1,10): error TS2440: Import declaration conflicts with local declaration of 'getOpenAIClient'.
```
```
lib/paris/import-engine/github-analyzer.ts(19,3): error TS2440: Import declaration conflicts with local declaration of 'SecurityFlag'.
```
```
lib/stripe/stripe-client.ts(3,21): error TS2440: Import declaration conflicts with local declaration of 'stripe'.
```

## 2739 - 3 errors

```
lib/curriculum/blueprints/barber/index.ts(15,7): error TS2739: Type '{ videoGenerator: "runway"; template: "elevate-slide"; instructorName: string; instructorTitle: string; instructorImagePath: string; topBarColor: string; accentColor: string; backgroundColor: string; ... 5 more ...; dalleImageStyle: "natural"; }' is missing the following properties from type 'BlueprintVideoConfig': width, height
```
```
lib/learner/dashboard-loader.ts(634,5): error TS2739: Type '{ id: string; role: string; organization_id?: string; email?: string; first_name?: string; last_name?: string; full_name?: string; }' is missing the following properties from type '{ id: string; first_name: string; last_name: string; role: string; avatar_url: string; onboarding_completed: boolean; }': avatar_url, onboarding_completed
```
```
lib/store/beauty-dashboard-clone.ts(55,3): error TS2739: Type '{ name: string; summary: string; }' is missing the following properties from type 'BeautyProgramCard': slug, href
```

## 1361 - 3 errors

```
lib/paris/workforce/agent-manager.ts(36,20): error TS1361: 'AGENT_TEMPLATES' cannot be used as a value because it was imported using 'import type'.
```
```
lib/paris/workforce/agent-manager.ts(56,7): error TS1361: 'AVAILABLE_TOOLS' cannot be used as a value because it was imported using 'import type'.
```
```
lib/paris/workforce/agent-manager.ts(513,7): error TS1361: 'AVAILABLE_TOOLS' cannot be used as a value because it was imported using 'import type'.
```

## 2300 - 2 errors

```
components/dashboard/InstructorDashboard.tsx(21,3): error TS2300: Duplicate identifier 'Users'.
```
```
components/dashboard/InstructorDashboard.tsx(24,3): error TS2300: Duplicate identifier 'Users'.
```

## 2349 - 2 errors

```
components/site/HeaderMobileMenu.client.tsx(202,39): error TS2349: This expression is not callable.
```
```
lib/native-modules.ts(235,20): error TS2349: This expression is not callable.
```

## 18047 - 2 errors

```
lib/ai/workforce-gap-scanner.ts(552,21): error TS18047: 'job' is possibly 'null'.
```
```
lib/ai/workforce-gap-scanner.ts(556,10): error TS18047: 'job' is possibly 'null'.
```

## 2367 - 2 errors

```
lib/cfd/service.ts(362,9): error TS2367: This comparison appears to be unintentional because the types '" SpalartAllmaras" | "laminar" | "LES"' and '"SpalartAllmaras"' have no overlap.
```
```
lib/compliance/alert-system.ts(829,18): error TS2367: This comparison appears to be unintentional because the types '"info"' and '"critical"' have no overlap.
```

## 2551 - 2 errors

```
lib/licensing/provisioning.ts(229,62): error TS2551: Property 'getUserByEmail' does not exist on type 'GoTrueAdminApi'. Did you mean 'getUserById'?
```
```
lib/xapi/xapi-client.ts(262,17): error TS2551: Property 'trackLessonCompletion' does not exist on type 'XAPIClient'. Did you mean 'trackLessonCompleted'?
```

## 2451 - 2 errors

```
lib/stripe/tuition-webhook-handler.ts(815,9): error TS2451: Cannot redeclare block-scoped variable 'supabase'.
```
```
lib/stripe/tuition-webhook-handler.ts(821,9): error TS2451: Cannot redeclare block-scoped variable 'supabase'.
```

## 2559 - 1 errors

```
components/RichTextEditor.tsx(93,47): error TS2559: Type 'false' has no properties in common with type 'SetContentOptions'.
```

## 2604 - 1 errors

```
components/lms/AdvancedQuizBuilder.tsx(279,20): error TS2604: JSX element type 'Icon' does not have any construct or call signatures.
```

## 2786 - 1 errors

```
components/lms/AdvancedQuizBuilder.tsx(279,20): error TS2786: 'Icon' cannot be used as a JSX component.
```

## 2448 - 1 errors

```
components/lms/ScenarioBlock.tsx(96,34): error TS2448: Block-scoped variable 'handleReset' used before its declaration.
```

## 2365 - 1 errors

```
components/site/HeaderMobileMenu.client.tsx(148,49): error TS2365: Operator '>' cannot be applied to types 'number | NavItem[]' and 'number'.
```

## 1064 - 1 errors

```
lib/compliance/rapids-export.ts(18,36): error TS1064: The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<SupabaseClient<any, "public", "public", any, any>>'?
```

## 2820 - 1 errors

```
lib/credentials/credential-system.ts(86,5): error TS2820: Type '"Industry - Recognized Certification"' is not assignable to type 'CredentialType'. Did you mean '"Industry-Recognized Certification"'?
```

## 2687 - 1 errors

```
lib/experiments/ab-testing.ts(282,5): error TS2687: All declarations of 'gtag' must have identical modifiers.
```

## 2717 - 1 errors

```
lib/experiments/ab-testing.ts(282,5): error TS2717: Subsequent property declarations must have the same type.  Property 'gtag' must be of type '(command: "event" | "config" | "consent", targetId: string, config?: Record<string, unknown>) => void', but here has type '(...args: unknown[]) => void'.
```

## 1192 - 1 errors

```
lib/insurance/scan-approve-strict.ts(1,8): error TS1192: Module '"/workspace/project/Elevate-lms/node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/index"' has no default export.
```

## 2459 - 1 errors

```
lib/lms/get-lesson-render-mode.ts(14,8): error TS2459: Module '"@/lib/curriculum/normalize-lesson-content"' declares 'LessonContent' locally, but it is not exported.
```

## 2362 - 1 errors

```
lib/paris/import-engine/github-analyzer.ts(231,7): error TS2362: The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
```
