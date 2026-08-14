# Website Builder pattern parity — 2026-08-14

This document records product patterns, not copied implementation details. Elevate remains its own architecture and design system.

| Mature builder pattern | Elevate canonical implementation | Status / acceptance gate |
|---|---|---|
| Guided AI website creation | `ParisWebsiteInterview` -> `user_websites` -> editor | Present; must pass create/edit/reload test |
| Blank/manual creation | Website Builder `POST /sites` | Present |
| Existing URL as source | `/apps/website-builder/import` + `/api/apps/website-builder/import` | Trial access fixed; source provenance retained |
| Import strategy choice | preserve / modernize / rebuild | Added to canonical import flow |
| AI + manual editor together | `WebsiteEditorClient` + PARIS copilot | Present; must persist every AI/manual change |
| AI edits save draft, not live site | PARIS site API + explicit Publish | Present |
| Preview while editing | editor preview | Present; viewport/device controls still need hardening |
| Save / publish separation | site PATCH API | Present |
| Revision snapshots / restore | `website_revisions` + revisions API | Backend present; editor history UI must be surfaced |
| SEO editing | site config SEO fields + PARIS | Present; structured/schema SEO remains gap |
| Custom domain lifecycle | `DomainPanel` / Domainee integration | Present; needs production E2E proof |
| Trial entitlement | `user_app_subscriptions` + trial wallet | Present; managed trial now grants builder trial |
| Metered AI trial | Website Builder trial wallet | Present; URL import now consumes generation credits |
| Multi-site management | Website Builder dashboard | Present |
| Mobile/tablet/desktop authoring | editor | Gap: add explicit viewport controls and validate responsive output |
| Undo/redo | revisions backend | Gap: expose history/restore and immediate undo affordance |
| Reusable sections/templates | tenant config/templates | Partial; consolidate into one library |
| Forms / booking / CRM wiring | platform capabilities | Gap: builder-native insertion/configuration |
| Automation triggers | platform automation stack | Gap: builder-native event wiring |
| Funnel/conversion experiments | platform | Gap: dedicated funnel/A-B testing layer |
| Image-reference generation | platform image capabilities | Gap: builder-specific reference-image intake |
| Structured SEO/schema | SEO config | Gap: schema generator/editor |

## Canonical customer journey

`trial -> choose new/existing -> AI interview or URL analysis -> create editable draft -> PARIS + manual editing -> responsive preview -> save/revision -> forms/CRM/booking -> SEO/domain -> publish -> analytics/automation`

## Release acceptance test

Use a real public business site such as `curvaturebodysculpting.store` as a non-destructive import source.

1. Start the 14-day trial.
2. Choose existing website.
3. Analyze the public URL during the trial without an upgrade wall.
4. Confirm extracted title, description, pages, images, colors and navigation are returned.
5. Choose preserve, modernize, or rebuild.
6. Create a private draft and open the canonical editor.
7. Make one manual hero change and save.
8. Make one PARIS change and verify it persists after reload.
9. Restore a prior revision and verify state changes back.
10. Check desktop, tablet and mobile preview.
11. Configure a subdomain and publish.
12. Verify the public URL returns the new published content.
13. Re-login and verify the website, entitlement, revision history and editor state remain intact.

No release should be called builder-complete until all thirteen steps pass against production-like infrastructure.