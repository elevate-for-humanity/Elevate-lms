# Website, dashboard, PWA and Studio layout repair

## Scope and evidence

The owner requested the full website, all dashboards, PWA, and browser side panels in Course Builder and Dev Studio. This change repairs the reproduced shared/update issues and the observed dashboard/Studio defects. It does not claim that every page and every authenticated role has passed a new visual acceptance run.

The October 17 production read-only audit found Marketing, Admin, LMS and Store serving commit `accd052e05ff0d66c6a9370da77085bf254fecd5`, with successful health responses. Earlier image and CSS fixes, including PR 1905 (`f1405ee540c6b98e3766effc408f48e6dd2af346`), are ancestors of that live commit. The remaining defects cannot be resolved by redeploying that same source again.

The repository variable `GOOGLE_RELEASE_HOLD=true` was observed in GitHub Actions settings. No release hold was changed and no production deployment was initiated for this repair.

## Reproduced defects and changes

| Surface | Evidence before repair | Change |
|---|---|---|
| PWA registration | Three focused tests failed against the original component: a cleared `registration.installing` reference missed the installed state, an already waiting worker was missed, and first installation was incorrectly announced as an update. | Observe the captured worker, detect existing waiting workers, distinguish initial control, clean listeners, and check for updates on reconnection/visibility. |
| PWA update UI | Only Admin showed the update notice; the previous click reloaded before worker activation. | Shared notice across canonical Marketing/Admin/LMS registration; wait for activation after the user requests refresh, with retry on timeout. |
| Version polling | First poll could accept a newer server SHA while the loaded JavaScript stayed old; later automatic reloads could discard work. | Compare the loaded compiled SHA immediately, notify on mismatch, and let the user save before refreshing. |
| PWA overlays | Install controls did not wrap and occupied the same bottom area as mobile Admin navigation. | Wrap controls, use safe-area and dock offsets, and prioritize the update notice over install prompts. |
| Admin overview | The desktop page was about 14,346 pixels tall, with 80 unpublished programs rendered inline. | Show six overview entries with the total and the existing complete-program-list link. |
| Host Shop overview | The main heading began about 3,259 pixels down the page, after extensive guidance. | Put the dashboard overview, responsibilities and summary cards before setup/network guidance. All guidance and data remain available. |
| Course Builder status | Three viewport-based status columns squeezed text inside a narrower Studio panel. | Fit columns to their actual available width and preserve word boundaries. |
| Dev Studio and Course Builder | Fixed layout and separate browser/preview placements lacked consistent resizing and close/reopen behavior. | Shared side panels with drag and keyboard resizing, bigger/smaller controls, close/reopen and expand/restore. Keep editor and browser DOM mounted across those operations. Stack panes below 760px available width. Consolidate the standalone Course Production wrapper so it cannot mount a second browser alongside the shared shell. |
| Course editor | Cloud browser appeared above the editor; preview used fixed viewport dimensions. | Learner preview and Cloud browser share a resizable side area. Preserve previews, browser session and unsaved editor state when toggled. Restore the missing React effect import used by the readiness component. |
| Browser controls | Desktop controls depended on the full window width even inside a narrow side panel. | Container queries adapt browser/tools/sign-in layout to the actual browser pane. |

## Verification

- The final affected layout, PWA, course, Studio, browser-navigation, secure-input and viewport suite passed **100 tests in 18 files**, exit 0, after integrating main at `45eba1a140cbec62bb8cb469b22258b7195610f2`.
- After integrating main at `45eba1a140cbec62bb8cb469b22258b7195610f2`, `pnpm typecheck:all` passed Marketing, Admin and LMS (exit 0), and repository-wide `pnpm lint` passed again (exit 0).
- `pnpm build:all` passed, exit 0: Marketing (526 static pages), Admin (140 static pages), and LMS compilation, packaging and generated-route typechecks. Builds used the reviewed repair on source base `9a39e53e07989bba1c3aba34ebd127ab94633351`. The subsequent main integration adds independent course-photo/diagnostic and live-endpoint verification changes, with no overlap in these repair files.
- Existing dependency warnings (Supabase Edge-runtime Node API references and optional media dynamic imports) remain; no build or validation guard was disabled.
- New PWA lifecycle/update tests and resizable-panel integration tests were added to CI.
- GitHub’s procurement architecture check initially failed because it required the browser import in the former standalone wrapper. The guard now follows `CourseProductionWorkspace → UnifiedCourseBuilder → CloudBrowserWorkspace` and requires the resizable shell. The original failure was reproduced locally, then the complete procurement guard passed; publication, access and RLS assertions remain unchanged. Its following Studio check also expected the former Admin-only update components in the root layout. That check now verifies the full mounted `AdminPwaRegister → CanonicalPwaRegistration → PwaUpdateNotice → useBuildVersion` path and rejects duplicate root update components. Both architecture scripts pass locally.
- The older Studio source-contract assertion required `h-full` on the Admin viewport. It already failed on the unmodified viewport implementation, which correctly uses `min-h-0 flex-1` within an `h-dvh` parent. The assertion now checks that existing bounded flex layout.

## Read-only live coverage and limits

The desktop route sweep included the public homepage, Admin overview, Studio, Course Builder and the registered Learner, Apprentice, Program Holder, Employer, Parent, Workforce Partner, Creator, Instructor, Staff, Testing Center, Workforce Board, Case Manager and Provider surfaces, plus Host Shop. At the observed desktop width, the checked dashboard documents did not overflow horizontally. Some roles presented Admin selection/oversight screens rather than an actual selected-role dashboard; Creator required access. Those states are not counted as proof of every private role workflow. Learner and Host Shop were inspected through existing Admin preview access, without changing their training or business records.

Homepage Host Shop card boxes were consistently 4:3. A portrait collage intentionally uses contain to retain its text; other photographs use cover. No image was cropped or replaced during this repair.

Post-deployment visual verification of the new side panels, all mobile role layouts, and a physical installed-PWA update remains outstanding. Unit tests establish lifecycle and state-preservation behavior, not real-device appearance.

## Unchanged systems

Stripe/payments, enrollment records, authentication/role permissions, database migrations, course-generation engines and persisted course content were not changed. Existing dashboard/LMS data connections were preserved. No new Google runtime or credential problem was claimed fixed by these UI changes. Northflank was not used.
