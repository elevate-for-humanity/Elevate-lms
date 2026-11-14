# CHAPTER 1: HOMEPAGE SPECIFICATION

## Business Purpose
The homepage is the primary entry point for all user types:
- Unemployed individuals seeking career transformation
- Underemployed workers seeking skill upgrades
- Employers seeking workforce pipeline
- Government agencies seeking program data
- Partners seeking collaboration
- Testing candidates seeking certification

The homepage must immediately answer: "Can Elevate help me get a job and how much will it cost?"

---

## HERO SECTION

### Primary Hero Banner
**Visual:** Full-width video background showing:
- Students in active training (barbering, HVAC, medical assisting)
- Apprentices working in real workplaces
- Graduates receiving certifications
- Employer hiring celebrations
- Indianapolis skyline with diverse workforce

**Video Specs:**
- Length: 60 seconds, auto-muted, loop
- Mobile: Static fallback image
- Captions available in English and Spanish

**Hero Copy:**
```
HEADLINE: "From Unemployed to Employed"

SUBHEADLINE: "Earn industry certifications, gain real skills, and land a career—no upfront cost for qualifying individuals. Elevate for Humanity trains Indiana's workforce."

PRIMARY CTA: [Get Started - Apply Now]
SECONDARY CTA: [Check Funding Eligibility]
TERTIARY CTA: [Watch How It Works]

HERO VIDEO TRANSCRIPT (accessible):
Voiceover: "At Elevate for Humanity, we believe everyone deserves a pathway to meaningful employment. Our programs combine classroom instruction with hands-on apprenticeship, giving you the skills employers demand. Whether you're starting fresh or upgrading your career, we're here to guide you every step of the way."
```

### Below Hero - Funding Banner (Sticky for first scroll)
```
BANNER: "Don't Pay Tuition Upfront — Check Your Eligibility"
SUBTEXT: "Many students qualify for WIOA funding, Vocational Rehabilitation, or employer sponsorship. See if you qualify in 60 seconds."
CTA: [Check Eligibility Now] → Links to /check-eligibility
```

### WorkOne Integration Banner
```
BANNER: "WorkOne Indiana Partner"
SUBTEXT: "Elevate is an approved WorkOne Indiana training provider. Workforce Development Boards refer participants for funded training."
LINK: [Learn about WIOA Funding] → /funding/wioa
TRUST BADGE: WorkOne Indiana Approved Provider
```

### Vocational Rehabilitation Banner
```
BANNER: "Vocational Rehabilitation Partner"
SUBTEXT: "VR participants may qualify for full tuition coverage and additional support services."
LINK: [VR Funding Details] → /funding/vocational-rehabilitation
TRUST BADGE: VR Approved Training Provider
```

---

## TRUST BAR (Logos)

Display logos with equal sizing:

**Government Partners:**
- Indiana Department of Workforce Development (DWD)
- WorkOne Indianapolis
- Marion County Workforce Development Board
- Indiana Vocational Rehabilitation

**Testing Providers:**
- PSI (testing center partner)
- State Board of Barber Examiners
- State Board of Cosmetology
- EPA (for HVAC certification)

**Employer Partners:**
- Great Clips
- Sport Clips
- Supercuts
- Local HVAC companies
- Healthcare facilities

**Accreditations:**
- ACCSC (if applicable)
- BBB Accredited
- Indiana State Board approval badges

**Logo Display Rules:**
- Grayscale on load, color on hover
- Equal height sizing
- Infinite scroll animation (slow)
- Alt text for accessibility
- Links to partner verification pages

---

## GET STARTED JOURNEY SELECTOR

**Section Title:** "How Can We Help You Today?"

### Journey Cards (4 options)

**Card 1: I'm Looking for a Career**
```
ICON: Briefcase
HEADLINE: "Start My Career Journey"
SUBTEXT: "Explore programs, check funding eligibility, and apply for training."
BUTTON: [Explore Programs] → /programs
AUDIENCE: Unemployed, underemployed, career changers
```

