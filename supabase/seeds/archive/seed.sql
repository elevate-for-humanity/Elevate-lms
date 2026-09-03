-- Seed data for Elevate for Humanity

-- Insert sample programs
INSERT INTO public.programs (slug, name, description, category, duration_weeks, price, partner_name, certification, level, avg_salary, is_active) VALUES
('cybersecurity', 'Cybersecurity Fundamentals', 'Learn to protect digital assets and networks from cyber threats. High-demand field with excellent salary potential.', 'Technology', 14, 525.00, 'CompTIA', 'CompTIA Security+', 'Intermediate', 65000, true),
('cloud-computing', 'Cloud Computing with AWS', 'Master AWS, Azure, and Google Cloud platforms. Essential skills for modern IT infrastructure.', 'Technology', 12, 450.00, 'AWS', 'AWS Certified Cloud Practitioner', 'Intermediate', 70000, true),
('healthcare-cna', 'Certified Nursing Assistant (CNA)', 'CNA and Home Health Aide certification programs. Make a difference in healthcare.', 'Healthcare', 7, 375.00, 'State Board', 'CNA Certification', 'Beginner', 35000, true),
('electrical-trades', 'Electrical Systems', 'Electrical systems installation and maintenance. Essential trade with strong job security.', 'Skilled Trades', 18, 750.00, 'IBEW', 'IBEW Electrical Certificate', 'Intermediate', 55000, true),
('construction', 'Construction Fundamentals', 'Building and construction fundamentals. Hands-on training for a growing industry.', 'Skilled Trades', 14, 525.00, 'NCCER', 'NCCER Core Certificate', 'Beginner', 45000, true),
('beauty-wellness', 'Cosmetology', 'Beauty and wellness services training. Creative career with flexible opportunities.', 'Beauty & Wellness', 22, 375.00, 'Milady', 'Cosmetology License', 'Beginner', 30000, true),
('data-science', 'Data Science & Analytics', 'Learn data analysis, visualization, and machine learning fundamentals.', 'Technology', 16, 600.00, 'Microsoft', 'Azure Data Scientist Associate', 'Advanced', 85000, true),
('web-development', 'Full Stack Web Development', 'Build modern web applications with React, Node.js, and databases.', 'Technology', 20, 450.00, 'Industry Standard', 'Full Stack Developer Certificate', 'Intermediate', 75000, true);

-- Insert sample courses for Cybersecurity program
INSERT INTO public.courses (program_id, title, description, order_index, duration_hours, is_published)
SELECT id, 'Introduction to Cybersecurity', 'Overview of cybersecurity concepts, threats, and career paths', 1, 8, true
FROM public.programs WHERE slug = 'cybersecurity';

INSERT INTO public.courses (program_id, title, description, order_index, duration_hours, is_published)
SELECT id, 'Network Security Fundamentals', 'Learn about network protocols, firewalls, and security architecture', 2, 12, true
FROM public.programs WHERE slug = 'cybersecurity';

INSERT INTO public.courses (program_id, title, description, order_index, duration_hours, is_published)
SELECT id, 'Threat Detection and Response', 'Identify and respond to security threats and incidents', 3, 10, true
FROM public.programs WHERE slug = 'cybersecurity';

-- Insert sample courses for Cloud Computing program
INSERT INTO public.courses (program_id, title, description, order_index, duration_hours, is_published)
SELECT id, 'Cloud Computing Basics', 'Introduction to cloud services, deployment models, and providers', 1, 6, true
FROM public.programs WHERE slug = 'cloud-computing';

INSERT INTO public.courses (program_id, title, description, order_index, duration_hours, is_published)
SELECT id, 'AWS Core Services', 'Deep dive into EC2, S3, RDS, and other essential AWS services', 2, 14, true
FROM public.programs WHERE slug = 'cloud-computing';

INSERT INTO public.courses (program_id, title, description, order_index, duration_hours, is_published)
SELECT id, 'Cloud Security and Best Practices', 'Secure your cloud infrastructure and follow industry standards', 3, 8, true
FROM public.programs WHERE slug = 'cloud-computing';

-- Insert sample lessons for first Cybersecurity course
INSERT INTO public.lessons (course_id, title, content, order_index, duration_minutes, is_published)
SELECT id, 'What is Cybersecurity?', 'Understanding the fundamentals of cybersecurity and why it matters in today''s digital world.', 1, 30, true
FROM public.courses WHERE title = 'Introduction to Cybersecurity' LIMIT 1;

INSERT INTO public.lessons (course_id, title, content, order_index, duration_minutes, is_published)
SELECT id, 'Common Cyber Threats', 'Learn about malware, phishing, ransomware, and other common threats.', 2, 45, true
FROM public.courses WHERE title = 'Introduction to Cybersecurity' LIMIT 1;

INSERT INTO public.lessons (course_id, title, content, order_index, duration_minutes, is_published)
SELECT id, 'Career Paths in Cybersecurity', 'Explore different roles and opportunities in the cybersecurity field.', 3, 30, true
FROM public.courses WHERE title = 'Introduction to Cybersecurity' LIMIT 1;

-- Insert sample lessons for first Cloud Computing course
INSERT INTO public.lessons (course_id, title, content, order_index, duration_minutes, is_published)
SELECT id, 'Introduction to Cloud Computing', 'What is cloud computing and how does it work?', 1, 25, true
FROM public.courses WHERE title = 'Cloud Computing Basics' LIMIT 1;

INSERT INTO public.lessons (course_id, title, content, order_index, duration_minutes, is_published)
SELECT id, 'Cloud Service Models', 'Understanding IaaS, PaaS, and SaaS models.', 2, 35, true
FROM public.courses WHERE title = 'Cloud Computing Basics' LIMIT 1;

INSERT INTO public.lessons (course_id, title, content, order_index, duration_minutes, is_published)
SELECT id, 'Major Cloud Providers', 'Overview of AWS, Azure, and Google Cloud Platform.', 3, 40, true
FROM public.courses WHERE title = 'Cloud Computing Basics' LIMIT 1;
