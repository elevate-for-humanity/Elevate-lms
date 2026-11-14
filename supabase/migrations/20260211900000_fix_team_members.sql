-- Fix team_members table with real data
-- Replace fake "Mitchy Mayes" with Elizabeth Greene and update team photos

-- Clear existing fake team data
DELETE FROM team_members;

-- Insert real team data with actual images from repository
INSERT INTO team_members (name, title, department, bio, image_url, display_order, is_active) VALUES
(
  'Elizabeth Greene', 
  'Founder & CEO', 
  'leadership', 
  'Elizabeth Greene founded Elevate for Humanity in 2019 with a mission to create pathways out of poverty and into prosperity for those who need it most. Under her leadership, Elevate has grown into a U.S. Department of Labor Registered Apprenticeship Sponsor and Indiana DWD Approved Training Provider, serving thousands of participants across Indianapolis.

Elizabeth''s approach combines workforce development expertise with a deep commitment to serving justice-involved individuals, low-income families, veterans, and anyone facing barriers to employment. She believes that everyone deserves access to quality career training regardless of their background.', 
  '/images/team/founder/elizabeth-greene-founder-hero-01.jpg', 
  1, 
  true
),
(
  'Training Team',
  'Certified Instructors',
  'instructors',
  'Our training department consists of industry-certified professionals with real-world experience in healthcare, skilled trades, and professional services. Each instructor brings hands-on expertise and a commitment to student success.',
  '/images/team-new/team-1.jpg',
  2,
  true
),
(
  'Career Services',
  'Career Counselors',
  'staff',
  'Our career services team provides resume writing, interview preparation, job search assistance, and direct connections to hiring employers. We are dedicated to helping every graduate find meaningful employment.',
  '/images/team-new/team-2.jpg',
  3,
  true
),
(
  'Student Support',
  'Enrollment Advisors',
  'staff',
  'Our enrollment advisors guide students through the application process, help navigate funding options, and provide ongoing support throughout their training journey.',
  '/images/team-new/team-3.jpg',
  4,
  true
),
(
  'Operations Team',
  'Administration & Compliance',
  'admin',
  'Our administrative team ensures smooth operations, maintains compliance with all regulatory requirements, and supports the infrastructure that makes our programs possible.',
  '/images/team-new/team-4.jpg',
  5,
  true
);
