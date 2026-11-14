# CHAPTER 26: STUDENT DASHBOARD SPECIFICATION

## Business Purpose
The Student Dashboard is the central hub for every enrolled student. After login, students see their complete training status, next actions, and resources. The dashboard answers: "What do I need to do today?"

---

## LOGIN EXPERIENCE

### First-Time Login
```
FLOW:
1. Student receives email with magic link
2. Click link → Set password
3. Complete profile (photo, contact, emergency contact)
4. Watch 2-minute dashboard tour video
5. Acknowledge Student Handbook
6. Dashboard loads

PROMpts:
- "Welcome to Elevate! Let's set up your profile."
- "Tell us about yourself"
- "Upload a profile photo (helps instructors recognize you)"
- "Add an emergency contact"
- "Review and accept the Student Handbook"
```

### Returning Login
```
FLOW:
1. Enter email
2. Receive magic link (or enter password)
3. Dashboard loads

REDIRECT:
If mid-course, redirect to current lesson
If action required, highlight notification
```

---

## DASHBOARD LAYOUT

### Desktop Layout (Primary)
```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                      │
│ [Logo] [Search...] [Notifications 🔔] [Messages 💬] [👤]  │
├─────────┬───────────────────────────────────────────────────┤
│         │                                                    │
│  SIDE   │           MAIN CONTENT AREA                       │
│  NAV    │                                                   │
│         │  ┌─────────────────────────────────────────────┐ │
│ 📊 Home │  │ Welcome Banner + Today's Focus               │ │
│ 📚 My   │  └─────────────────────────────────────────────┘ │
│   Programs │                                                  │
│ 📝 Classes │  ┌──────────────────┐ ┌──────────────────────┐ │
│ 📋 My     │  │ Continue Learning │ │ Today's Schedule    │ │
│   Binder  │  └──────────────────┘ └──────────────────────┘ │
│ 🎓 My     │                                                  │
│   Certs   │  ┌─────────────────────────────────────────────┐ │
│ 💼 Career │  │ Progress Overview                           │ │
│   Prep   │  └─────────────────────────────────────────────┘ │
│ 💬 Support│                                                  │
│         │  ┌──────────────────┐ ┌──────────────────────┐ │
│         │  │ Apprenticeship   │ │ Funding Status      │ │
│         │  │ Hours           │ │                      │ │
│         │  └──────────────────┘ └──────────────────────┘ │
│         │                                                  │
│         │  ┌─────────────────────────────────────────────┐ │
│         │  │ Quick Actions                               │ │
│         │  └─────────────────────────────────────────────┘ │
├─────────┴───────────────────────────────────────────────────┤
│ FOOTER: [Help] [Accessibility] [Logout]                     │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────┐
│ ☰  [Logo]    🔔 👤 │
├─────────────────────┤
│                     │
│ Welcome + Focus     │
│                     │
│ Continue Learning   │
│                     │
│ Today's Schedule    │
│                     │
│ Progress Overview   │
│                     │
│ Apprenticeship      │
│                     │
│ Quick Actions       │
│                     │
├─────────────────────┤
│ 📊  📚  📋  🎓  💼 │
│ Home  My   Binder  Certs│
└─────────────────────┘
```

---

## HEADER SECTION

### Elements
```
LEFT:
- Elevate logo (links to homepage)
- Breadcrumb: Dashboard

CENTER:
- Global search bar
  Placeholder: "Search courses, lessons, assignments..."

RIGHT:
- Notifications bell (badge with count)
- Messages icon (badge with count)
- Profile dropdown:
  - My Profile
  - Settings
  - Help Center
  - Logout
```

### Notification Badge Logic
```
- If any urgent: Red badge "!"
- If new messages: Blue badge count
- If action required: Yellow badge "1"
```

---

## WELCOME BANNER

