-- Seed hardcoded data into DB tables created in migration 20260416000002
-- Sources: data/team.ts, data/state-licensing.ts, lib/testing/proctoring-capabilities.ts,
--          app/partners/join/page.tsx, components/home/Testimonials.tsx, OutcomeProof.tsx

-- ── TEAM MEMBERS ─────────────────────────────────────────────────────────────

INSERT INTO public.team_members (name, title, org_role, bio, headshot_url, email, display_order) VALUES
(
  'Elizabeth Greene',
  'Founder & Chief Executive Officer',
  'Executive Leadership',
  'U.S. Army veteran (Unit Supply Specialist), IRS Enrolled Agent (EA), EFIN and PTIN holder, licensed barber, Indiana substitute teacher, EPA 608 Certified Proctor. Elizabeth founded Elevate for Humanity — a DOL Registered Apprenticeship Sponsor, ETPL provider, WRG/WIOA/JRI approved, Job Ready Indy partner, WorkOne partner, EmployIndy partner, HSI affiliate, CareerSafe OSHA provider, Milady partner, NRF Rise Up provider, Certiport CATC, SAM.gov registered (CAGE: 0Q856), federal government contractor, and ByBlack certified. She also operates SupersonicFastCash (tax software) and Selfish Inc., a 501(c)(3) nonprofit (DBA: The Rise Foundation) providing VITA free tax prep and community services.',
  '/images/team/elizabeth-greene-headshot.jpg',
  '',
  1
),
(
  'Jozanna George',
  'Director of Enrollment & Beauty Industry Programs',
  'Enrollment & Instruction',
  'Jozanna is a multi-licensed beauty professional holding Nail Technician, Nail Instructor, and Esthetician licenses. She oversees the nail program at Textures Institute of Cosmetology and manages enrollment operations for Elevate for Humanity.',
  '/images/jozanna-george.jpg',
  'jozanna@elevateforhumanity.org',
  2
),
(
  'Dr. Carlina Wilkes',
  'Executive Director of Financial Operations & Organizational Compliance',
  'Grants & Compliance',
  'Dr. Wilkes brings 24+ years of federal experience with DFAS, holding DoD Financial Management Certification Level II. She oversees financial operations and compliance at Elevate for Humanity.',
  '/images/carlina-wilkes.jpg',
  'carlina@elevateforhumanity.org',
  3
),
(
  'Leslie Wafford',
  'Director of Community Services',
  'Community & Supportive Services',
  'Leslie promotes low-barrier housing access and eviction prevention, helping families navigate housing challenges with her "reach one, teach one" philosophy.',
  '/images/leslie-wafford.jpg',
  'leslie@elevateforhumanity.org',
  4
),
(
  'Delores Reynolds',
  'Social Media & Digital Engagement Coordinator',
  'Communications',
  'Delores manages digital communications, sharing student success stories and promoting program offerings to reach those who can benefit from funded training.',
  '/images/delores-reynolds.jpg',
  'delores@elevateforhumanity.org',
  5
),
(
  'Clystjah Woodley',
  'Program Coordinator',
  'Program Operations',
  'Clystjah supports program operations and student services, helping participants navigate enrollment and stay on track through their training programs.',
  '/images/clystjah-woodley.jpg',
  'clystjah@elevateforhumanity.org',
  6
),
(
  'Alberta Davis',
  'Testing Center Coordinator & Exam Proctor',
  'Credential Testing',
  'Alberta Davis serves as a Testing Center Coordinator and Exam Proctor at Elevate for Humanity''s Workforce Credential Testing Center in Indianapolis. She supports the administration of industry-recognized certification exams and workforce assessments for individuals, employers, schools, and workforce development partners. In her role, Alberta coordinates testing appointments, prepares testing stations, and assists candidates through the check-in and identity verification process to ensure each testing session begins smoothly. As an exam proctor, she monitors in-person and live testing sessions to maintain compliance with certification provider policies and exam security standards. Alberta also assists with onsite testing events for partner organizations and workforce programs, helping expand access to credential testing opportunities across the community.',
  NULL,
  'alberta@elevateforhumanity.org',
  7
)
ON CONFLICT (name) DO UPDATE SET
  title         = EXCLUDED.title,
  org_role      = EXCLUDED.org_role,
  bio           = EXCLUDED.bio,
  headshot_url  = EXCLUDED.headshot_url,
  email         = EXCLUDED.email,
  display_order = EXCLUDED.display_order,
  updated_at    = now();

