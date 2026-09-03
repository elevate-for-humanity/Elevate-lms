# Email Templates

HTML email templates for form submissions and user communications.

## Templates

### 1. contact-form.html

Used when someone submits the contact form. Sent to admin/staff.

**Variables:**

- `{{name}}` - Contact's full name
- `{{email}}` - Contact's email address
- `{{phone}}` - Contact's phone number
- `{{subject}}` - Message subject
- `{{message}}` - Message content
- `{{timestamp}}` - Submission timestamp

### 2. application-confirmation.html

Sent to applicants after they submit a program application.

**Variables:**

- `{{name}}` - Applicant's first name
- `{{program}}` - Program name they applied to
- `{{timestamp}}` - Application submission time
- `{{application_id}}` - Unique application ID

## Usage

### With Resend (Recommended)

```typescript
import { Resend } from 'resend';
import fs from 'fs';

const resend = new Resend(process.env.RESEND_API_KEY);

const template = fs.readFileSync('./lib/email-templates/contact-form.html', 'utf-8');
const html = template
  .replace('{{name}}', formData.name)
  .replace('{{email}}', formData.email)
  .replace('{{phone}}', formData.phone)
  .replace('{{subject}}', formData.subject)
  .replace('{{message}}', formData.message)
  .replace('{{timestamp}}', new Date().toLocaleString());

await resend.emails.send({
  from: 'noreply@www.elevateforhumanity.org',
  to: 'admin@www.elevateforhumanity.org',
  subject: 'New Contact Form Submission',
  html: html,
});
```

### With SendGrid

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'admin@www.elevateforhumanity.org',
  from: 'noreply@www.elevateforhumanity.org',
  subject: 'New Contact Form Submission',
  html: processedTemplate,
};

await sgMail.send(msg);
```

## Setup Instructions

1. **Install email service:**

   ```bash
   npm install resend
   # or
   npm install @sendgrid/mail
   ```

2. **Add environment variables:**

   ```env
   RESEND_API_KEY=your_key_here
   # or
   SENDGRID_API_KEY=your_key_here
   ```

3. **Create API route** (e.g., `app/api/contact/route.ts`):

   ```typescript
   import { NextResponse } from 'next/server';
   import { Resend } from 'resend';
   import fs from 'fs';
   import path from 'path';

   const resend = new Resend(process.env.RESEND_API_KEY);

   export async function POST(request: Request) {
     const data = await request.json();

     const templatePath = path.join(process.cwd(), 'lib/email-templates/contact-form.html');
     let template = fs.readFileSync(templatePath, 'utf-8');

     // Replace variables
     Object.keys(data).forEach((key) => {
       template = template.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
     });

     await resend.emails.send({
       from: 'noreply@www.elevateforhumanity.org',
       to: 'admin@www.elevateforhumanity.org',
       subject: 'New Contact Form Submission',
       html: template,
     });

     return NextResponse.json({ success: true });
   }
   ```

## Testing

Test emails locally with [MailHog](https://github.com/mailhog/MailHog) or [Mailtrap](https://mailtrap.io/).

## Customization

- Update colors in inline styles to match brand
- Add/remove fields as needed
- Modify footer links and contact info
- Add logo images (use absolute URLs)

## Best Practices

- Always use inline CSS for email compatibility
- Test across email clients (Gmail, Outlook, Apple Mail)
- Keep width at 600px for desktop readability
- Use web-safe fonts (Arial, Helvetica, Georgia)
- Include plain text fallback for accessibility
