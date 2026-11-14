# Responsive and service follow-up

## Published repair baseline

Main `23b4762710a6d5704205825fa51fd003434c430f` contains the Admin navigation, Studio execution/cutover, authenticated data pages, billing-health honesty, and learner forms repairs. At 12:18 UTC its Admin release was building and its LMS release remained queued. Those UI changes must not be described as verified live until the corresponding health SHA and authenticated pages are checked.

Studio Browser is independently verified live at that SHA: persistent encrypted state ready, authorized workspace accepted, anonymous workspace denied. Its live image is visible in the authenticated Admin Studio. Existing external provider login recovery remains unverified.

Marketing and LMS release workflows for the preceding `6b51ed29` repair completed successfully. Marketing's live speech check returned HTTP 200, audio/mpeg, and a valid 34,752-byte MP3. This does not verify the user's physical microphone or speaker.

Course job `a9b85487-5465-4bc0-bed0-9fc3411c4e50` was running with a 12:15 UTC heartbeat, first attempt, no reported error, and an active lease. Final course output acceptance remains outstanding.

## Prepared follow-up changes

- Homepage: versioned illustrative facade image with Elevate for Humanity mounted on the building. Remove the floating brand card. Preserve the original asset. Image is 1672 x 941 WebP, 325,402 bytes. Generated with image editing from the existing illustration; requested exact facade lettering and preservation of composition, people, building, and framing. Marketing production compilation and generated-route type checking passed, as did a separate Marketing type check. Actual deployed responsive crop remains to be checked.
- Inventory: list executions for each discovered Cloud Run job and its region. Retain recent executions and older active work. Regression fixture passed for two regions, secret exclusion, no mutating commands, and independent permission failures. The project's optional Cloud Asset permission failure remains explicit; no access grants were added.
- Apprentice clock-in: permit the dashboard/shift log/hours/competency row to wrap on narrow screens. Make recorded progress visible in blue. No attendance calculations, geofence rules, identity checks, or hours credits changed.
- LMS install message: replace the universal Program Holder phone-call advertisement with courses/hours/messages/documents wording. Apprentice navigation contains no business-phone entry; retain phone tools for their intended host-shop/admin roles.

These follow-up changes are being kept on a separate branch to avoid superseding the current Admin/LMS release queue. They are not yet deployed. No learner attendance, payment, carrier call, outbound message, or notification delivery was created as a test.

## Open acceptance work

Every service is in scope, but configuration presence is not proof of operation. Still open: website QuickBooks OAuth (distinct from the connected QuickBooks plugin), held PWA deliveries with zero device acceptance, owned AI availability, carrier/audio acceptance, full course/media quality, remaining private-query authorization reviews, and responsive checks across public pages and dashboards. Google inventory found six web services and seven jobs across two regions; the east-region Marketing endpoint returned an unauthenticated 403 and requires authorized inspection, not a declaration that it is down. Cloud Asset search is permission-restricted and Scheduler inventory is central-region only.

## QuickBooks shared-client follow-up

The shared runtime client previously preferred legacy app_settings OAuth application credentials over the hydrated deployment secret store, unlike the Admin integration route. Align static credential precedence while preserving database priority for rotating tokens and company identity. Surface unreadable connection settings. Validate refreshed token shapes and require durable storage before retrying an API request. Five new mocked client tests plus ten existing OAuth/webhook/invoice-link tests passed (15 total); no live token refresh, invoice, payment, or other financial operation was invoked. Website company authorization still requires a separate live acceptance check; this source correction alone does not establish connectivity.

### Live OAuth root cause confirmed

The authenticated Intuit authorization flow rejected the website request with invalid redirect_uri. The existing Elevate production app already has the exact website callback registered. A browser-side comparison of the public client identifier returned production match=false and development match=true. No credential values were emitted or transferred. Thus the website is requesting live company authorization with the development application's credentials. Do not add duplicate production callbacks or keep retrying the rejected development request.

The secure repair is to replace existing QB_CLIENT_ID and QB_CLIENT_SECRET with this same app's production pair, bind the pair to the existing Google runtimes that use QuickBooks, preserve the exact production callback, then authorize the same Elevate company and verify a read-only company-info request. The Admin environment editor is prepared with exactly these two fields; the existing Intuit app's Production keys tab is open with credentials hidden. Credential entry requires the user's secure handoff under the browser's credential-change policy. No provider keys were rotated, no new OAuth app was created, and no scope expansion was attempted.
