# SMTP / Email Setup Guide

## Quick Start (Resend - Recommended)

### 1. Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up for free (100 emails/day free tier)
3. Verify your email

### 2. Get API Key
1. Go to Dashboard → API Keys
2. Click "Create API Key"
3. Name it "Elevate LMS Production"
4. Copy the key (starts with `re_`)

### 3. Configure Environment
Add to `.env.local`:
```bash
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM="Elevate for Humanity <noreply@elevateforhumanity.org>"
```

### 4. Verify Domain (Optional but Recommended)
1. Go to Resend Dashboard → Domains
2. Add `elevateforhumanity.org`
3. Add the DNS records shown:
   - SPF record (TXT)
   - DKIM record (TXT)
   - DMARC record (TXT)

### 5. Test Email
```bash
npx tsx -e "
const { sendEmail } = require('./lib/email/resend');
sendEmail({
  to: 'your@email.com',
  subject: 'Test Email',
  html: '<h1>It works!</h1>'
}).then(console.log);
"
```

---

## Alternative: SendGrid

### 1. Create SendGrid Account
1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up (100 emails/day free)

### 2. Get API Key
1. Settings → API Keys → Create API Key
2. Select "Full Access" or "Restricted Access" with Mail Send permission
3. Copy the key

### 3. Configure Environment
```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_api_key_here
```

---

## Alternative: Custom SMTP

For Gmail, Outlook, or custom mail servers:

```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
```

**Note:** For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833), not your regular password.

---

## Email Templates Available

The system includes these email templates:

| Template | Trigger |
|----------|---------|
| Welcome Email | New enrollment |
| Password Reset | User requests reset |
| Enrollment Confirmation | Application approved |
| Course Completion | Student completes course |
| Creator Approval | Creator application approved |
| Sale Notification | Marketplace purchase |
| Payout Confirmation | Creator payout processed |

---

## Troubleshooting

### Emails not sending?
1. Check API key is correct
2. Verify domain DNS records
3. Check spam folder
4. Review logs: `console.log` in `/lib/email/resend.ts`

### Emails going to spam?
1. Set up SPF, DKIM, DMARC records
2. Use a verified domain (not gmail.com)
3. Avoid spam trigger words in subject

### Rate limits?
- Resend free: 100/day, 10/second
- SendGrid free: 100/day
- Upgrade for higher limits