### Content
```
GREETING: "Welcome back, [First Name]!"
DATE: "Today is [Day, Month Date, Year]"

TODAY'S FOCUS (personalized):
IF deadline approaching:
  "Assignment due tomorrow: [Assignment Name]"
IF attendance required:
  "You have class at [Time] - [Location]"
IF apprenticeship hours needed:
  "You're [X] hours from your next milestone"
IF test upcoming:
  "State Board exam in [X] days"

MOTIVATIONAL QUOTE:
Rotating from Elevate quotes collection
Example: "Every day is a new opportunity to grow your skills."
```

### Visual
```
Background: Gradient brand colors
Photo: Student (if uploaded) or initials avatar
Action: Arrow pointing to top priority
```

---

## CONTINUE LEARNING WIDGET

### Display
```
HEADLINE: "Continue Where You Left Off"

COURSE CARD:
┌─────────────────────────────────────────────┐
│ [Course Thumbnail]                           │
│                                             │
│ Course Name: Barbering Fundamentals          │
│ Lesson: "Sanitation and Safety"              │
│                                             │
│ Progress: ████████░░░░░░░░░ 45%             │
│                                             │
│ [▶ Continue Learning]                        │
└─────────────────────────────────────────────┘
```

### Logic
```
Show most recent incomplete lesson
Order by:
1. Incomplete assignment due soon
2. Next lesson in sequence
3. Most recently accessed
```

---

## TODAY'S SCHEDULE WIDGET

### Display
```
HEADLINE: "Today's Schedule"

IF NO CLASSES TODAY:
"No classes scheduled today."
"Enjoy your day off!"
[Schedule button]

IF CLASSES TODAY:
┌─────────────────────────────────────────────┐
│ ⏰ 9:00 AM - Theory Class                   │
│    Room 101 | Instructor: Mr. Johnson         │
│    [Join Virtual] [Get Directions]           │
├─────────────────────────────────────────────┤
│ ⏰ 2:00 PM - Hands-On Practice              │
│    Shop B | Instructor: Ms. Williams         │
│    [Join Virtual] [Get Directions]           │
└─────────────────────────────────────────────┘

CALENDAR LINK: [View Full Calendar]
```

### Calendar View
```
Show month view in modal
Color coded:
- Theory = Blue
- Hands-on = Green
- Testing = Purple
- Appointments = Orange
```

---

## PROGRESS OVERVIEW WIDGET

### Student Progress Wheel
```
CIRCULAR PROGRESS showing overall completion

CENTER DISPLAY:
- [X]% Complete
- [X] courses remaining
- [X] certifications earned

OUTER RING:
- Theory: [X]%
- Practical: [X]%
- Apprenticeship: [X]%
```

### Metrics Grid
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📚 Theory    │ │ 🔧 Practical │ │ ⏰ Clocked   │
│ 65%         │ │ 45%          │ │ 1,250 hrs   │
│ [View]      │ │ [View]      │ │ [Log Hours] │
└──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📋 RTI Hours │ │ 🎯 DOL Comp. │ │ 📅 Attendance│
│ 40/200 hrs  │ │ 45/85       │ │ 92%         │
│ [View]      │ │ [View]      │ │ [View]      │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Tooltip Definitions
```
Theory: Hours spent on classroom instruction
Practical: Hands-on training hours
Clocked: Total apprenticeship hours worked
RTI: Related Technical Instruction hours
DOL Competencies: Required competency sign-offs
```

---

## APPRENTICESHIP HOURS WIDGET

### For Apprentices Only
```
DISPLAY:
┌─────────────────────────────────────────────┐
│ 🔨 Apprenticeship Progress                   │
│                                             │
│ Total Hours: 1,250 / 4,000                  │
│ ████████████░░░░░░░░░░░░░░░░░ 31%         │
│                                             │
│ Current Period: May 2024                     │
│ Hours This Period: 160 / 200                 │
│ ████████████████░░░░░░░░░░░░░░ 80%        │
│                                             │
│ Next Milestone: 1,500 hours                 │
│ Est. Completion: [Date]                     │
│                                             │
│ [Log Hours] [Submit Evaluation]              │
└─────────────────────────────────────────────┘
```

