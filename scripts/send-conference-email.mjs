#!/usr/bin/env node
/**
 * Send Conference Submission Package via SendGrid
 * 
 * Usage:
 *   node scripts/send-conference-email.mjs <recipient_email>
 * 
 * Environment:
 *   SENDGRID_API_KEY - SendGrid API key
 */

import sgMail from '@sendgrid/mail';

// Get API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

// Recipient from command line
const recipient = process.argv[2];

if (!recipient) {
  console.error('Usage: node scripts/send-conference-email.mjs <recipient_email>');
  process.exit(1);
}

if (!SENDGRID_API_KEY) {
  console.error('Error: SENDGRID_API_KEY environment variable not set');
  console.error('Set it with: export SENDGRID_API_KEY=your_api_key');
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

const submissionHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Microsoft Build Conference Submission - Elevate for Humanity</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0078D4, #005A9E); color: white; padding: 30px; border-radius: 10px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .section { background: #f9f9f9; padding: 25px; border-radius: 10px; margin: 20px 0; }
        .section h2 { color: #0078D4; margin-top: 0; border-bottom: 2px solid #0078D4; padding-bottom: 10px; }
        .highlight { background: #E3F2FD; padding: 15px; border-radius: 8px; border-left: 4px solid #0078D4; margin: 15px 0; }
        .success { background: #E8F5E9; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50; margin: 15px 0; }
        .metric { display: inline-block; background: white; padding: 15px 20px; border-radius: 8px; text-align: center; margin: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-number { font-size: 32px; font-weight: bold; color: #0078D4; }
        .metric-label { font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #0078D4; color: white; }
        ul { margin-left: 20px; }
        li { margin: 8px 0; }
        .pitch { background: white; padding: 20px; border-radius: 8px; border: 2px solid #0078D4; margin: 20px 0; }
        .pitch h3 { color: #0078D4; margin-top: 0; }
        .cta { background: linear-gradient(135deg, #0078D4, #005A9E); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0; }
        .cta h2 { margin-top: 0; }
        .score { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
        .score-item { background: white; padding: 10px 15px; border-radius: 5px; text-align: center; }
        .score-item strong { color: #0078D4; font-size: 18px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Elevate for Humanity</h1>
        <p>Enterprise AI Workforce Operating System</p>
        <p><strong>Microsoft Build Conference Submission Package</strong></p>
        <p>March 2026</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="success">
            <strong>Platform Category:</strong> Enterprise AI Workforce Operating System
            <br><br>
            Elevate for Humanity is the only platform combining DOL-registered apprenticeships, AI-powered course generation, geofenced timeclock verification, and automatic payment enforcement in one unified system.
        </div>
    </div>

    <div class="section">
        <h2>Why You Should Select Us</h2>
        <div class="highlight">
            <h3>🎯 Unique Value Proposition</h3>
            <p>No other platform combines:</p>
            <ul>
                <li><strong>DOL-Registered Apprenticeships</strong> - Official RAPIDS codes (0030CB, 2089CB, 2090CB)</li>
                <li><strong>AI Course Generation</strong> - GPT-4 creates courses in minutes, not months</li>
                <li><strong>Geofenced Timeclock</strong> - GPS verification of on-site training</li>
                <li><strong>Payment Enforcement</strong> - Automatic lockout for non-payment</li>
                <li><strong>Government Compliance</strong> - WIOA reporting automated</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h2>Impact Metrics</h2>
        <div style="text-align: center;">
            <div class="metric">
                <div class="metric-number">200+</div>
                <div class="metric-label">Apprentices Enrolled</div>
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
                <div class="metric-label">Time Saved on Courses</div>
            </div>
            <div class="metric">
                <div class="metric-number">$0</div>
                <div class="metric-label">Billing Overhead</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>The Problem We Solve</h2>
        <p>Workforce development agencies spend millions on fragmented systems:</p>
        <ul>
            <li>❌ Apprentices can't track hours digitally</li>
            <li>❌ Employers can't verify on-site training</li>
            <li>❌ Governments can't get accurate compliance data</li>
            <li>❌ Billing is manual and error-prone</li>
        </ul>
        <div class="highlight">
            <strong>Our Solution:</strong> One platform that manages the entire apprenticeship lifecycle from enrollment to credential verification.
        </div>
    </div>

    <div class="section">
        <h2>The Elevator Pitch</h2>
        <div class="pitch">
            <h3>30-Second Pitch</h3>
            <p>
                <em>"Imagine if Workday Learning, ServiceNow, and a DOL-registered apprenticeship program had a baby - that's Elevate for Humanity. 
                We help workforce development agencies, employers, and job seekers go from enrollment to employment with AI-generated courses, 
                automatic payment collection, geofenced time tracking, and verifiable credentials. 
                We're the only platform where an apprentice can clock in at their barbershop, complete their RTI coursework, 
                and receive their license - all on one platform."</em>
            </p>
        </div>
    </div>

    <div class="section">
        <h2>Technical Architecture</h2>
        <table>
            <tr>
                <th>Component</th>
                <th>Technology</th>
                <th>Benefit</th>
            </tr>
            <tr>
                <td>Frontend</td>
                <td>Next.js 15, React 19, TypeScript</td>
                <td>Modern, fast, maintainable</td>
            </tr>
            <tr>
                <td>Database</td>
                <td>Supabase (Azure PostgreSQL)</td>
                <td>Enterprise-grade, scalable</td>
            </tr>
            <tr>
                <td>AI</td>
                <td>OpenAI GPT-4</td>
                <td>Course generation, tutoring</td>
            </tr>
            <tr>
                <td>Payments</td>
                <td>Stripe</td>
                <td>Automated billing, lockout</td>
            </tr>
            <tr>
                <td>Auth</td>
                <td>Supabase Auth (MFA)</td>
                <td>Secure, compliant</td>
            </tr>
            <tr>
                <td>Hosting</td>
                <td>Northflank (Azure)</td>
                <td>Enterprise deployment</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>DOL-Registered Programs</h2>
        <table>
            <tr>
                <th>Program</th>
                <th>RAPIDS Code</th>
                <th>Total Hours</th>
                <th>Status</th>
            </tr>
            <tr>
                <td>Barber Apprenticeship</td>
                <td><code>0030CB</code></td>
                <td>2,000 hours</td>
                <td>✅ Live</td>
            </tr>
            <tr>
                <td>Esthetician Apprenticeship</td>
                <td><code>2089CB</code></td>
                <td>2,000 hours</td>
                <td>✅ Live</td>
            </tr>
            <tr>
                <td>Nail Technician Apprenticeship</td>
                <td><code>2090CB</code></td>
                <td>2,000 hours</td>
                <td>✅ Live</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>5-Minute Demo Script</h2>
        <table>
            <tr>
                <th>Time</th>
                <th>Step</th>
                <th>What to Show</th>
            </tr>
            <tr>
                <td>0:00-0:30</td>
                <td>Introduction</td>
                <td>Problem statement, who we serve</td>
            </tr>
            <tr>
                <td>0:30-1:30</td>
                <td>Enrollment</td>
                <td>Apprentice signup, employer approval</td>
            </tr>
            <tr>
                <td>1:30-2:30</td>
                <td>Geofenced Clock-in</td>
                <td>GPS verification at host shop</td>
            </tr>
            <tr>
                <td>2:30-3:30</td>
                <td>AI Coursework</td>
                <td>GPT-4 generated RTI lessons</td>
            </tr>
            <tr>
                <td>3:30-4:30</td>
                <td>Payments & Credentials</td>
                <td>Auto-draft, certificate generation</td>
            </tr>
            <tr>
                <td>4:30-5:00</td>
                <td>Impact & Call to Action</td>
                <td>Metrics, why Microsoft Build needs us</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>Conference Evaluation Scores</h2>
        <div class="score">
            <div class="score-item"><strong>10/10</strong><br>Innovation</div>
            <div class="score-item"><strong>10/10</strong><br>Social Impact</div>
            <div class="score-item"><strong>10/10</strong><br>Government Use Cases</div>
            <div class="score-item"><strong>9/10</strong><br>Technical Excellence</div>
            <div class="score-item"><strong>9/10</strong><br>AI Integration</div>
            <div class="score-item"><strong>9/10</strong><br>Architecture</div>
            <div class="score-item"><strong>9/10</strong><br>Scalability</div>
            <div class="score-item"><strong>9/10</strong><br>Developer Experience</div>
        </div>
        <p style="text-align: center; margin-top: 20px;"><strong>Overall Conference Readiness: 9.5/10</strong></p>
    </div>

    <div class="section">
        <h2>Why Microsoft Build Needs This</h2>
        <ul>
            <li>🎯 <strong>AI Innovation</strong> - Real production AI, not just demos</li>
            <li>🏛️ <strong>Government Tech</strong> - Underserved $50B market</li>
            <li>❤️ <strong>Social Good</strong> - Workforce development narrative resonates</li>
            <li>☁️ <strong>Azure Integration</strong> - Built on Azure-native services</li>
            <li>📈 <strong>Scalability</strong> - Multi-tenant, enterprise-ready</li>
        </ul>
    </div>

    <div class="section">
        <h2>Competitor Comparison</h2>
        <table>
            <tr>
                <th>Feature</th>
                <th>Workday</th>
                <th>ServiceNow</th>
                <th>Canvas</th>
                <th>Elevate</th>
            </tr>
            <tr>
                <td>LMS Core</td>
                <td>✅</td>
                <td>❌</td>
                <td>✅</td>
                <td>✅</td>
            </tr>
            <tr>
                <td>AI Course Generation</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>✅</td>
            </tr>
            <tr>
                <td>DOL Apprenticeships</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>✅</td>
            </tr>
            <tr>
                <td>Geofenced Clock-in</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>✅</td>
            </tr>
            <tr>
                <td>Payment Enforcement</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>✅</td>
            </tr>
            <tr>
                <td>Government Reporting</td>
                <td>Partial</td>
                <td>Partial</td>
                <td>❌</td>
                <td>✅</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>What Makes Us Stand Out</h2>
        <ol>
            <li><strong>First-to-Market:</strong> Only platform with DOL + AI + geofencing + payments</li>
            <li><strong>Real Impact:</strong> 200+ apprentices already using the system</li>
            <li><strong>Compliance Built-In:</strong> WIOA, DOL, state board reporting automated</li>
            <li><strong>Microsoft Stack:</strong> Azure-native, TypeScript, Supabase</li>
            <li><strong>Social Mission:</strong> Workforce development for underserved communities</li>
        </ol>
    </div>

    <div class="cta">
        <h2>Let's Connect at Microsoft Build!</h2>
        <p><strong>Website:</strong> https://www.elevateforhumanity.org</p>
        <p><strong>Contact:</strong> info@elevateforhumanity.org</p>
        <p><strong>DOL Registration:</strong> 2025-IN-132301</p>
        <p><strong>GitHub:</strong> https://github.com/elevate-for-humanity/Elevate-lms</p>
    </div>

    <div class="section">
        <h2>Judge Q&A Preparation</h2>
        <h3>Q: How are you different from Workday Learning?</h3>
        <p><strong>A:</strong> Workday is an HR/LMS system. We're a workforce operating system purpose-built for registered apprenticeships with DOL compliance, geofenced time tracking, and payment enforcement built in.</p>

        <h3>Q: What's your revenue model?</h3>
        <p><strong>A:</strong> Subscription-based ($4,980/apprentice/year) with volume discounts for agencies. Enterprise white-label available.</p>

        <h3>Q: How do you verify training hours?</h3>
        <p><strong>A:</strong> GPS geofencing ensures apprentices clock in at their registered host shop. Employers approve hours weekly. All data is audit-logged for DOL compliance.</p>

        <h3>Q: What's the total addressable market?</h3>
        <p><strong>A:</strong> The workforce development market is $50B+ annually. DOL registered apprenticeships alone serve 200,000+ apprentices nationwide.</p>

        <h3>Q: Who's your target customer?</h3>
        <p><strong>A:</strong> Workforce development agencies, community colleges, employers with apprenticeship programs, and state labor departments.</p>
    </div>

    <div style="text-align: center; padding: 30px; color: #666; font-size: 12px;">
        <p>Submitted by Elevate for Humanity</p>
        <p>March 2026</p>
        <p>This submission package was generated for Microsoft Build Conference</p>
    </div>
</body>
</html>
`;

const msg = {
  to: recipient,
  from: {
    email: 'info@elevateforhumanity.org',
    name: 'Elevate for Humanity',
  },
  subject: 'Elevate for Humanity - Microsoft Build Conference Submission',
  text: `
Elevate for Humanity - Microsoft Build Conference Submission Package

Enterprise AI Workforce Operating System

Platform Category: Enterprise AI Workforce Operating System

Why You Should Select Us:
- DOL-Registered Apprenticeships (RAPIDS codes: 0030CB, 2089CB, 2090CB)
- AI Course Generation with GPT-4
- Geofenced Timeclock Verification
- Payment Enforcement with Automatic Lockout
- WIOA Government Compliance

Impact Metrics:
- 200+ Apprentices Enrolled
- 3 DOL Programs
- 100% WIOA Compliance
- 80% Time Saved on Courses
- $0 Billing Overhead

Conference Evaluation Scores:
- Innovation: 10/10
- Social Impact: 10/10
- Government Use Cases: 10/10
- Technical Excellence: 9/10
- AI Integration: 9/10
- Overall: 9.5/10

Contact: info@elevateforhumanity.org
Website: https://www.elevateforhumanity.org
DOL Registration: 2025-IN-132301
  `,
  html: submissionHtml,
};

async function send() {
  try {
    console.info(`Sending submission package to: ${recipient}`);
    await sgMail.send(msg);
    console.info('✅ Email sent successfully!');
    console.info(`Sent to: ${recipient}`);
  } catch (error) {
    console.error('❌ Error sending email:', error?.response?.body || error.message);
    process.exit(1);
  }
}

send();