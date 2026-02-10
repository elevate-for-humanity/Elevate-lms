import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Award, ArrowRight, Clock, Users, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sanitation & Infection Control Apprenticeship | 2Exclusive | Elevate for Humanity',
  description: 'Specialized training in sanitation and infection control for hospitals, military bases, and government facilities. OSHA certified, hands-on experience.',
};

export default function SanitationInfectionControlPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative h-[60vh] min-h-[400px] bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-800" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <span className="inline-block px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-full mb-4">
              DOL REGISTERED APPRENTICESHIP
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Sanitation & Infection Control<br />Apprenticeship Program
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mb-8">
              Specialized training for high-risk environments including hospitals, military bases, and government facilities.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/programs/sanitation-infection-control/apply" className="inline-flex items-center px-8 py-4 bg-green-500 text-white font-bold rounded-full hover:bg-green-400">
                Apply Now <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/inquiry?program=sanitation-infection-control" className="inline-flex items-center px-8 py-4 bg-white text-slate-900 font-bold rounded-full hover:bg-slate-100">
                Request Information
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAM QUICK FACTS */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <Clock className="w-10 h-10 text-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">32 Weeks</div>
              <div className="text-slate-600">Total Duration</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <Users className="w-10 h-10 text-green-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">5 Phases</div>
              <div className="text-slate-600">Structured Training</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <Shield className="w-10 h-10 text-orange-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">4 Certs</div>
              <div className="text-slate-600">Industry Credentials</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <Award className="w-10 h-10 text-purple-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">12 Weeks</div>
              <div className="text-slate-600">Paid OJT</div>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAM DESCRIPTION */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">About the Program</h2>
          <p className="text-lg text-slate-700 mb-6">
            The 2Exclusive Apprenticeship Program is a specialized training initiative focused on equipping participants with the advanced skills required for sanitation and infection control in high-risk environments such as hospitals, military bases, and government facilities.
          </p>
          <p className="text-lg text-slate-700 mb-6">
            This program offers hands-on experience and in-depth training in areas such as OSHA compliance, holistic wellness cleaning, hazardous waste management, and infection control protocols. Apprentices will gain expertise in safely handling hazardous materials, implementing eco-friendly cleaning practices, and ensuring regulatory compliance.
          </p>
          <p className="text-lg text-slate-700">
            With a strong emphasis on both technical proficiency and holistic well-being, this apprenticeship prepares participants to meet the unique demands of critical sectors, ensuring a highly skilled workforce ready to tackle the challenges of modern sanitation and safety.
          </p>
        </div>
      </section>

      {/* CIP CODE & PREREQUISITES */}
      <section className="py-12 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Program Details</h3>
              <ul className="space-y-3 text-slate-700">
                <li><strong>CIP Code:</strong> 15.0501</li>
                <li><strong>Industry Collaboration:</strong> Yes</li>
                <li><strong>Prerequisite:</strong> High School Diploma or Equivalent</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Application Deadlines</h3>
              <p className="text-slate-700 mb-3">Applications accepted on a rolling basis with new cohorts starting every quarter:</p>
              <ul className="space-y-1 text-slate-700">
                <li>• January</li>
                <li>• April</li>
                <li>• July</li>
                <li>• October</li>
              </ul>
              <p className="text-sm text-slate-600 mt-3">Apply at least 30 days before desired start date.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PREREQUISITES DESCRIPTION */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Prerequisites</h2>
          <div className="bg-slate-50 rounded-xl p-8">
            <p className="text-slate-700 mb-4">
              Applicants must have a high school diploma or equivalent. Candidates should have a willingness to learn infection control, sanitation procedures, and eco-friendly cleaning techniques.
            </p>
            <p className="text-slate-700 mb-4">
              While prior experience in janitorial, environmental services, or healthcare cleaning services is preferred, it is not required.
            </p>
            <p className="text-slate-700">
              Selected apprentices will undergo background checks and may need to complete OSHA 10 or OSHA 30 safety certification during the program.
            </p>
          </div>
        </div>
      </section>

      {/* TRAINING PHASES */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Training Curriculum - 5 Phases</h2>
          
          {/* Phase 1 */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-xl font-bold">1</div>
              <div>
                <h3 className="text-2xl font-bold">Introduction to Sanitation and Infection Control</h3>
                <p className="text-slate-400">Duration: 4 Weeks</p>
              </div>
            </div>
            <p className="text-slate-300 mb-4">Provide foundational knowledge and skills in sanitation, infection control, and regulatory compliance.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Introduction to Sanitation</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Overview of sanitation in healthcare and military environments</li>
                  <li>• Understanding the role of infection control</li>
                  <li>• Basic cleaning protocols and techniques</li>
                </ul>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">OSHA Compliance</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• OSHA standards and regulations</li>
                  <li>• Identifying and managing workplace hazards</li>
                  <li>• PPE usage and safety measures</li>
                </ul>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Infection Control Protocols</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Standard precautions and isolation protocols</li>
                  <li>• Disinfectants, antiseptics, and sterilization</li>
                  <li>• Cross-contamination and decontamination</li>
                </ul>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">High-Risk Environments</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Cleaning procedures in hospitals and military settings</li>
                  <li>• Specific sanitation needs in healthcare facilities</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-xl font-bold">2</div>
              <div>
                <h3 className="text-2xl font-bold">Advanced Cleaning Techniques and Holistic Wellness</h3>
                <p className="text-slate-400">Duration: 6 Weeks</p>
              </div>
            </div>
            <p className="text-slate-300 mb-4">Build proficiency in advanced cleaning techniques, with a focus on holistic wellness and eco-friendly practices.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Advanced Infection Control</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Infection control in critical care areas (ICUs, operating rooms)</li>
                  <li>• Biohazardous waste and spill containment</li>
                  <li>• Proper disinfection and sterilization processes</li>
                </ul>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Holistic Wellness Cleaning</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Eco-friendly and non-toxic cleaning solutions</li>
                  <li>• Reducing environmental stressors</li>
                  <li>• Air quality and allergen management</li>
                </ul>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Preventative Strategies</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Proactive sanitation practices</li>
                  <li>• Continuous disinfection in high-touch areas</li>
                  <li>• Anti-microbial treatments</li>
                </ul>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Green Cleaning</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Green cleaning products and methods</li>
                  <li>• Sustainable cleaning benefits</li>
                  <li>• Environmental impact comparison</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-xl font-bold">3</div>
              <div>
                <h3 className="text-2xl font-bold">Hazardous Waste Management and Specialized Cleaning</h3>
                <p className="text-slate-400">Duration: 8 Weeks</p>
              </div>
            </div>
            <p className="text-slate-300 mb-4">Train apprentices in hazardous waste cleaning protocols, handling dangerous materials, and ensuring compliance with safety regulations.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Hazardous Waste Management</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Types of hazardous waste (biological, chemical, radioactive)</li>
                  <li>• Legal and regulatory requirements</li>
                  <li>• Hazardous materials identification</li>
                </ul>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Biohazardous Materials</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Handling bloodborne pathogens and sharps</li>
                  <li>• Proper disposal methods</li>
                  <li>• Cleaning contaminated equipment</li>
                </ul>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Military & Healthcare Protocols</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Specific hazardous waste protocols</li>
                  <li>• Decontamination procedures</li>
                  <li>• Emergency response plans</li>
                </ul>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Chemical Safety</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Handling hazardous chemicals safely</li>
                  <li>• Waste minimization strategies</li>
                  <li>• Recycling and safe disposal</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Phase 4 */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-xl font-bold">4</div>
              <div>
                <h3 className="text-2xl font-bold">On-the-Job Training and Real-World Applications</h3>
                <p className="text-slate-400">Duration: 12 Weeks (Paid)</p>
              </div>
            </div>
            <p className="text-slate-300 mb-4">Provide practical, hands-on experience in healthcare, military, and government facility environments under the guidance of experienced mentors.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Real-World Practice</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Daily sanitation routines in hospitals and military facilities</li>
                  <li>• Application of infection control procedures</li>
                  <li>• Biohazard handling in real-life scenarios</li>
                </ul>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Emergency Response</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Supervised hazardous waste cleanup</li>
                  <li>• Simulated emergency response drills</li>
                  <li>• Contamination response procedures</li>
                </ul>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Facility Inspections</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Conducting sanitation audits</li>
                  <li>• Identifying areas for improvement</li>
                  <li>• Implementing corrective actions</li>
                </ul>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Soft Skills</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Effective communication with facility staff</li>
                  <li>• Customer service in high-stress environments</li>
                  <li>• Reporting and documentation practices</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Phase 5 */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-xl font-bold">5</div>
              <div>
                <h3 className="text-2xl font-bold">Certification and Final Evaluation</h3>
                <p className="text-slate-400">Duration: 2 Weeks</p>
              </div>
            </div>
            <p className="text-slate-300 mb-4">Prepare apprentices for certification and assess their overall readiness for the workforce.</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Knowledge Assessment</h4>
                <p className="text-sm text-slate-400">Written and practical exams covering OSHA compliance, infection control, hazardous waste cleaning, and wellness cleaning techniques.</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Hands-on Demonstration</h4>
                <p className="text-sm text-slate-400">Demonstrate competence in handling real-world cleaning tasks and hazardous waste protocols under supervision.</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Certification</h4>
                <p className="text-sm text-slate-400">Receive certification in infection control, OSHA compliance, hazardous waste management, and holistic wellness cleaning.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CREDENTIALS */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Certifications You'll Earn</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">OSHA 10/30</h3>
              <p className="text-sm text-slate-600">Workplace safety certification required for all sanitation professionals.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Infection Control</h3>
              <p className="text-sm text-slate-600">Certified in infection prevention and control protocols for healthcare settings.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Hazardous Waste</h3>
              <p className="text-sm text-slate-600">HAZMAT certified for handling and disposing of hazardous materials.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Holistic Wellness</h3>
              <p className="text-sm text-slate-600">Certified in eco-friendly and wellness-focused cleaning practices.</p>
            </div>
          </div>
        </div>
      </section>

      {/* INSTRUCTOR QUALIFICATIONS */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Instructor Qualifications</h2>
          <div className="bg-white rounded-xl p-8">
            <p className="text-slate-700 mb-4">
              All facility members must possess at least three to five years of professional experience in military or institutional cleaning. They are required to hold valid safety and compliance certifications such as OSHA 10/30, HAZMAT, or Certified Environmental Technician credentials.
            </p>
            <p className="text-slate-700 mb-4">
              Instructors should also demonstrate strong expertise in infection control, regulatory compliance, and holistic wellness cleaning practices. Previous experience in adult education or apprenticeship instruction is preferred.
            </p>
            <p className="text-slate-700">
              A high school diploma or equivalent is required, and an associate degree in a related field is highly recommended.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">What environments will I be trained to work in?</h3>
              <p className="text-slate-700">You'll be trained for high-risk environments including hospitals, military bases, government facilities, and other healthcare settings requiring specialized sanitation.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">Do I need prior cleaning experience?</h3>
              <p className="text-slate-700">No, prior experience is preferred but not required. You need a high school diploma or equivalent and a willingness to learn infection control and sanitation procedures.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">Will I get paid during training?</h3>
              <p className="text-slate-700">Yes! Phase 4 includes 12 weeks of paid on-the-job training where you work in real healthcare and military facilities under mentor supervision.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">When can I start?</h3>
              <p className="text-slate-700">New cohorts start every quarter (January, April, July, October). Apply at least 30 days before your desired start date for processing and eligibility verification.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Career in Sanitation & Infection Control?</h2>
          <p className="text-xl text-slate-300 mb-8">Join the 2Exclusive Apprenticeship Program and become a certified professional in high-demand sanitation services.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/programs/sanitation-infection-control/apply" className="inline-flex items-center justify-center px-8 py-4 bg-green-500 text-white font-bold rounded-full hover:bg-green-400">
              Apply Now <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/inquiry?program=sanitation-infection-control" className="inline-flex items-center justify-center px-8 py-4 bg-slate-700 text-white font-bold rounded-full hover:bg-slate-600 border border-slate-600">
              Request Information
            </Link>
          </div>
          <p className="mt-8 text-sm text-slate-400">
            Questions? Call (317) 314-3757 or email elevate4humanityedu@gmail.com
          </p>
        </div>
      </section>
    </main>
  );
}
