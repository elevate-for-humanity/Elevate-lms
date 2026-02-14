import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Content Moderation Policy | Elevate for Humanity',
  description: 'Content moderation standards, enforcement procedures, and appeal processes for platform content.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/moderation',
  },
};

export default function ModerationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Moderation" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Content Moderation Policy</h1>
            <p className="text-sm text-gray-600">Last Updated: January 12, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              This Content Moderation Policy establishes how we review, moderate, and enforce standards for 
              user-generated content on Elevate for Humanity platforms. Our goal is to maintain a safe, 
              respectful, and productive learning environment while respecting freedom of expression.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">What We Moderate</h2>
            
            <div className="bg-brand-blue-50 rounded-xl p-6 border-2 border-brand-blue-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Content Subject to Moderation</h3>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li>Discussion forum posts and comments</li>
                <li>Course submissions and assignments</li>
                <li>Profile information and photos</li>
                <li>Messages and communications</li>
                <li>Reviews and feedback</li>
                <li>User-uploaded files and media</li>
                <li>Any publicly visible content</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Moderation Standards</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Prohibited Content</h3>
            <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-6">
              <p className="text-black mb-4">
                Content will be removed if it contains:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>Illegal Content:</strong> Violates laws or promotes illegal activities</li>
                <li><strong>Hate Speech:</strong> Attacks individuals or groups based on protected characteristics</li>
                <li><strong>Harassment:</strong> Bullying, threats, or targeted abuse</li>
                <li><strong>Violence:</strong> Graphic violence, gore, or threats of harm</li>
                <li><strong>Sexual Content:</strong> Pornography or sexually explicit material</li>
                <li><strong>Spam:</strong> Repetitive, unsolicited, or commercial content</li>
                <li><strong>Misinformation:</strong> Deliberately false or misleading information</li>
                <li><strong>Privacy Violations:</strong> Sharing others' private information</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Restricted Content</h3>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <p className="text-black mb-4">
                Content may be flagged, hidden, or require review:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li>Profanity or vulgar language</li>
                <li>Controversial or sensitive topics</li>
                <li>Political or religious content (if disruptive)</li>
                <li>Off-topic discussions</li>
                <li>Self-promotion or advertising</li>
                <li>Copyrighted material without permission</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Moderation Methods</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Automated Moderation</h3>
            <p className="text-black mb-4">
              We use automated systems to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Filter spam and obvious violations</li>
              <li>Detect prohibited keywords and patterns</li>
              <li>Flag potentially problematic content for review</li>
              <li>Block known malicious links or files</li>
              <li>Identify duplicate or repetitive content</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Human Moderation</h3>
            <p className="text-black mb-4">
              Trained moderators review:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Flagged content from automated systems</li>
              <li>User-reported content</li>
              <li>High-risk content types</li>
              <li>Appeals and disputes</li>
              <li>Context-dependent situations</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Community Reporting</h3>
            <p className="text-black mb-4">
              Users can report content through:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>"Report" button on content</li>
              <li>Email to moderation team</li>
              <li>Contact form</li>
              <li>Direct message to moderators</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Moderation Process</h2>
            
            <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200 mb-6">
              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Detection</h3>
                    <p className="text-black">
                      Content flagged by automated systems, user reports, or proactive monitoring.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Review</h3>
                    <p className="text-black">
                      Moderator reviews content against policy standards. Considers context, intent, and severity.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Action</h3>
                    <p className="text-black">
                      Appropriate enforcement action taken based on violation severity and user history.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Notification</h3>
                    <p className="text-black">
                      User notified of action taken, reason, and appeal rights (if applicable).
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    5
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Documentation</h3>
                    <p className="text-black">
                      Action logged for record-keeping and pattern analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Enforcement Actions</h2>
            
            <div className="bg-green-50 border-l-4 border-green-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Content-Level Actions</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><strong>Content Removal:</strong> Deleted from platform</li>
                <li><strong>Content Hidden:</strong> Visible only to author and moderators</li>
                <li><strong>Content Edited:</strong> Problematic portions removed</li>
                <li><strong>Content Flagged:</strong> Warning label added</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">User-Level Actions</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><strong>Warning:</strong> Notification of violation</li>
                <li><strong>Posting Restriction:</strong> Limited posting frequency or features</li>
                <li><strong>Temporary Suspension:</strong> 1-30 days unable to post</li>
                <li><strong>Permanent Ban:</strong> Indefinite loss of posting privileges</li>
                <li><strong>Account Termination:</strong> Complete account closure</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Factors Considered</h3>
            <p className="text-black mb-4">
              When determining enforcement action:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Severity of violation</li>
              <li>Intent (accidental vs. deliberate)</li>
              <li>User's history and prior violations</li>
              <li>Harm caused or potential harm</li>
              <li>Context and circumstances</li>
              <li>User's response and cooperation</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Appeals Process</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">How to Appeal</h3>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>Submit appeal within 5 business days of action</li>
              <li>Explain why you believe action was incorrect</li>
              <li>Provide any relevant context or evidence</li>
              <li>Appeal reviewed by different moderator</li>
              <li>Decision rendered within 3-5 business days</li>
            </ol>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Appeal Outcomes</h3>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>Upheld:</strong> Original decision stands</li>
              <li><strong>Overturned:</strong> Content restored, action reversed</li>
              <li><strong>Modified:</strong> Lesser action applied</li>
              <li><strong>Escalated:</strong> Referred to senior moderators</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Moderator Guidelines</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Moderator Standards</h3>
            <p className="text-black mb-4">
              Our moderators are trained to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Apply policies consistently and fairly</li>
              <li>Consider context and nuance</li>
              <li>Respect user privacy and dignity</li>
              <li>Avoid bias and conflicts of interest</li>
              <li>Document decisions clearly</li>
              <li>Escalate complex cases appropriately</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Moderator Accountability</h3>
            <p className="text-black mb-6">
              Moderators are subject to oversight and quality review. Users can report moderator misconduct 
              to elevate4humanityedu@gmail.com.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Transparency</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Moderation Reports</h3>
            <p className="text-black mb-6">
              We publish quarterly transparency reports including:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Number of content items reviewed</li>
              <li>Types of violations found</li>
              <li>Actions taken</li>
              <li>Appeal statistics</li>
              <li>Response times</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Special Circumstances</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Emergency Situations</h3>
            <p className="text-black mb-6">
              Content involving immediate safety threats (violence, self-harm, child safety) is prioritized 
              and may result in immediate action and law enforcement notification.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Legal Requests</h3>
            <p className="text-black mb-6">
              We comply with valid legal requests for content removal or user information. See our Privacy 
              Policy for details on legal disclosures.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Moderation Team</h2>
            <p className="text-black mb-4">
              For moderation questions, reports, or appeals:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Email:</strong> elevate4humanityedu@gmail.com</li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>Report Button:</strong> Available on all content</li>
              <li><strong>Response Time:</strong> 24-48 hours for most reports</li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/content" className="text-brand-blue-600 hover:underline">Content Policy</a></li>
                <li><a href="/policies/community-guidelines" className="text-brand-blue-600 hover:underline">Community Guidelines</a></li>
                <li><a href="/policies/acceptable-use" className="text-brand-blue-600 hover:underline">Acceptable Use Policy</a></li>
                <li><a href="/policies/student-code" className="text-brand-blue-600 hover:underline">Student Code of Conduct</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
