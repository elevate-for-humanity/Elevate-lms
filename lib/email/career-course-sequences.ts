// Email sequences for career course purchasers

export interface CourseEmailData {
  email: string;
  firstName?: string;
  courseName: string;
  courseSlug: string;
  purchaseDate: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://elevateforhumanity.org';

// Welcome email - sent immediately after purchase
export function getWelcomeEmail(data: CourseEmailData) {
  return {
    subject: `Welcome to ${data.courseName}! Let's Get Started`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${SITE_URL}/images/logo.png" alt="Elevate for Humanity" style="height: 50px;">
        </div>
        
        <h1 style="color: #7c3aed; margin-bottom: 20px;">Welcome to ${data.courseName}!</h1>
        
        <p>Hi${data.firstName ? ` ${data.firstName}` : ''},</p>
        
        <p>Thank you for investing in your career! You now have <strong>lifetime access</strong> to ${data.courseName}.</p>
        
        <div style="padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; border: 2px solid #e5e7eb;">
          <h2 style="margin: 0 0 15px 0; color: white;">Start Learning Now</h2>
          <p style="margin: 0 0 20px 0; opacity: 0.9;">Your course is ready and waiting for you.</p>
          <a href="${SITE_URL}/career-services/courses/${data.courseSlug}/learn" 
             style="display: inline-block; background: white; color: #7c3aed; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Go to My Course →
          </a>
        </div>
        
        <h3 style="color: #1f2937;">Here's what to expect:</h3>
        <ul style="padding-left: 20px;">
          <li style="margin-bottom: 10px;"><strong>Video Lessons:</strong> Watch at your own pace, anytime</li>
          <li style="margin-bottom: 10px;"><strong>Downloadable Resources:</strong> Templates and worksheets included</li>
          <li style="margin-bottom: 10px;"><strong>Certificate:</strong> Earn your certificate upon completion</li>
          <li style="margin-bottom: 10px;"><strong>Lifetime Access:</strong> Come back anytime, including future updates</li>
        </ul>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h4 style="margin: 0 0 10px 0; color: #1f2937;">💡 Pro Tip</h4>
          <p style="margin: 0; color: #4b5563;">Set aside 30 minutes each day to work through the course. Consistent progress leads to better results!</p>
        </div>
        
        <p>Questions? Just reply to this email - we're here to help!</p>
        
        <p>Here's to your success,<br>
        <strong>The Elevate for Humanity Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          Elevate for Humanity | 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240<br>
          <a href="${SITE_URL}/unsubscribe" style="color: #9ca3af;">Unsubscribe</a>
        </p>
      </body>
      </html>
    `,
  };
}

// Day 3 email - check in and encourage progress
export function getDay3Email(data: CourseEmailData) {
  return {
    subject: `How's ${data.courseName} going? 📚`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${SITE_URL}/images/logo.png" alt="Elevate for Humanity" style="height: 50px;">
        </div>
        
        <h1 style="color: #7c3aed;">Quick Check-In 👋</h1>
        
        <p>Hi${data.firstName ? ` ${data.firstName}` : ''},</p>
        
        <p>It's been a few days since you started <strong>${data.courseName}</strong>. How's it going?</p>
        
        <p>If you haven't started yet, that's okay! Here are some tips to get going:</p>
        
        <div style="background: #f9fafb; border-left: 4px solid #e5e7eb; padding: 15px; margin: 20px 0;">
          <strong>🎯 Start Small:</strong> Just watch the first lesson today. It's only about 10-15 minutes!
        </div>
        
        <h3 style="color: #1f2937;">Your Next Steps:</h3>
        <ol style="padding-left: 20px;">
          <li style="margin-bottom: 10px;">Log in to your course</li>
          <li style="margin-bottom: 10px;">Watch Lesson 1 (it's a preview - you can do this!)</li>
          <li style="margin-bottom: 10px;">Take notes on one key takeaway</li>
        </ol>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${SITE_URL}/career-services/courses/${data.courseSlug}/learn" 
             style="display: inline-block; background: #ea580c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Continue Learning →
          </a>
        </div>
        
        <p>Remember: Every expert was once a beginner. You've got this!</p>
        
        <p>Cheering you on,<br>
        <strong>The Elevate Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          <a href="${SITE_URL}/unsubscribe" style="color: #9ca3af;">Unsubscribe</a>
        </p>
      </body>
      </html>
    `,
  };
}

// Day 7 email - motivation and resources
export function getDay7Email(data: CourseEmailData) {
  return {
    subject: `Week 1 Complete! Here's a bonus for you 🎁`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${SITE_URL}/images/logo.png" alt="Elevate for Humanity" style="height: 50px;">
        </div>
        
        <h1 style="color: #7c3aed;">One Week In! 🎉</h1>
        
        <p>Hi${data.firstName ? ` ${data.firstName}` : ''},</p>
        
        <p>It's been one week since you enrolled in <strong>${data.courseName}</strong>!</p>
        
        <p>Whether you've completed several lessons or are just getting started, we want to share some bonus resources to help you succeed:</p>
        
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #166534;">🎁 Bonus Resources</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Download all course worksheets from your dashboard</li>
            <li>Join our private community for support</li>
            <li>Book a free 15-min Q&A call with our team</li>
          </ul>
        </div>
        
        <h3 style="color: #1f2937;">Success Stories</h3>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; font-style: italic;">
          "I completed the course in 2 weeks and landed 3 interviews within a month. The resume templates alone were worth it!"
          <br><br>
          <strong style="font-style: normal;">— Sarah M., Marketing Professional</strong>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${SITE_URL}/career-services/courses/${data.courseSlug}/learn" 
             style="display: inline-block; background: #ea580c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Keep Going →
          </a>
        </div>
        
        <p>You're doing great!<br>
        <strong>The Elevate Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          <a href="${SITE_URL}/unsubscribe" style="color: #9ca3af;">Unsubscribe</a>
        </p>
      </body>
      </html>
    `,
  };
}

// Completion email - congratulations and next steps
export function getCompletionEmail(data: CourseEmailData & { certificateUrl?: string }) {
  return {
    subject: `🎓 Congratulations! You've completed ${data.courseName}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${SITE_URL}/images/logo.png" alt="Elevate for Humanity" style="height: 50px;">
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 60px;">🎓</div>
          <h1 style="color: #7c3aed; margin: 10px 0;">Congratulations!</h1>
          <p style="font-size: 18px; color: #4b5563;">You've completed <strong>${data.courseName}</strong>!</p>
        </div>
        
        <p>Hi${data.firstName ? ` ${data.firstName}` : ''},</p>
        
        <p>This is a huge accomplishment! You've invested in yourself and completed the entire course. That puts you ahead of 90% of people who never finish what they start.</p>
        
        <div style="padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; border: 2px solid #e5e7eb;">
          <h2 style="margin: 0 0 15px 0; color: white;">Your Certificate is Ready!</h2>
          <p style="margin: 0 0 20px 0; opacity: 0.9;">Download and share your achievement.</p>
          <a href="${SITE_URL}/career-services/courses/${data.courseSlug}/certificate" 
             style="display: inline-block; background: white; color: #7c3aed; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Download Certificate →
          </a>
        </div>
        
        <h3 style="color: #1f2937;">What's Next?</h3>
        <ul style="padding-left: 20px;">
          <li style="margin-bottom: 10px;"><strong>Apply what you learned:</strong> Start using your new skills today</li>
          <li style="margin-bottom: 10px;"><strong>Share your certificate:</strong> Add it to LinkedIn and your resume</li>
          <li style="margin-bottom: 10px;"><strong>Continue learning:</strong> Check out our other courses</li>
        </ul>
        
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h4 style="margin: 0 0 10px 0; color: #92400e;">🎁 Graduate Discount</h4>
          <p style="margin: 0 0 15px 0; color: #92400e;">Get 25% off any other course with code: <strong>GRADUATE25</strong></p>
          <a href="${SITE_URL}/career-services/courses" 
             style="display: inline-block; background: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Browse Courses
          </a>
        </div>
        
        <p>We're so proud of you!</p>
        
        <p>Congratulations again,<br>
        <strong>The Elevate for Humanity Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          <a href="${SITE_URL}/unsubscribe" style="color: #9ca3af;">Unsubscribe</a>
        </p>
      </body>
      </html>
    `,
  };
}

// Re-engagement email - for users who haven't logged in
export function getReengagementEmail(data: CourseEmailData & { lastLoginDays: number }) {
  return {
    subject: `We miss you! Your course is waiting 👋`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${SITE_URL}/images/logo.png" alt="Elevate for Humanity" style="height: 50px;">
        </div>
        
        <h1 style="color: #7c3aed;">We Miss You! 👋</h1>
        
        <p>Hi${data.firstName ? ` ${data.firstName}` : ''},</p>
        
        <p>It's been ${data.lastLoginDays} days since you last visited <strong>${data.courseName}</strong>. Life gets busy - we get it!</p>
        
        <p>But your course is still there, waiting for you. And the skills you'll learn can change your career trajectory.</p>
        
        <div style="background: #f9fafb; border-left: 4px solid #e5e7eb; padding: 15px; margin: 20px 0;">
          <strong>💡 Quick Win:</strong> Just log in and watch ONE lesson today. That's it. Small steps lead to big results.
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${SITE_URL}/career-services/courses/${data.courseSlug}/learn" 
             style="display: inline-block; background: #ea580c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Jump Back In →
          </a>
        </div>
        
        <p>Need help or have questions? Just reply to this email - we're here for you.</p>
        
        <p>Rooting for you,<br>
        <strong>The Elevate Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          <a href="${SITE_URL}/unsubscribe" style="color: #9ca3af;">Unsubscribe</a>
        </p>
      </body>
      </html>
    `,
  };
}
