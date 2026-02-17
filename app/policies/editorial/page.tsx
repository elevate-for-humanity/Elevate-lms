export const dynamic = 'force-dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Editorial Policy | Elevate for Humanity',
  description: 'Standards for published content, editorial review processes, and content quality guidelines.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/editorial',
  },
};

export default function EditorialPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Editorial" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Editorial Policy</h1>
            <p className="text-sm text-gray-600">Last Updated: January 12, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              This Editorial Policy establishes standards for content published by Elevate for Humanity, including 
              website content, blog posts, course materials, communications, and marketing materials. These guidelines 
              ensure accuracy, clarity, consistency, and professionalism in all published content.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Editorial Standards</h2>
            
            <div className="bg-brand-blue-50 rounded-xl p-6 border-2 border-brand-blue-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Core Principles</h3>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>Accuracy:</strong> All information must be factually correct and verified</li>
                <li><strong>Clarity:</strong> Content should be clear, concise, and easily understood</li>
                <li><strong>Accessibility:</strong> Written for diverse audiences with varying literacy levels</li>
                <li><strong>Integrity:</strong> Honest, transparent, and ethical in all communications</li>
                <li><strong>Respect:</strong> Inclusive language that respects all individuals and groups</li>
                <li><strong>Professionalism:</strong> Maintains institutional reputation and credibility</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Content Types</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Educational Content</h3>
            <p className="text-black mb-4">
              Course materials, curricula, and instructional content must:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Be pedagogically sound and evidence-based</li>
              <li>Align with learning objectives</li>
              <li>Include proper citations and references</li>
              <li>Be reviewed by subject matter experts</li>
              <li>Meet accessibility standards (WCAG 2.1)</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Marketing and Communications</h3>
            <p className="text-black mb-4">
              Promotional materials must:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Be truthful and not misleading</li>
              <li>Accurately represent programs and outcomes</li>
              <li>Include required disclosures</li>
              <li>Comply with advertising regulations</li>
              <li>Maintain brand consistency</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Blog and News Content</h3>
            <p className="text-black mb-4">
              Blog posts and news articles must:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Provide value to readers</li>
              <li>Be well-researched and fact-checked</li>
              <li>Include author attribution</li>
              <li>Distinguish opinion from fact</li>
              <li>Link to credible sources</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Editorial Process</h2>
            
            <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200 mb-6">
              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Content Creation</h3>
                    <p className="text-black">
                      Author creates content following editorial guidelines and style guide.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Peer Review</h3>
                    <p className="text-black">
                      Subject matter expert reviews for accuracy and completeness.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Editorial Review</h3>
                    <p className="text-black">
                      Editor reviews for clarity, style, grammar, and compliance with guidelines.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Approval</h3>
                    <p className="text-black">
                      Final approval from appropriate authority (department head, director, etc.).
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-red-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    5
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Publication</h3>
                    <p className="text-black">
                      Content published and monitored for accuracy and relevance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Writing Style</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Voice and Tone</h3>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>Professional yet approachable:</strong> Maintain credibility while being accessible</li>
              <li><strong>Active voice:</strong> Use active voice for clarity and directness</li>
              <li><strong>Positive and encouraging:</strong> Focus on opportunities and solutions</li>
              <li><strong>Inclusive:</strong> Use language that welcomes all individuals</li>
              <li><strong>Consistent:</strong> Maintain consistent voice across all content</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Language Guidelines</h3>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Use plain language; avoid jargon when possible</li>
              <li>Define technical terms when necessary</li>
              <li>Use person-first language (e.g., "person with disability" not "disabled person")</li>
              <li>Avoid gendered language; use they/them when appropriate</li>
              <li>Be culturally sensitive and aware</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Fact-Checking and Verification</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Required Verification</h3>
            <p className="text-black mb-4">
              All factual claims must be verified through:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Primary sources when available</li>
              <li>Credible secondary sources</li>
              <li>Official data and statistics</li>
              <li>Expert consultation</li>
              <li>Multiple source confirmation for critical facts</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Citations and Attribution</h3>
            <p className="text-black mb-6">
              Properly cite all sources using appropriate citation style (APA, MLA, Chicago). Include links 
              to online sources. Give credit to original authors and creators.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Corrections and Updates</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Error Correction</h3>
            <p className="text-black mb-4">
              When errors are discovered:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Correct immediately</li>
              <li>Note correction with date (for significant errors)</li>
              <li>Notify affected parties if necessary</li>
              <li>Review process to prevent similar errors</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Content Updates</h3>
            <p className="text-black mb-6">
              Content should be reviewed and updated regularly to ensure accuracy and relevance. Include 
              "Last Updated" dates on time-sensitive content.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Legal and Ethical Considerations</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Copyright and Fair Use</h3>
            <p className="text-black mb-6">
              Respect intellectual property rights. Only use copyrighted material with permission or under 
              fair use. See our Copyright Policy for details.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Privacy and Confidentiality</h3>
            <p className="text-black mb-6">
              Protect student and employee privacy. Do not publish personally identifiable information without 
              consent. Follow FERPA and privacy regulations.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Conflicts of Interest</h3>
            <p className="text-black mb-6">
              Disclose any conflicts of interest. Maintain editorial independence from commercial interests.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Editorial Team</h2>
            <p className="text-black mb-4">
              For editorial questions or submissions:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Email:</strong> info@elevateforhumanity.org</li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>Office Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST</li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/content" className="text-brand-blue-600 hover:underline">Content Policy</a></li>
                <li><a href="/policies/copyright" className="text-brand-blue-600 hover:underline">Copyright Policy</a></li>
                <li><a href="/policies/privacy" className="text-brand-blue-600 hover:underline">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
