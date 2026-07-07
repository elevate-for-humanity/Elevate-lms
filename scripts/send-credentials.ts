/**
 * Send Login Credentials to All Users via SendGrid
 */

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY environment variable is not set');
  process.exit(1);
}

interface User {
  name: string;
  email: string;
  password: string;
  category: string;
}

const users: User[] = [
  // Admin
  { name: 'Elizabeth Greene', email: 'curvaturebodysculpting@gmail.com', password: 'Elijah14619$', category: 'Admin' },
  
  // Host Shop Partners
  { name: 'Calvin Pena', email: 'calvincutz1985@gmail.com', password: 'Calvin1234619$', category: 'Host Shop Partner' },
  { name: 'Elizabeth Greene', email: 'info@prestigeelevation.com', password: 'Prestige20264619Elijah', category: 'Host Shop Partner' },
  { name: 'Aaron Brown', email: 'razorsimage11@gmail.com', password: 'Aaron1234619$', category: 'Host Shop Partner' },
  { name: 'Adam Kriech', email: 'adamkriech1@gmail.com', password: 'Adam1234619$', category: 'Host Shop Partner' },
  { name: 'Corienne Meid', email: 'styleandscissorsalon@gmail.com', password: 'Corienne1234619$', category: 'Host Shop Partner' },
  { name: 'Chris Newkirk', email: 'christopherd.newkirk@gmail.com', password: 'Chris1234619$', category: 'Host Shop Partner' },
  
  // Program Holders
  { name: 'David Nazaire', email: 'indyondemandservices@gmail.com', password: 'David1234619$', category: 'Program Holder' },
  { name: 'Shawndra Quinn', email: 'info@enchantedheartstraining.com', password: 'Shawndra1234619$', category: 'Program Holder' },
  { name: 'Jozanna George', email: 'mesmerizedbybeautyl@yahoo.com', password: 'Jozanna1234619$', category: 'Program Holder' },
  { name: 'Tanesha Anderson', email: 'missandersonrn@gmail.com', password: 'Tanesha1234619$', category: 'Program Holder' },
  { name: 'Ameco Martin', email: 'amecosenterprise@gmail.com', password: 'Ameco1234619$', category: 'Program Holder' },
  { name: 'Doreen Hawkins', email: 'doreen.hawkins01@outlook.com', password: 'Doreen1234619$', category: 'Program Holder' },
  { name: 'Dr. Carlina A. Wilkes', email: 'info@centerofdestiny.org', password: 'Carlina1234619$', category: 'Program Holder' },
  { name: 'Marketta Kirby', email: 'info@looproots.org', password: 'Marketta1234619$', category: 'Program Holder' },
  { name: 'Naomi Jordan', email: 'sherebuildsmindbodystudio2025@outlook.com', password: 'Naomi1234619$', category: 'Program Holder' },
  
  // Apprentices
  { name: 'Devon Swanson', email: 'devonchopz@icloud.com', password: 'Devon1234619$', category: 'Apprentice' },
  { name: 'Natalia Roa', email: 'natataroa@gmail.com', password: 'Natalia1234619$', category: 'Apprentice' },
  { name: 'Jordan White', email: 'jbwhite888@icloud.com', password: 'Jordan1234619$', category: 'Apprentice' },
  { name: 'Mercedes Wellington', email: 'msanqin@gmail.com', password: 'Mercedes1234619$', category: 'Apprentice' },
  { name: 'Edgar Hernandez', email: 'itisjoel24@gmail.com', password: 'Edgar1234619$', category: 'Apprentice' },
];

function createEmailContent(user: User): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
    h1 { color: #fff; margin: 0; }
    h2 { color: #1a1a2e; }
    .credentials { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; }
    .credentials p { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .value { font-family: monospace; background: #e8f5e9; padding: 5px 10px; border-radius: 4px; display: inline-block; }
    .button { display: inline-block; background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 5px; }
    .button-secondary { background: #1a1a2e; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .category { background: #4CAF50; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Elevate for Humanity</h1>
      <p>Your Login Credentials</p>
    </div>
    <div class="content">
      <span class="category">${user.category}</span>
      <h2>Welcome, ${user.name}!</h2>
      
      <p>You have been given access to the Elevate for Humanity LMS platform. Below are your login credentials:</p>
      
      <div class="credentials">
        <p><span class="label">Email:</span></p>
        <p class="value">${user.email}</p>
        
        <p style="margin-top: 15px;"><span class="label">Password:</span></p>
        <p class="value">${user.password}</p>
      </div>
      
      <p style="text-align: center;">
        <a href="https://elevateforhumanity.org/login" class="button">Login Now</a>
      </p>
      
      <h3>First Time Login:</h3>
      <ol>
        <li>Go to <strong>https://elevateforhumanity.org/login</strong></li>
        <li>Enter your email and password above</li>
        <li>Complete your profile setup</li>
      </ol>
      
      <p><strong>Important:</strong> Please change your password after your first login for security.</p>
      
      <p>If you have any questions, contact support at support@elevateforhumanity.org</p>
      
      <p>Best regards,<br/>Elevate for Humanity Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message from Elevate for Humanity LMS.</p>
      <p>© 2026 Elevate for Humanity. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Elevate for Humanity - Your Login Credentials
============================================

Welcome, ${user.name}!

You have been given access to the Elevate for Humanity LMS platform.

YOUR LOGIN CREDENTIALS:
-----------------------
Email: ${user.email}
Password: ${user.password}

LOGIN URL: https://elevateforhumanity.org/login

FIRST TIME LOGIN:
1. Go to https://elevateforhumanity.org/login
2. Enter your email and password above
3. Complete your profile setup

IMPORTANT: Please change your password after your first login for security.

If you have questions, contact support@elevateforhumanity.org

Best regards,
Elevate for Humanity Team
`;

  return { html, text };
}

async function sendEmail(user: User): Promise<boolean> {
  const { html, text } = createEmailContent(user);
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: user.email, name: user.name }],
        subject: `Elevate for Humanity - Your Login Credentials`,
      }],
      from: {
        email: 'noreply@elevateforhumanity.org',
        name: 'Elevate for Humanity'
      },
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });

  return response.ok;
}

async function main() {
  console.log('📧 Sending credentials to all users...\n');
  
  let sent = 0;
  let failed = 0;
  
  for (const user of users) {
    const success = await sendEmail(user);
    if (success) {
      console.log(`✅ ${user.name} (${user.email})`);
      sent++;
    } else {
      console.log(`❌ Failed: ${user.name} (${user.email})`);
      failed++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Summary: ${sent} sent, ${failed} failed`);
}

main().catch(console.error);