### Clock In/Out
```
BUTTON: [🔴 Clock In to Apprenticeship]
ON CLICK:
- Start shift timer
- Show clock-in confirmation
- Log location (if required)

AFTER CLOCK IN:
- Timer running at top
- [🔵 Clock Out] button
- "You're currently working at [Host Shop Name]"
```

### Milestone Celebrations
```
DISPLAY at milestones (500, 1000, 2000, 3000 hrs):
🎉 CONGRATULATIONS!
You've reached [X] hours!
[Share achievement] [View certificate]
```

---

## FUNDING STATUS WIDGET

### Display
```
HEADLINE: "Your Funding Status"

IF FUNDED:
┌─────────────────────────────────────────────┐
│ ✅ Funded by [Source]                        │
│                                             │
│ Remaining Balance: $2,450                   │
│ Used: $1,550 / $4,000                       │
│                                             │
│ Next Payment: [Date]                         │
│ Payment Status: Current                      │
│                                             │
│ [View Funding Details]                       │
└─────────────────────────────────────────────┘

IF SELF-PAY:
┌─────────────────────────────────────────────┐
│ 💳 Self-Pay Student                          │
│                                             │
│ Tuition Balance: $3,200                     │
│ Monthly Payment: $200                        │
│ Next Payment Due: [Date]                     │
│                                             │
│ [Make Payment] [View Payment Plan]           │
└─────────────────────────────────────────────┘

IF PAYMENT PLAN:
┌─────────────────────────────────────────────┐
│ 📅 Payment Plan Active                       │
│                                             │
│ Monthly Payment: $175                        │
│ Payments Remaining: 18                      │
│ Total Remaining: $3,150                     │
│                                             │
│ Auto-Pay: Enabled ✓                         │
│ Next Payment: [Date]                         │
│                                             │
│ [Make Early Payment] [Update Method]        │
└─────────────────────────────────────────────┘
```

### Funding Sources Supported
```
- WIOA (Workforce Ready Grant)
- Vocational Rehabilitation (VR)
- Employer Sponsorship
- GI Bill / VR&E
- Workforce Innovation Grant
- Custom employer arrangements
```

---

## QUICK ACTIONS WIDGET

### Action Buttons Grid
```
┌──────────────────────────────────────────────────────┐
│ QUICK ACTIONS                                        │
├──────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│ │ 📤 Upload  │ │ 📅 Schedule│ │ 💬 Message │        │
│ │ Assignment │ │  Meeting   │ │ Instructor │        │
│ └────────────┘ └────────────┘ └────────────┘        │
│                                                      │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│ │ 📸 Upload  │ │ 📝 Submit  │ │ 📞 Contact │        │
│ │ Portfolio  │ │ Evaluation │ │  Advisor   │        │
│ └────────────┘ └────────────┘ └────────────┘        │
└──────────────────────────────────────────────────────┘
```

### Upload Assignment
```
ON CLICK:
1. Open file picker
2. Accept: PDF, DOC, DOCX, images
3. Max size: 10MB
4. Show preview
5. Add notes field
6. Submit
7. Confirmation + email
```

### Schedule Meeting
```
OPTIONS:
- Instructor office hours
- Admissions counselor
- Career services
- Financial aid advisor

SLOTS:
- Calendar showing available times
- 30-minute default duration
- Video/in-person toggle
- Add to calendar integration
```

---

## DIGITAL STUDENT BINDER

### Section Access
```
┌──────────────────────────────────────────────────────┐
│ 📋 MY STUDENT BINDER                                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│ │ 📄 Documents │ │ 🎓 Certificates│ │ 📊 Records │  │
│ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                      │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│ │ 💼 Resume    │ │ 🖼️ Portfolio │ │ 📋 Evaluations│  │
│ └──────────────┘ └──────────────┘ └──────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Documents Tab
```
Uploaded Documents:
- Enrollment agreement
- Funding approval letter
- Class schedule
- Attendance records
- Disciplinary records
- Handbook acknowledgment

