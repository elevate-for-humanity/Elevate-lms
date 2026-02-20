
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Content Policy | Elevate for Humanity',
  description: 'Guidelines for user-generated content, intellectual property rights, and content standards on our platforms.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/content',
  },
};

export default function ContentPage() {

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Content" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Content Policy</h1>
            <p className="text-sm text-gray-600">Last Updated: January 11, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              This Content Policy governs user-generated content on Elevate for Humanity platforms, including 
              discussion forums, social media, course submissions, and any other content created or shared by 
              users. These guidelines ensure our platforms remain educational, respectful, and legally compliant.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Scope</h2>
            <p className="text-black mb-4">
              This policy applies to all content posted, uploaded, or shared on:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Learning management system (LMS) and course platforms</li>
              <li>Discussion forums and message boards</li>
              <li>Social media pages and groups</li>
              <li>Student portfolios and project showcases</li>
              <li>Comments, reviews, and feedback</li>
              <li>Any other Elevate for Humanity digital properties</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Acceptable Content</h2>
            
            <div className="bg-brand-green-50 rounded-xl p-6 border-2 border-brand-green-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Encouraged Content</h3>
              <p className="text-black mb-4">We welcome content that is:</p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>Educational:</strong> Shares knowledge, insights, or learning resources</li>
                <li><strong>Supportive:</strong> Encourages and helps fellow community members</li>
                <li><strong>Constructive:</strong> Offers helpful feedback and suggestions</li>
                <li><strong>Relevant:</strong> Relates to education, career development, or community topics</li>
                <li><strong>Original:</strong> Your own work or properly attributed content</li>
                <li><strong>Respectful:</strong> Maintains professional and courteous tone</li>
                <li><strong>Accurate:</strong> Factual and truthful information</li>
                <li><strong>Inclusive:</strong> Welcomes diverse perspectives and experiences</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Prohibited Content</h2>
            
            <div className="bg-brand-red-50 border-l-4 border-brand-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Illegal Content</h3>
              <p className="text-black mb-2">Absolutely prohibited:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Content that violates local, state, or federal laws</li>
                <li>Pirated software, media, or copyrighted materials</li>
                <li>Instructions for illegal activities</li>
                <li>Child sexual abuse material (CSAM)</li>
                <li>Content promoting terrorism or violence</li>
                <li>Stolen personal information or credentials</li>
              </ul>
            </div>

            <div className="bg-brand-orange-50 border-l-4 border-brand-orange-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Harmful Content</h3>
              <p className="text-black mb-2">Do not post:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Hate speech or content targeting protected groups</li>
                <li>Harassment, bullying, or threats</li>
                <li>Sexually explicit or pornographic material</li>
                <li>Graphic violence or gore</li>
                <li>Content promoting self-harm or suicide</li>
                <li>Dangerous misinformation (health, safety, etc.)</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Spam and Manipulation</h3>
              <p className="text-black mb-2">Prohibited activities:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Spam, repetitive posting, or flooding</li>
                <li>Unsolicited advertising or commercial promotion</li>
                <li>Phishing or scam attempts</li>
                <li>Malware, viruses, or malicious links</li>
                <li>Vote manipulation or fake engagement</li>
                <li>Impersonation of others</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Intellectual Property Rights</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Your Content</h3>
            <p className="text-black mb-4">
              When you post content on our platforms:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>You retain ownership</strong> of your original content</li>
              <li><strong>You grant us a license</strong> to display, distribute, and use your content on our platforms</li>
              <li><strong>You represent</strong> that you have the right to post the content</li>
              <li><strong>You are responsible</strong> for ensuring your content doesn't infringe others' rights</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Others' Content</h3>
            <p className="text-black mb-4">
              When using content created by others:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Always provide proper attribution and citations</li>
              <li>Only use content you have permission to use</li>
              <li>Respect copyright, trademarks, and other intellectual property</li>
              <li>Follow fair use guidelines for educational purposes</li>
              <li>Link to original sources when possible</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">License Grant</h3>
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 mb-6">
              <p className="text-black mb-4">
                By posting content, you grant Elevate for Humanity a non-exclusive, worldwide, royalty-free 
                license to:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li>Display your content on our platforms</li>
                <li>Distribute your content to other users</li>
                <li>Create derivative works for platform functionality</li>
                <li>Use your content for promotional or educational purposes</li>
              </ul>
              <p className="text-black mt-4">
                This license ends when you delete your content, except for content that has been shared 
                or copied by others.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Content Standards</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Quality Standards</h3>
            <p className="text-black mb-4">
              Content should meet these quality standards:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>Clear and Readable:</strong> Use proper grammar, spelling, and formatting</li>
              <li><strong>Relevant:</strong> Stay on topic and contribute meaningfully</li>
              <li><strong>Accurate:</strong> Verify facts and cite sources</li>
              <li><strong>Complete:</strong> Provide sufficient context and information</li>
              <li><strong>Appropriate:</strong> Suitable for educational environment</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Accessibility</h3>
            <p className="text-black mb-4">
              When creating content, consider accessibility:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Provide alt text for images</li>
              <li>Use clear, descriptive link text</li>
              <li>Include captions or transcripts for audio/video</li>
              <li>Use sufficient color contrast</li>
              <li>Structure content with proper headings</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Content Moderation</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Our Rights</h3>
            <p className="text-black mb-4">
              Elevate for Humanity reserves the right to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Review all user-generated content</li>
              <li>Remove content that violates this policy</li>
              <li>Edit content for formatting or technical reasons</li>
              <li>Restrict or suspend users who violate policies</li>
              <li>Report illegal content to authorities</li>
              <li>Preserve content for legal or safety reasons</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Moderation Process</h3>
            <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200 mb-6">
              <p className="text-black mb-4">
                Content may be moderated through:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>Automated Systems:</strong> AI and filters detect prohibited content</li>
                <li><strong>User Reports:</strong> Community members flag concerning content</li>
                <li><strong>Staff Review:</strong> Human moderators review flagged content</li>
                <li><strong>Proactive Monitoring:</strong> Regular review of high-traffic areas</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Reporting Violations</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">How to Report</h3>
            <p className="text-black mb-4">
              If you encounter content that violates this policy:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Use the "Report" button on the content (if available)</li>
              <li>Email our contact form with details</li>
              <li>Call (317) 314-3757 for urgent concerns</li>
              <li>Include link to content and reason for report</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">What Happens Next</h3>
            <p className="text-black mb-4">
              After you report content:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>We review the report within 24-48 hours</li>
              <li>Content may be temporarily hidden during review</li>
              <li>We determine if content violates policies</li>
              <li>Appropriate action is taken (removal, warning, etc.)</li>
              <li>Reporter may receive confirmation (privacy permitting)</li>
            </ol>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Consequences for Violations</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">First Violation</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Content removal</li>
                <li>Warning notification</li>
                <li>Required review of content policy</li>
              </ul>
            </div>

            <div className="bg-brand-orange-50 border-l-4 border-brand-orange-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Repeated Violations</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Temporary suspension from posting (1-30 days)</li>
                <li>Restriction from certain features</li>
                <li>Formal written warning</li>
                <li>Required meeting with staff</li>
              </ul>
            </div>

            <div className="bg-brand-red-50 border-l-4 border-brand-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Severe Violations</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Permanent ban from platforms</li>
                <li>Account termination</li>
                <li>Dismissal from program</li>
                <li>Legal action if applicable</li>
                <li>Law enforcement notification</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Copyright Infringement</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">DMCA Compliance</h3>
            <p className="text-black mb-4">
              We comply with the Digital Millennium Copyright Act (DMCA). If you believe content infringes 
              your copyright:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>Send written notice to our DMCA agent</li>
              <li>Include required information (see Copyright Policy)</li>
              <li>We will investigate and take appropriate action</li>
              <li>Infringing content will be removed if claim is valid</li>
            </ol>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Appeals</h2>
            <p className="text-black mb-4">
              If your content is removed or you face consequences:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>Submit appeal within 5 business days</li>
              <li>Explain why you believe the decision was incorrect</li>
              <li>Provide any supporting evidence</li>
              <li>Appeal reviewed by Content Review Committee</li>
              <li>Decision rendered within 10 business days</li>
            </ol>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Information</h2>
            <p className="text-black mb-4">
              For questions about content policy or to report violations:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Email:</strong> <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a></li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>DMCA Agent:</strong> <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a></li>
              <li><strong>Office Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST</li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/copyright" className="text-brand-blue-600 hover:underline">Copyright Policy</a></li>
                <li><a href="/policies/community-guidelines" className="text-brand-blue-600 hover:underline">Community Guidelines</a></li>
                <li><a href="/policies/moderation" className="text-brand-blue-600 hover:underline">Moderation Policy</a></li>
                <li><a href="/policies/acceptable-use" className="text-brand-blue-600 hover:underline">Acceptable Use Policy</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
