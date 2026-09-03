/**
 * Send Professional Conference Submission Package via SendGrid
 * PDF slides attached - for personal review only
 */

import sgMail from '@sendgrid/mail';
import fs from 'fs';
import path from 'path';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY not set');
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

const recipient = process.argv[2];

if (!recipient) {
  console.error('Usage: node scripts/send-submission-package.mjs <email>');
  process.exit(1);
}

// Read the PDF
const pdfPath = path.join(process.cwd(), 'DEMO_VIDEO_SLIDES.pdf');
const pdfBuffer = fs.readFileSync(pdfPath);

const msg = {
  to: recipient,
  from: {
    email: 'info@elevateforhumanity.org',
    name: 'Elevate for Humanity',
  },
  subject: '📋 Microsoft Build Submission Package - Elevate for Humanity',
  text: `
ELEVATE FOR HUMANITY - MICROSOFT BUILD CONFERENCE SUBMISSION
=============================================================

Dear Mrs. Greene,

Please find attached your complete conference submission package for Elevate for Humanity.

This package includes:
- 12-slide presentation deck (PDF)
- Complete 5-minute demo script
- Voiceover narration for each slide
- Recording instructions

WHAT'S INCLUDED IN THE PDF:
--------------------------
1. Title Slide - "Enterprise AI Workforce Operating System"
2. Impact Metrics - 200+ apprentices, 3 DOL programs, 100% compliance
3. The Problem We Solve
4. Our Solution - AI, Geofencing, Payments, Dashboards
5. 30-Second Elevator Pitch
6. Technical Architecture - Microsoft Stack
7. DOL-Registered Programs - RAPIDS codes
8. 5-Minute Demo Flow Timeline
9. Conference Evaluation Scores (9.5/10)
10. Competitor Comparison
11. What Makes Us Stand Out
12. Contact Information

HOW TO RECORD YOUR DEMO:
------------------------
1. Open the attached PDF
2. Go fullscreen (F11)
3. Record yourself presenting each slide
4. Use the script provided for narration
5. Keep total under 5 minutes

NEXT STEPS:
-----------
1. ✅ Review the attached PDF
2. ⏳ Record your 5-minute demo video
3. ⏳ Submit to Microsoft Partner Center
4. ⏳ Practice your Q&A

Good luck with your submission!

Best regards,
Elevate for Humanity Team
  `,
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Microsoft Build Submission Package</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 40px; border-radius: 15px; text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 32px; }
        .header p { margin: 10px 0 0 0; font-size: 18px; opacity: 0.9; }
        .attachment-box { background: #E3F2FD; border: 2px solid #0078D4; padding: 25px; border-radius: 15px; text-align: center; margin: 25px 0; }
        .attachment-box h3 { margin: 0 0 10px 0; color: #0078D4; }
        .attachment-icon { font-size: 48px; margin-bottom: 10px; }
        .section { background: #f9f9f9; padding: 25px; border-radius: 15px; margin: 20px 0; }
        .section h2 { color: #333; margin-top: 0; border-bottom: 2px solid #dc2626; padding-bottom: 10px; }
        .checklist { list-style: none; padding: 0; }
        .checklist li { padding: 10px 0; border-bottom: 1px solid #eee; }
        .checklist li:last-child { border: none; }
        .done { color: #4CAF50; font-weight: bold; }
        .pending { color: #FF9800; font-weight: bold; }
        .metric-grid { display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; }
        .metric { background: white; padding: 15px 25px; border-radius: 10px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .metric-number { font-size: 28px; font-weight: bold; color: #dc2626; }
        .metric-label { font-size: 12px; color: #666; }
        .steps { counter-reset: step; }
        .steps li { list-style: none; padding: 15px 0 15px 50px; position: relative; }
        .steps li::before { counter-increment: step; content: counter(step); position: absolute; left: 0; top: 10px; width: 35px; height: 35px; background: #dc2626; color: white; border-radius: 50%; text-align: center; line-height: 35px; font-weight: bold; }
        .footer { text-align: center; padding: 30px; color: #666; font-size: 14px; border-top: 1px solid #eee; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎓 Elevate for Humanity</h1>
        <p><strong>Microsoft Build Conference Submission Package</strong></p>
        <p>For Mrs. Elizabeth Greene</p>
    </div>

    <div class="attachment-box">
        <div class="attachment-icon">📎</div>
        <h3>PDF Attachment Included</h3>
        <p><strong>DEMO_VIDEO_SLIDES.pdf</strong></p>
        <p>12-slide presentation deck for recording your demo</p>
    </div>

    <div class="section">
        <h2>What's In The PDF</h2>
        <ol class="steps">
            <li><strong>Title Slide</strong> - "Enterprise AI Workforce Operating System"</li>
            <li><strong>Impact Metrics</strong> - 200+ apprentices, 3 DOL programs</li>
            <li><strong>The Problem</strong> - What workforce agencies face today</li>
            <li><strong>Our Solution</strong> - AI, Geofencing, Payments, Dashboards</li>
            <li><strong>Elevator Pitch</strong> - 30-second pitch for judges</li>
            <li><strong>Tech Stack</strong> - Next.js, Supabase, GPT-4, Stripe</li>
            <li><strong>DOL Programs</strong> - RAPIDS codes: 0030CB, 2089CB, 2090CB</li>
            <li><strong>Demo Flow</strong> - 5-minute walkthrough timeline</li>
            <li><strong>Evaluation Scores</strong> - 9.5/10 overall (10/10 Innovation)</li>
            <li><strong>Competitor Comparison</strong> - vs Workday, ServiceNow, Canvas</li>
            <li><strong>Differentiators</strong> - 5 reasons you stand out</li>
            <li><strong>Contact Info</strong> - Website, email, GitHub</li>
        </ol>
    </div>

    <div class="section">
        <h2>Your Impact Metrics</h2>
        <div class="metric-grid">
            <div class="metric">
                <div class="metric-number">200+</div>
                <div class="metric-label">Apprentices</div>
            </div>
            <div class="metric">
                <div class="metric-number">3</div>
                <div class="metric-label">DOL Programs</div>
            </div>
            <div class="metric">
                <div class="metric-number">100%</div>
                <div class="metric-label">WIOA Compliance</div>
            </div>
            <div class="metric">
                <div class="metric-number">80%</div>
                <div class="metric-label">Time Saved</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Your Submission Checklist</h2>
        <ul class="checklist">
            <li><span class="done">✅</span> Conference submission package created</li>
            <li><span class="done">✅</span> PDF presentation slides ready</li>
            <li><span class="done">✅</span> Complete voiceover script included</li>
            <li><span class="pending">⏳</span> Record your 5-minute demo video</li>
            <li><span class="pending">⏳</span> Submit to Microsoft Partner Center</li>
            <li><span class="pending">⏳</span> Practice judge Q&A</li>
        </ul>
    </div>

    <div class="section">
        <h2>How To Record Your Demo</h2>
        <ol>
            <li><strong>Open the PDF</strong> - Double-click DEMO_VIDEO_SLIDES.pdf</li>
            <li><strong>Go fullscreen</strong> - Press F11 or click the fullscreen button</li>
            <li><strong>Record your screen</strong> - Use Zoom, Loom, or OBS</li>
            <li><strong>Follow the script</strong> - Each slide has suggested narration</li>
            <li><strong>Keep it under 5 minutes</strong> - Practice before recording</li>
            <li><strong>Save and submit</strong> - Upload to Microsoft Partner Center</li>
        </ol>
    </div>

    <div class="section">
        <h2>Key Talking Points</h2>
        <ul>
            <li><strong>"First-to-market"</strong> - Only platform with DOL + AI + geofencing + payments</li>
            <li><strong>"Real impact"</strong> - 200+ apprentices already using the system</li>
            <li><strong>"Built on Microsoft"</strong> - Azure, TypeScript, Supabase</li>
            <li><strong>"Social mission"</strong> - Workforce development for underserved communities</li>
        </ul>
    </div>

    <div class="footer">
        <p><strong>Questions?</strong></p>
        <p>Website: www.elevateforhumanity.org</p>
        <p>DOL Registration: 2025-IN-132301</p>
        <p style="margin-top: 20px; color: #999;">
            Good luck with your submission!<br>
            - Elevate for Humanity Team
        </p>
    </div>
</body>
</html>
`,
  attachments: [
    {
      content: pdfBuffer.toString('base64'),
      filename: 'Elevate_for_Humanity_Demo_Slides.pdf',
      type: 'application/pdf',
      disposition: 'attachment',
    },
  ],
};

async function send() {
  try {
    console.info(`Sending submission package to: ${recipient}`);
    await sgMail.send(msg);
    console.info('✅ Email sent successfully!');
    console.info(`📎 Attached: DEMO_VIDEO_SLIDES.pdf (12 slides)`);
  } catch (error) {
    console.error('❌ Error:', error?.response?.body || error.message);
    process.exit(1);
  }
}

send();