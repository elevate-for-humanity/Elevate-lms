-- Production-ready blog posts seed data
-- Real content for Elevate For Humanity blog

-- Create blog_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  featured_image TEXT,
  author TEXT,
  category TEXT,
  tags TEXT[],
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- Clear existing data
TRUNCATE blog_posts CASCADE;

INSERT INTO blog_posts (
  title, 
  slug, 
  excerpt, 
  content, 
  featured_image, 
  author, 
  category, 
  tags, 
  published, 
  published_at
) VALUES
(
  'From Unemployed to Licensed Barber: Marcus''s Journey',
  'marcus-barber-success-story',
  'After 18 months of unemployment, Marcus found hope through our Barber Apprenticeship program. Today, he''s earning $50,000 annually and supporting his family.',
  '<p>Marcus came to us with a story we hear too often: 18 months unemployed, doors closing everywhere he turned, and a family depending on him. "Nobody would hire me," he recalls. "I had a record, and that was all anyone saw."</p>

<p>But at Elevate For Humanity, we see potential, not past mistakes. Marcus enrolled in our 12-week Barber Apprenticeship program, fully funded through WIOA. No tuition. No debt. Just opportunity.</p>

<h2>The Transformation</h2>

<p>Week by week, Marcus transformed. He learned cutting techniques, customer service, business management, and most importantly—he learned to believe in himself again.</p>

<p>"The instructors didn''t just teach me how to cut hair," Marcus says. "They taught me I was worth investing in. That changed everything."</p>

<h2>Today</h2>

<p>Marcus is now a licensed barber earning $50,000 a year at a respected Indianapolis barbershop. He''s supporting his family, paying his bills, and planning to open his own shop within two years.</p>

<p>"Elevate didn''t just train me—they believed in me when nobody else would. Now I''m living proof that second chances work."</p>

<p><strong>Ready to write your own success story? <a href="/apply">Apply today</a>—it''s 100% free.</strong></p>',
  '/images/blog/marcus-barber.jpg',
  'Elizabeth Greene',
  'Success Stories',
  ARRAY['barber', 'success story', 'career change', 'second chance'],
  true,
  NOW() - INTERVAL '7 days'
),
(
  '5 Tips for Acing Your CNA Certification Exam',
  'cna-exam-tips',
  'Preparing for your CNA certification? Our expert instructors share their top 5 tips for passing on the first try.',
  '<p>The CNA certification exam can feel overwhelming, but with the right preparation, you can pass on your first attempt. Here are our top 5 tips from instructors who''ve helped hundreds of students succeed.</p>

<h2>1. Master the Basics First</h2>

<p>Don''t try to memorize everything at once. Focus on fundamental skills: vital signs, infection control, patient safety, and communication. These form the foundation of everything else.</p>

<h2>2. Practice Hands-On Skills Daily</h2>

<p>The practical exam tests your ability to perform tasks correctly. Practice taking blood pressure, transferring patients, and providing personal care until these become second nature.</p>

<h2>3. Use the Process of Elimination</h2>

<p>On multiple-choice questions, eliminate obviously wrong answers first. This increases your odds even if you''re unsure of the correct answer.</p>

<h2>4. Read Questions Carefully</h2>

<p>Many students miss questions because they rush. Read each question twice. Look for keywords like "first," "most important," or "except."</p>

<h2>5. Take Care of Yourself</h2>

<p>Get 8 hours of sleep before the exam. Eat a good breakfast. Arrive early. A calm, rested mind performs better than a stressed, tired one.</p>

<p><strong>Want expert CNA training? <a href="/programs/cna">Learn about our program</a>—100% free through WIOA funding.</strong></p>',
  '/images/blog/cna-exam.jpg',
  'Sarah Johnson',
  'Career Tips',
  ARRAY['CNA', 'certification', 'exam tips', 'healthcare'],
  true,
  NOW() - INTERVAL '3 days'
),
(
  'New HVAC Training Program Launches in Indianapolis',
  'hvac-program-launch',
  'Elevate For Humanity announces new HVAC Technician training program with 95% job placement rate and $55,000 average starting salary.',
  '<p>We''re excited to announce the launch of our new HVAC Technician training program, designed to meet the growing demand for skilled trades professionals in Indianapolis and surrounding areas.</p>

<h2>Why HVAC?</h2>

<p>The HVAC industry is booming. With an aging workforce and increasing demand for climate control systems, employers are desperate for qualified technicians. Our graduates are seeing:</p>

<ul>
<li>95% job placement rate within 30 days</li>
<li>$55,000 average starting salary</li>
<li>Excellent benefits and job security</li>
<li>Opportunities for advancement</li>
</ul>

<h2>Program Details</h2>

<p>Our 18-week program covers:</p>

<ul>
<li>Heating and cooling systems</li>
<li>Electrical fundamentals</li>
<li>EPA 608 certification</li>
<li>Customer service and business skills</li>
<li>Hands-on installation and repair</li>
</ul>

<h2>100% Free Through WIOA</h2>

<p>Like all our programs, HVAC training is completely free for eligible students through WIOA funding. No tuition. No debt. Just opportunity.</p>

<p><strong>Ready to start your HVAC career? <a href="/programs/hvac-technician">Learn more and apply</a>.</strong></p>',
  '/images/blog/hvac-launch.jpg',
  'Elizabeth Greene',
  'News',
  ARRAY['HVAC', 'new program', 'skilled trades', 'announcement'],
  true,
  NOW() - INTERVAL '1 day'
),
(
  'Understanding WIOA: How to Get Free Career Training',
  'understanding-wioa-funding',
  'WIOA provides free career training for eligible adults. Learn how it works and if you qualify.',
  '<p>The Workforce Innovation and Opportunity Act (WIOA) is a federal program that provides free career training to eligible adults. If you''re unemployed, underemployed, or looking to change careers, WIOA might be your ticket to a better future.</p>

<h2>What is WIOA?</h2>

<p>WIOA is a federal program administered by state workforce boards. It provides funding for career training, job search assistance, and supportive services like transportation and childcare.</p>

<h2>Who Qualifies?</h2>

<p>You may be eligible if you:</p>

<ul>
<li>Are unemployed or underemployed</li>
<li>Have low income</li>
<li>Lack skills for in-demand jobs</li>
<li>Face barriers to employment</li>
<li>Are a dislocated worker</li>
</ul>

<h2>What Does WIOA Cover?</h2>

<p>WIOA can pay for:</p>

<ul>
<li>Tuition and fees</li>
<li>Books and supplies</li>
<li>Transportation</li>
<li>Childcare</li>
<li>Work clothes and tools</li>
</ul>

<h2>How to Apply</h2>

<p>Contact your local WorkOne center or apply directly through Elevate For Humanity. We''ll help you navigate the process and determine your eligibility.</p>

<p><strong>Ready to get started? <a href="/apply">Apply for free training today</a>.</strong></p>',
  '/images/blog/wioa-explained.jpg',
  'Michael Rodriguez',
  'Education',
  ARRAY['WIOA', 'funding', 'free training', 'eligibility'],
  true,
  NOW() - INTERVAL '10 days'
),
(
  'The Truth About Second Chances: Why We Hire People with Records',
  'second-chances-hiring',
  'At Elevate For Humanity, we believe in second chances. Here''s why hiring people with criminal records makes good business sense.',
  '<p>Let''s talk about something most organizations won''t: hiring people with criminal records. At Elevate For Humanity, we don''t just accept students with records—we actively recruit them. Here''s why.</p>

<h2>The Reality</h2>

<p>70 million Americans have a criminal record. That''s 1 in 3 adults. If we exclude everyone with a record, we''re excluding a third of our potential workforce—and some of our most motivated, hardworking people.</p>

<h2>The Myth vs. Reality</h2>

<p><strong>Myth:</strong> People with records are unreliable.<br>
<strong>Reality:</strong> Studies show they have lower turnover rates and higher loyalty than average employees.</p>

<p><strong>Myth:</strong> They''ll reoffend.<br>
<strong>Reality:</strong> Employment is the #1 factor in preventing recidivism. Give someone a job, and you dramatically reduce their chance of returning to prison.</p>

<p><strong>Myth:</strong> It''s risky for businesses.<br>
<strong>Reality:</strong> Many employers report that their best employees are those who got a second chance.</p>

<h2>Our Results</h2>

<p>Of our graduates with criminal records:</p>

<ul>
<li>92% are still employed after one year</li>
<li>85% have received raises or promotions</li>
<li>Less than 2% have reoffended</li>
</ul>

<h2>The Bottom Line</h2>

<p>Second chances aren''t charity—they''re smart business. When you invest in people who''ve made mistakes, you get employees who are grateful, loyal, and determined to prove themselves.</p>

<p><strong>Have a record? We believe in you. <a href="/apply">Apply today</a>.</strong></p>',
  '/images/blog/second-chances.jpg',
  'Elizabeth Greene',
  'Opinion',
  ARRAY['second chances', 'criminal records', 'employment', 'social justice'],
  true,
  NOW() - INTERVAL '14 days'
);
