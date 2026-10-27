# Registered Apprenticeship Appendix Source Index

Updated October 27, 2026. This is an **evidence-location index**, not a new or amended registered standard. The signed, approved Appendix A and RAPIDS record govern when repository representations conflict.

## Consolidated occupation index

| Occupation | RAPIDS code | Current representation | Known primary repository paths | Evidence status |
| --- | --- | --- | --- | --- |
| Barber | `0030CB` | Competency-based; 14 competencies; 260 hours RTI; 1:1 mentor | [Canonical Appendix A](../../lib/compliance/appendix-a-standards.ts), [registered contract](../../lib/apprenticeship/registered-program-contract.ts), [barber governance migration](../../supabase/migrations/20260818203000_barber_appendix_a_governance.sql) | Appendix A content modeled in canonical registry |
| Esthetician | `2089CB` | Competency-based; 20 competencies; 300 hours RTI; 1:1 mentor | [Canonical Appendix A](../../lib/compliance/appendix-a-standards.ts), [standard mirror migration](../../supabase/migrations/20260819040000_beauty_apprenticeship_registered_standard_mirror.sql) | Appendix A content modeled in canonical registry |
| Manicurist / Nail Technician | `2090CB` | Competency-based; 19 competencies; 210 hours RTI; 1:1 mentor | [Canonical Appendix A](../../lib/compliance/appendix-a-standards.ts), [standard mirror migration](../../supabase/migrations/20260819040000_beauty_apprenticeship_registered_standard_mirror.sql) | Appendix A content modeled in canonical registry |
| Hair Stylist / Cosmetologist | `0096HY V1` | Hybrid; 2,000–2,500-hour term; 154 hours RTI; 500-hour probation; 1:1 mentor | [RAPIDS configuration](../../lib/compliance/rapids-config.ts), [program configuration](../../lib/programs/beauty-programs.ts), [program data](../../lib/programs/canonical-data.ts), [host-shop program dashboard](../../apps/lms/app/host-shop/dashboard/programs/page.tsx) | Operationally referenced, but signed Appendix A is **not represented** in canonical `APPENDIX_A_STANDARDS` or the queried active `apprenticeship_standard_versions` entries. Do not manufacture a standard. |

## Other appendix, workflow and field evidence

- [Course Builder Appendix A source adapter](../../lib/ultimate-course-builder/credential/appendix-a-source.ts): reads only registered standards exposed by `getRegisteredProgramStandard`; an operational RAPIDS config entry does **not** automatically become an Appendix A document.
- [Registered-program contract](../../lib/apprenticeship/registered-program-contract.ts): resolves approved canonical Appendix A data and the corresponding database version.
- [Hair Stylist RAPIDS configuration](../../lib/compliance/rapids-config.ts): occupation code, hour counts and 1:1 ratio.
- [Beauty program listings](../../components/programs/beauty/BeautyApprenticeshipAuthority.tsx): public-facing descriptions; **not** signed appendix evidence.
- [Beauty RAPIDS queue migration](../../supabase/migrations/20260901093000_queue_all_beauty_apprenticeships_for_rapids.sql): expressly records `APPROVED_APPENDIX_A_VERSION_REQUIRED` for Cosmetologist in its migration logic.
- [Apprenticeship operating guide](../host-shops/federal-indiana-beauty-apprenticeship-operating-guide-2026-10-16.md): secondary implementation guidance; requires the signed Appendix A and occupation-specific supervision verification.
- [Host Shop onboarding requirements](../../lib/partners/host-shop-onboarding.ts): identifies required shop/supervisor licensing documents and host onboarding paths, not occupation authority.
- [Barber Appendix A competency crosswalk](../../supabase/migrations/20260818205000_barber_appendix_a_competency_crosswalk.sql)
- [Barber Appendix A program contract](../../supabase/migrations/20260818204000_barber_appendix_a_program_contract.sql)
- [Apprentice Appendix A progress UI](../../apps/lms/app/apprentice/competencies/AppendixAProgress.client.tsx)

## Search coverage and limitations

Repository code search performed for: `Appendix 6`, `appendix-six`, `Appendix VI`, `Appendix A`, `0096HY`, `Cosmetologist`, `Hair Stylist`. The queries `appendix-six` returned no matches; broad `Appendix 6` and `Appendix VI` searches produced numerous unrelated hits because search tokenization is not exact-phrase or an exhaustive scan of binary/PDF contents. No verified source named Appendix 6 / Appendix VI was identified.

This index consolidates *located code and text references*, not independently retrieved signed PDFs or historical attachments. Search repository assets, signed program files, or the sponsor's approved RAPIDS export for the Hair Stylist appendix; compare against the registration authority before adding it to the canonical registry. Do not remove registration blockers or approve new occupation placements on the strength of this index alone.
