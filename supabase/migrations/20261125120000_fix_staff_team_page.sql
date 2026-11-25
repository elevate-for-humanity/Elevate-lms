-- Fix the staff/team roster (Elizabeth, Nov 25, 2026).
--
-- Removes Carl Brown, Sharon Douglass, and Debbie Footman Williams from the
-- public team page, removes the four non-person group cards (Training Team,
-- Career Services, Student Support, Operations Team — departments, not staff,
-- with no personal photo), corrects Elizabeth Greene's portrait (the live row
-- used a phone screenshot with status/nav-bar chrome baked in), adds the
-- missing staff (David Nazario, Naomi Jordan, Alberta Davis, Tempestt Barnes,
-- Matthew Barnes), and adds a credentials column so degrees, licenses, and
-- certifications show on the team page and profile pages.
--
-- No portraits are invented: members without a verified photo on file get
-- NULL image_url/headshot_url, and the team page renders their card without
-- an image. Ariana is NOT added here — no verified name, title, bio, or
-- photo exists for her in the repo; Elizabeth must supply those first.

ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS credentials text[];

-- Deactivate the people Elizabeth asked to remove, plus the group cards.
UPDATE public.team_members
SET is_active = false, updated_at = now()
WHERE name IN (
  'Debbie Footman Williams',
  'Sharon Douglass',
  'Carl Brown',
  'Training Team',
  'Career Services',
  'Student Support',
  'Operations Team'
);

INSERT INTO public.team_members
  (name, title, org_role, bio, headshot_url, image_url, email, credentials, display_order, is_active)
