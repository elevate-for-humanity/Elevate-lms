-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'billing', 'enrollment', 'program', 'general', 'urgent')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attachments TEXT[] DEFAULT '{}',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Messages Table (conversation thread)
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_staff BOOLEAN DEFAULT FALSE,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQ/Knowledge Base Table
CREATE TABLE IF NOT EXISTS support_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_articles ENABLE ROW LEVEL SECURITY;

-- Tickets: Users can see their own, staff can see all
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
  ));

CREATE POLICY "Anyone can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can update tickets"
  ON support_tickets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
  ));

-- Messages: Same as tickets
CREATE POLICY "Users can view ticket messages"
  ON support_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM support_tickets t 
    WHERE t.id = ticket_id 
    AND (t.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    ))
  ));

CREATE POLICY "Authenticated users can add messages"
  ON support_messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Articles: Public read, staff manage
CREATE POLICY "Public can read published articles"
  ON support_articles FOR SELECT
  USING (status = 'published');

CREATE POLICY "Staff can manage articles"
  ON support_articles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_articles_slug ON support_articles(slug);
CREATE INDEX IF NOT EXISTS idx_support_articles_category ON support_articles(category);

-- Grants
GRANT SELECT, INSERT ON support_tickets TO anon;
GRANT SELECT, INSERT, UPDATE ON support_tickets TO authenticated;
GRANT SELECT, INSERT ON support_messages TO authenticated;
GRANT SELECT ON support_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON support_articles TO authenticated;

-- Updated at trigger
CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER support_articles_updated_at
  BEFORE UPDATE ON support_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert FAQ articles
