/**
 * Send All User Credentials List via SendGrid
 */

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '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';

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.4; color: #333; }
    .container { max-width: 900px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
    h1 { color: #fff; margin: 0; font-size: 28px; }
    h2 { color: #1a1a2e; border-bottom: 2px solid #4CAF50; padding-bottom: 8px; margin-top: 25px; }
    h3 { color: #4CAF50; margin-top: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; font-size: 14px; }
    th, td { border: 1px solid #ddd; padding: 10px 8px; text-align: left; }
    th { background: #1a1a2e; color: white; }
    tr:nth-child(even) { background: #f2f2f2; }
    .password { font-family: monospace; background: #e8f5e9; padding: 2px 6px; border-radius: 3px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .total { background: #4CAF50; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; font-size: 12px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Elevate for Humanity LMS</h1>
      <p>Complete User Credentials List</p>
      <span class="total">Generated: July 7, 2026</span>
    </div>
    <div class="content">
      
      <h2>🔷 ADMIN (1)</h2>
      <table>
        <tr><th>Name</th><th>Email</th><th>Password</th></tr>
        <tr><td>Elizabeth Greene</td><td>curvaturebodysculpting@gmail.com</td><td><span class="password">Elijah14619$</span></td></tr>
      </table>

      <h2>🔷 HOST SHOP PARTNERS (6)</h2>
      <table>
        <tr><th>Host Shop</th><th>Owner</th><th>Email</th><th>Password</th></tr>
        <tr><td>Cal's Kutz Studio</td><td>Calvin Pena</td><td>calvincutz1985@gmail.com</td><td><span class="password">Calvin1234619$</span></td></tr>
        <tr><td>Prestige Elevation</td><td>Elizabeth Greene</td><td>info@prestigeelevation.com</td><td><span class="password">Prestige20264619Elijah</span></td></tr>
        <tr><td>Razors Image Barbershop</td><td>Aaron Brown</td><td>razorsimage11@gmail.com</td><td><span class="password">Aaron1234619$</span></td></tr>
        <tr><td>Kountry Kutz Barbershop</td><td>Adam Kriech</td><td>adamkriech1@gmail.com</td><td><span class="password">Adam1234619$</span></td></tr>
        <tr><td>Style and Scissors Salon</td><td>Corienne Meid</td><td>styleandscissorsalon@gmail.com</td><td><span class="password">Corienne1234619$</span></td></tr>
        <tr><td>Chris Newkirk Salon</td><td>Chris Newkirk</td><td>christopherd.newkirk@gmail.com</td><td><span class="password">Chris1234619$</span></td></tr>
      </table>

      <h2>🔷 PROGRAM HOLDERS (8)</h2>
      <table>
        <tr><th>Name</th><th>Email</th><th>Password</th></tr>
        <tr><td>David Nazaire</td><td>indyondemandservices@gmail.com</td><td><span class="password">David1234619$</span></td></tr>
        <tr><td>Shawndra Quinn, RN</td><td>info@enchantedheartstraining.com</td><td><span class="password">Shawndra1234619$</span></td></tr>
        <tr><td>Jozanna George</td><td>mesmerizedbybeautyl@yahoo.com</td><td><span class="password">Jozanna1234619$</span></td></tr>
        <tr><td>Tanesha Anderson</td><td>missandersonrn@gmail.com</td><td><span class="password">Tanesha1234619$</span></td></tr>
        <tr><td>Ameco Martin</td><td>amecosenterprise@gmail.com</td><td><span class="password">Ameco1234619$</span></td></tr>
        <tr><td>Doreen Hawkins</td><td>doreen.hawkins01@outlook.com</td><td><span class="password">Doreen1234619$</span></td></tr>
        <tr><td>Dr. Carlina A. Wilkes</td><td>info@centerofdestiny.org</td><td><span class="password">Carlina1234619$</span></td></tr>
        <tr><td>Marketta Kirby</td><td>info@looproots.org</td><td><span class="password">Marketta1234619$</span></td></tr>
      </table>

      <h2>🔷 APPRENTICES (5)</h2>
      <table>
        <tr><th>Name</th><th>Email</th><th>Password</th></tr>
        <tr><td>Devon Swanson</td><td>devonchopz@icloud.com</td><td><span class="password">Devon1234619$</span></td></tr>
        <tr><td>Natalia Roa</td><td>natataroa@gmail.com</td><td><span class="password">Natalia1234619$</span></td></tr>
        <tr><td>Jordan White</td><td>jbwhite888@icloud.com</td><td><span class="password">Jordan1234619$</span></td></tr>
        <tr><td>Mercedes Wellington</td><td>msanqin@gmail.com</td><td><span class="password">Mercedes1234619$</span></td></tr>
        <tr><td>Edgar Hernandez</td><td>itisjoel24@gmail.com</td><td><span class="password">Edgar1234619$</span></td></tr>
      </table>

      <h2>🔷 LOGIN URL</h2>
      <p style="font-size: 18px;"><strong>https://elevateforhumanity.org/login</strong></p>

      <p style="color: #666; margin-top: 30px;"><em>⚠️ Security Notice: Please delete this email after saving credentials securely.</em></p>

    </div>
    <div class="footer">
      <p>Elevate for Humanity LMS</p>
      <p>© 2026 All Rights Reserved</p>
    </div>
  </div>
</body>
</html>`;

const textContent = `
ELEVATE FOR HUMANITY LMS - COMPLETE USER CREDENTIALS LIST
=========================================================
Generated: July 7, 2026

🔷 ADMIN (1)
-------------
Elizabeth Greene | curvaturebodysculpting@gmail.com | Elijah14619$

🔷 HOST SHOP PARTNERS (6)
--------------------------
Cal's Kutz Studio | Calvin Pena | calvincutz1985@gmail.com | Calvin1234619$
Prestige Elevation | Elizabeth Greene | info@prestigeelevation.com | Prestige20264619Elijah
Razors Image Barbershop | Aaron Brown | razorsimage11@gmail.com | Aaron1234619$
Kountry Kutz Barbershop | Adam Kriech | adamkriech1@gmail.com | Adam1234619$
Style and Scissors Salon | Corienne Meid | styleandscissorsalon@gmail.com | Corienne1234619$
Chris Newkirk Salon | Chris Newkirk | christopherd.newkirk@gmail.com | Chris1234619$

🔷 PROGRAM HOLDERS (8)
-----------------------
David Nazaire | indyondemandservices@gmail.com | David1234619$
Shawndra Quinn, RN | info@enchantedheartstraining.com | Shawndra1234619$
Jozanna George | mesmerizedbybeautyl@yahoo.com | Jozanna1234619$
Tanesha Anderson | missandersonrn@gmail.com | Tanesha1234619$
Ameco Martin | amecosenterprise@gmail.com | Ameco1234619$
Doreen Hawkins | doreen.hawkins01@outlook.com | Doreen1234619$
Dr. Carlina A. Wilkes | info@centerofdestiny.org | Carlina1234619$
Marketta Kirby | info@looproots.org | Marketta1234619$

🔷 APPRENTICES (5)
-------------------
Devon Swanson | devonchopz@icloud.com | Devon1234619$
Natalia Roa | natataroa@gmail.com | Natalia1234619$
Jordan White | jbwhite888@icloud.com | Jordan1234619$
Mercedes Wellington | msanqin@gmail.com | Mercedes1234619$
Edgar Hernandez | itisjoel24@gmail.com | Edgar1234619$

LOGIN URL: https://elevateforhumanity.org/login

⚠️ Security Notice: Please delete this email after saving credentials securely.
`;

async function sendEmail() {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: 'elevate4humanityedu@gmail.com', name: 'Elevate for Humanity' }],
        subject: 'Elevate LMS - Complete User Credentials List',
      }],
      from: {
        email: 'noreply@elevateforhumanity.org',
        name: 'Elevate for Humanity'
      },
      content: [
        { type: 'text/plain', value: textContent },
        { type: 'text/html', value: htmlContent },
      ],
    }),
  });

  if (response.ok) {
    console.log('✅ Email sent successfully to elevate4humanityedu@gmail.com');
  } else {
    console.log('❌ Failed to send email:', response.status, await response.text());
  }
}

sendEmail();
