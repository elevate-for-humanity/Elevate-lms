
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Copyright Policy | Elevate for Humanity',
  description: 'Protection of intellectual property, fair use guidelines, and DMCA compliance procedures.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/copyright',
  },
};

export default function CopyrightPage() {

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Copyright" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Copyright Policy</h1>
            <p className="text-sm text-gray-600">Last Updated: January 11, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              This Copyright Policy explains the intellectual property rights related to content on Elevate for 
              Humanity platforms, including our materials, user-generated content, and third-party content. We 
              respect intellectual property rights and expect our community to do the same.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Our Copyrighted Materials</h2>
            
            <div className="bg-brand-blue-50 rounded-xl p-6 border-2 border-brand-blue-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">What We Own</h3>
              <p className="text-black mb-4">
                Unless otherwise noted, all content on Elevate for Humanity platforms is owned by or licensed to us:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li>Course materials, curricula, and lesson plans</li>
                <li>Videos, presentations, and multimedia content</li>
                <li>Text, graphics, logos, and images</li>
                <li>Software, code, and platform functionality</li>
                <li>Assessments, quizzes, and evaluation materials</li>
                <li>Documentation and training materials</li>
                <li>Website design and layout</li>
              </ul>
              <p className="text-black mt-4">
                <strong>Copyright Notice:</strong> © 2026 Elevate for Humanity. All rights reserved.
              </p>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Permitted Uses</h3>
            <p className="text-black mb-4">
              Students and authorized users may:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Access and view materials for personal educational use</li>
              <li>Download materials for offline study (where permitted)</li>
              <li>Print materials for personal reference</li>
              <li>Share materials within authorized course groups</li>
              <li>Quote brief excerpts with proper attribution</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Prohibited Uses</h3>
            <div className="bg-brand-red-50 rounded-lg p-6 border-2 border-brand-red-200 mb-6">
              <p className="text-black mb-4">
                You may NOT:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li>Reproduce, distribute, or sell our materials</li>
                <li>Modify or create derivative works without permission</li>
                <li>Remove copyright notices or watermarks</li>
                <li>Share materials with non-enrolled individuals</li>
                <li>Post materials on public websites or file-sharing services</li>
                <li>Use materials for commercial purposes</li>
                <li>Reverse engineer software or platforms</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">User-Generated Content</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Your Rights</h3>
            <p className="text-black mb-4">
              When you create and post content on our platforms:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>You retain copyright ownership</strong> of your original work</li>
              <li><strong>You control</strong> how your work is used outside our platforms</li>
              <li><strong>You can delete</strong> your content at any time (subject to backups)</li>
              <li><strong>You receive credit</strong> for your work when displayed</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">License You Grant Us</h3>
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 mb-6">
              <p className="text-black mb-4">
                By posting content, you grant Elevate for Humanity a:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>Non-exclusive license:</strong> We don't own your content exclusively</li>
                <li><strong>Worldwide license:</strong> Can be displayed globally</li>
                <li><strong>Royalty-free license:</strong> No payment required for use</li>
                <li><strong>Sublicensable license:</strong> Can allow others to view/use</li>
                <li><strong>Transferable license:</strong> Continues if platform ownership changes</li>
              </ul>
              <p className="text-black mt-4">
                This license allows us to:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li>Display your content on our platforms</li>
                <li>Distribute to other authorized users</li>
                <li>Create backups and copies for technical purposes</li>
                <li>Modify for formatting or technical compatibility</li>
                <li>Use in promotional materials (with your permission)</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Your Responsibilities</h3>
            <p className="text-black mb-4">
              When posting content, you represent that:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>You own the content or have permission to post it</li>
              <li>The content doesn't infringe others' intellectual property</li>
              <li>You have rights to grant the license described above</li>
              <li>The content complies with all applicable laws</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Third-Party Content</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Licensed Materials</h3>
            <p className="text-black mb-4">
              Some content on our platforms is licensed from third parties:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Textbooks and educational publishers</li>
              <li>Video and multimedia providers</li>
              <li>Software and tool vendors</li>
              <li>Stock photos and graphics</li>
            </ul>
            <p className="text-black mb-6">
              These materials are subject to their own copyright and licensing terms. Use only as authorized.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Open Educational Resources (OER)</h3>
            <p className="text-black mb-6">
              We use some openly licensed educational materials. These are typically licensed under Creative 
              Commons or similar licenses. Check individual materials for specific licensing terms.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Fair Use in Education</h2>
            
            <div className="bg-brand-green-50 rounded-xl p-6 border-2 border-brand-green-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Educational Fair Use</h3>
              <p className="text-black mb-4">
                Fair use allows limited use of copyrighted materials for educational purposes without permission. 
                Factors considered:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>Purpose:</strong> Nonprofit educational use favors fair use</li>
                <li><strong>Nature:</strong> Factual works more likely fair use than creative works</li>
                <li><strong>Amount:</strong> Using small portions favors fair use</li>
                <li><strong>Effect:</strong> Not harming market for original favors fair use</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Fair Use Guidelines</h3>
            <p className="text-black mb-4">
              When using copyrighted materials under fair use:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Use only what's necessary for educational purpose</li>
              <li>Provide proper attribution and citations</li>
              <li>Don't distribute beyond the class or course</li>
              <li>Don't use if licensed version is reasonably available</li>
              <li>Don't create course packs or compilations without permission</li>
              <li>When in doubt, seek permission or use alternatives</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">DMCA Compliance</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Digital Millennium Copyright Act</h3>
            <p className="text-black mb-6">
              We comply with the DMCA and respond to valid copyright infringement notices. We also respect 
              the DMCA safe harbor provisions for user-generated content.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Filing a DMCA Notice</h3>
            <p className="text-black mb-4">
              If you believe content on our platform infringes your copyright, send a written notice to our 
              DMCA agent including:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li><strong>Your contact information:</strong> Name, address, phone, email</li>
              <li><strong>Identification of copyrighted work:</strong> Describe the work being infringed</li>
              <li><strong>Location of infringing material:</strong> URL or specific location on our platform</li>
              <li><strong>Good faith statement:</strong> State you believe use is not authorized</li>
              <li><strong>Accuracy statement:</strong> Declare information is accurate under penalty of perjury</li>
              <li><strong>Authorization:</strong> Physical or electronic signature of copyright owner or agent</li>
            </ol>

            <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200 mb-6">
              <h4 className="text-lg font-bold text-black mb-3">DMCA Agent Contact</h4>
              <ul className="list-none text-black space-y-2">
                <li><strong>Email:</strong> <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a></li>
                <li><strong>Mail:</strong> DMCA Agent, Elevate for Humanity</li>
                <li className="ml-6">8888 Keystone Crossing, Suite 1300</li>
                <li className="ml-6">Indianapolis, IN 46240</li>
                <li><strong>Phone:</strong> (317) 314-3757</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Counter-Notice</h3>
            <p className="text-black mb-4">
              If your content was removed due to a DMCA notice and you believe it was removed in error, 
              you may file a counter-notice including:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>Your contact information</li>
              <li>Identification of removed content and its location</li>
              <li>Statement under penalty of perjury that removal was mistake or misidentification</li>
              <li>Consent to jurisdiction of federal court</li>
              <li>Your physical or electronic signature</li>
            </ol>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Repeat Infringer Policy</h3>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <p className="text-black mb-4">
                We maintain a policy for repeat copyright infringers:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>First offense:</strong> Content removal and warning</li>
                <li><strong>Second offense:</strong> Temporary suspension (30 days)</li>
                <li><strong>Third offense:</strong> Permanent account termination</li>
              </ul>
              <p className="text-black mt-4">
                Severe or willful infringement may result in immediate termination.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Trademarks</h2>
            <p className="text-black mb-4">
              Elevate for Humanity trademarks include:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Elevate for Humanity name and logo</li>
              <li>Program names and branding</li>
              <li>Slogans and taglines</li>
              <li>Service marks</li>
            </ul>
            <p className="text-black mb-6">
              Use of our trademarks requires written permission. Contact our contact form 
              for trademark licensing inquiries.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Attribution Requirements</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Citing Our Materials</h3>
            <p className="text-black mb-4">
              When citing Elevate for Humanity materials:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 mb-6">
              <p className="text-black font-mono text-sm">
                Elevate for Humanity. (2026). [Course/Material Title]. Retrieved from 
                https://www.elevateforhumanity.org/[url]
              </p>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Citing Others' Work</h3>
            <p className="text-black mb-4">
              Always provide proper attribution when using others' work:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Include author name, title, source, and date</li>
              <li>Use appropriate citation style (APA, MLA, Chicago, etc.)</li>
              <li>Link to original source when possible</li>
              <li>Clearly distinguish quoted material from your own work</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Questions and Permissions</h2>
            <p className="text-black mb-4">
              For copyright questions or permission requests:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>General Questions:</strong> our contact form</li>
              <li><strong>DMCA Notices:</strong> our contact form</li>
              <li><strong>Permission Requests:</strong> our contact form</li>
              <li><strong>Trademark Licensing:</strong> our contact form</li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/content" className="text-brand-blue-600 hover:underline">Content Policy</a></li>
                <li><a href="/policies/academic-integrity" className="text-brand-blue-600 hover:underline">Academic Integrity Policy</a></li>
                <li><a href="/policies/acceptable-use" className="text-brand-blue-600 hover:underline">Acceptable Use Policy</a></li>
                <li><a href="/terms-of-service" className="text-brand-blue-600 hover:underline">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