-- ── TESTIMONIALS ──────────────────────────────────────────────────────────────

INSERT INTO public.testimonials (name, title, quote, show_on_home, show_on_program, rating, display_order) VALUES
(
  'Sarah Johnson',
  'Healthcare Graduate',
  'I didn''t know where to start. This program showed me exactly what to do, step by step. Now I''m certified and working.',
  true, true, 5, 1
),
(
  'Maria Rodriguez',
  'Skilled Trades Graduate',
  'The training was real. The credentials matter. I got hired two weeks after finishing the program.',
  true, true, 5, 2
),
(
  'David Chen',
  'Technology Graduate',
  'No cost, no debt, and a real career path. This changed everything for me.',
  true, true, 5, 3
)
ON CONFLICT (name, quote) DO UPDATE SET
  title           = EXCLUDED.title,
  show_on_home    = EXCLUDED.show_on_home,
  show_on_program = EXCLUDED.show_on_program,
  rating          = EXCLUDED.rating,
  display_order   = EXCLUDED.display_order,
  updated_at      = now();

-- ── IMPACT STATS ──────────────────────────────────────────────────────────────

INSERT INTO public.impact_stats (stat_key, label, value, numeric_value, icon, show_on_home, display_order) VALUES
('job_placement',    'Job placement within 90 days',       '85%',     85,  'TrendingUp', true, 1),
('time_to_cred',     'Average time to credential',         '12 weeks', 12, 'Clock',      true, 2),
('avg_salary',       'Average starting salary',            '$42K',    42,  'DollarSign', true, 3),
('tuition_covered',  'Tuition covered for eligible students', '100%', 100, 'Award',      true, 4)
ON CONFLICT (stat_key) DO UPDATE SET
  label         = EXCLUDED.label,
  value         = EXCLUDED.value,
  numeric_value = EXCLUDED.numeric_value,
  updated_at    = now();

-- ── PARTNER TYPES ─────────────────────────────────────────────────────────────

INSERT INTO public.partner_types (key, title, description, icon, apply_href, display_order) VALUES
('workforce-agency',    'Workforce Agency',        'Refer WIOA, Job Ready Indy, or WRG-funded participants to our approved training programs.',                                  'Building2',    '/partners/apply', 1),
('employer',            'Employer',                'Hire certified graduates, host apprentices, or post jobs to our placement pipeline.',                                        'Briefcase',    '/partners/apply', 2),
('training-provider',   'Training Provider',       'Co-deliver programs, share facilities, or list your programs in our catalog.',                                               'GraduationCap','/partners/apply', 3),
('reentry-org',         'Reentry Organization',    'Connect justice-involved individuals to Job Ready Indy-funded training and placement services.',                             'RefreshCw',    '/partners/apply', 4),
('community-org',       'Community Organization',  'Refer clients facing employment barriers to our programs and support services.',                                             'Users',        '/partners/apply', 5),
('philanthropic',       'Philanthropic Supporter', 'Fund training, supplies, scholarships, or wraparound support services.',                                                     'Heart',        '/philanthropy',   6)
ON CONFLICT (key) DO UPDATE SET
  title       = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at  = now();

-- ── TESTING PROVIDERS ─────────────────────────────────────────────────────────

