import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Community Guidelines | Elevate for Humanity',
  description: 'Standards for respectful interaction, behavior expectations, and community participation guidelines.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/community-guidelines',
  },
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Community Guidelines" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Community Guidelines</h1>
            <p className="text-sm text-gray-600">Last Updated: January 11, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              These Community Guidelines establish standards for respectful interaction and behavior within the 
              Elevate for Humanity community. We are committed to creating a safe, inclusive, and supportive 
              environment where all members can learn, grow, and succeed together.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Our Community Values</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
                <h3 className="text-xl font-bold text-black mb-3">Respect</h3>
                <p className="text-black">
                  Treat all community members with dignity and respect, regardless of background, identity, 
                  or perspective. Value diverse experiences and viewpoints.
                </p>
              </div>

              <div className="bg-brand-green-50 rounded-lg p-6 border-2 border-brand-green-200">
                <h3 className="text-xl font-bold text-black mb-3">Inclusivity</h3>
                <p className="text-black">
                  Welcome and support all members. Create an environment where everyone feels valued, 
                  heard, and able to participate fully.
                </p>
              </div>

              <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
                <h3 className="text-xl font-bold text-black mb-3">Support</h3>
                <p className="text-black">
                  Help and encourage fellow community members. Share knowledge, offer assistance, 
                  and celebrate each other's successes.
                </p>
              </div>

              <div className="bg-brand-orange-50 rounded-lg p-6 border-2 border-brand-orange-200">
                <h3 className="text-xl font-bold text-black mb-3">Professionalism</h3>
                <p className="text-black">
                  Maintain professional conduct in all interactions. Communicate thoughtfully and 
                  constructively, even in disagreement.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Expected Behaviors</h2>
            
            <div className="bg-brand-green-50 rounded-xl p-6 border-2 border-brand-green-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Do:</h3>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>Be Respectful:</strong> Use kind and considerate language in all communications</li>
                <li><strong>Be Inclusive:</strong> Welcome new members and help them feel part of the community</li>
                <li><strong>Be Constructive:</strong> Offer helpful feedback and suggestions</li>
                <li><strong>Be Supportive:</strong> Encourage others and celebrate their achievements</li>
                <li><strong>Be Professional:</strong> Maintain appropriate boundaries and conduct</li>
                <li><strong>Be Honest:</strong> Communicate truthfully and authentically</li>
                <li><strong>Be Accountable:</strong> Take responsibility for your words and actions</li>
                <li><strong>Be Open-Minded:</strong> Listen to and consider different perspectives</li>
                <li><strong>Ask Questions:</strong> Seek clarification when needed</li>
                <li><strong>Share Knowledge:</strong> Help others learn and grow</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Prohibited Behaviors</h2>
            
            <div className="bg-brand-red-50 border-l-4 border-brand-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Harassment and Discrimination</h3>
              <p className="text-black mb-2">Absolutely prohibited:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Harassment, bullying, or intimidation of any kind</li>
                <li>Discrimination based on race, ethnicity, national origin, religion, gender, sexual orientation, disability, age, or any protected characteristic</li>
                <li>Hate speech or slurs targeting individuals or groups</li>
                <li>Sexual harassment or unwelcome sexual advances</li>
                <li>Stalking or persistent unwanted contact</li>
                <li>Threats of violence or harm</li>
              </ul>
            </div>

            <div className="bg-brand-orange-50 border-l-4 border-brand-orange-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Disruptive Behavior</h3>
              <p className="text-black mb-2">Do not:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Personal attacks or insults directed at individuals</li>
                <li>Trolling, baiting, or deliberately inflammatory comments</li>
                <li>Spam or repetitive posting</li>
                <li>Off-topic or irrelevant content in discussions</li>
                <li>Excessive self-promotion or advertising</li>
                <li>Disrupting classes, events, or community activities</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Inappropriate Content</h3>
              <p className="text-black mb-2">Do not post or share:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Sexually explicit or pornographic content</li>
                <li>Graphic violence or gore</li>
                <li>Content promoting illegal activities</li>
                <li>Misinformation or deliberately false information</li>
                <li>Private or confidential information about others</li>
                <li>Copyrighted material without permission</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Communication Guidelines</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Online Interactions</h3>
            <p className="text-black mb-4">
              When participating in online forums, discussions, and social media:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Use clear, respectful language</li>
              <li>Stay on topic and contribute meaningfully</li>
              <li>Respect others' time and attention</li>
              <li>Proofread before posting</li>
              <li>Use appropriate channels for different types of communication</li>
              <li>Respect privacy - don't share others' personal information</li>
              <li>Give credit when sharing others' ideas or work</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">In-Person Interactions</h3>
            <p className="text-black mb-4">
              When interacting in classrooms, labs, and campus spaces:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Arrive on time and prepared</li>
              <li>Listen actively when others are speaking</li>
              <li>Participate constructively in discussions</li>
              <li>Respect personal space and boundaries</li>
              <li>Keep noise levels appropriate for the environment</li>
              <li>Clean up after yourself in shared spaces</li>
              <li>Follow facility rules and instructor guidelines</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Conflict Resolution</h2>
            
            <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">If You Experience or Witness Violations</h3>
              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    1
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-black mb-2">Address Directly (if safe)</h4>
                    <p className="text-black">
                      If you feel comfortable, politely address the behavior with the person directly. 
                      They may not realize their impact.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-black mb-2">Report to Staff</h4>
                    <p className="text-black">
                      Contact an instructor, advisor, or administrator. All reports are taken seriously 
                      and handled confidentially.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    3
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-black mb-2">Use Reporting Channels</h4>
                    <p className="text-black">
                      Submit a report through the student portal, email info@elevateforhumanity.org, 
                      or call (317) 314-3757.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    4
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-black mb-2">Emergency Situations</h4>
                    <p className="text-black">
                      For immediate safety concerns, call 911 first, then notify campus security 
                      at (317) 314-3757 ext. 911.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Consequences for Violations</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Minor Violations</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Verbal or written warning</li>
                <li>Content removal from platforms</li>
                <li>Required meeting with staff</li>
                <li>Community guidelines training</li>
              </ul>
            </div>

            <div className="bg-brand-orange-50 border-l-4 border-brand-orange-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Moderate Violations</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Temporary suspension from community platforms (1-30 days)</li>
                <li>Restriction from certain activities or events</li>
                <li>Formal written warning in student file</li>
                <li>Required conflict resolution or counseling</li>
                <li>Academic probation</li>
              </ul>
            </div>

            <div className="bg-brand-red-50 border-l-4 border-brand-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Severe Violations</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Permanent ban from community platforms</li>
                <li>Suspension or dismissal from program</li>
                <li>Revocation of credentials</li>
                <li>Legal action if applicable</li>
                <li>Law enforcement notification for criminal behavior</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Special Considerations</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Freedom of Expression</h3>
            <p className="text-black mb-6">
              We support open dialogue and diverse perspectives. However, freedom of expression does not 
              protect harassment, threats, discrimination, or speech that creates a hostile environment 
              for others. Disagreement is welcome; disrespect is not.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Cultural Sensitivity</h3>
            <p className="text-black mb-6">
              Our community includes people from diverse cultural backgrounds. Be mindful that communication 
              styles, humor, and social norms vary across cultures. When in doubt, err on the side of 
              respect and ask for clarification.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Mental Health and Well-being</h3>
            <p className="text-black mb-6">
              If you're struggling with mental health, stress, or personal challenges, reach out for support. 
              We have counseling services and resources available. Taking care of your well-being helps you 
              be a better community member.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Reporting and Privacy</h2>
            <p className="text-black mb-4">
              When you report a violation:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Reports are handled confidentially to the extent possible</li>
              <li>You will not face retaliation for good-faith reports</li>
              <li>We investigate all reports thoroughly and fairly</li>
              <li>You may be contacted for additional information</li>
              <li>Outcomes may be limited by privacy laws</li>
              <li>Anonymous reporting is available but may limit investigation</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Appeals</h2>
            <p className="text-black mb-4">
              If you receive consequences for guideline violations, you may appeal:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>Submit written appeal within 5 business days</li>
              <li>Include explanation and any supporting evidence</li>
              <li>Appeal reviewed by Community Standards Committee</li>
              <li>Decision rendered within 10 business days</li>
              <li>Committee decision is final</li>
            </ol>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Information</h2>
            <p className="text-black mb-4">
              For questions, concerns, or to report violations:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Email:</strong> info@elevateforhumanity.org</li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>Office Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST</li>
              <li><strong>Anonymous Reporting:</strong> Available through student portal</li>
              <li><strong>Emergency:</strong> Call 911, then (317) 314-3757 ext. 911</li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/student-code" className="text-brand-blue-600 hover:underline">Student Code of Conduct</a></li>
                <li><a href="/policies/acceptable-use" className="text-brand-blue-600 hover:underline">Acceptable Use Policy</a></li>
                <li><a href="/policies/moderation" className="text-brand-blue-600 hover:underline">Content Moderation Policy</a></li>
                <li><a href="/policies/privacy" className="text-brand-blue-600 hover:underline">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