**Card 2: I Need Funding Help**
```
ICON: DollarSign
HEADLINE: "Check My Funding Options"
SUBTEXT: "WIOA, VR, employer sponsorship, or payment plans—we'll help you find what you qualify for."
BUTTON: [Check Eligibility] → /check-eligibility
AUDIENCE: Anyone concerned about tuition cost
```

**Card 3: I'm an Employer**
```
ICON: Building2
HEADLINE: "Build Your Workforce"
SUBTEXT: "Hire apprenticeship graduates, sponsor employee training, or post job opportunities."
BUTTON: [Partner With Us] → /partners/employers
AUDIENCE: Business owners, HR departments, workforce managers
```

**Card 4: I'm a Government/Agency Partner**
```
ICON: Landmark
HEADLINE: "Partner with Elevate"
SUBTEXT: "Refer participants, access program data, or build custom workforce solutions."
BUTTON: [Agency Portal] → /partners/government
AUDIENCE: WorkOne, VR, workforce boards, economic development
```

---

## AI CAREER ADVISOR ENTRY POINT

**Section Title:** "Not Sure Where to Start? Let Our AI Help."

**Widget Display:**
```
HEADLINE: "Find Your Perfect Career Match"
SUBTEXT: "Answer 5 quick questions and our AI will recommend the best program for your goals."

CHAT INTERFACE:
AI: "Hi! I'm your Elevate career advisor. I'm here to help you find the right path. What brings you here today?"

OPTIONS:
- I want to earn money while I learn
- I need help paying for training
- I want to get certified quickly
- I need a job immediately
- I'm unsure what career fits me

FOLLOW-UP QUESTIONS (based on selection):
- What's your current employment status?
- Do you have any certifications already?
- What kind of work environment do you prefer?
- Are you open to apprenticeship programs?
- What's your ideal salary range?

OUTPUT:
- Top 3 recommended programs
- Funding eligibility estimate
- Next steps to take
- Link to apply
```

**Technical Requirements:**
- Conversational AI interface
- Save conversation for follow-up
- Link to human admissions counselor
- Fallback to /check-eligibility quiz
- Spanish language option

---

## PROGRAM SEARCH

**Section Title:** "Find Your Program"

**Search Features:**
```
SEARCH BAR:
Placeholder: "Search programs (e.g., 'barber', 'HVAC', 'medical assistant')"
Live suggestions as user types
Recent searches saved

FILTER OPTIONS:
- Category: Trades, Healthcare, Technology, Business
- Format: In-person, Apprenticeship, Hybrid
- Duration: < 3 months, 3-6 months, 6-12 months
- Funding Available: WIOA, VR, Employer Paid, Self-Pay
- Location: Indianapolis, Remote, Statewide
- Start Date: This month, Next month, Rolling admissions

SORT BY:
- Most Popular
- Highest Salary Potential
- Quickest Completion
- Lowest Cost
```

**Featured Programs Grid (6 cards):**

**Card Template:**
```
IMAGE: Program-specific hero image
BADGE: "Most Popular" or "New" or "Apprenticeship"
TITLE: Program name (e.g., "Barbering Registered Apprenticeship")
SHORT DESC: 1 sentence value proposition
DURATION: "12-month program"
FORMAT: "Earn while you learn"
SALARY: "Start at $14/hr → $35/hr after certification"
FUNDING: "WIOA Eligible ✓"
CTA: [Learn More] → /programs/[slug]
```

**Programs to Feature:**
1. Barbering Registered Apprenticeship
2. HVAC Technician Training
3. Medical Assistant Certificate
4. Commercial Driver's License (CDL)
5. Cosmetology Apprenticeship
6. Phlebotomy Technician

---

## TUITION & FUNDING SECTION

**Section Title:** "We Believe Cost Shouldn't Stop Your Career"