Actions:
- [Upload Document]
- [Download All]
- [Share with Employer]

Organization:
- Folder structure by category
- Search within binder
- Filter by type/date
```

### Certificates Tab
```
EARNED CERTIFICATES:
┌─────────────────────────────────────────────────────┐
│ 🎓 Barbering Fundamentals                            │
│ Issued: [Date]                                     │
│ Credential ID: XXX-XXXXX                           │
│ [View] [Download] [Share]                          │
└─────────────────────────────────────────────────────┘

PENDING CERTIFICATIONS:
- State Board Exam (Scheduled: [Date])
- OSHA 10-Hour (In Progress)
- First Aid/CPR (Required)
```

### Portfolio Tab
```
STUDENT PORTFOLIO:
┌─────────────────────────────────────────────────────┐
│ 📸 Upload Work Photos                               │
│                                                     │
│ Before/After Gallery:                               │
│ [Photo 1] [Photo 2] [Photo 3] [+]                  │
│                                                     │
│ Description: "Client haircut - layered cut"        │
│ Date: [Date]                                       │
│ Instructor Sign-off: [Name] ✓                      │
└─────────────────────────────────────────────────────┘

For Barbering Students:
- Haircut photos (before/after)
- Color treatments
- Styling variations
- Permit work (where applicable)

For HVAC Students:
- Equipment installation photos
- System diagnostics
- Tool identification
```

---

## MY CERTIFICATES WIDGET

### Credential Wallet
```
EARNED CREDENTIALS:
┌─────────────────────────────────────────────────────┐
│ 🎖️ Indiana Barber License #XXXXX                   │
│ Expires: [Date]                                     │
│ [Verify Online]                                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🎖️ EPA 608 Universal Certification                  │
│ Cert #: XXXXXXXX                                   │
│ Expires: Never                                     │
│ [Download PDF]                                     │
└─────────────────────────────────────────────────────┘

CREDENTIAL BADGE DISPLAY:
Shareable credential cards with:
- Credential name
- Issue date
- Expiration (if applicable)
- QR code for verification
- Digital badge (for LinkedIn)
```

---

## CAREER PREPARATION WIDGET

### Job Opportunities
```
HEADLINE: "Open Positions for [Program Name]"

┌─────────────────────────────────────────────────────┐
│ 💼 Great Clips - Stylist                           │
│ $18-25/hr + tips | Indianapolis | [X] miles away  │
│ [View Details] [Apply]                             │
└─────────────────────────────────────────────────────┘

FILTERS:
- Location
- Salary range
- Full-time/part-time
- Employer type

SAVED JOBS: [View All]
```

### Resume Builder
```
RESUME STATUS: [Draft] [Finalized]

BUILDER SECTIONS:
- Contact Information (from profile)
- Objective
- Education (auto-populated)
- Certifications (auto-populated)
- Experience
- Skills

ACTIONS:
- [Edit Resume]
- [Preview]
- [Download PDF]
- [Share with Employer]
- [Submit for Review]
```

### Interview Prep
```
UPCOMING INTERVIEWS:
None scheduled

RESOURCES:
- Common interview questions
- Dress for success guide
- Salary negotiation tips
- Thank you note templates

[Schedule Mock Interview]
```

---

## AI TUTOR WIDGET

### Display
```
HEADLINE: "AI Study Assistant"

┌─────────────────────────────────────────────────────┐
│ 🤖 Ask any question about your coursework:           │
│                                                     │
│ [What are the steps for a skin fade?]               │
│                                                     │
│ [Ask about sanitation procedures]                   │
│                                                     │
│ [Explain OSHA safety requirements]                  │
│                                                     │
│ [Generate practice quiz]                            │
└─────────────────────────────────────────────────────┘
```

### Capabilities
```
ANSWERS questions about:
- Course content
- Technical procedures
- Safety protocols
- Exam preparation

GENERATES:
- Practice quizzes
- Study guides
- Flashcards