INSERT INTO public.testing_providers (key, name, description, website_url, proctoring_type, status, exams, fees, display_order) VALUES
(
  'esco',
  'EPA Section 608 (ESCO Institute)',
  'Federal refrigerant handling certification required by the EPA Clean Air Act. It is illegal to purchase or handle refrigerants without this certification. Elevate is a nationally authorized proctor site for both ESCO Group and Mainstream Engineering. Required for any HVAC technician who services, maintains, or disposes of equipment containing refrigerants.',
  'https://www.escogroup.org/esco/certifications/epa608.aspx',
  'IN_PERSON_ONLY',
  'active',
  '[
    {"name":"Core","description":"Covers EPA regulations, refrigerant safety, environmental impact of ozone-depleting substances, and proper handling procedures. Required as part of every certification type.","durationMinutes":20,"questionCount":25},
    {"name":"Type I — Small Appliances","description":"Covers equipment containing 5 lbs or less of refrigerant — window AC units, refrigerators, freezers, and dehumidifiers.","durationMinutes":20,"questionCount":25},
    {"name":"Type II — High-Pressure","description":"Covers high-pressure systems using refrigerants like R-22 and R-410A — residential and commercial AC, heat pumps, and refrigeration equipment.","durationMinutes":20,"questionCount":25},
    {"name":"Type III — Low-Pressure","description":"Covers low-pressure systems using refrigerants like R-11 and R-123 — large commercial chillers found in office buildings, hospitals, and industrial facilities.","durationMinutes":20,"questionCount":25},
    {"name":"Universal (All Sections)","description":"Passes all four sections in a single sitting. Required for technicians who work across residential, commercial, and industrial systems.","durationMinutes":80,"questionCount":100}
  ]'::jsonb,
  '[
    {"label":"Universal (all sections)","amount":55,"note":"Includes exam fee + proctoring"},
    {"label":"Single section","amount":35,"note":"Includes exam fee + proctoring"}
  ]'::jsonb,
  1
),
(
  'nrf',
  'NRF RISE Up (National Retail Federation)',
  'NRF RISE Up credentials are nationally recognized workforce certifications for customer service, retail, and business roles. Issued by the National Retail Federation Foundation — the largest retail trade association in the world. Recognized by major employers including Walmart, Target, Macy''s, and thousands of small businesses.',
  'https://nrffoundation.org/riseup',
  'IN_PERSON_ONLY',
  'active',
  '[
    {"name":"Retail Industry Fundamentals","description":"Entry-level credential covering the basics of working in retail — store operations, customer interaction, product handling, and workplace safety.","durationMinutes":60,"questionCount":60},
    {"name":"Customer Service & Sales","description":"Covers professional customer service skills, sales techniques, handling complaints, building customer loyalty, and meeting sales goals.","durationMinutes":60,"questionCount":60},
    {"name":"Business of Retail: Operations & Profit","description":"Covers retail business operations — inventory management, merchandising, loss prevention, financial basics, and store performance metrics.","durationMinutes":60,"questionCount":60}
  ]'::jsonb,
  '[{"label":"Per credential exam","amount":45,"note":"Includes exam fee + proctoring"}]'::jsonb,
  2
),
(
  'certiport',
  'Certiport Authorized Testing Center',
  'Elevate is an authorized Certiport testing center. Certiport delivers performance-based certification exams for Microsoft, Adobe, CompTIA, Intuit, and IC3. Exams are taken on a computer and test real-world skills — not just memorization. Credentials are issued by the respective technology company and recognized globally by employers.',
  'https://certiport.pearsonvue.com/Locator',
  'IN_PERSON_OR_PROVIDER_REMOTE',
  'active',
  '[
    {"name":"Microsoft Office Specialist (MOS)","description":"Validates proficiency in Microsoft Word, Excel, PowerPoint, Outlook, and Access. The most widely recognized productivity credential in the world."},
    {"name":"IT Specialist","description":"Entry-level IT credentials covering Python, Java, HTML/CSS, networking, databases, and cybersecurity fundamentals."},
    {"name":"Intuit QuickBooks Certified User","description":"Validates ability to use QuickBooks for small business accounting — invoicing, payroll, reporting, and reconciliation."},
    {"name":"Entrepreneurship & Small Business (ESB)","description":"Covers business planning, marketing, financial management, and operations for aspiring entrepreneurs and small business owners."},
    {"name":"IC3 Digital Literacy","description":"Foundational digital literacy credential covering computing fundamentals, key applications, and living online."},
    {"name":"Adobe Certified Professional","description":"Validates creative skills in Photoshop, Illustrator, InDesign, Premiere Pro, and After Effects."},
    {"name":"CompTIA A+ · Network+ · Security+","description":"Industry-standard IT certifications for hardware, networking, and cybersecurity roles."}
  ]'::jsonb,
  '[{"label":"Per exam","amount":45,"note":"Includes exam fee + proctoring"}]'::jsonb,
  3
),
(
  'nha',
  'NHA — National Healthcareer Association',
  'NHA Authorized Testing Center (account #412957). NHA is one of the largest allied health certification bodies in the United States. Credentials are nationally recognized by hospitals, clinics, physician offices, and long-term care facilities. All exams are computer-based and proctored in person.',
  'https://www.nhanow.com/',
  'IN_PERSON_ONLY',
  'active',
  '[
    {"name":"Certified Phlebotomy Technician (CPT)","description":"Validates skills in venipuncture, capillary puncture, specimen handling, and patient interaction.","durationMinutes":120,"questionCount":100},
    {"name":"Certified Clinical Medical Assistant (CCMA)","description":"Covers clinical and administrative duties — taking vital signs, preparing patients for exams, assisting with procedures, EKG, phlebotomy, and managing patient records.","durationMinutes":120,"questionCount":150},
    {"name":"Certified EKG Technician (CET)","description":"Validates the ability to perform electrocardiograms (EKGs/ECGs), Holter monitor setup, stress testing, and basic cardiac rhythm interpretation.","durationMinutes":90,"questionCount":100},
    {"name":"Certified Patient Care Technician/Assistant (CPCT/A)","description":"Covers direct patient care skills — vital signs, phlebotomy, EKG, catheter care, wound care, and patient mobility.","durationMinutes":120,"questionCount":150},
    {"name":"Certified Medical Administrative Assistant (CMAA)","description":"Covers front-office healthcare operations — scheduling, insurance verification, medical billing basics, HIPAA compliance, and patient communication.","durationMinutes":90,"questionCount":110},
    {"name":"Certified Pharmacy Technician — ExCPT","description":"Validates pharmacy technician skills — prescription processing, drug dispensing, inventory management, compounding basics, and pharmacy law.","durationMinutes":110,"questionCount":120}
  ]'::jsonb,
  '[
    {"label":"CPT — Phlebotomy","amount":243,"note":"$149 NHA exam + $94 testing & administration"},
    {"label":"CCMA — Medical Assistant","amount":243,"note":"$149 NHA exam + $94 testing & administration"},
    {"label":"CET — EKG Technician","amount":243,"note":"$149 NHA exam + $94 testing & administration"},
    {"label":"ExCPT — Pharmacy Technician","amount":243,"note":"$149 NHA exam + $94 testing & administration"},
    {"label":"CPCT/A — Patient Care Tech","amount":243,"note":"$149 NHA exam + $94 testing & administration"},
    {"label":"CMAA — Medical Admin Assistant","amount":243,"note":"$149 NHA exam + $94 testing & administration"}
  ]'::jsonb,
  4
),
(
  'workkeys',
  'ACT WorkKeys / NCRC',
  'The National Career Readiness Certificate (NCRC) is a portable, evidence-based credential recognized by 22,000+ employers nationwide. Earned by passing three ACT WorkKeys assessments. Elevate is an authorized ACT testing site (Realm: 1317721865). Scores are valid for 5 years.',
  'https://www.act.org/content/act/en/products-and-services/workkeys-for-job-seekers.html',
  'IN_PERSON_ONLY',
  'active',
  '[
    {"name":"Applied Math","description":"Measures the skill workers use when they apply mathematical reasoning, critical thinking, and problem-solving techniques to work-related problems."},
    {"name":"Workplace Documents","description":"Measures the skill workers use when they read and use written text such as memos, letters, directions, signs, notices, bulletins, policies, and regulations."},
    {"name":"Business Writing","description":"Measures the skill workers use when they write workplace documents such as emails, memos, letters, and other business communications."}
  ]'::jsonb,
  '[
    {"label":"Per assessment","amount":45,"note":"Includes $13.50 ACT fee + $31.50 proctoring"},
    {"label":"Full NCRC battery (3 assessments)","amount":120,"note":"Applied Math + Workplace Documents + Business Writing"}
  ]'::jsonb,
  5
),
(
  'careersafe',
  'CareerSafe / OSHA Outreach',
  'OSHA Outreach Training Program certifications issued through the U.S. Department of Labor. The OSHA 10 and OSHA 30 are the most widely recognized workplace safety credentials in the country. Required by many construction employers, union apprenticeship programs, and federal contractors. A DOL wallet card is issued upon completion — valid for life.',
  'https://www.osha.gov/training/outreach',
  'CENTER_REMOTE_ALLOWED',
  'active',
  '[
    {"name":"OSHA 10-Hour — General Industry","description":"Covers workplace safety fundamentals for non-construction environments — manufacturing, warehousing, healthcare, retail, and service industries.","durationMinutes":600},
    {"name":"OSHA 10-Hour — Construction","description":"Covers construction site safety — fall protection, scaffolding, electrical hazards, struck-by and caught-in hazards, and OSHA standards for the construction industry.","durationMinutes":600},
    {"name":"OSHA 30-Hour — General Industry","description":"Advanced safety training for supervisors and workers with safety responsibilities in general industry.","durationMinutes":1800},
    {"name":"OSHA 30-Hour — Construction","description":"Advanced construction safety training for foremen, supervisors, and safety personnel.","durationMinutes":1800}
  ]'::jsonb,
  '[
    {"label":"OSHA 10-Hour","amount":65,"note":"Includes course + DOL card"},
    {"label":"OSHA 30-Hour","amount":185,"note":"Includes course + DOL card"}
  ]'::jsonb,
  6
)
ON CONFLICT (key) DO UPDATE SET
  name            = EXCLUDED.name,
  description     = EXCLUDED.description,
  proctoring_type = EXCLUDED.proctoring_type,
  status          = EXCLUDED.status,
  exams           = EXCLUDED.exams,
  fees            = EXCLUDED.fees,
  updated_at      = now();