### Quick Eligibility Check
```
HEADLINE: "Do You Qualify for Free Training?"
SUBTEXT: "Most of our students pay $0 upfront. Check your eligibility in 60 seconds."

FORM (inline):
- ZIP Code: [____]
- Employment Status: [Unemployed / Employed / Other]
- Household Size: [1-10+]
- Annual Income: [$0 / Under $40K / $40-75K / Over $75K]

RESULT DISPLAY:
IF LIKELY QUALIFY:
"Your household likely qualifies for WIOA funding!"
[Apply Now] [Learn More]
ELSE:
"You may qualify for payment plans or employer sponsorship."
[Explore Payment Options] [Schedule Consultation]
```

### Funding Sources Explained
```
TABS:
1. WIOA Funding
2. Vocational Rehabilitation
3. Employer Sponsorship
4. Payment Plans
5. Military Benefits

CONTENT PER TAB:
- Eligibility requirements
- Coverage amount
- Application process
- Success rate
- Student testimonials
- FAQ
```

---

## BNPL / TUITION CALCULATOR

**Section Title:** "Know Your Payment Options"

**Calculator Display:**
```
HEADLINE: "Calculate Your Monthly Payments"

INPUTS:
Program: [Dropdown - all programs]
Tuition: $[Auto-filled from program]
Down Payment: $[Slider 0-50%]
Term Length: [6 / 12 / 18 / 24 months]
Funding Received: $[If any grant/scholarship]

OUTPUT:
Monthly Payment: $XXX/month
Total Interest: $XX
Total Cost: $X,XXX
vs. Average Starting Salary: $XX,XXX

COMPARISON:
"With your certification, you'll earn $X,XXX more per year than before."
"Payoff time: X months"

CTA: [Apply for This Program] [Explore Other Programs]
```

### Payment Plan Partners Display
```
BADGES: Sezzle, Afterpay, Klarna (if integrated)
DISCLAIMER: "Subject to credit approval. Rates vary."
```

---

## SALARY ROI CALCULATOR

**Section Title:** "See Your Return on Investment"

**Calculator Display:**
```
HEADLINE: "How Much More Could You Earn?"

INPUTS:
Current Status: [Unemployed / Minimum Wage / $X/hr]
Program Interest: [Dropdown]
Years in Program: [Auto-filled]

OUTPUT:
Before Training: $XX,XXX/year
After Certification: $XX,XXX/year
Annual Increase: +$XX,XXX/year
5-Year Lifetime Gain: +$XXX,XXX

VISUAL: Animated counter showing salary growth

COMPARISON:
"Invest in yourself: $X,XXX tuition → $XX,XXX annual raise"
"ROI: XXX% over 5 years"

CTA: [Calculate for My Program] [Apply Now]
```

---

## STUDENT SUCCESS METRICS

**Section Title:** "Real Results for Real People"

**Statistics Display (Animated Counters):**
```
STUDENTS ENROLLED: [XXXX]
GRADUATES PLACED: [XX%]
AVERAGE STARTING SALARY: $XX,XXX
PROGRAMS OFFERED: [XX]
PARTNER EMPLOYERS: [XXX]
YEARS IN OPERATION: [XX]
```

**Visual Representation:**
- Animated progress bars
- Before/after salary comparisons
- Employment timeline charts
- Certification completion rates

---

## TESTIMONIALS SECTION

**Section Title:** "From Our Graduates"

**Testimonial Cards (Carousel):**

**Card Template:**
```
PHOTO: Student/Graduate headshot (real photos, not stock)
NAME: "[First Name] [Last Initial]."
PROGRAM: "Barbering Apprenticeship, Class of 2024"
QUOTE: "3-4 sentence testimonial focusing on:
- Career transformation story
- Funding experience
- Job placement success
- Instructor impact"

BEFORE/AFTER:
Before Elevate: "Unemployed for 6 months"
After Elevate: "Employed at [Employer], $18/hr + tips"

VIDEO OPTION:
Play button → Modal with 60-second video testimonial

CTA: [Watch More Stories] → /success-stories
```

