# Dashboard Google Calendar connection

The shared CalendarWidget includes a per-user Google Calendar connection in LMS and Admin. It reads fresh busy blocks from the user's primary and selected calendars when the calendar opens, regains focus, or is refreshed. Event text is not imported. Read-only access does not create or edit Google events.

Admin room creation and Program Holder meeting scheduling check connected Google calendars immediately before creating a meeting. A conflicting busy period returns an error; provider or credential failures also block the booking rather than assuming the calendar is free. Accounts that have not connected Google can still schedule, but do not receive Google conflict protection. Separate bookings made simultaneously in Google and Elevate are not an atomic reservation across providers.

## Production provider setup

1. Use the production Google web OAuth client and enable Google Calendar API in its Google Cloud project.
2. Configure the Google consent screen for the read-only scope `https://www.googleapis.com/auth/calendar.readonly`. Follow Google's consent-screen publishing and verification requirements for the intended audience.
3. Register both exact redirect URIs:
   - `https://app.elevateforhumanity.org/api/calendar/google/callback`
   - `https://admin.elevateforhumanity.org/api/calendar/google/callback`
4. Store the same `GOOGLE_CALENDAR_CLIENT_ID` and `GOOGLE_CALENDAR_CLIENT_SECRET` in the Google Secret Manager runtime configuration for Admin and LMS. Existing `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are fallbacks. Never commit values to source control.
5. Deploy Admin and LMS from main. The database migration must already be applied.
6. In each person's own calendar, choose **Connect Google Calendar**, select their Google account, review and grant read-only access, and return to the dashboard. Administrators must not approve consent for another person's account.

OAuth state is bound to the authenticated account, uses a ten-minute HttpOnly secure cookie, and validates PKCE on exchange. Access and refresh credentials are stored as a Vault secret behind service-role-only functions. The browser receives only connection status and busy periods. Disconnect deletes this application's stored credentials, not the user's Google events; Google account permissions can also be removed in Google.

## Acceptance

- Connect with a real account, check a known Google busy block inside the dashboard, then move or cancel it in Google and refresh.
- Check an all-day event across local date boundaries and daylight-saving transitions.
- Attempt an overlapping dashboard booking: it must stop before room creation or invitation delivery.
- Confirm an adjacent non-overlapping meeting is accepted and a revoked Google grant fails closed on booking.
- Confirm a different signed-in account cannot read the connection, credentials, or busy periods.
- The nine-step video guide appears on Admin and Program Holder meeting pages and inside the shared room used by all portals.

Video deployment, Google OAuth configuration, individual Google consent, and actual two-device camera/audio/screen-sharing acceptance are separate verification steps.