SAVES conversation history
Links to relevant lessons
Escalates to human tutor if needed
```

---

## CALENDAR WIDGET

### Mini Calendar View
```
CURRENT WEEK DISPLAY:
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│     │ 📚  │     │ 📚  │ 📝  │     │     │
│     │ 9am │     │ 9am │ Test│     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

EVENT TYPES:
📚 = Class
📝 = Test/Exam
🎯 = Milestone
📅 = Appointment
🎉 = Event
```

### Integration
```
- Google Calendar sync
- Outlook sync
- Add to phone calendar
- Reminder notifications
```

---

## MESSAGES & COMMUNICATIONS

### Instructor Messages
```
UNREAD: 2 messages

┌─────────────────────────────────────────────────────┐
│ 📩 From: Mr. Johnson - Barbering 101               │
│ Re: Your fade technique                            │
│ Yesterday at 3:45 PM                               │
└─────────────────────────────────────────────────────┘

COMPOSE:
[New Message]
Recipient: [Dropdown - instructors, advisors, admin]
Subject: [Text field]
Body: [Rich text editor]
Attachments: [Upload]
[Send]
```

### Mentor Messages (Apprentices)
```
MENTOR COMMUNICATION:
- Direct message with assigned mentor
- Evaluation submission notifications
- Meeting reminders
```

### Employer Messages (Apprentices)
```
EMPLOYER COMMUNICATION:
- Messages from host shop supervisor
- Job opportunity notifications
- Schedule coordination
```

---

## NOTIFICATION CENTER

### Notification Types
```
🔔 REMINDERS:
- Assignment due tomorrow
- Class starting in 30 minutes
- Test scheduled next week
- Funding deadline approaching

📋 UPDATES:
- Grade posted
- Evaluation received
- Certificate earned
- New message

⚠️ ACTION REQUIRED:
- Complete enrollment forms
- Upload required documents
- Submit timesheet
- Acknowledge policy change
```

### Notification Preferences
```
SETTINGS:
[ ] Email notifications
[ ] SMS notifications
[ ] Push notifications
[ ] In-app notifications

FREQUENCY:
[ ] Immediate
[ ] Daily digest
[ ] Weekly digest
```

---

## ATTENDANCE TRACKING

### Current Attendance
```
OVERALL ATTENDANCE: 92%

MONTH: June 2024
Present: 22 days
Absent: 2 days
Tardy: 1 time

WARNING STATUS:
IF < 90%: "⚠️ Attendance below threshold"
IF < 85%: "🔴 Attendance at-risk"