**Diversity Requirement:**
- Include representation from all program types
- Include various demographics (age, background, barriers)
- Include WIOA, VR, and self-pay students
- Include employer testimonials alongside student testimonials

---

## EMPLOYER SPOTLIGHT

**Section Title:** "Our Graduates Get Hired"

**Employer Logos:**
```
DISPLAY: 6-8 employer logos with hover reveal of details
```

**Featured Employer Card:**
```
EMPLOYER: Great Clips (example)
LOGO: Large display
QUOTE: "Elevate graduates are job-ready on day one. The apprenticeship model gives us skilled barbers who understand professional standards."
CONTACT: "[Employer Name] is hiring! View openings →"
CTA: [View All Hiring Partners] → /employers
```

**Employer Hiring Section:**
```
HEADLINE: "Employers Trust Elevate"
SUBTEXT: "Our apprenticeship programs train workers to YOUR standards."

WHY EMPLOYERS CHOOSE ELEVATE:
- Pre-screened candidates
- Customized training
- Real workplace experience
- Industry certifications
- Ongoing support

CTA: [Post a Job] [Become a Host Shop] [Learn More]
```

---

## WORKFORCE PARTNER LOGOS

**Section Title:** "Supported By"

**Partner Categories:**
```
Government:
- Indiana DWD
- WorkOne Indy
- Marion County WDB
- Indiana VR

Industry:
- Barbering associations
- HVAC associations
- Healthcare systems

Community:
- United Way
- Community foundations
- Social services
```

---

## INTERACTIVE CAREER PATHWAYS

**Section Title:** "Build Your Career Path"

**Visual:**
```
CAREER MAP showing progression:
Entry Level → Training → Certification → Employment → Advancement

EXAMPLE PATHWAYS:

PATH 1: Barbering
No Experience → Barber School (6 mo) → State Board Exam → Apprentice → Licensed Barber → Master Barber → Salon Owner

PATH 2: HVAC
No Experience → HVAC Training (6 mo) → EPA 608 Cert → Entry HVAC → Journeyman → Master → Contractor

PATH 3: Medical Assistant
No Experience → MA Program (4 mo) → Cert Exam → MA → CMA → Office Manager
```

**Interactive Elements:**
- Click pathway step → Show details, requirements, salary
- Select current situation → Show recommended starting point
- Download career roadmap PDF

---

## FEATURED APPRENTICESHIP SPOTLIGHT

**Section Title:** "Earn While You Learn"

**Featured Apprenticeship Card:**
```
PROGRAM: Barbering Registered Apprenticeship
HEADLINE: "Get Paid to Become a Barber"

WHY APPRENTICESHIP:
- Earn $14-18/hr while training
- 4000+ hours hands-on experience
- State certification upon completion
- Job placement assistance

HOW IT WORKS:
1. Apply to program (Free)
2. Get matched with host shop
3. Work and learn (12-18 months)
4. Pass state board exam
5. Become licensed barber

STAT: "95% of our apprentices are hired by their host shop"

CTA: [Learn About Apprenticeships] → /apprenticeships
CTA: [Apply Now] → /apply/apprenticeship
```

---

## WHY CHOOSE ELEVATE

**Section Title:** "Why Elevate for Humanity?"

**Value Propositions (6 cards):**

**Card 1: Government Funded Options**
```
ICON: Building
HEADLINE: "Many Pay Nothing"
DESC: "WIOA, VR, and employer programs may cover your full tuition."
```

**Card 2: Apprenticeship Model**
```
ICON: GraduationCap
HEADLINE: "Earn While You Learn"
DESC: "Real jobs, real pay, real experience while you train."
```

**Card 3: Industry Certifications**
```
ICON: Award
HEADLINE: "Job-Ready Credentials"
DESC: "State licenses, EPA certifications, and employer-recognized certificates."
```