-- ── STATE LICENSING — CNA ─────────────────────────────────────────────────────

INSERT INTO public.state_licensing (program_type, state, state_code, available, unavailable_reason, requirements_url, board_name, notes) VALUES
('cna','Indiana','IN',true,NULL,'https://www.in.gov/isdh/27072.htm','Indiana State Department of Health (ISDH)','Elevate is an approved Indiana CNA training program. Exam proctored on-site. 105 hours required (75 classroom + 30 clinical).'),
('cna','Illinois','IL',false,'Illinois requires CNA training programs to be approved by the Illinois Department of Public Health. Elevate is not yet approved in Illinois.','https://dph.illinois.gov/topics-services/health-care-regulation/nursing-home-hfs-surveyor-training/nurse-aide-training.html','Illinois Department of Public Health','Must complete an Illinois-approved program. Out-of-state training not accepted without reciprocity.'),
('cna','Ohio','OH',false,'Ohio requires CNA training to be completed at an Ohio-approved facility. Reciprocity available if you hold an active Indiana CNA license.','https://odh.ohio.gov/know-our-programs/nurse-aide-registry/nurse-aide-registry','Ohio Department of Health — Nurse Aide Registry','Indiana CNA holders may apply for Ohio reciprocity without retesting if license is active and in good standing.'),
('cna','Michigan','MI',false,'Michigan requires training at a Michigan-approved program. Reciprocity available for active Indiana CNA license holders.','https://www.michigan.gov/lara/bureau-list/bpl/occ/health-professions/nurse-aide','Michigan Department of Licensing and Regulatory Affairs','Active Indiana CNA license holders may apply for Michigan endorsement.'),
('cna','Kentucky','KY',false,'Kentucky requires training at a Kentucky-approved program. Reciprocity available for active Indiana CNA license holders.','https://chfs.ky.gov/agencies/os/oig/hcb/Pages/nurseaideregistry.aspx','Kentucky Cabinet for Health and Family Services','Active Indiana CNA license holders may apply for Kentucky reciprocity.'),
('cna','Tennessee','TN',false,'Tennessee requires training at a Tennessee-approved program. Reciprocity available for active Indiana CNA license holders.','https://www.tn.gov/health/health-program-areas/health-professional-boards/nurse-aide-registry.html','Tennessee Department of Health — Nurse Aide Registry','Active Indiana CNA license holders may apply for Tennessee reciprocity.'),
('cna','Wisconsin','WI',false,'Wisconsin requires training at a Wisconsin-approved program.','https://www.dhs.wisconsin.gov/caregiver/nurse-aide.htm','Wisconsin Department of Health Services','Active Indiana CNA license holders may apply for Wisconsin reciprocity.'),
('cna','Missouri','MO',false,'Missouri requires training at a Missouri-approved program.','https://health.mo.gov/safety/natp/','Missouri Department of Health and Senior Services','Active Indiana CNA license holders may apply for Missouri reciprocity.'),
('cna','Florida','FL',false,'Florida has its own CNA training and testing requirements. Out-of-state training not accepted without Florida approval.','https://ahca.myflorida.com/Medicaid/Long_Term_Care/Nurse_Aide_Registry/','Florida Agency for Health Care Administration','Florida does not accept reciprocity from Indiana. Must complete a Florida-approved program.'),
('cna','Texas','TX',false,'Texas requires training at a Texas-approved program. No reciprocity with Indiana.','https://www.hhs.texas.gov/providers/long-term-care-providers/nurse-aide-training-competency-evaluation-program-natcep','Texas Health and Human Services','Texas does not accept out-of-state CNA training. Must complete a Texas-approved program.'),
('cna','California','CA',false,'California has its own CNA certification requirements and does not accept Indiana training.','https://www.cdph.ca.gov/Programs/CHCQ/LCP/Pages/AIDE.aspx','California Department of Public Health','California requires 160 hours of training at a California-approved program.'),
('cna','New York','NY',false,'New York requires training at a New York State-approved program.','https://www.health.ny.gov/facilities/nursing/nurse_aide/','New York State Department of Health','Active Indiana CNA license holders may apply for New York reciprocity if license is current.')
ON CONFLICT (program_type, state_code) DO UPDATE SET
  available          = EXCLUDED.available,
  unavailable_reason = EXCLUDED.unavailable_reason,
  requirements_url   = EXCLUDED.requirements_url,
  board_name         = EXCLUDED.board_name,
  notes              = EXCLUDED.notes,
  updated_at         = now();

