import Image from "next/image";
import Link from "next/link";

const teamMembers = [
  {
    name: "Elizabeth Greene",
    title: "Founder & Chief Executive Officer",
    image: "/images/team/elizabeth-greene-headshot.jpg",
    bio: "U.S. military veteran, IRS Enrolled Agent (EA), EFIN and PTIN holder, EPA 608 Certified Proctor (ESCO Group & Mainstream Engineering). Elizabeth founded Elevate for Humanity to connect people to funded workforce training. She also operates SupersonicFastCash, a tax preparation software company. Elevate for Humanity is a DOL Registered Apprenticeship Sponsor, ETPL listed, WRG approved, WIOA and JRI approved, EmployIndy partner, Milady curriculum partner, NRF Rise Up provider, Certiport CATC, Choice Medical CNA School partner, PECOS enrolled (Medicare provider), NPI registered, ITAP/INDOT registered, Indiana State Bidder, CAGE code registered, and ByBlack certified (NAACP).",
  },
  {
    name: "Jozanna George",
    title: "Director of Enrollment & Beauty Industry Programs | Site Coordinator, Textures Institute of Cosmetology",
    image: "/images/jozanna-george.jpg",
    bio: "Jozanna is a multi-licensed beauty professional holding Nail Technician, Nail Instructor, and Esthetician licenses. She oversees the nail program at Textures Institute of Cosmetology and manages enrollment operations for Elevate for Humanity.",
  },
  {
    name: "Dr. Carlina Wilkes",
    title: "Executive Director of Financial Operations & Organizational Compliance",
    image: "/images/carlina-wilkes.jpg",
    bio: "Dr. Wilkes brings 24+ years of federal experience with DFAS, holding DoD Financial Management Certification Level II. She oversees financial operations and compliance at Elevate for Humanity.",
  },
  {
    name: "Sharon Douglass",
    title: "Respiratory Therapy & Health Informatics Specialist",
    image: "/images/sharon-douglas.jpg",
    bio: "Sharon brings 30+ years as a Respiratory Therapist with a Master's in Health Informatics. She supports healthcare training programs and workforce readiness initiatives.",
  },
  {
    name: "Leslie Wafford",
    title: "Director of Community Services",
    image: "/images/leslie-wafford.jpg",
    bio: "Leslie promotes low-barrier housing access and eviction prevention, helping families navigate housing challenges with her 'reach one, teach one' philosophy.",
  },
  {
    name: "Alina Smith, PMHNP",
    title: "Psychiatric Mental Health Nurse Practitioner",
    image: "/images/alina-smith.jpg",
    bio: "Alina is a board-certified PMHNP from Purdue University, providing mental health assessments, interventions, and medication management for program participants.",
  },
  {
    name: "Delores Reynolds",
    title: "Social Media & Digital Engagement Coordinator",
    image: "/images/delores-reynolds.jpg",
    bio: "Delores manages digital communications, sharing student success stories and promoting program offerings to reach those who can benefit from free training.",
  },
];

export default function TeamSection() {
  return (
    <section className="py-20   ">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-teal-600 uppercase tracking-wide mb-3">
            Our Team
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Meet the People Behind the Mission
          </h2>
          <p className="text-xl text-black max-w-3xl mx-auto">
            Our dedicated team works every day to connect individuals with life-changing career opportunities through free workforce training.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image - Professional Headshot Size */}
              <div className="relative h-64 overflow-hidden bg-slate-100">
                <Image alt="Team member" loading="lazy"
                  src={member.image}
                  alt={`${member.name} - ${member.title}`}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-black mb-2">
                  {member.name}
                </h3>
                <p className="text-sm font-semibold text-teal-600 mb-3">
                  {member.title}
                </p>
                <p className="text-sm text-black leading-relaxed">
                  {member.bio}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-black mb-6">
            Want to join our mission to elevate communities through workforce development?
          </p>
          <Link
            href="/careers"
            className="inline-flex items-center justify-center px-8 py-4 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-lg hover:shadow-xl"
          >
            View Career Opportunities
          </Link>
        </div>
      </div>
    </section>
  );
}