**Card 4: Career Support**
```
ICON: Briefcase
HEADLINE: "Job Placement Help"
DESC: "Resume help, interview prep, and employer connections."
```

**Card 5: Flexible Schedule**
```
ICON: Clock
HEADLINE: "Training That Fits"
DESC: "Day, evening, and weekend options to match your life."
```

**Card 6: Local Focus**
```
ICON: MapPin
HEADLINE: "Indianapolis-Based"
DESC: "Training designed for Indiana employers and Indiana careers."
```

---

## CALLS TO ACTIONS PLACEMENT

**Sticky Mobile CTA Bar:**
```
POSITION: Bottom of screen, sticky
DISPLAY: [Text Admissions] [Call Now] [Apply Now]
HIDE: After user scrolls past hero
SHOW: When user scrolls up or after 10 seconds idle
```

**Inline CTAs Throughout Page:**
- After hero → [Apply Now]
- After funding section → [Check Eligibility]
- After program search → [View All Programs]
- After testimonials → [Apply Now]
- After employer section → [Partner With Us]

---

## FOOTER STRUCTURE

**Column 1: Programs**
```
- Barbering
- HVAC
- Medical Assistant
- CNA
- CDL
- Phlebotomy
- Cosmetology
- View All Programs →
```

**Column 2: Funding**
```
- WIOA Funding
- Vocational Rehabilitation
- Employer Sponsorship
- Payment Plans
- Military Benefits
- Check Eligibility →
```

**Column 3: For Employers**
```
- Hire Our Graduates
- Become a Host Shop
- Sponsor Training
- Post a Job
- Employer Login →
```

**Column 4: About**
```
- Our Mission
- Success Stories
- Blog
- Contact Us
- About Elevate →
```

**Footer Bottom:**
```
CREDENTIAL VERIFICATION LINK: [Verify Credentials]
PRIVACY POLICY | TERMS | ACCESSIBILITY
© 2024 Elevate for Humanity | EIN: XX-XXXXXXX
```

---

## SEO CONTENT

### Meta Tags
```
Title: "Elevate for Humanity | Workforce Training, Apprenticeships & Funding — Indianapolis"
Description: "Get free or funded career training in Indianapolis. Earn certifications in barbering, HVAC, medical assisting, and more. WIOA and VR funding available."
Keywords: workforce training, Indianapolis, barber school, HVAC training, medical assistant program, WIOA funding, apprenticeship, career training
```

### Schema Markup
```json
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Elevate for Humanity",
  "description": "Workforce development and career training organization",
  "url": "https://www.elevateforhumanity.org",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Indianapolis",
    "addressRegion": "IN",
    "addressCountry": "US"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Career Training Programs",
    "itemListElement": [...]
  }
}
```

### FAQ Schema
```
Questions:
- "What is WIOA funding?"
- "How do I qualify for free training?"
- "How long is the barber apprenticeship?"
- "What certifications can I earn?"
- "Do you help with job placement?"
```

### Local Business Schema
```
Include Indianapolis-specific local business markup
Hours, phone, address, service area
```

---

## INTERNAL LINKING STRUCTURE

**Links from Homepage to:**
```
/programs → Program listing
/programs/barbering → Individual program pages
/apprenticeships → Apprenticeship hub
/funding → Funding hub
/funding/wioa → WIOA details
/check-eligibility → Eligibility quiz
/partners → Partner hub
/partners/employers → Employer info
/about → About page
/success-stories → Testimonials
/blog → Blog
/contact → Contact
/portals → Login portals
/apply → Application
/testing → Testing center info
/store → Merchandise
```

---

## MOBILE EXPERIENCE

### Responsive Breakpoints
```
Desktop: 1280px+
Tablet: 768px - 1279px
Mobile: < 768px
```

