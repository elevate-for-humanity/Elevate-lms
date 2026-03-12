// Run with: npx tsx scripts/seed-blog-posts.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const blogPosts = [
  {
    title: "From Unemployed to HVAC Technician: Marcus's Success Story",
    slug: "marcus-hvac-success-story",
    excerpt: "After losing his retail job during the pandemic, Marcus Thompson enrolled in our HVAC program. Within 6 months, he landed a $55,000/year position with full benefits.",
    content: `## The Challenge

Marcus Thompson, 34, had spent 8 years climbing the ladder in retail management. When COVID-19 hit Indianapolis in March 2020, his store closed permanently.

"I applied to over 200 jobs in three months," Marcus recalls. "Retail was dead, and I didn't have skills for anything else."

## Discovering a New Path

Marcus's unemployment counselor at WorkOne Indianapolis suggested WIOA-funded training. That's when he found Elevate for Humanity's HVAC Technician program.

"When I saw the job outlook—95% placement rate, average starting salary of $45,000—I knew I had to try."

## The Training Experience

Marcus enrolled in the 20-week HVAC program covering:
- Heating system installation and repair
- Air conditioning fundamentals
- Refrigeration principles
- EPA 608 certification preparation
- Customer service and job site safety

Through WIOA funding, Marcus paid nothing out of pocket—$0 tuition, $0 for tools, $0 for certification exams.

## The Results

Marcus completed training and passed his EPA 608 certification on the first attempt. Within two weeks, he had three job offers.

He accepted a position with ServiceMaster Climate Control:
- Starting salary: $52,000/year
- Full health, dental, and vision insurance
- Company vehicle and gas card
- 401(k) with 4% match

## One Year Later

Today, Marcus has been promoted to Lead Technician earning $58,000 annually.

"I went from unemployed and hopeless to having a real career with a future. Elevate for Humanity changed my life."

Ready to start your own success story? Apply now at /apply or call (317) 314-3757.`,
    featured_image_url: "/images/blog/hvac-success.jpg",
    tags: ["HVAC", "success story", "career change", "WIOA"],
    published: true,
    author_name: "Elevate for Humanity",
  },
  {
    title: "Understanding WIOA Funding: Your Complete Guide to Free Career Training",
    slug: "wioa-funding-complete-guide",
    excerpt: "WIOA funding can cover 100% of your training costs—tuition, books, certifications, even transportation. Learn who qualifies and how to apply.",
    content: `## What is WIOA?

The Workforce Innovation and Opportunity Act (WIOA) is the largest federal investment in workforce development. In Indiana alone, WIOA helps over 50,000 people each year access free job training.

## What Does WIOA Cover?

When you qualify, you pay nothing for:
- Tuition and fees (100% covered)
- Books and study materials
- Tools and equipment
- Certification exams
- Transportation assistance
- Childcare assistance while in training

## Who Qualifies?

You may qualify if you meet ANY of these criteria:

**Income-Based:**
- Household income below 70% of Lower Living Standard Income Level
- For a family of 4 in Indiana: approximately $52,000/year

**Categorical (income doesn't matter):**
- Receive public assistance (SNAP, TANF, SSI)
- Veteran or spouse of a veteran
- Laid off or received layoff notice
- Displaced homemaker
- Documented disability
- Ex-offender
- Homeless or at risk
- Youth aged 16-24 out of school
- Single parent
- Lack high school diploma/GED

## How to Apply

1. Visit indianacareerconnect.com and create a profile
2. Schedule appointment at WorkOne Indianapolis: (317) 684-2400
3. Bring: ID, Social Security card, proof of income, proof of address
4. Complete eligibility assessment (1-2 hours)
5. Receive ITA voucher and choose your program
6. Enroll at Elevate for Humanity and start training

**Timeline: 2-4 weeks from application to training start**

Check your eligibility at /wioa-eligibility or call (317) 314-3757.`,
    featured_image_url: "/images/blog/wioa-guide.jpg",
    tags: ["WIOA", "funding", "financial aid", "free training"],
    published: true,
    author_name: "Elevate for Humanity",
  },
  {
    title: "5 Highest-Paying Careers You Can Start in 6 Months or Less",
    slug: "highest-paying-careers-6-months",
    excerpt: "You don't need a 4-year degree to earn $50,000+. These five careers offer excellent salaries and can be started in weeks—not years.",
    content: `## The Myth of the 4-Year Degree

- 40% of college graduates are underemployed
- Average student loan debt: $37,000
- Many degree holders earn less than skilled tradespeople

The truth? Some of the best-paying careers require months of training—not years of debt.

## 1. HVAC Technician
- Training: 16-20 weeks
- Starting: $45,000-$55,000
- Top Earners: $75,000+

## 2. Commercial Truck Driver (CDL-A)
- Training: 4-8 weeks
- Starting: $50,000-$65,000
- Top Earners: $85,000+

## 3. Certified Nursing Assistant (CNA)
- Training: 4-6 weeks
- Starting: $32,000-$38,000
- Top Earners: $45,000+

## 4. IT Support Specialist (CompTIA A+)
- Training: 10-12 weeks
- Starting: $40,000-$50,000
- Top Earners: $70,000+

## 5. Phlebotomy Technician
- Training: 8-10 weeks
- Starting: $35,000-$42,000
- Top Earners: $50,000+

## Summary

| Career | Training | Starting Pay |
|--------|----------|--------------|
| HVAC | 20 weeks | $45,000 |
| CDL | 4-8 weeks | $50,000 |
| CNA | 4-6 weeks | $32,000 |
| IT Support | 10-12 weeks | $40,000 |
| Phlebotomist | 8-10 weeks | $35,000 |

All five are available at Elevate for Humanity with WIOA funding. Apply at /apply.`,
    featured_image_url: "/images/blog/careers.jpg",
    tags: ["careers", "salary", "training"],
    published: true,
    author_name: "Elevate for Humanity",
  },
  {
    title: "CNA vs. Medical Assistant: Which Healthcare Career is Right for You?",
    slug: "cna-vs-medical-assistant",
    excerpt: "Both CNAs and Medical Assistants are in high demand, but they're very different roles. Here's an honest comparison.",
    content: `## CNA (Certified Nursing Assistant)

**What CNAs Do:**
- Help patients with bathing, dressing, grooming
- Assist with mobility and transfers
- Take vital signs
- Provide emotional support

**Where:** Nursing homes, hospitals, home health

**Training:** 4-6 weeks

**Salary:** $30,000-$45,000

## Medical Assistant

**What MAs Do:**
- Take patient histories and vital signs
- Prepare patients for exams
- Administer medications
- Draw blood
- Schedule appointments
- Manage medical records

**Where:** Doctor's offices, clinics, urgent care

**Training:** 10-12 weeks

**Salary:** $34,000-$50,000

## Comparison

| Factor | CNA | MA |
|--------|-----|-----|
| Training | 4-6 weeks | 10-12 weeks |
| Starting Pay | $30,000 | $34,000 |
| Setting | Hospitals, nursing homes | Offices, clinics |
| Schedule | Shifts | Usually M-F daytime |
| Physical Demands | High | Moderate |

**Choose CNA if:** You want to start quickly, enjoy hands-on care, want to pursue nursing.

**Choose MA if:** You prefer daytime hours, like variety, want higher starting pay.

Both programs available at Elevate for Humanity with WIOA funding.`,
    featured_image_url: "/images/blog/healthcare-comparison.jpg",
    tags: ["CNA", "medical assistant", "healthcare"],
    published: true,
    author_name: "Elevate for Humanity",
  },
  {
    title: "Elevate Partners with Indiana Career Connect for Faster Enrollment",
    slug: "indiana-career-connect-partnership",
    excerpt: "Our expanded partnership means faster WIOA approvals and a smoother path from application to training.",
    content: `## What This Partnership Means

### Faster WIOA Approvals
- Pre-screening available online
- Priority scheduling for Elevate applicants
- Same-day eligibility decisions in many cases
- **New timeline: As fast as 5 business days**

### Co-Located Services
A WorkOne career advisor is now on-site at Elevate every Tuesday and Thursday:
- Complete WIOA eligibility at our location
- Meet with career counselors without a separate trip
- Start training the same week you're approved

## How to Get Started

**Option 1: Online**
1. Visit indianacareerconnect.com
2. Create your profile
3. Apply at /apply

**Option 2: In Person**
Visit us at 8888 Keystone Crossing, Suite 1300, Indianapolis
- Tuesdays and Thursdays for on-site WIOA eligibility

**Option 3: Call**
(317) 314-3757

Don't let paperwork stand between you and your new career.`,
    featured_image_url: "/images/blog/partnership.jpg",
    tags: ["partnership", "Indiana Career Connect", "WorkOne"],
    published: true,
    author_name: "Elevate for Humanity",
  },
];

async function seedBlogPosts() {
  console.log('Seeding blog posts...');
  
  for (const post of blogPosts) {
    const { data, error } = await supabase
      .from('blog_posts')
      .upsert({
        ...post,
        published_at: new Date().toISOString(),
      }, {
        onConflict: 'slug',
      });
    
    if (error) {
      console.error(`Error inserting ${post.slug}:`, error.message);
    } else {
      console.log(`✅ Inserted: ${post.title}`);
    }
  }
  
  console.log('Done seeding blog posts.');
}

seedBlogPosts();
