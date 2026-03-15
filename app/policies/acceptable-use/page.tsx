
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy | Elevate for Humanity',
  description: 'Guidelines for appropriate use of technology, learning resources, and platform services.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/acceptable-use',
  },
};

export default function AcceptableUsePage() {

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Acceptable Use" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Acceptable Use Policy</h1>
            <p className="text-sm text-gray-600">Last Updated: January 11, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              This Acceptable Use Policy establishes guidelines for appropriate use of Elevate for Humanity's 
              technology resources, learning platforms, equipment, and services. These guidelines protect our 
              community, ensure system security, and maintain a productive learning environment for all users.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Scope</h2>
            <p className="text-black mb-4">This policy applies to:</p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>All students, staff, instructors, and authorized users</li>
              <li>Learning management system (LMS) and online platforms</li>
              <li>Computer labs, equipment, and devices</li>
              <li>Internet and network access</li>
              <li>Email and communication systems</li>
              <li>Software, applications, and digital resources</li>
              <li>Physical facilities and equipment</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Acceptable Uses</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Educational Activities</h3>
            <p className="text-black mb-4">Technology and resources may be used for:</p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Completing coursework, assignments, and assessments</li>
              <li>Accessing learning materials and educational content</li>
              <li>Participating in online classes and discussions</li>
              <li>Conducting research related to your program</li>
              <li>Communicating with instructors and classmates about coursework</li>
              <li>Accessing career services and job placement resources</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Professional Development</h3>
            <p className="text-black mb-4">Authorized uses include:</p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Building professional portfolios and resumes</li>
              <li>Searching for employment opportunities</li>
              <li>Networking with industry professionals</li>
              <li>Accessing certification and licensing resources</li>
              <li>Participating in professional development activities</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Administrative Activities</h3>
            <p className="text-black mb-4">Appropriate administrative uses:</p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Accessing student records and account information</li>
              <li>Submitting required documentation and forms</li>
              <li>Communicating with administrative staff</li>
              <li>Managing enrollment and workforce funding</li>
              <li>Scheduling appointments and services</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Prohibited Uses</h2>

            <div className="bg-brand-red-50 border-l-4 border-brand-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Illegal Activities</h3>
              <p className="text-black mb-2">Strictly prohibited:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Accessing, storing, or distributing illegal content</li>
                <li>Pirating software, media, or copyrighted materials</li>
                <li>Hacking, cracking, or unauthorized system access</li>
                <li>Identity theft or fraud</li>
                <li>Cyberbullying, harassment, or threats</li>
                <li>Any activity that violates local, state, or federal law</li>
              </ul>
            </div>

            <div className="bg-brand-orange-50 border-l-4 border-brand-orange-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Security Violations</h3>
              <p className="text-black mb-2">Prohibited security activities:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Sharing passwords or login credentials</li>
                <li>Accessing another user's account without permission</li>
                <li>Attempting to bypass security measures</li>
                <li>Installing unauthorized software or applications</li>
                <li>Connecting unauthorized devices to the network</li>
                <li>Downloading or distributing malware, viruses, or malicious code</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Inappropriate Content</h3>
              <p className="text-black mb-2">Do not access, create, or distribute:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Pornographic or sexually explicit material</li>
                <li>Hate speech or discriminatory content</li>
                <li>Violent or graphic content</li>
                <li>Content promoting illegal activities</li>
                <li>Spam, chain letters, or unsolicited advertising</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">System Abuse</h3>
            <p className="text-black mb-4">Prohibited system activities:</p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Excessive use that degrades system performance</li>
              <li>Monopolizing resources (bandwidth, storage, equipment)</li>
              <li>Running unauthorized servers or services</li>
              <li>Cryptocurrency mining or similar resource-intensive activities</li>
              <li>Deliberately introducing system vulnerabilities</li>
              <li>Interfering with other users' access or work</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Commercial Activities</h3>
            <p className="text-black mb-4">Unauthorized commercial uses:</p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Operating a business using our resources</li>
              <li>Selling products or services to other users</li>
              <li>Advertising or promoting commercial ventures</li>
              <li>Using resources for personal financial gain</li>
              <li>Fundraising without prior authorization</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">User Responsibilities</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Account Security</h3>
            <p className="text-black mb-4">Users must:</p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Keep passwords confidential and secure</li>
              <li>Use strong, unique passwords</li>
              <li>Log out when finished using shared computers</li>
              <li>Report suspected security breaches immediately</li>
              <li>Not share accounts or allow others to use your credentials</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Equipment Care</h3>
            <p className="text-black mb-4">When using equipment:</p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Handle all equipment with care</li>
              <li>Report damage or malfunctions immediately</li>
              <li>Do not remove equipment from designated areas</li>
              <li>Do not eat or drink near computers or equipment</li>
              <li>Leave workstations clean and organized</li>
              <li>Follow all posted rules and instructions</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Respectful Use</h3>
            <p className="text-black mb-4">Maintain a respectful environment:</p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Respect others' privacy and personal space</li>
              <li>Keep noise levels appropriate for the environment</li>
              <li>Be considerate of others waiting to use resources</li>
              <li>Follow time limits on shared equipment</li>
              <li>Communicate professionally in all online interactions</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Monitoring and Privacy</h2>
            <p className="text-black mb-4">
              Elevate for Humanity reserves the right to monitor use of technology resources to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Ensure compliance with this policy</li>
              <li>Maintain system security and performance</li>
              <li>Investigate suspected violations</li>
              <li>Comply with legal requirements</li>
              <li>Protect the safety and rights of our community</li>
            </ul>
            <p className="text-black mb-6">
              Users should have no expectation of privacy when using institutional technology resources. 
              All activity may be logged and reviewed.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Consequences for Violations</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Minor Violations</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Verbal or written warning</li>
                <li>Temporary suspension of access (1-7 days)</li>
                <li>Required meeting with IT or administrative staff</li>
                <li>Mandatory technology use training</li>
              </ul>
            </div>

            <div className="bg-brand-orange-50 border-l-4 border-brand-orange-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Serious Violations</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Extended suspension of access (1-6 months)</li>
                <li>Academic probation</li>
                <li>Financial responsibility for damages</li>
                <li>Referral to Student Conduct Committee</li>
                <li>Possible program suspension</li>
              </ul>
            </div>

            <div className="bg-brand-red-50 border-l-4 border-brand-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Severe Violations</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Permanent revocation of access privileges</li>
                <li>Dismissal from program</li>
                <li>Legal action and law enforcement referral</li>
                <li>Financial liability for all damages and costs</li>
                <li>Permanent ban from all facilities and services</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Reporting Violations</h2>
            <p className="text-black mb-4">
              Report suspected policy violations or security concerns:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Email:</strong> <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a></li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>In-Person:</strong> IT Help Desk or Administrative Office</li>
              <li><strong>Anonymous:</strong> Use the online reporting form in student portal</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Technical Support</h2>
            <p className="text-black mb-4">
              For technical assistance or questions about acceptable use:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>IT Help Desk:</strong> our contact form</li>
              <li><strong>Phone:</strong> (317) 314-3757 ext. 2</li>
              <li><strong>Hours:</strong> Monday-Friday, 8:00 AM - 6:00 PM EST</li>
              <li><strong>Location:</strong> Main Campus, Room 105</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Policy Updates</h2>
            <p className="text-black mb-6">
              This policy may be updated to reflect changes in technology, legal requirements, or institutional 
              needs. Users will be notified of significant changes via email and the student portal. Continued 
              use of technology resources constitutes acceptance of policy updates.
            </p>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/academic-integrity" className="text-brand-blue-600 hover:underline">Academic Integrity Policy</a></li>
                <li><a href="/policies/student-code" className="text-brand-blue-600 hover:underline">Student Code of Conduct</a></li>
                <li><a href="/privacy-policy" className="text-brand-blue-600 hover:underline">Privacy Policy</a></li>
                <li><a href="/policies/copyright" className="text-brand-blue-600 hover:underline">Copyright Policy</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
