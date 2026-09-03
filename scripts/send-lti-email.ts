/**
 * Send LTI Technical Document to Elevate Team
 */

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY environment variable is not set');
  process.exit(1);
}

const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    h1 { color: #1a1a2e; }
    h2 { color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
    code { background: #e0e0e0; padding: 2px 6px; border-radius: 3px; }
    pre { background: #2d2d2d; color: #fff; padding: 15px; border-radius: 5px; overflow-x: auto; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #1a1a2e; color: white; }
    .success { color: #4CAF50; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Elevate for Humanity LMS</h1>
      <h2>LTI 1.3 Technical Information</h2>
    </div>
    <div class="content">
      <p>Hi Connie,</p>
      
      <p>As requested, please find below the technical documentation for our LMS LTI 1.3 integration.</p>
      
      <h2>LTI 1.3 Compliance</h2>
      <p class="success">✅ FULLY IMPLEMENTED</p>
      <p>Elevate for Humanity LMS supports <strong>LTI 1.3</strong> (IMS Global Learning Tools Interoperability) and is ready for integration with external LMS platforms.</p>
      
      <h2>API Endpoints</h2>
      <table>
        <tr><th>Endpoint</th><th>URL</th><th>Purpose</th></tr>
        <tr><td>OIDC Config</td><td><code>https://www.elevateforhumanity.org/api/lti/config</code></td><td>LTI tool configuration for automatic setup</td></tr>
        <tr><td>JWKS</td><td><code>www.elevateforhumanity.org/api/lti/jwks</code></td><td>JWT signature verification keys</td></tr>
        <tr><td>Login</td><td><code>https://www.elevateforhumanity.org/api/lti/login</code></td><td>OIDC login initiation endpoint</td></tr>
        <tr><td>Launch</td><td><code>https://www.elevateforhumanity.org/api/lti/launch</code></td><td>LTI launch/deep link endpoint</td></tr>
      </table>
      
      <h2>Supported Scopes</h2>
      <ul>
        <li><code>openid</code> - Basic OIDC authentication</li>
        <li><code>https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly</code> - Names & Roles Provisioning Service</li>
      </ul>
      
      <h2>Canvas Integration</h2>
      <p>Pre-configured for Canvas LMS with:</p>
      <ul>
        <li>Course navigation placement</li>
        <li>LtiResourceLinkRequest message type</li>
        <li>Automatic user provisioning</li>
      </ul>
      
      <h2>LTI Configuration JSON</h2>
      <pre>{"title":"Elevate for Humanity LMS","description":"Workforce & apprenticeship training LMS by Elevate for Humanity","jwks_uri":"https://www.elevateforhumanity.org/api/lti/jwks","initiate_login_uri":"https://www.elevateforhumanity.org/api/lti/login","redirect_uris":["https://www.elevateforhumanity.org/api/lti/launch"],"scopes":["openid","https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly"],"extensions":[{"platform":"canvas.instructure.com","settings":{"placements":[{"placement":"course_navigation","message_type":"LtiResourceLinkRequest","target_link_uri":"https://www.elevateforhumanity.org/api/lti/launch","label":"Elevate for Humanity"}]}}]}</pre>
      
      <h2>Programs Available for Integration</h2>
      <ul>
        <li>Barber Apprenticeship</li>
        <li>Cosmetology Apprenticeship</li>
        <li>Esthetics Apprenticeship</li>
        <li>Nail Technician Apprenticeship</li>
        <li>HVAC Training</li>
        <li>Career Courses</li>
      </ul>
      
      <h2>Integration Requirements</h2>
      <p>Your LMS needs to be <strong>LTI 1.1 or 1.3 compliant</strong>. Our system is fully LTI 1.3 compliant.</p>
      
      <p>Please let us know if you need any additional information or have questions about the integration.</p>
      
      <p>Best regards,<br/>Elevate for Humanity Development Team</p>
    </div>
  </div>
</body>
</html>`;

const textContent = `
Elevate for Humanity LMS - LTI 1.3 Technical Information

Hi Connie,

As requested, please find below the technical documentation for our LMS LTI 1.3 integration.

LTI 1.3 Compliance: ✅ FULLY IMPLEMENTED

API Endpoints:
- OIDC Config: https://www.elevateforhumanity.org/api/lti/config
- JWKS: https://www.elevateforhumanity.org/api/lti/jwks
- Login: https://www.elevateforhumanity.org/api/lti/login
- Launch: https://www.elevateforhumanity.org/api/lti/launch

Supported Scopes:
- openid
- https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly

Programs Available:
- Barber Apprenticeship
- Cosmetology Apprenticeship
- Esthetics Apprenticeship
- Nail Technician Apprenticeship
- HVAC Training
- Career Courses

Your LMS needs to be LTI 1.1 or 1.3 compliant. Our system is fully LTI 1.3 compliant.

Please let us know if you need any additional information.

Best regards,
Elevate for Humanity Development Team
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
        to: [{ email: 'elevate@elevateforhumanity.org' }],
        subject: 'Elevate for Humanity LMS - LTI 1.3 Technical Information',
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
    console.log('✅ LTI Technical Document sent to elevate@elevateforhumanity.org');
  } else {
    console.log('❌ Failed to send email:', response.status, await response.text());
  }
}

sendEmail();
