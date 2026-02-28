// Comprehensive email template system

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
`;

const buttonStyle = `
  display: inline-block;
  padding: 14px 28px;
  background: #ea580c;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  margin: 20px 0;
`;

export const emailTemplates = {
  // Welcome email
  welcome: (data: { name: string; loginUrl: string }) => ({
    subject: '🎓 Welcome to Elevate for Humanity!',
    html: `
      <div style="${baseStyles} max-width: 600px; margin: 0 auto;">
        <div style="padding: 40px; text-align: center; border-bottom: 2px solid #e5e7eb; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to Elevate!</h1>
        </div>
        <div style="padding: 40px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${data.name},</h2>
          <p style="font-size: 16px; color: #4b5563;">We're thrilled to have you join our community of learners!</p>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">What's Next?</h3>
            <ul style="color: #4b5563; padding-left: 20px;">
              <li>Complete your profile</li>
              <li>Browse our training programs</li>
              <li>Check your WIOA eligibility</li>
              <li>Connect with an advisor</li>
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="${data.loginUrl}" style="${buttonStyle}">
              Get Started →
            </a>
          </div>

          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Need help? Reply to this email or call us at (317) 314-3757
            </p>
          </div>
        </div>
      </div>
    `,
    text: `Hi ${data.name}, Welcome to Elevate for Humanity! Get started at ${data.loginUrl}`,
  }),

  // Course enrollment
  courseEnrollment: (data: { name: string; courseName: string; startDate: string; courseUrl: string }) => ({
    subject: `✅ You're enrolled in ${data.courseName}!`,
    html: `
      <div style="${baseStyles} max-width: 600px; margin: 0 auto;">
        <div style="padding: 40px; text-align: center; border-bottom: 2px solid #e5e7eb; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px;">Enrollment Confirmed!</h1>
        </div>
        <div style="padding: 40px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${data.name},</h2>
          <p style="font-size: 16px; color: #4b5563;">Great news! You're now enrolled in <strong>${data.courseName}</strong>.</p>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #e5e7eb;">
            <p style="margin: 0; color: #065f46;"><strong>Start Date:</strong> ${data.startDate}</p>
          </div>

          <h3 style="color: #1f2937;">What Happens Next:</h3>
          <ol style="color: #4b5563; padding-left: 20px;">
            <li>Access your course materials</li>
            <li>Complete the orientation module</li>
            <li>Join your cohort's study group</li>
            <li>Start learning!</li>
          </ol>

          <div style="text-align: center;">
            <a href="${data.courseUrl}" style="${buttonStyle}">
              Start Learning →
            </a>
          </div>
        </div>
      </div>
    `,
    text: `Hi ${data.name}, You're enrolled in ${data.courseName}! Start date: ${data.startDate}. Access at ${data.courseUrl}`,
  }),

  // Assignment due reminder
  assignmentReminder: (data: { name: string; assignmentName: string; courseName: string; dueDate: string; assignmentUrl: string }) => ({
    subject: `⏰ Reminder: ${data.assignmentName} due soon`,
    html: `
      <div style="${baseStyles} max-width: 600px; margin: 0 auto;">
        <div style="padding: 40px; text-align: center; border-bottom: 2px solid #e5e7eb; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px;">Assignment Reminder</h1>
        </div>
        <div style="padding: 40px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${data.name},</h2>
          <p style="font-size: 16px; color: #4b5563;">This is a friendly reminder about your upcoming assignment.</p>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #9a3412;"><strong>Assignment:</strong> ${data.assignmentName}</p>
            <p style="margin: 0 0 8px 0; color: #9a3412;"><strong>Course:</strong> ${data.courseName}</p>
            <p style="margin: 0; color: #9a3412;"><strong>Due:</strong> ${data.dueDate}</p>
          </div>

          <h3 style="color: #1f2937;">Don't forget to:</h3>
          <ul style="color: #4b5563; padding-left: 20px;">
            <li>Review the assignment requirements</li>
            <li>Complete all sections</li>
            <li>Submit before the deadline</li>
          </ul>

          <div style="text-align: center;">
            <a href="${data.assignmentUrl}" style="${buttonStyle}">
              View Assignment →
            </a>
          </div>
        </div>
      </div>
    `,
    text: `Hi ${data.name}, Reminder: ${data.assignmentName} is due on ${data.dueDate}. Submit at ${data.assignmentUrl}`,
  }),

  // Certificate issued
  certificateIssued: (data: { name: string; courseName: string; certificateUrl: string; linkedInUrl: string }) => ({
    subject: `🎉 Your ${data.courseName} Certificate is Ready!`,
    html: `
      <div style="${baseStyles} max-width: 600px; margin: 0 auto;">
        <div style="padding: 40px; text-align: center; border-bottom: 2px solid #e5e7eb; border-radius: 12px 12px 0 0;">
          <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
          <h1 style="color: white; margin: 0; font-size: 32px;">Congratulations!</h1>
        </div>
        <div style="padding: 40px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${data.name},</h2>
          <p style="font-size: 16px; color: #4b5563;">Congratulations on completing <strong>${data.courseName}</strong>!</p>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; color: #92400e; font-size: 18px; font-weight: 600;">Your certificate is now available for download</p>
          </div>

          <p style="color: #4b5563;">Share your achievement on LinkedIn to showcase your new skills to potential employers!</p>

          <div style="text-align: center;">
            <a href="${data.certificateUrl}" style="${buttonStyle}">
              Download Certificate →
            </a>
            <br/>
            <a href="${data.linkedInUrl}" style="${buttonStyle} background: #0077b5;">
              Share on LinkedIn →
            </a>
          </div>

          <div style="margin-top: 32px; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 0; color: #4b5563; font-size: 14px;">
              <strong>What's Next?</strong><br/>
              Continue your learning journey with our advanced courses or connect with our career services team for job placement support.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `Hi ${data.name}, Congratulations on completing ${data.courseName}! Download your certificate at ${data.certificateUrl}`,
  }),

  // Achievement unlocked
  achievementUnlocked: (data: { name: string; achievementName: string; achievementDescription: string; points: number; achievementsUrl: string }) => ({
    subject: `🏆 Achievement Unlocked: ${data.achievementName}`,
    html: `
      <div style="${baseStyles} max-width: 600px; margin: 0 auto;">
        <div style="padding: 40px; text-align: center; border-bottom: 2px solid #e5e7eb; border-radius: 12px 12px 0 0;">
          <div style="font-size: 64px; margin-bottom: 16px;">🏆</div>
          <h1 style="color: white; margin: 0; font-size: 32px;">Achievement Unlocked!</h1>
        </div>
        <div style="padding: 40px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${data.name},</h2>
          <p style="font-size: 16px; color: #4b5563;">You've unlocked a new achievement!</p>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
            <h3 style="margin: 0 0 8px 0; color: #92400e; font-size: 24px;">${data.achievementName}</h3>
            <p style="margin: 0 0 16px 0; color: #78350f;">${data.achievementDescription}</p>
            <div style="display: inline-block; padding: 8px 16px; background: #f3f4f6; color: #374151; border-radius: 20px; font-weight: 600;">
              +${data.points} Points
            </div>
          </div>

          <p style="color: #4b5563;">Keep up the great work and continue your learning journey!</p>

          <div style="text-align: center;">
            <a href="${data.achievementsUrl}" style="${buttonStyle}">
              View All Achievements →
            </a>
          </div>
        </div>
      </div>
    `,
    text: `Hi ${data.name}, You've unlocked the ${data.achievementName} achievement! +${data.points} points. View at ${data.achievementsUrl}`,
  }),

  // Job placement notification
  jobPlacement: (data: { name: string; jobTitle: string; company: string; salary: string; startDate: string }) => ({
    subject: `🎊 Congratulations on Your New Job!`,
    html: `
      <div style="${baseStyles} max-width: 600px; margin: 0 auto;">
        <div style="padding: 40px; text-align: center; border-bottom: 2px solid #e5e7eb; border-radius: 12px 12px 0 0;">
          <div style="font-size: 64px; margin-bottom: 16px;">🎊</div>
          <h1 style="color: white; margin: 0; font-size: 32px;">Congratulations!</h1>
        </div>
        <div style="padding: 40px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${data.name},</h2>
          <p style="font-size: 16px; color: #4b5563;">We're thrilled to hear about your new job placement!</p>

          <div style="background: #f9fafb; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Position:</strong> ${data.jobTitle}</p>
            <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Company:</strong> ${data.company}</p>
            <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Salary:</strong> ${data.salary}</p>
            <p style="margin: 0; color: #065f46;"><strong>Start Date:</strong> ${data.startDate}</p>
          </div>

          <p style="color: #4b5563;">Your success is our success! We're proud to have been part of your journey.</p>

          <div style="margin-top: 32px; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 0; color: #4b5563; font-size: 14px;">
              <strong>Stay Connected:</strong><br/>
              Join our alumni network and help inspire the next generation of learners by sharing your story!
            </p>
          </div>
        </div>
      </div>
    `,
    text: `Hi ${data.name}, Congratulations on your new job as ${data.jobTitle} at ${data.company}! Starting ${data.startDate} at ${data.salary}.`,
  }),

  // Weekly progress report
  weeklyProgress: (data: { name: string; coursesInProgress: number; lessonsCompleted: number; quizScore: number; studyStreak: number; dashboardUrl: string }) => ({
    subject: `📊 Your Weekly Progress Report`,
    html: `
      <div style="${baseStyles} max-width: 600px; margin: 0 auto;">
        <div style="padding: 40px; text-align: center; border-bottom: 2px solid #e5e7eb; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px;">Weekly Progress Report</h1>
        </div>
        <div style="padding: 40px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${data.name},</h2>
          <p style="font-size: 16px; color: #4b5563;">Here's a summary of your learning activity this week:</p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #92400e;">${data.coursesInProgress}</div>
              <div style="color: #78350f; font-size: 14px;">Courses in Progress</div>
            </div>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #1e40af;">${data.lessonsCompleted}</div>
              <div style="color: #1e3a8a; font-size: 14px;">Lessons Completed</div>
            </div>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #166534;">${data.quizScore}%</div>
              <div style="color: #14532d; font-size: 14px;">Avg Quiz Score</div>
            </div>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #991b1b;">${data.studyStreak}</div>
              <div style="color: #7f1d1d; font-size: 14px;">Day Streak</div>
            </div>
          </div>

          <p style="color: #4b5563;">Keep up the great work! Consistency is key to success.</p>

          <div style="text-align: center;">
            <a href="${data.dashboardUrl}" style="${buttonStyle}">
              View Full Dashboard →
            </a>
          </div>
        </div>
      </div>
    `,
    text: `Hi ${data.name}, Your weekly progress: ${data.coursesInProgress} courses, ${data.lessonsCompleted} lessons, ${data.quizScore}% avg score, ${data.studyStreak} day streak. View at ${data.dashboardUrl}`,
  }),
};

export default emailTemplates;
