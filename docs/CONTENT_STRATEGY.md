# Elevate Content Strategy

## Core Principle
Every public page answers **5 questions within 15 seconds**:
1. What is this?
2. Who is it for?
3. Why should I care?
4. What outcome do I get?
5. What should I do next?

## Storytelling Formula
**Problem → Solution → Proof → Outcome → Action**

Works for: Students, Employers, Workforce Boards, VR Counselors, Government Agencies, Community Partners

---

## Page Templates

### Program Pages
1. Hero (headline, subheadline, CTAs, hero image)
2. Problem Section (pain points)
3. Solution Section (how Elevate solves it)
4. Program Overview Card (length, cost, funding, credential, delivery, pathway)
5. What You'll Learn (curriculum with icons)
6. Career Outcomes (titles, salary, demand, employers, advancement)
7. Funding Options (WIOA, WRG, Employer, Self-Pay, Payment Plans)
8. Student Success Stories (Before → Journey → Outcome)
9. Why Choose Elevate (differentiators)
10. CTA (Apply, Advisor, Check Funding)

### Employer Pages
1. Workforce Challenges
2. Solutions
3. Services
4. Apprenticeships
5. OJT Programs
6. Success Stories
7. Employer CTA

### Partner Pages
1. Who We Work With
2. How Partnerships Work
3. Benefits
4. Success Metrics
5. Partner Types
6. Contact CTA

### Testing Pages
1. Available Exams
2. Testing Process
3. Requirements
4. Pricing
5. Schedule Exam CTA
6. FAQ

### Store Pages
1. Problem
2. Product
3. Features
4. Benefits
5. What's Included
6. Testimonials
7. Purchase CTA

### About Page
1. Mission
2. Founder Story
3. Why We Exist
4. Community Impact
5. Programs
6. Outcomes
7. Future Vision

---

## Design Standards

### Hero Specifications
- Desktop: 1920 × 800 px (21:9)
- Left-aligned text
- CTA buttons below headline
- NO gradient overlays
- Content in 1400px safe area

### Image Dimensions
- Program Cards: 800 × 450 px (16:9)
- Program Detail Hero: 1600 × 600 px (8:3)
- Dashboard Cards: 400 × 225 px (16:9)
- Team Photos: 800 × 800 px (1:1)

### Spacing System
- Section spacing: 96px
- Card padding: 24px
- Grid gap: 24px
- Form fields: 24px vertical

### Max Width: 1400px

### Navigation (Target)
Programs | Funding | Students | Employers | Partners | Testing | Store | About | Apply

---

## Navigation Cleanup
REMOVE from header:
- AI Chat, AI Instructor, Impact Methodology, Transparency, Volunteer
- Videos, Webinars, Community Services, Government, Educator Hub, Testimonials

MOVE to: About section, Footer, Resources

---

## Design Violations to Fix

### Hero Overlays (Remove)
1. components/programs/VisualProgramTemplate.tsx:437 - Dark overlay on CTA section
2. components/programs/ProgramHero.tsx:57 - Text overlay on hero
3. components/home/AnimatedHomePage.tsx - Full gradient background

### Cards Without Images
All program cards MUST have real photos (no generic icons)

### Missing CTAs
All pages MUST have CTA (Apply, View Program, etc.)

### Price Positioning
Program pages should NOT lead with price - lead with program description first.
