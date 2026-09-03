# SendGrid Setup Instructions

## Step 1: Add Environment Variables to Northflank

Go to Northflank dashboard → Your project → **Config** or **Environment Variables**

Add these variables:

```
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=payments@elevatelms.com
SENDGRID_FROM_NAME=Elevate for Humanity
```

## Step 2: Redeploy

After adding the environment variables, **redeploy** your Northflank service so the new variables are loaded.

## Step 3: Send Payment Emails

Once deployed, run this command:

```bash
cd /workspace/project/Elevate-lms
npx tsx scripts/send-payment-emails.ts
```

Or use the Northflank console to run the script.

---

## Alternative: Manual Email

If you want to send manually right now, just copy these links and email them:

### Jordan White
- **Email:** Jbwhite888@icloud.com
- **Amount:** $76.41
- **Payment Link:** https://buy.stripe.com/dRmaEXbrq4QS94f4NbgIo12

### Natalia Roa
- **Email:** nataTaroa@gmail.com
- **Amount:** $151.03
- **Payment Link:** https://buy.stripe.com/6oUaEX2UUcjk3JV4NbgIo13

---

## Payment Links Summary

| Student | Email | Amount | Link |
|---------|-------|--------|------|
| Jordan White | Jbwhite888@icloud.com | $76.41 | https://buy.stripe.com/dRmaEXbrq4QS94f4NbgIo12 |
| Natalia Roa | nataTaroa@gmail.com | $151.03 | https://buy.stripe.com/6oUaEX2UUcjk3JV4NbgIo13 |
