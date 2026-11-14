# Asterisk device provisioning

This is a staged per-device registration service. It does not change the public
Telnyx route and does not by itself establish PARIS, voicemail, operator routing,
PSTN dialing, notification delivery, or successful audio calls.

## API contract

The LMS server authenticates the signed-in Supabase user, then uses the shared
Google Secret Manager provisioning secret as `Authorization: Bearer ...` over
HTTPS. Browsers never receive this service secret. Each request is JSON containing
`profileId`, `deviceId`, and `extensionId`. The LMS namespaces Asterisk device IDs with `asterisk_`, keeping the existing
Telnyx records and uniqueness contract intact during rollout. Device IDs use 8–128 URL-safe letters,
digits, hyphens or underscores. No caller-supplied extension number is accepted.

| POST path | Result |
| --- | --- |
| `/internal/pbx/devices` | Creates or retrieves that device's SIP credentials after the runtime endpoint and dialplan have been verified. |
| `/internal/pbx/devices/status` | Reports dynamic Asterisk contacts, qualified reachable contacts, and observation time. |
| `/internal/pbx/devices/revoke` | Removes the endpoint and verifies it is absent after reload. |

Every operation independently reads `communication_extensions` in Supabase and
requires matching ownership, `enabled = true`, `webrtc_provider = 'asterisk'`, and
the configured `communication_workspaces.phone_system_id`. Each endpoint has a
random 256-bit password. Configuration and secrets are stored only on the VM
with restricted permissions; application and database logs must never include
provisioning responses. Passwords are not written to Supabase. Each credential has a ten-minute runtime lease, renewed only by authorized
status checks. Expired endpoints are removed and their dialplan lease blocks new
calls; stopping the service invalidates its generated include. This is not an online state. A generated credential is reported
unregistered/disconnected until the subsequent status check observes registration.

`registered` means Asterisk has a dynamic contact; `connectionState = connected`
requires a qualified `Avail` contact. Neither result proves two-way audio or a
device's willingness to receive calls. Availability policy remains in the existing
dialplan/application. A timer rechecks ownership every 60 seconds and removes
disabled, reassigned or provider-switched devices. Failures to reach Supabase do
not delete records; monitor reconciliation failures and do not treat them as a
healthy authorization service. Revocation does not forcibly end ongoing calls.

## Installation gates

Do this on the existing VM only after reviewing its actual configuration. Never
rerun `google-startup.sh` to install this service: that script can recreate the
Asterisk container. Do not replace running configuration with checked-in samples.

1. Capture a root-only rollback copy of the live Asterisk/Caddy configuration and
   record container identity, image digest, bind mounts, Asterisk version, active
   call count, loaded modules and existing WS transport. Do not print config,
   Docker environment, auth objects, or SIP logger output into CI logs. Confirm
   the `asterisk` process's numeric group and existing `/etc/asterisk` bind mount.
2. Test configuration on a separate, network-isolated instance of the **same
   Asterisk image and version**, using a redacted copy of the running dialplan.
   The service validates generated identifiers and structure before it atomically
   installs a generation; Asterisk runtime readback then verifies the resulting
   endpoints and routes. This does not replace isolated dialplan validation.
3. Merge `pjsip.fragment.conf` and `extensions.fragment.conf` into the reviewed
   running files. Existing WS transports should be reused. Integrate the generated
   ring-group `Gosub` after existing availability checks and before legacy ringing.
   Explicitly validate operator 0 and the unanswered-call fallback. Generated
   contexts preserve `DIALSTATUS` for the canonical fallback; they do not invent
   mailboxes or bypass availability/business-hours checks.
4. Make `elevate-webrtc/` below the live Asterisk config directory writable only by
   root and readable by the actual Asterisk group. Set `PBX_GENERATED_ROOT` to this
   host-side directory, and include this exact path in a systemd
   `ReadWritePaths=` drop-in. The existing config directory bind mount exposes it
   read-only inside Asterisk; no new bind mount or container restart is needed.
   Symlink generation swaps are atomic. A failed reload/readback restores the
   previous generation; failed rollback quarantines the service.
5. Install Node.js 22 or later at `/usr/bin/node`, then copy `server.mjs` to
   `/opt/elevate-pbx/provisioner/server.mjs` and the unit to
   `/etc/systemd/system/elevate-pbx-provisioner.service`. The root-owned
   `/etc/elevate-pbx/provisioner.conf` contains only these nonsecret settings:

   - `PBX_PROVISIONING_TOKEN_SECRET`: full GSM secret version resource in project
     `elegant-racer-299721` (a random secret of at least 32 bytes).
   - `SUPABASE_SERVICE_ROLE_KEY_SECRET`: full GSM secret version resource.
   - `SUPABASE_URL`: existing production HTTPS Supabase URL.
   - `PBX_PHONE_SYSTEM_ID`: exact authorized Supabase phone system UUID.
   - `PBX_ASTERISK_CONTAINER`: existing Asterisk container name.
   - `PBX_ASTERISK_GID`: existing numeric Asterisk group.
   - `PBX_GENERATED_ROOT`: actual host-side runtime configuration directory.

   Grant the VM service account access only to those two GSM secrets and ensure
   its access scope permits Secret Manager. The process obtains workload identity
   from Compute metadata and retrieves secrets directly from GSM; do not embed
   credentials in unit files, shell commands, CI output, or repository files.
   The LMS gets the same provisioning token through its Cloud Run GSM binding.
6. Merge `Caddyfile.fragment` into the current site block. Validate the full
   Caddyfile and reload Caddy using its supported admin API without recreating its
   container. Preserve the current trusted certificate and verified `/ws` mapping.
   The service binds **127.0.0.1:8090 only**; do not open that port in a firewall.
   Keep Asterisk HTTP/AMI/ARI private and restrict legacy UDP SIP to intended carrier
   addresses. Disable request/response body and Authorization logging.
7. Reload reviewed Asterisk endpoint/dialplan changes without restarting active
   calls. If the required WS transport cannot be added without restart, stop this
   activation and schedule a controlled maintenance window; preserve carrier
   service. Read back the actual transport, DTLS settings, dialplan and routes.
8. Start the provisioning unit. Keep all existing extensions on the migration's
   default `telnyx` provider. Select only the authorized test extension for the
   independent Asterisk path; do not change the public telephone carrier route.

## Validation and rollback

Run local boundary tests with `node --test infra/pbx/provisioner/server.test.mjs`.
The tests use an isolated filesystem and test doubles at the Supabase and Asterisk
boundaries. They prove API authorization, config transaction behavior, and status
semantics; they are **not** live phone acceptance evidence.

Live acceptance must include unauthorized-request rejection; owner-only credential
retrieval; exact endpoint/AOR readback; actual authenticated SIP registration;
registered-to-disconnected transitions; revoke and failed-registration verification;
internal ring, answer, hold, hangup, and real two-way audio on desktop/mobile; and
existing operator/voicemail fallbacks. Test NAT traversal with actual networks and
configured TURN credentials as needed. Capture only nonsecret evidence.

Rollback: restore the selected test extension's prior provider, revoke generated
devices, verify endpoint absence, stop this provisioning service, restore the
root-only Asterisk/Caddy snapshots, and perform validated reloads. If Asterisk
cannot restore its prior state safely, leave public traffic on the existing
Telnyx route and report the precise blocker. Do not delete recordings or histories.
