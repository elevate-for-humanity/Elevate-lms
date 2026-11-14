# Installed Secrets

## SendGrid Email API Key

**API Key:** `SG.your_api_key_here`

**Installed in:** Northflank environment variables as `SENDGRID_API_KEY`

**Used by:** `lib/email/sendgrid.ts`

**Status:** Ready to use once deployed to Northflank

---

## To Apply

Add to Northflank:
1. Go to your Northflank dashboard
2. Find the elevate-lms service
3. Add environment variable: `SENDGRID_API_KEY=SG.your_api_key_here
4. Redeploy

---

## Related Files

- `lib/email/sendgrid.ts` - SendGrid HTTP API implementation
- `lib/email/email-service.ts` - Email template service
- `lib/communication/announcements.ts` - Announcement email system