-- ── STATE LICENSING — PHLEBOTOMY ──────────────────────────────────────────────

INSERT INTO public.state_licensing (program_type, state, state_code, available, unavailable_reason, requirements_url, board_name, notes) VALUES
('phlebotomy','Indiana','IN',true,NULL,'https://www.in.gov/isdh/','Indiana State Department of Health','Indiana does not require state licensure for phlebotomists. National certification (NHA CPT, ASCP PBT, or AMT RPT) is accepted by employers. Elevate prepares students for NHA CPT exam.'),
('phlebotomy','California','CA',false,'California is the only state that requires phlebotomists to hold a state-issued license (CPT I or CPT II). Training must be completed at a California-approved program.','https://www.cdph.ca.gov/Programs/OSPHLD/LFS/Pages/PhlebotomyTechnician.aspx','California Department of Public Health — Laboratory Field Services','California CPT license requires 40 hours classroom + 40 hours clinical at a CA-approved site. Indiana training does not qualify.'),
('phlebotomy','Louisiana','LA',false,'Louisiana requires phlebotomists to be licensed by the Louisiana State Board of Medical Examiners.','https://www.lsbme.la.gov/','Louisiana State Board of Medical Examiners','Louisiana requires state licensure. National certification alone is not sufficient.'),
('phlebotomy','Nevada','NV',false,'Nevada requires phlebotomists to hold a state license issued by the Nevada State Board of Health.','https://dpbh.nv.gov/','Nevada Division of Public and Behavioral Health','Nevada requires state licensure in addition to national certification.'),
('phlebotomy','Washington','WA',false,'Washington State requires phlebotomists to hold a state credential issued by the Department of Health.','https://www.doh.wa.gov/LicensesPermitsandCertificates/ProfessionsNewReneworUpdate/MedicalTestSitesClinicalLaboratories','Washington State Department of Health','Washington requires state certification. National certification alone is not sufficient.'),
('phlebotomy','Illinois','IL',true,NULL,'https://idfpr.illinois.gov/','Illinois Department of Financial and Professional Regulation','Illinois does not require state licensure for phlebotomists. National certification (NHA CPT, ASCP PBT) accepted by employers.'),
('phlebotomy','Ohio','OH',true,NULL,'https://odh.ohio.gov/','Ohio Department of Health','Ohio does not require state licensure for phlebotomists. National certification accepted by employers.'),
('phlebotomy','Michigan','MI',true,NULL,'https://www.michigan.gov/lara','Michigan Department of Licensing and Regulatory Affairs','Michigan does not require state licensure for phlebotomists. National certification accepted by employers.'),
('phlebotomy','Kentucky','KY',true,NULL,'https://chfs.ky.gov/','Kentucky Cabinet for Health and Family Services','Kentucky does not require state licensure for phlebotomists. National certification accepted by employers.'),
('phlebotomy','Tennessee','TN',true,NULL,'https://www.tn.gov/health/','Tennessee Department of Health','Tennessee does not require state licensure for phlebotomists. National certification accepted by employers.')
ON CONFLICT (program_type, state_code) DO UPDATE SET
  available          = EXCLUDED.available,
  unavailable_reason = EXCLUDED.unavailable_reason,
  requirements_url   = EXCLUDED.requirements_url,
  board_name         = EXCLUDED.board_name,
  notes              = EXCLUDED.notes,
  updated_at         = now();