VALUES
  (
    'Elizabeth Greene',
    'Founder & Chief Executive Officer',
    'Executive Leadership',
    $bio$U.S. Army veteran (Unit Supply Specialist), IRS Enrolled Agent (EA), EFIN/PTIN holder, ERO, and SBIN-authorized federal tax software submitter. Elizabeth is also a licensed barber, Indiana substitute teacher, OSHA 10-Hour certified, EPA 608 Certified Proctor (ESCO #358010 and Mainstream Engineering), and Certiport Authorized Testing Center (CATC) operator. She founded Elevate for Humanity — a DOL Registered Apprenticeship Sponsor and Indiana ETPL/WIOA/WRG/JRI-approved workforce provider — and also leads Elevate tax operations and Selfish Inc., a 501(c)(3) nonprofit providing VITA free tax prep and community services.$bio$,
    '/images/team/elizabeth-greene-headshot.webp',
    '/images/team/elizabeth-greene-headshot.webp',
    '',
    ARRAY[
      'U.S. Army Veteran — Unit Supply Specialist',
      'IRS Enrolled Agent (EA)',
      'EFIN / PTIN holder',
      'Licensed Barber (Indiana)',
      'Indiana Substitute Teacher',
      'OSHA 10-Hour',
      'EPA 608 Certified Proctor (ESCO #358010, Mainstream Engineering)',
      'Certiport Authorized Testing Center (CATC) Operator'
    ]::text[],
    1,
    true
  ),
  (
    'Jozanna George',
    'Director of Enrollment & Beauty Industry Programs',
    'Nail & Esthetics Industry Leadership',
    $bio$Jozanna George is a multi-licensed beauty professional holding Nail Technician, Nail Instructor, and Esthetician licenses. Through Mesmerized by Beauty Cosmetology Academy, she leads beauty-industry education and brings hands-on experience in nail care, skincare, sanitation, client consultation, salon and spa professionalism, technical skill development, and student preparation. At Elevate for Humanity, she directs enrollment and beauty-industry programs and supports Nail Technician and Esthetician apprentices from application through career readiness.$bio$,
    '/images/jozanna-george.jpg',
    '/images/jozanna-george.jpg',
    'jozanna@elevateforhumanity.org',
    ARRAY[
      'Indiana Nail Technician License',
      'Indiana Nail Instructor License',
      'Indiana Esthetician License'
    ]::text[],
    2,
    true
  ),
  (
    'Dr. Carlina Wilkes',
    'Executive Director of Financial Operations & Organizational Compliance',
    'Chair, Financial Literacy',
    $bio$Dr. Carlina Wilkes brings more than 24 years of federal financial management experience with the Defense Finance and Accounting Service (DFAS) and holds DoD Financial Management Certification Level II. Her expertise includes federal cost accounting, budget development and monitoring, audit readiness, regulatory compliance, financial reporting, and long-term financial planning. At Elevate for Humanity, she oversees financial operations and organizational compliance and leads the Elevate Financial Empowerment Program, helping participants turn financial knowledge into practical plans for stability, independence, and long-term wellness.$bio$,
    '/images/carlina-wilkes.jpg',
    '/images/carlina-wilkes.jpg',
    'carlina@elevateforhumanity.org',
    ARRAY['DoD Financial Management Certification Level II']::text[],
    3,
    true
  ),
  (
    'Leslie Wafford',
    'Director of Community Services',
    'Community & Supportive Services',
    $bio$Leslie promotes low-barrier housing access and eviction prevention, helping families navigate housing challenges with her "reach one, teach one" philosophy.$bio$,
    '/images/leslie-wafford.webp',
    '/images/leslie-wafford.webp',
    'leslie@elevateforhumanity.org',
    NULL,
    4,
    true
  ),
  (
    'Delores Reynolds',
    'Social Media & Digital Engagement Coordinator',
    'Communications',
    $bio$Delores manages digital communications, sharing student success stories and promoting program offerings to reach those who can benefit from funded training.$bio$,
    '/images/delores-reynolds.jpg',
    '/images/delores-reynolds.jpg',
    'delores@elevateforhumanity.org',
    NULL,
    5,
    true
  ),
  (
    'Clystjah Woodley',
    'Program Coordinator',
    'Program Operations',
    $bio$Clystjah supports program operations and student services, helping participants navigate enrollment and stay on track through their training programs.$bio$,
    '/images/clystjah-woodley.jpg',
    '/images/clystjah-woodley.jpg',
    'clystjah@elevateforhumanity.org',
    NULL,
    6,
    true
  ),
  (
    'Ameco L. Martin',
    'IT/IS Technology Instructor',
    'Information Technology Programs',
    $bio$Ameco L. Martin is an experienced information technology professional, business leader, and educator who brings technical knowledge, healthcare information systems experience, and real-world business expertise to her role as an IT/IS Technology Instructor with Elevate for Humanity.

Ameco holds a Bachelor's degree in Business Information Systems with a major in Computer Programming. Her professional background includes work as a Clinical Information Systems Specialist and Cerner programmer with Indiana University Health, connecting computer systems, healthcare operations, data, workflow processes, and end-user support.

With more than 27 years of professional experience in healthcare, Ameco's career has evolved from direct patient care and rehabilitation services to healthcare billing, information systems, technology, operations, and executive leadership. She is also an entrepreneur, business consultant, author, and organizational leader with experience developing businesses, implementing administrative systems, training staff, and improving technology-driven workflows.

Her teaching emphasizes hands-on learning, digital literacy, problem-solving, computer and information systems fundamentals, workplace technology, and practical application. She helps students connect technical skills to career opportunities in information technology, information systems, healthcare technology, business technology, and other technology-driven careers. Her philosophy is simple: technology is more than learning a computer - it is learning how to use information, systems, and innovation to create opportunities and solve real-world problems.$bio$,
    '/images/ameco-martin.jpg',
    '/images/ameco-martin.jpg',
    'amecosenterprise@gmail.com',
    ARRAY['Bachelor''s Degree in Business Information Systems (major: Computer Programming)']::text[],
    7,
    true
  ),
  (
    'David Nazario',
    'HVAC Instructor',
    'Skilled Trades Programs',
    $bio$David Nazario is Elevate for Humanity’s HVAC instructor. He teaches HVAC fundamentals and EPA Section 608 examination preparation through instructor-led and practical sessions, built around a 48-hour hands-on syllabus covering residential split systems, gas furnaces, and core service procedures.$bio$,
    NULL,
    NULL,
    NULL,
    NULL,
    8,
    true
  ),
  (
    'Naomi Jordan',
    'Director of Healthcare Administration',
    'Healthcare Programs',
    $bio$Naomi Jordan is the owner of Rebuilds Mind and Body Studio LLC, located at 6331 N Keystone Ave, Indianapolis, IN 46220. She holds active Indiana credentials as a Certified Nursing Assistant (CNA), Home Health Aide (HHA), Phlebotomy Technician, and Qualified Medication Aide (QMA). As Director of Healthcare Administration at Elevate for Humanity, Naomi oversees all healthcare program administration, clinical coordination, healthcare partner relationships, and curriculum compliance for CNA, HHA, Phlebotomy, QMA, Medical Assistant, Pharmacy Technician, and Peer Recovery Specialist programs. She brings direct clinical experience to program design and ensures that Elevate’s healthcare graduates are fully prepared to pass state and national credentialing exams and enter the healthcare workforce.$bio$,
    '/images/naomi-jordan.jpg',
    '/images/naomi-jordan.jpg',
    NULL,
    ARRAY[
      'Certified Nursing Assistant (CNA) — Indiana',
      'Home Health Aide (HHA) — Indiana',
      'Phlebotomy Technician — Indiana',
      'Qualified Medication Aide (QMA) — Indiana'
    ]::text[],
    9,
    true
  ),
  (
    'Alberta Davis',
    'Testing Center Coordinator & Exam Proctor',
    'Credential Testing',
    $bio$Alberta Davis serves as a Testing Center Coordinator and Exam Proctor at Elevate for Humanity’s Workforce Credential Testing Center in Indianapolis. She supports the administration of industry-recognized certification exams and workforce assessments for individuals, employers, schools, and workforce development partners. In her role, Alberta coordinates testing appointments, prepares testing stations, and assists candidates through the check-in and identity verification process to ensure each testing session begins smoothly. As an exam proctor, she monitors in-person and live testing sessions to maintain compliance with certification provider policies and exam security standards. Alberta also assists with onsite testing events for partner organizations and workforce programs, helping expand access to credential testing opportunities across the community.$bio$,
    NULL,
    NULL,
    'alberta@elevateforhumanity.org',
    ARRAY['Certified Exam Proctor (Certiport, NHA, EPA 608)']::text[],
    10,
    true
  ),
  (
    'Tempestt Barnes',
    'Gary-Area Site Coordinator',
    'Regional Coordination',
    $bio$Tempestt Barnes is a Gary-area site coordinator for Elevate for Humanity, supporting local partner communications, site planning coordination, and community outreach across Northwest Indiana.$bio$,
    NULL,
    NULL,
    NULL,
    NULL,
    11,
    true
  ),
  (
    'Matthew Barnes',
    'Gary-Area Site Coordinator',
    'Regional Coordination',
    $bio$Matthew Barnes is a Gary-area site coordinator for Elevate for Humanity, supporting local partner communications, site planning coordination, and community outreach across Northwest Indiana.$bio$,
    NULL,
    NULL,
    NULL,
    NULL,
    12,
    true
  )
ON CONFLICT (name) DO UPDATE SET
  title = EXCLUDED.title,
  org_role = EXCLUDED.org_role,
  bio = EXCLUDED.bio,
  headshot_url = EXCLUDED.headshot_url,
  image_url = EXCLUDED.image_url,
  email = EXCLUDED.email,
  credentials = EXCLUDED.credentials,
  display_order = EXCLUDED.display_order,
  is_active = true,
  updated_at = now();
