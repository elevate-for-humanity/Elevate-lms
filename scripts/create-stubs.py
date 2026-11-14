import os

stub_template = """import {{ Metadata }} from 'next';
import Link from 'next/link';

export const metadata: Metadata = {{
  title: '{title} | Elevate for Humanity',
  description: '{desc}',
}};

export default function Page() {{
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          <p className="text-xl text-blue-100">{{subtitle}}</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-600 mb-8">This page is under construction. Please check back soon.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact" className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700">Contact Us</Link>
            <Link href="/" className="px-6 py-3 border-2 border-brand-blue-600 text-brand-blue-600 font-semibold rounded-lg hover:bg-brand-blue-50">Return Home</Link>
          </div>
        </div>
      </section>
    </div>
  );
}}
"""

pages = {
    "/agencies": ("Agencies", "Workforce agency partnerships"),
    "/booth-rental/apply": ("Booth Rental", "Apply for booth rental"),
    "/career-services/career-counseling": ("Career Counseling", "One-on-one career counseling"),
    "/career-services/contact": ("Career Services Contact", "Contact career services"),
    "/career-services/courses": ("Career Courses", "Career development courses"),
    "/career-services/interview-prep": ("Interview Prep", "Interview preparation"),
    "/career-services/job-placement": ("Job Placement", "Job placement services"),
    "/career-services/resume-building": ("Resume Building", "Resume building services"),
    "/careers/assessment": ("Career Assessment", "Career assessment quiz"),
    "/docs": ("Documentation", "Platform documentation"),
    "/docs/program-holder-guide": ("Program Holder Guide", "Program holder documentation"),
    "/docs/quickstart": ("Quickstart Guide", "Get started quickly"),
    "/donate/monthly": ("Monthly Giving", "Become a monthly donor"),
    "/forms": ("Forms", "Downloadable forms"),
    "/forms/barber-apprenticeship-inquiry": ("Barber Inquiry", "Barber apprenticeship inquiry"),
    "/fssa/tpp-survey": ("TPP Survey", "FSSA transition planning survey"),
    "/impact/methodology": ("Impact Methodology", "How we measure impact"),
    "/onboarding/employer": ("Employer Onboarding", "Onboard your organization"),
    "/onboarding/instructor": ("Instructor Onboarding", "Onboard as an instructor"),
    "/partners/apply": ("Partner Application", "Apply to become a partner"),
    "/partners/barber-host-shop": ("Barber Host Shops", "Barber apprenticeship host shops"),
    "/partners/cosmetology-host-shop": ("Cosmetology Host Shops", "Cosmetology host shops"),
    "/partners/esthetician-host-shop": ("Esthetician Host Shops", "Esthetician host shops"),
    "/partners/host-shops": ("Host Shops", "All host shop partnerships"),
    "/partners/hsi": ("HSI Partner", "American Safety and Health Institute"),
    "/partners/jri": ("JRI Partner", "Job Ready Indy"),
    "/partners/nail-host-shop": ("Nail Host Shops", "Nail technician host shops"),
    "/partners/nrf": ("NRF Partner", "National Retail Federation"),
    "/partners/reentry": ("Reentry Program", "Justice reentry support"),
    "/partners/referral": ("Referral Program", "Referral partner program"),
    "/partners/workforce": ("Workforce Partners", "Workforce development partners"),
    "/pathways/outcomes": ("Pathway Outcomes", "Career pathway outcomes"),
    "/pathways/training-model": ("Training Model", "Our training approach"),
    "/programs/barber-apprenticeship/apply": ("Apply - Barber", "Apply for barber apprenticeship"),
    "/programs/barber-apprenticeship/host-shops": ("Barber Host Shops", "Find barber host shops"),
    "/programs/beauty-career-educator": ("Beauty Educator", "Beauty career educator program"),
    "/programs/cdl-training": ("CDL Training", "Commercial driver's license training"),
    "/programs/home-health-aide": ("Home Health Aide", "Home health aide certification"),
    "/programs/hvac-technician/study-guide": ("HVAC Study Guide", "HVAC study resources"),
    "/shop/products": ("Products", "Shop products"),
    "/student-support/schedule": ("Schedule Support", "Schedule student support"),
    "/suboffice-onboarding": ("Suboffice Onboarding", "Suboffice partner onboarding"),
    "/support/chat": ("Support Chat", "Live chat support"),
    "/support/contact": ("Support Contact", "Contact support"),
    "/support/help": ("Help Center", "Browse help articles"),
    "/support/ticket": ("Support Ticket", "Submit a ticket"),
    "/team": ("Our Team", "Meet the Elevate team"),
    "/updates/2026/01/program-calendar": ("Program Calendar", "January 2026 calendar"),
    "/wioa-eligibility/low-income": ("Low Income", "WIOA low income eligibility"),
    "/wioa-eligibility/public-assistance": ("Public Assistance", "WIOA public assistance"),
    "/wioa-eligibility/veterans": ("Veterans", "WIOA veterans eligibility"),
    "/wioa-participant": ("WIOA Participant", "WIOA participant info"),
    "/workforce-board/employment": ("Employment", "Workforce board employment"),
    "/writing-center": ("Writing Center", "Writing support resources"),
    "/alumni": ("Alumni", "Alumni community and resources"),
    "/apps": ("Apps", "Platform apps and integrations"),
    "/attendance-policy": ("Attendance Policy", "Student attendance requirements"),
    "/career-assessment": ("Career Assessment", "Take a career assessment quiz"),
    "/career-counseling": ("Career Counseling", "One-on-one career guidance"),
    "/career-services": ("Career Services", "Career development resources"),
    "/careers": ("Careers", "Join our team"),
    "/compliance/apprenticeship-structure": ("Apprenticeship Compliance", "RAPIDS and DOL compliance"),
    "/cosmetology-host-shop": ("Cosmetology Host Shops", "Find cosmetology host shops"),
    "/directory": ("Directory", "Find programs and resources"),
    "/donate": ("Donate", "Support workforce development"),
    "/educatorhub": ("Educator Hub", "Resources for educators"),
    "/employers/directory": ("Employer Directory", "Browse employer partners"),
    "/enrollment": ("Enrollment", "Student enrollment information"),
    "/esthetician-host-shop": ("Esthetician Host Shops", "Find esthetician host shops"),
    "/events": ("Events", "Upcoming events and webinars"),
    "/federal-compliance": ("Federal Compliance", "ETPL and federal compliance"),
    "/for-partners": ("For Partners", "Partner with Elevate"),
    "/for-students": ("For Students", "Student resources"),
    "/founder": ("Our Founder", "Meet the founder"),
    "/fssa": ("FSSA Programs", "Family and Social Services programs"),
    "/government": ("Government Partners", "Government workforce partnerships"),
    "/grants": ("Grants", "Grant programs and opportunities"),
    "/help/account": ("Account Help", "Help with your account"),
    "/help/courses": ("Course Help", "Help with courses"),
    "/help/getting-started": ("Getting Started", "Getting started guide"),
    "/help/technical": ("Technical Support", "Technical help"),
    "/help/tutorials": ("Tutorials", "Video tutorials"),
    "/host-shop/dashboard": ("Host Shop Portal", "Access the host shop dashboard"),
    "/impact": ("Impact", "Our community impact"),
    "/industries": ("Industries", "Industries we serve"),
    "/inquiry": ("Inquiry", "Send us an inquiry"),
    "/instructional-framework": ("Instructional Framework", "Our teaching approach"),
    "/jobs": ("Job Board", "Find your next career opportunity"),
    "/learning": ("Learning", "Learning resources and LMS"),
    "/license": ("License", "Platform licensing"),
    "/licenses": ("Licenses", "View licensing options"),
    "/licensing": ("Licensing", "Licensing information"),
    "/metrics": ("Metrics", "Performance metrics"),
    "/mobile": ("Mobile App", "Elevate mobile application"),
    "/mobile-app": ("Mobile App", "Elevate mobile application"),
    "/mou/employer": ("Employer MOU", "Employer memorandum of understanding"),
    "/nail-host-shop": ("Nail Host Shops", "Find nail technician host shops"),
    "/news": ("News", "Latest news and updates"),
    "/ojt-and-funding": ("OJT and Funding", "On-the-job training and funding"),
    "/orientation": ("Orientation", "Student orientation"),
    "/outcomes": ("Outcomes", "Program outcomes and results"),
    "/partners": ("Partners", "Partner with Elevate"),
    "/pathways": ("Career Pathways", "Explore career pathways"),
    "/pricing/sponsor-licensing": ("Sponsor Licensing", "Apprenticeship sponsor licensing"),
    "/program-holder/dashboard": ("Program Holder Dashboard", "Program holder portal"),
    "/programs/barber-apprenticeship": ("Barber Apprenticeship", "DOL-registered barber apprenticeship"),
    "/programs/business": ("Business Programs", "Business and professional development"),
    "/programs/catalog": ("Program Catalog", "Browse all available programs"),
    "/programs/cna": ("CNA Training", "Certified Nursing Assistant training"),
    "/programs/construction-trades-certification": ("Construction Trades", "Construction and building trades training"),
    "/programs/cpr-first-aid": ("CPR and First Aid", "CPR, AED, and First Aid training"),
    "/programs/culinary-apprenticeship": ("Culinary Apprenticeship", "Culinary arts registered apprenticeship"),
    "/programs/cybersecurity-analyst": ("Cybersecurity Analyst", "Cybersecurity certification program"),
    "/programs/diesel-mechanic": ("Diesel Mechanic", "Diesel technician training"),
    "/programs/electrical": ("Electrical Training", "Electrical trades apprenticeship prep"),
    "/programs/hvac-technician": ("HVAC Technician", "Heating and cooling technician training"),
    "/programs/it-help-desk": ("IT Help Desk", "IT support and help desk certification"),
    "/programs/medical-assistant": ("Medical Assistant", "Medical assistant certification"),
    "/programs/nail-technician-apprenticeship": ("Nail Technician Apprenticeship", "Nail tech registered apprenticeship"),
    "/programs/peer-recovery-specialist": ("Peer Recovery Specialist", "Peer recovery certification"),
    "/programs/pharmacy-technician": ("Pharmacy Technician", "Pharmacy tech certification prep"),
    "/programs/phlebotomy": ("Phlebotomy Technician", "Phlebotomy certification training"),
    "/programs/plumbing": ("Plumbing Training", "Plumbing trades apprenticeship prep"),
    "/programs/qma": ("QMA Training", "Qualified Medication Aide certification"),
    "/programs/software-development": ("Software Development", "Coding and software development"),
    "/programs/web-development": ("Web Development", "Web design and development"),
    "/programs/welding": ("Welding Training", "Welding certification programs"),
    "/reels": ("Reels", "Video content"),
    "/resources/instructor-training": ("Instructor Training", "Instructor development resources"),
    "/satisfactory-academic-progress": ("Academic Progress", "Satisfactory academic progress requirements"),
    "/schedule-consultation": ("Schedule Consultation", "Book a consultation"),
    "/schools/mesmerized-by-beauty": ("Mesmerized by Beauty", "Beauty school partner"),
    "/shop": ("Shop", "Elevate merchandise and products"),
    "/snap/snap-et": ("SNAP E&T", "SNAP Employment and Training"),
    "/student-support": ("Student Support", "Student support services"),
    "/students": ("Students", "Student resources"),
    "/support": ("Support", "Get help and support"),
    "/syllabi": ("Syllabi", "Course syllabi and schedules"),
    "/testimonials": ("Testimonials", "Graduate testimonials"),
    "/training": ("Training", "Training programs and courses"),
    "/training/certifications": ("Certifications", "Available certifications"),
    "/training/learning-center": ("Learning Center", "Learning resource center"),
    "/transparency": ("Transparency", "Organizational transparency"),
    "/tuition": ("Tuition", "Tuition and fees"),
    "/updates": ("Updates", "Latest platform updates"),
    "/volunteer": ("Volunteer", "Volunteer opportunities"),
    "/webinars": ("Webinars", "Webinars and workshops"),
    "/white-label": ("White Label", "White label platform"),
    "/wioa-eligibility": ("WIOA Eligibility", "WIOA funding eligibility"),
    "/workbooks": ("Workbooks", "Student workbooks and resources"),
    "/workforce-board": ("Workforce Board", "Workforce board partnerships"),
    "/workforce-partners": ("Workforce Partners", "Workforce development partners"),
    "/academic-calendar": ("Academic Calendar", "Program schedules and dates"),
    "/ai": ("AI Career Navigator", "AI-powered career guidance"),
    "/ai-chat": ("AI Chat", "Chat with our AI assistant"),
    "/ai-tutor": ("AI Tutor", "AI-powered learning assistance"),
    "/employment-support": ("Employment Support", "Employment support services"),
    "/for-agencies": ("For Workforce Agencies", "Partner with us to serve your clients"),
    "/for-employers": ("For Employers", "Partner with us to build your workforce"),
    "/for-providers": ("For Training Providers", "License our platform or join our network"),
    "/eligibility": ("Eligibility", "Check your funding eligibility"),
    "/scholarships": ("Scholarships", "Explore scholarship opportunities"),
    "/financing": ("Financing", "Payment plans and financing options"),
    "/contact": ("Contact", "Get in touch with our team"),
    "/apprenticeships": ("Apprenticeships", "Earn while you learn with registered apprenticeships"),
    "/courses": ("Courses", "Browse all available courses"),
}

count = 0
for route, (title, subtitle) in pages.items():
    desc = subtitle
    dir_path = f"app{route}"
    os.makedirs(dir_path, exist_ok=True)
    content = stub_template.format(title=title, subtitle=subtitle, desc=desc)
    file_path = os.path.join(dir_path, "page.tsx")
    with open(file_path, 'w') as f:
        f.write(content)
    count += 1

print(f"Created {count} stub pages")