-- ── FAQs ──────────────────────────────────────────────────────────────────────

INSERT INTO public.faqs (question, answer, category, program_slug, display_order) VALUES
-- Enrollment / general
('How do I enroll in a program?','Visit the program page and click "Apply Now" or "Enroll." You''ll complete a short application and our enrollment team will contact you within 1–2 business days to confirm eligibility and next steps.','enrollment',NULL,1),
('Is there a cost to attend?','Most programs are fully funded for eligible participants through WIOA, Job Ready Indy, WRG, or other workforce grants. Eligibility is determined during the enrollment process. Some programs have a small materials fee.','funding',NULL,2),
('What funding sources do you accept?','We accept WIOA Title I, Job Ready Indy, WRG (Workforce Ready Grant), JRI (Justice Reinvestment Initiative), and employer-sponsored training. We also offer payment plans for self-pay students.','funding',NULL,3),
('How long do programs take?','Program length varies. Most credential programs run 4–16 weeks. Apprenticeship programs run 1–4 years depending on the trade. See each program page for specific timelines.','programs',NULL,4),
('Do I need prior experience?','Most programs are open to beginners. Some programs have basic requirements (e.g., high school diploma or GED, valid ID, background check). Requirements are listed on each program page.','enrollment',NULL,5),
('Will I get a job after completing the program?','We connect graduates directly with hiring employers through our career services team. Employment outcomes vary by program and market conditions. Many graduates are hired within 90 days of completing their credential.','programs',NULL,6),
('Where are classes held?','Training is held at our Indianapolis facility and at partner training sites. Some programs offer hybrid or online components. Location details are on each program page.','programs',NULL,7),
('How do I access my courses?','Click "My Courses" from the dashboard. All enrolled courses will appear with direct links to course materials, lectures, and assignments.','lms',NULL,8),
('Where can I view my grades?','Navigate to "Grades & Progress" to see current grades, assignment scores, and overall completion percentage for each course.','lms',NULL,9),
-- CNA-specific
('What is the CNA exam like?','The Indiana CNA competency exam has two parts: a written test (70 questions) and a skills demonstration. Both are administered by Prometric on behalf of the Indiana State Department of Health. You must pass both parts to be listed on the Indiana Nurse Aide Registry.','enrollment','cna',1),
('How many hours is the CNA program?','Indiana requires 105 hours: 75 hours of classroom/lab instruction and 30 hours of supervised clinical practice at a long-term care facility.','programs','cna',2),
('Is the CNA program free?','For eligible participants, the CNA program is fully funded through WIOA or Job Ready Indy. Contact us to determine your eligibility.','funding','cna',3),
-- HVAC-specific
('Do I need EPA 608 certification to work in HVAC?','Yes. Federal law requires anyone who purchases or handles refrigerants to hold EPA Section 608 certification. Elevate is an authorized proctor site — you can test here after completing the program.','programs','hvac-technician',1),
('What does the HVAC program cover?','The program covers refrigeration fundamentals, electrical systems, system installation and service, EPA 608 exam prep, and hands-on lab work. Graduates are prepared for entry-level HVAC technician roles.','programs','hvac-technician',2),
-- Phlebotomy-specific
('What certification will I earn in the phlebotomy program?','Graduates are prepared for the NHA Certified Phlebotomy Technician (CPT) exam. Elevate is an NHA Authorized Testing Center — you can test on-site after completing the program.','programs','phlebotomy',1),
('Is phlebotomy in demand?','Yes. The Bureau of Labor Statistics projects 8% growth for phlebotomists through 2032, faster than average. Hospitals, clinics, labs, and blood banks all hire phlebotomists.','programs','phlebotomy',2)
ON CONFLICT (question) DO UPDATE SET
  answer        = EXCLUDED.answer,
  category      = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  updated_at    = now();

