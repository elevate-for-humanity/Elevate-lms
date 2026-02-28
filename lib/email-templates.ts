
// Email Templates for Elevate for Humanity

export const emailTemplates = {
  welcome: {
    name: 'Welcome Email',
    subject: 'Welcome to Elevate for Humanity!',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Elevate for Humanity</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; text-align: center; border-bottom: 2px solid #e5e7eb;">
              <h1 style="color: #1e293b; margin: 0; font-size: 28px; font-weight: bold;">Welcome to Elevate for Humanity!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hi {{firstName}},</p>

              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We're excited to have you join Elevate for Humanity! You're taking the first step toward a life-changing career.
              </p>

              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Our programs are 100% free for eligible students, and we're here to support you every step of the way.
              </p>

              <div style="background-color: #f1f5f9; border-left: 4px solid #ea580c; padding: 20px; margin: 0 0 30px 0;">
                <h3 style="color: #1e293b; margin: 0 0 10px 0; font-size: 18px;">What's Next?</h3>
                <ul style="color: #475569; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Complete your application</li>
                  <li style="margin-bottom: 8px;">Schedule your orientation</li>
                  <li style="margin-bottom: 8px;">Meet with your advisor</li>
                  <li>Start your training!</li>
                </ul>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{portalUrl}}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">Access Your Portal</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
                Questions? Call us at <a href="tel:317-314-3757" style="color: #ea580c; text-decoration: none;">(317) 314-3757</a>
              </p>
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  },

  programEnrollment: {
    name: 'Program Enrollment',
    subject: "You're Enrolled in {{programName}}!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 30px; text-align: center; border-bottom: 2px solid #e5e7eb;">
              <h1 style="color: #1e293b; margin: 0; font-size: 28px;">🎉 You're Enrolled!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hi {{firstName}},</p>

              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Congratulations! You're officially enrolled in <strong>{{programName}}</strong>.
              </p>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
                <h3 style="color: #065f46; margin: 0 0 15px 0;">Program Details:</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color: #047857; padding: 8px 0; font-weight: bold;">Start Date:</td>
                    <td style="color: #065f46; padding: 8px 0;">{{startDate}}</td>
                  </tr>
                  <tr>
                    <td style="color: #047857; padding: 8px 0; font-weight: bold;">Duration:</td>
                    <td style="color: #065f46; padding: 8px 0;">{{duration}}</td>
                  </tr>
                  <tr>
                    <td style="color: #047857; padding: 8px 0; font-weight: bold;">Location:</td>
                    <td style="color: #065f46; padding: 8px 0;">{{location}}</td>
                  </tr>
                  <tr>
                    <td style="color: #047857; padding: 8px 0; font-weight: bold;">Cost:</td>
                    <td style="color: #065f46; padding: 8px 0; font-weight: bold;">$0 (WIOA-funded)</td>
                  </tr>
                </table>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{courseUrl}}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold;">Start Learning</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #ffffff; padding: 30px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                Elevate for Humanity | (317) 314-3757 | info@elevateforhumanity.org
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  },

  courseReminder: {
    name: 'Course Reminder',
    subject: 'Reminder: {{courseName}} starts {{startTime}}',
    html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 30px; text-align: center; border-bottom: 2px solid #e5e7eb;">
              <h1 style="color: #1e293b; margin: 0; font-size: 28px;">⏰ Class Reminder</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #334155; font-size: 16px; margin: 0 0 20px 0;">Hi {{firstName}},</p>

              <p style="color: #334155; font-size: 16px; margin: 0 0 30px 0;">
                This is a friendly reminder that your class <strong>{{courseName}}</strong> starts soon!
              </p>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 30px 0; text-align: center;">
                <p style="color: #1e40af; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">{{startDate}}</p>
                <p style="color: #1e40af; font-size: 24px; font-weight: bold; margin: 0;">{{startTime}}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{classUrl}}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold;">Join Class</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  },

  certificateReady: {
    name: 'Certificate Ready',
    subject: '🎓 Your Certificate is Ready!',
    html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 30px; text-align: center; border-bottom: 2px solid #e5e7eb;">
              <h1 style="color: #1e293b; margin: 0; font-size: 32px;">🎓 Congratulations!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <p style="color: #334155; font-size: 18px; margin: 0 0 20px 0;">Hi {{firstName}},</p>

              <p style="color: #334155; font-size: 18px; font-weight: bold; margin: 0 0 30px 0;">
                Your Certificate of Completion is ready to download!
              </p>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; margin: 0 0 30px 0;">
                <p style="color: #5b21b6; font-size: 20px; font-weight: bold; margin: 0 0 10px 0;">{{programName}}</p>
                <p style="color: #7c3aed; font-size: 16px; margin: 0;">Completed: {{completionDate}}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{certificateUrl}}" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">Download Certificate</a>
                  </td>
                </tr>
              </table>

              <p style="color: #64748b; font-size: 14px; margin: 30px 0 0 0;">
                Share your achievement on LinkedIn and social media!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  },

  eventInvitation: {
    name: 'Event Invitation',
    subject: "You're Invited: {{eventName}}",
    html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 30px; text-align: center; border-bottom: 2px solid #e5e7eb;">
              <h1 style="color: #1e293b; margin: 0; font-size: 28px;">📅 You're Invited!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">{{eventName}}</h2>

              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                {{eventDescription}}
              </p>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color: #92400e; padding: 8px 0; font-weight: bold;">📅 Date:</td>
                    <td style="color: #78350f; padding: 8px 0;">{{eventDate}}</td>
                  </tr>
                  <tr>
                    <td style="color: #92400e; padding: 8px 0; font-weight: bold;">⏰ Time:</td>
                    <td style="color: #78350f; padding: 8px 0;">{{eventTime}}</td>
                  </tr>
                  <tr>
                    <td style="color: #92400e; padding: 8px 0; font-weight: bold;">📍 Location:</td>
                    <td style="color: #78350f; padding: 8px 0;">{{eventLocation}}</td>
                  </tr>
                </table>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{rsvpUrl}}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold;">RSVP Now</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  },

  partnerOutreach: {
    name: 'Partner Outreach',
    subject: 'Partnership Opportunity with Elevate for Humanity',
    html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Partnership Opportunity</h1>

              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear {{partnerName}},</p>

              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Elevate for Humanity is Indiana's leading workforce training provider, offering 100% funded programs in high-demand careers.
              </p>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
                <h3 style="color: #1e293b; margin: 0 0 15px 0;">Partnership Benefits:</h3>
                <ul style="color: #475569; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Access to pre-screened, trained candidates</li>
                  <li style="margin-bottom: 8px;">Customized training programs</li>
                  <li style="margin-bottom: 8px;">DOL Registered Apprenticeships</li>
                  <li>Ongoing support and retention services</li>
                </ul>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{meetingUrl}}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold;">Schedule a Meeting</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  },

  employerPitch: {
    name: 'Employer Pitch',
    subject: 'Hire Skilled Talent Through Our Training Programs',
    html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 30px; text-align: center; border-bottom: 2px solid #e5e7eb;">
              <h1 style="color: #1e293b; margin: 0; font-size: 28px;">Build Your Talent Pipeline</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear {{employerName}},</p>

              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Finding skilled workers is challenging. Elevate for Humanity provides pre-trained, job-ready candidates in {{industry}} at no cost to you.
              </p>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin: 0 0 30px 0;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 20px;">Why Partner With Us?</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 10px 0;">
                      <strong style="color: #1e40af;">✓ Zero Recruitment Costs</strong>
                      <p style="color: #1e3a8a; margin: 5px 0 0 0; font-size: 14px;">We handle screening, training, and placement</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <strong style="color: #1e40af;">✓ Pre-Screened Candidates</strong>
                      <p style="color: #1e3a8a; margin: 5px 0 0 0; font-size: 14px;">Background checks, drug tests, and soft skills training</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <strong style="color: #1e40af;">✓ Industry Certifications</strong>
                      <p style="color: #1e3a8a; margin: 5px 0 0 0; font-size: 14px;">State-licensed and nationally recognized credentials</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <strong style="color: #1e40af;">✓ Retention Support</strong>
                      <p style="color: #1e3a8a; margin: 5px 0 0 0; font-size: 14px;">90-day follow-up and ongoing career coaching</p>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #f9fafb; border-left: 4px solid #e5e7eb; padding: 20px; margin: 0 0 30px 0;">
                <p style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">Current Available Talent:</p>
                <p style="color: #78350f; margin: 0; font-size: 14px;">{{availableCandidates}} candidates ready for placement in {{industry}}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{hiringUrl}}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">View Available Candidates</a>
                  </td>
                </tr>
              </table>

              <p style="color: #64748b; font-size: 14px; text-align: center; margin: 30px 0 0 0;">
                Or call us at <a href="tel:317-314-3757" style="color: #1e40af; text-decoration: none; font-weight: bold;">(317) 314-3757</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #ffffff; padding: 30px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                Elevate for Humanity | 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  },

  studentNurture: {
    name: 'Student Nurture',
    subject: '{{firstName}}, Keep Up the Great Work!',
    html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 30px; text-align: center; border-bottom: 2px solid #e5e7eb;">
              <h1 style="color: #1e293b; margin: 0; font-size: 28px;">You're Making Progress!</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hi {{firstName}},</p>

              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                We wanted to check in and celebrate your progress in {{programName}}!
              </p>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin: 0 0 30px 0; text-align: center;">
                <h3 style="color: #065f46; margin: 0 0 20px 0; font-size: 20px;">Your Progress</h3>
                <div style="background-color: #e5e7eb; border-radius: 50px; height: 30px; position: relative; margin: 0 0 15px 0;">
                  <div style="background: linear-gradient(90deg, #10b981 0%, #059669 100%); height: 30px; border-radius: 50px; width: {{progressPercent}}%; display: flex; align-items: center; justify-content: center;">
                    <span style="color: #ffffff; font-weight: bold; font-size: 14px;">{{progressPercent}}%</span>
                  </div>
                </div>
                <p style="color: #047857; margin: 0; font-size: 16px;">
                  <strong>{{completedHours}}</strong> of <strong>{{totalHours}}</strong> hours completed
                </p>
              </div>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
                <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">Next Steps:</h3>
                <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>{{nextStep1}}</li>
                  <li>{{nextStep2}}</li>
                  <li>{{nextStep3}}</li>
                </ul>
              </div>

              <div style="background-color: #f9fafb; border-left: 4px solid #e5e7eb; padding: 20px; margin: 0 0 30px 0;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  <strong>Need Help?</strong> Your advisor {{advisorName}} is here to support you. Schedule a meeting anytime!
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{portalUrl}}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; margin-right: 10px;">Continue Learning</a>
                    <a href="{{advisorUrl}}" style="display: inline-block; background-color: #64748b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold;">Contact Advisor</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color: #ffffff; padding: 30px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                Elevate for Humanity | (317) 314-3757 | info@elevateforhumanity.org
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  },

  applicationFollowUp: {
    name: 'Application Follow-Up',
    subject: 'Complete Your Application - {{programName}}',
    html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 30px; text-align: center; border-bottom: 2px solid #e5e7eb;">
              <h1 style="color: #1e293b; margin: 0; font-size: 28px;">Finish Your Application</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hi {{firstName}},</p>

              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We noticed you started an application for <strong>{{programName}}</strong> but haven't finished yet.
              </p>

              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Don't miss this opportunity! Our programs are 100% free and can change your career trajectory.
              </p>

              <div style="background-color: #fff7ed; border: 2px solid #ea580c; border-radius: 8px; padding: 25px; margin: 0 0 30px 0;">
                <h3 style="color: #9a3412; margin: 0 0 15px 0; font-size: 20px;">What You'll Get:</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #7c2d12;">
                      <strong>✓</strong> 100% Free Training (WIOA-funded)
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #7c2d12;">
                      <strong>✓</strong> Industry Certifications
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #7c2d12;">
                      <strong>✓</strong> Job Placement Assistance
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #7c2d12;">
                      <strong>✓</strong> Career Coaching & Support
                    </td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 30px 0; text-align: center;">
                <p style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">⏰ Next Cohort Starts:</p>
                <p style="color: #78350f; font-size: 24px; font-weight: bold; margin: 0;">{{nextCohortDate}}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{applicationUrl}}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">Complete Application</a>
                  </td>
                </tr>
              </table>

              <p style="color: #64748b; font-size: 14px; text-align: center; margin: 30px 0 0 0;">
                Questions? Call us at <a href="tel:317-314-3757" style="color: #ea580c; text-decoration: none; font-weight: bold;">(317) 314-3757</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #ffffff; padding: 30px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                Elevate for Humanity | 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  },

  workoneUpdate: {
    name: 'WorkOne Update',
    subject: 'WorkOne Partnership Update - {{month}}',
    html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 30px; text-align: center; border-bottom: 2px solid #e5e7eb;">
              <h1 style="color: #1e293b; margin: 0; font-size: 28px;">WorkOne Partnership Update</h1>
              <p style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 16px;">{{month}} Report</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Dear WorkOne Team,
              </p>

              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Here's our monthly update on student enrollments, completions, and placements through our WIOA partnership.
              </p>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin: 0 0 30px 0;">
                <h3 style="color: #075985; margin: 0 0 20px 0; font-size: 20px;">{{month}} Metrics</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #bae6fd;">
                      <strong style="color: #0c4a6e;">New Enrollments:</strong>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #bae6fd; text-align: right;">
                      <span style="color: #0369a1; font-size: 20px; font-weight: bold;">{{newEnrollments}}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #bae6fd;">
                      <strong style="color: #0c4a6e;">Program Completions:</strong>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #bae6fd; text-align: right;">
                      <span style="color: #0369a1; font-size: 20px; font-weight: bold;">{{completions}}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #bae6fd;">
                      <strong style="color: #0c4a6e;">Job Placements:</strong>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #bae6fd; text-align: right;">
                      <span style="color: #0369a1; font-size: 20px; font-weight: bold;">{{placements}}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <strong style="color: #0c4a6e;">Average Starting Wage:</strong>
                    </td>
                    <td style="padding: 12px 0; text-align: right;">
                      <span style="color: #0369a1; font-size: 20px; font-weight: bold;">${{ avgWage }}/hr</span>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
                <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">Top Programs This Month:</h3>
                <ol style="color: #475569; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>{{topProgram1}}</li>
                  <li>{{topProgram2}}</li>
                  <li>{{topProgram3}}</li>
                </ol>
              </div>

              <div style="background-color: #f9fafb; border-left: 4px solid #e5e7eb; padding: 20px; margin: 0 0 30px 0;">
                <p style="color: #065f46; font-size: 14px; margin: 0 0 10px 0;">
                  <strong>Success Story:</strong>
                </p>
                <p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.6;">
                  {{successStory}}
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{reportUrl}}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold;">View Full Report</a>
                  </td>
                </tr>
              </table>

              <p style="color: #64748b; font-size: 14px; margin: 30px 0 0 0;">
                Thank you for your continued partnership in transforming lives through workforce development.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #ffffff; padding: 30px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                Elevate for Humanity | (317) 314-3757 | info@elevateforhumanity.org
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  },
};

export type EmailTemplateKey = keyof typeof emailTemplates;

export function getTemplate(key: EmailTemplateKey) {
  return emailTemplates[key];
}

export function renderTemplate(
  key: EmailTemplateKey,
  variables: Record<string, string>
) {
  const template = emailTemplates[key];
  let html = template.html;
  let subject = template.subject;

  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value);
    subject = subject.replace(regex, value);
  });

  return { subject, html };
}