MISSED CLASSES:
- June 15: Excused (Doctor's note ✓)
- June 22: Unexcused
```

### Make-Up Work
```
REQUIRED FOR ABSENCES:
- Theory: Complete lesson assignment
- Practical: Schedule makeup session
- Apprenticeship: Log hours on different day

[Request Make-Up Session]
[Submit Excuse Documentation]
```

---

## GRADUATION COUNTDOWN

### For Students Nearing Completion
```
HEADLINE: "You're Almost There!"

COUNTDOWN:
XX days until graduation

REQUIREMENTS CHECKLIST:
✅ 450 Theory Hours (Required: 450)
✅ 1,200 Practical Hours (Required: 1,200)
✅ 3,800 Apprenticeship Hours (Required: 4,000)
⏳ 15 DOL Competencies (Completed: 12/27)
✅ State Board Prep Course
⏳ State Board Exam (Scheduled)

NEXT ACTION: [Schedule State Board Exam]
```

### Graduation Info
```
GRADUATION CEREMONY:
Date: [Date]
Time: [Time]
Location: [Venue]
Dress Code: Business professional
+ Guest: [X] guests allowed

RSVP: [Complete RSVP]
```

---

## SETTINGS & PREFERENCES

### Profile Settings
```
EDITABLE FIELDS:
- Profile photo
- Phone number
- Email address
- Emergency contact
- Address
- Notification preferences
- Language preference

READ-ONLY:
- Student ID
- Program enrollment
- Funding status
- Start date
```

### Accessibility Settings
```
- Text size: [A-] [A] [A+]
- High contrast: [Toggle]
- Screen reader optimized: [Toggle]
- Reduce motion: [Toggle]
```

---

## STUDENT DASHBOARD - MOBILE EXPERIENCE

### Mobile Navigation
```
BOTTOM NAV BAR:
┌────┬────┬────┬────┬────┐
│ 📊 │ 📚 │ 📋 │ 🎓 │ 💼 │
│Home│My  │Binder│Cert│Jobs│
│    │Prog│    │s   │    │
└────┴────┴────┴────┴────┘

SWIPE GESTURES:
- Swipe right on card → Quick action
- Swipe left on card → Dismiss
- Pull down → Refresh
```

### Mobile-Specific Features
```
- Click-to-call floating button
- SMS advisor button
- Face ID / Touch ID login
- Push notifications
- Offline mode for downloaded content
```

---

## ANALYTICS EVENTS

### Track These Events
```
dashboard_view
continue_learning_click
schedule_view
schedule_appointment
clock_in
clock_out
assignment_upload
portfolio_upload
message_sent
notification_click
certificate_view
certificate_download
job_view
job_apply
resume_build
ai_tutor_question
funding_status_view
attendance_view
```

### User Properties
```
student_id
program_name
program_type (apprenticeship vs. traditional)
enrollment_status
funding_source
completion_percentage
graduation_eta
```

---

## ACCESSIBILITY REQUIREMENTS

### WCAG 2.1 AA
```
- All interactive elements keyboard accessible
- Focus indicators visible
- Screen reader labels for all widgets
- Color contrast 4.5:1 minimum
- Text resizable to 200%
- Reduced motion option
```

### Screen Reader Experience
```
STRUCTURE:
- Navigation landmark
- Main content landmark
- Complementary widgets
- Form labels

ANNOUNCEMENTS:
- Dashboard loaded
- X notifications
- New message
- Progress updates
```

---

## DEVELOPER IMPLEMENTATION CHECKLIST

### Core Features
```
[ ] Dashboard layout responsive
[ ] Side navigation functional
[ ] Header with search
[ ] Notification system
[ ] Message center
[ ] Profile dropdown
```

### Widgets
```
[ ] Welcome banner with personalization
[ ] Continue learning widget
[ ] Today's schedule widget
[ ] Progress overview wheel
[ ] Apprenticeship hours (conditional)
[ ] Clock in/out system
[ ] Funding status widget
[ ] Quick actions grid
[ ] Digital binder
[ ] Certificate wallet
[ ] Career prep widget
[ ] AI tutor chat
[ ] Calendar integration
[ ] Graduation countdown (conditional)
```

### Integrations
```
[ ] Supabase user data
[ ] Course progress sync
[ ] Attendance records
[ ] Payment records
[ ] Email notifications
[ ] SMS notifications
[ ] Calendar sync
```

---

## QA ACCEPTANCE CHECKLIST

### Functionality
```
[ ] Login flow works
[ ] First-time setup completes
[ ] All navigation links work
[ ] All widgets load data
[ ] Quick actions function
[ ] File uploads work
[ ] Messages send and receive
[ ] Calendar displays events
[ ] Clock in/out tracks time
[ ] AI chat responds
[ ] Settings save
```

### Student Types
```
[ ] Traditional student dashboard
[ ] Apprenticeship student dashboard
[ ] Funded student dashboard
[ ] Self-pay student dashboard
[ ] Near-graduation student dashboard
```

### Mobile
```
[ ] Responsive layout
[ ] Bottom navigation works
[ ] Swipe gestures function
[ ] Touch targets appropriate size
[ ] Performance acceptable
```

### Accessibility
```
[ ] Keyboard navigation complete
[ ] Screen reader tested
[ ] Color contrast passes
[ ] Focus order logical
```

---

*Last Updated: 2026-07-05*
*Status: SPECIFICATION COMPLETE*