-- ── TRAINING PARTNERS (employer partners from data/programs/*.ts) ─────────────
-- Sources: data/programs/cna.ts, hvac-technician.ts, phlebotomy.ts,
--          office-administration.ts, cybersecurity-analyst.ts, it-help-desk.ts,
--          cdl-training.ts, plumbing.ts, cad-drafting.ts, barber-apprenticeship.ts

INSERT INTO public.training_partners
  (name, slug, category, training_role, city, state, status, programs_list)
VALUES
-- Healthcare
('Ascension St. Vincent',         'ascension-st-vincent',         'healthcare',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['CNA Certification']),
('IU Health',                     'iu-health',                     'healthcare',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['CNA Certification','Phlebotomy']),
('Kindred Healthcare',            'kindred-healthcare',            'healthcare',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['CNA Certification']),
('Eskenazi Health',               'eskenazi-health',               'healthcare',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['Phlebotomy','Office Administration']),
('Community Health Network',      'community-health-network',      'healthcare',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['Phlebotomy','Office Administration']),
-- Skilled Trades / HVAC
('Gaylor Electric',               'gaylor-electric',               'skilled-trades', 'placement',     'Indianapolis', 'IN', 'active', ARRAY['HVAC Technician']),
('Summers Plumbing Heating & Cooling', 'summers-plumbing-heating-cooling', 'skilled-trades', 'placement', 'Indianapolis', 'IN', 'active', ARRAY['HVAC Technician']),
('Service Experts',               'service-experts',               'skilled-trades', 'placement',     'Indianapolis', 'IN', 'active', ARRAY['HVAC Technician']),
('Jesse J. Wilkerson & Associates', 'jesse-j-wilkerson-associates', 'skilled-trades', 'placement',   'Indianapolis', 'IN', 'active', ARRAY['Plumbing','CAD Drafting']),
-- CDL / Transportation
('Werner Enterprises',            'werner-enterprises',            'cdl',            'placement',     'Indianapolis', 'IN', 'active', ARRAY['CDL Class A']),
('Schneider National',            'schneider-national',            'cdl',            'placement',     'Indianapolis', 'IN', 'active', ARRAY['CDL Class A']),
('FedEx Freight',                 'fedex-freight',                 'cdl',            'placement',     'Indianapolis', 'IN', 'active', ARRAY['CDL Class A']),
-- Technology
('Resultant',                     'resultant',                     'technology',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['IT Help Desk','Cybersecurity Analyst']),
('KAR Global',                    'kar-global',                    'technology',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['IT Help Desk']),
('Roche Diagnostics',             'roche-diagnostics',             'technology',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['IT Help Desk','Cybersecurity Analyst']),
('Anthem (Elevance Health)',       'anthem-elevance-health',        'technology',     'placement',     'Indianapolis', 'IN', 'active', ARRAY['Cybersecurity Analyst']),
-- Business / Admin
('City of Indianapolis',          'city-of-indianapolis',          'business',       'placement',     'Indianapolis', 'IN', 'active', ARRAY['Office Administration']),
('Goodwill of Central & Southern Indiana', 'goodwill-central-southern-indiana', 'social-services', 'placement', 'Indianapolis', 'IN', 'active', ARRAY['Office Administration']),
-- Barbershop
('Partner Barbershops in Indianapolis', 'partner-barbershops-indianapolis', 'barbershop', 'apprenticeship', 'Indianapolis', 'IN', 'active', ARRAY['Barber Apprenticeship'])
ON CONFLICT (slug) DO UPDATE SET
  name          = EXCLUDED.name,
  category      = EXCLUDED.category,
  training_role = EXCLUDED.training_role,
  status        = EXCLUDED.status,
  programs_list = EXCLUDED.programs_list,
  updated_at    = now();