INSERT INTO support_articles (title, slug, content, excerpt, category, tags, status) VALUES
(
  'How to Apply for WIOA Funding',
  'how-to-apply-wioa-funding',
  '## What is WIOA?

The Workforce Innovation and Opportunity Act (WIOA) provides federal funding for job training programs. If you qualify, your entire training can be covered at no cost to you.

## Eligibility Requirements

You may qualify for WIOA funding if you meet one or more of these criteria:

**Income-Based Eligibility:**
- Your household income is below 70% of the Lower Living Standard Income Level (LLSIL)
- You receive public assistance (SNAP, TANF, SSI)

**Categorical Eligibility:**
- You are a veteran or spouse of a veteran
- You were recently laid off or received a layoff notice
- You are a displaced homemaker
- You have a disability
- You are an ex-offender
- You are homeless or at risk of homelessness
- You are a youth aged 16-24 who is out of school

## How to Apply

1. **Visit Indiana Career Connect** - Go to indianacareerconnect.com and create an account
2. **Complete Your Profile** - Fill out your work history, education, and goals
3. **Schedule an Appointment** - Book a meeting with a WorkOne career advisor
4. **Bring Required Documents** - ID, Social Security card, proof of income, proof of address
5. **Get Approved** - Your advisor will determine eligibility and issue a training voucher
6. **Enroll at Elevate** - Bring your voucher to us and start training!

## Timeline

The entire process typically takes 2-3 weeks from your first appointment to program start.

## Questions?

Contact us at (317) 314-3757 or email info@elevateforhumanity.org',
  'Learn how to apply for WIOA funding to cover 100% of your training costs.',
  'Enrollment',
  ARRAY['wioa', 'funding', 'financial aid', 'free training'],
  'published'
),
(
  'What Programs Does Elevate Offer?',
  'what-programs-does-elevate-offer',
  '## Our Training Programs

Elevate for Humanity offers career training in high-demand industries with strong job placement rates.

### Healthcare Programs
- **CNA (Certified Nursing Assistant)** - 4-6 weeks, prepare for state certification
- **Phlebotomy** - 8 weeks, learn blood draw techniques
- **Medical Assistant** - 12 weeks, clinical and administrative skills
- **Home Health Aide** - 2 weeks, in-home patient care

### Skilled Trades
- **HVAC Technician** - 20 weeks, heating and cooling systems
- **Electrical Apprenticeship** - Earn while you learn
- **Plumbing Basics** - 12 weeks, residential plumbing
- **Welding Fundamentals** - 16 weeks, MIG/TIG welding

### Technology
- **CompTIA A+** - 10 weeks, IT support certification
- **Cybersecurity Fundamentals** - 12 weeks, security basics
- **Web Development** - 16 weeks, full-stack development

### Business & Professional
- **Tax Preparation** - 8 weeks, become a tax preparer
- **Bookkeeping** - 10 weeks, QuickBooks certified
- **Project Management** - 8 weeks, PMP prep

### Transportation
- **CDL Class A** - 4 weeks, commercial truck driving
- **CDL Class B** - 3 weeks, bus and delivery vehicles

## Program Features

All programs include:
- Industry-recognized certifications
- Hands-on training
- Job placement assistance
- Career counseling
- Resume and interview prep

## How to Choose

Not sure which program is right for you? Schedule a free career consultation at (317) 314-3757.',
  'Explore our healthcare, skilled trades, technology, and business training programs.',
  'Programs',
  ARRAY['programs', 'training', 'careers', 'certifications'],
  'published'
),
(
  'How Long Are the Training Programs?',
  'how-long-are-training-programs',
  '## Program Duration

Our programs range from 2 weeks to 20 weeks depending on the career path.

### Quick-Start Programs (2-6 weeks)
- Home Health Aide: 2 weeks
- CNA: 4-6 weeks
- CDL Class A: 4 weeks
- CDL Class B: 3 weeks

### Standard Programs (8-12 weeks)
- Phlebotomy: 8 weeks
- Tax Preparation: 8 weeks
- CompTIA A+: 10 weeks
- Bookkeeping: 10 weeks
- Medical Assistant: 12 weeks
- Plumbing Basics: 12 weeks
- Cybersecurity: 12 weeks

### Extended Programs (16-20 weeks)
- Welding: 16 weeks
- Web Development: 16 weeks
- HVAC Technician: 20 weeks

## Class Schedules

We offer flexible scheduling:
- **Day Classes**: Monday-Friday, 8am-3pm
- **Evening Classes**: Monday-Thursday, 5pm-9pm
- **Weekend Classes**: Saturday 8am-4pm (select programs)

## Accelerated Options

Some programs offer accelerated tracks for students who can commit to full-time study.

Contact us to discuss which schedule works best for you.',
  'Find out how long each training program takes to complete.',
  'Programs',
  ARRAY['duration', 'schedule', 'timeline'],
  'published'
),
(
  'Is Training Really Free?',
  'is-training-really-free',
  '## Yes, Training Can Be 100% Free

Through WIOA (Workforce Innovation and Opportunity Act) funding, eligible students pay nothing for:
- Tuition and fees
- Books and study materials
- Tools and equipment
- Certification exams
- Uniforms (if required)

## Who Qualifies for Free Training?

You may qualify if you:
- Have low to moderate income
- Receive public assistance (SNAP, TANF, SSI)
- Are a veteran
- Were recently laid off
- Are a displaced homemaker
- Have a disability
- Are 16-24 and out of school

## What If I Don''t Qualify for WIOA?

We have other options:
- **Payment Plans**: Spread costs over 6-12 months
- **Employer Sponsorship**: Some employers pay for training
- **Scholarships**: Limited scholarships available
- **Partner Funding**: Other workforce programs may help

## Additional Support

WIOA can also cover:
- Transportation assistance
- Childcare support
- Work supplies and uniforms
- Certification exam fees

## Get Started

Check your eligibility at elevateforhumanity.org/wioa-eligibility or call (317) 314-3757.',
  'Learn how WIOA funding makes career training completely free for eligible students.',
  'Financial Aid',
  ARRAY['free', 'wioa', 'funding', 'cost'],
  'published'
),
(
  'How Do I Reset My Password?',
  'how-to-reset-password',
  '## Resetting Your Password

If you forgot your password or need to change it, follow these steps:

### From the Login Page

1. Go to elevateforhumanity.org/login
2. Click "Forgot Password?"
3. Enter your email address
4. Check your email for a reset link
5. Click the link and create a new password

### Password Requirements

Your new password must:
- Be at least 8 characters long
- Include at least one uppercase letter
- Include at least one number
- Include at least one special character (!@#$%^&*)

### Didn''t Receive the Email?

- Check your spam/junk folder
- Make sure you entered the correct email
- Wait a few minutes and try again
- Contact support if issues persist

### From Your Account Settings

If you''re already logged in:
1. Click your profile icon
2. Go to Settings
3. Select "Security"
4. Click "Change Password"
5. Enter your current password and new password

## Need Help?

Contact support at support@elevateforhumanity.org or call (317) 314-3757.',
  'Step-by-step instructions for resetting your account password.',
  'Account',
  ARRAY['password', 'login', 'account', 'security'],
  'published'
),
(
  'How to Access My Student Portal',
  'how-to-access-student-portal',
  '## Accessing Your Student Portal

The student portal is your hub for coursework, grades, schedules, and resources.

### First-Time Login

1. Go to elevateforhumanity.org/login
2. Enter the email you used during enrollment
3. If this is your first login, click "Set Password"
4. Check your email for a password setup link
5. Create your password and log in

### What You Can Do in the Portal

**Coursework**
- Access course materials and videos
- Submit assignments
- Take quizzes and exams
- View your grades

**Schedule**
- See your class schedule
- Book tutoring sessions
- Schedule career counseling

**Documents**
- Upload required documents
- Download certificates
- Access your transcript

**Career Services**
- Update your resume
- Search job listings
- Schedule mock interviews

### Mobile Access

The portal works on mobile devices. For the best experience, use Chrome or Safari.

### Trouble Logging In?

- Clear your browser cache
- Try a different browser
- Reset your password
- Contact support at (317) 314-3757',
  'Learn how to log in and navigate your student portal.',
  'Account',
  ARRAY['portal', 'login', 'student', 'access'],
  'published'
),
(
  'Job Placement Services',
  'job-placement-services',
  '## Our Job Placement Support

We don''t just train you—we help you get hired. Our career services team works with you from day one.

### What We Offer

**Resume Building**
- Professional resume writing
- LinkedIn profile optimization
- Cover letter templates
- Portfolio development

**Interview Preparation**
- Mock interviews with feedback
- Common question practice
- Industry-specific coaching
- Salary negotiation tips

**Job Search Support**
- Access to employer network
- Job board with exclusive listings
- Application tracking
- Referrals to hiring partners

**Career Counseling**
- One-on-one career planning
- Skills assessment
- Industry insights
- Long-term career mapping

### Our Employer Partners

We work with 100+ employers in Indianapolis including:
- Major healthcare systems
- HVAC and construction companies
- IT firms and tech startups
- Transportation and logistics companies
- Financial services firms

### Placement Rates

- 85% of graduates find employment within 90 days
- Average starting salary: $35,000-$55,000
- Many employers offer signing bonuses

### Get Started

Career services are included with all programs at no extra cost. Contact us at (317) 314-3757.',
  'Discover how our career services team helps you land a job after training.',
  'Career Services',
  ARRAY['jobs', 'placement', 'career', 'employment'],
  'published'
),
(
  'Contact and Support Hours',
  'contact-support-hours',
  '## How to Reach Us

### Main Office
**Address:** 3737 N Meridian St, Indianapolis, IN 46208

**Phone:** (317) 314-3757

**Email:** info@elevateforhumanity.org

### Office Hours
- Monday-Friday: 8:00 AM - 6:00 PM EST
- Saturday: 9:00 AM - 2:00 PM EST
- Sunday: Closed

### Support Response Times
- **Phone:** Immediate during business hours
- **Email:** Within 24 hours
- **Support Tickets:** Within 24-48 hours
- **Urgent Issues:** Same day response

### After-Hours Support

For urgent matters outside business hours:
- Submit a support ticket marked "Urgent"
- Leave a voicemail at (317) 314-3757
- Email support@elevateforhumanity.org with "URGENT" in subject

### Social Media
- LinkedIn: linkedin.com/company/elevate-for-humanity
- Facebook: facebook.com/elevateforhumanity
- YouTube: youtube.com/@elevateforhumanity

### Directions

We are located on North Meridian Street, easily accessible from I-465 and downtown Indianapolis. Free parking available.',
  'Find our contact information, office hours, and support response times.',
  'General',
  ARRAY['contact', 'hours', 'phone', 'email', 'location'],
  'published'
)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE support_tickets IS 'Customer support tickets';
COMMENT ON TABLE support_messages IS 'Messages within support tickets';
COMMENT ON TABLE support_articles IS 'FAQ and knowledge base articles';