### Mobile-Specific Elements
- Hamburger menu with full navigation
- Sticky bottom CTA bar
- Swipeable testimonial carousel
- Collapsible FAQ sections
- Touch-friendly calculator inputs
- Mobile-optimized video (no autoplay)
- Click-to-call buttons prominent
- SMS/text admission button

### Performance Targets
```
LCP: < 2.5s
FID: < 100ms
CLS: < 0.1
```

---

## ANALYTICS EVENTS

### Track These Events
```
page_view (homepage)
hero_cta_click (Apply Now)
hero_cta_click (Check Eligibility)
funding_banner_click
program_search
program_filter
calculator_open (BNPL)
calculator_open (ROI)
calculator_result_viewed
testimonial_view
employer_logo_click
chatbot_opened
chatbot_message_sent
cta_sticky_click
video_play
scroll_depth (25%, 50%, 75%, 100%)
```

### User Properties
```
user_type: [visitor, applicant, student, graduate, employer, partner]
funding_interest: [wioa, vr, employer, self]
program_interest: [category]
location: [zip_code]
```

---

## ACCESSIBILITY

### WCAG 2.1 AA Compliance
```
- Color contrast 4.5:1 minimum
- Focus indicators visible
- Alt text on all images
- Video captions
- Screen reader navigation
- Keyboard navigation
- Skip to content link
- ARIA labels on interactive elements
```

### Accessibility Controls Widget
```
LOCATION: Floating button, bottom-right
OPTIONS:
- Text size adjustment (A- A A+)
- High contrast mode
- Reduced motion
- Font selection (sans-serif/serif)
- Reading mode
```

---

## LANGUAGE SUPPORT

### Translations
```
Primary: English
Secondary: Spanish (toggle in header)
```

### Translation Scope
```
- All navigation
- Hero section
- Key CTAs
- Funding information
- Application forms
- FAQs
- Calculator labels
```

---

## DEVELOPER IMPLEMENTATION CHECKLIST

### Code Requirements
```
Hero video implemented with fallback
Funding banner sticky behavior
WorkOne/VR banners displayed
Trust bar with infinite scroll animation
Journey selector cards functional
AI chat widget integrated
Program search with live filters
BNPL calculator functional
ROI calculator functional
Eligibility quiz embedded
Testimonial carousel with video option
Employer spotlight cards
Career pathway visualization
Sticky mobile CTA bar
Footer with all links
Schema markup complete
SEO meta tags optimized
Analytics events firing
Accessibility controls working
Mobile responsive verified
```

### API Routes Required
```
/api/programs/search
/api/eligibility/check
/api/calculators/bnpl
/api/calculators/roi
/api/analytics/track
/api/chat/message
```

---

## QA ACCEPTANCE CHECKLIST

### Functionality
```
Homepage loads in < 3 seconds
Hero video plays (or graceful fallback)
All 4 journey cards navigate correctly
Program search returns results
Filters narrow results correctly
BNPL calculator produces accurate results
ROI calculator produces accurate results
Eligibility quiz completes and shows results
Testimonial carousel navigates
Video testimonials play in modal
Mobile menu opens/closes
Sticky CTA bar appears/disappears correctly
All internal links work
All external links (WorkOne, VR) work
Footer links all functional
Language toggle switches content
Accessibility controls adjust page
```

### Content Verification
```
All copy is final (no placeholder text)
All images are real (no stock placeholder)
All phone numbers are real
All addresses are correct
All social links are real accounts
All partner logos have permission
All testimonials have consent
All videos have captions
```

### SEO Verification
```
Title tag correct
Meta description correct
Schema validates
Canonical URL set
Sitemap includes page
Robots.txt allows crawling
Core Web Vitals pass
```

### Accessibility Verification
```
Screen reader navigates correctly
Keyboard navigation works
Focus order logical
Color contrast passes
Video captions present
Alt text on images
ARIA labels present
```

---

*Last Updated: 2026-07-05*
*Status: SPECIFICATION COMPLETE - Awaiting Development*
