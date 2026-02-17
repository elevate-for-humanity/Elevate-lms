import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'AI Usage Policy | Elevate for Humanity',
  description: 'Guidelines for appropriate use of AI tools and tutors in coursework and learning activities.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/ai-usage',
  },
};

export default function AIUsagePage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Ai Usage" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">AI Usage Policy</h1>
            <p className="text-sm text-gray-600">Last Updated: January 11, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              This policy establishes guidelines for appropriate use of artificial intelligence (AI) tools, 
              including our AI tutor and other AI-powered learning resources. AI can be a valuable learning 
              aid when used responsibly, but must not replace genuine learning or violate academic integrity.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">AI Tools Available</h2>
            
            <div className="bg-brand-blue-50 rounded-xl p-6 border-2 border-brand-blue-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Elevate AI Tutor</h3>
              <p className="text-black mb-4">
                Our AI tutor is available 24/7 to support your learning:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li>Answer questions about course concepts</li>
                <li>Explain difficult topics in different ways</li>
                <li>Provide practice problems and examples</li>
                <li>Offer study strategies and tips</li>
                <li>Help with time management and organization</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">External AI Tools</h3>
            <p className="text-black mb-4">
              Students may encounter other AI tools such as ChatGPT, Claude, Bard, and others. Use of 
              external AI tools must comply with this policy and instructor guidelines.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Acceptable Uses</h2>
            
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Learning Support</h3>
              <p className="text-black mb-4">AI tools may be used for:</p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>Concept Clarification:</strong> Ask AI to explain concepts you don't understand</li>
                <li><strong>Study Assistance:</strong> Generate practice questions or flashcards</li>
                <li><strong>Brainstorming:</strong> Explore ideas and approaches to problems</li>
                <li><strong>Research Starting Point:</strong> Get overview of topics before deeper research</li>
                <li><strong>Grammar and Writing Help:</strong> Check grammar, suggest improvements (not write for you)</li>
                <li><strong>Code Debugging:</strong> Help identify errors in your code (with disclosure)</li>
                <li><strong>Language Translation:</strong> Translate materials for better understanding</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Prohibited Uses</h2>
            
            <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Academic Dishonesty</h3>
              <p className="text-black mb-2">Strictly prohibited:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Having AI complete assignments, essays, or projects for you</li>
                <li>Submitting AI-generated content as your own work</li>
                <li>Using AI during exams or assessments (unless explicitly permitted)</li>
                <li>Having AI write code that you submit without understanding</li>
                <li>Using AI to paraphrase sources without proper citation</li>
                <li>Bypassing plagiarism detection with AI rewording</li>
              </ul>
            </div>

            <div className="bg-orange-50 border-l-4 border-orange-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Misuse of AI Systems</h3>
              <p className="text-black mb-2">Do not:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Attempt to manipulate or "jailbreak" AI systems</li>
                <li>Use AI to generate inappropriate or harmful content</li>
                <li>Share AI-generated answers with other students</li>
                <li>Use AI to harass, bully, or impersonate others</li>
                <li>Overload systems with excessive or frivolous requests</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Disclosure Requirements</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">When to Disclose AI Use</h3>
            <p className="text-black mb-4">
              You must disclose AI use when:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Submitting any work that involved AI assistance</li>
              <li>AI helped generate ideas, outlines, or structure</li>
              <li>AI was used for research or information gathering</li>
              <li>AI assisted with editing, proofreading, or translation</li>
              <li>AI helped debug code or solve technical problems</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">How to Disclose</h3>
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 mb-6">
              <p className="text-black mb-4">
                Include a statement with your submission:
              </p>
              <div className="bg-white p-4 rounded border-2 border-gray-300 mb-4">
                <p className="text-black italic">
                  "I used [AI tool name] to [specific use]. I reviewed and verified all AI-generated 
                  content and take full responsibility for the accuracy and originality of my work."
                </p>
              </div>
              <p className="text-black">
                Example: "I used ChatGPT to help brainstorm project ideas and explain the concept of 
                recursion. All code and written analysis is my own work."
              </p>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Instructor Guidelines</h2>
            <p className="text-black mb-4">
              Instructors may set specific AI policies for their courses:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>AI-Prohibited Assignments:</strong> Some assignments may not allow any AI use</li>
              <li><strong>AI-Assisted Assignments:</strong> Some may encourage AI use with disclosure</li>
              <li><strong>AI-Required Assignments:</strong> Some may require AI tool exploration</li>
            </ul>
            <p className="text-black mb-6">
              Always follow your instructor's specific guidelines. When in doubt, ask before using AI.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Best Practices</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Using AI Effectively</h3>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>Verify Information:</strong> AI can make mistakes. Always verify facts and code</li>
              <li><strong>Understand, Don't Copy:</strong> Use AI to learn, not to avoid learning</li>
              <li><strong>Ask Follow-Up Questions:</strong> Dig deeper to truly understand concepts</li>
              <li><strong>Compare Multiple Sources:</strong> Don't rely solely on AI responses</li>
              <li><strong>Document Your Process:</strong> Keep track of how AI helped your learning</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Critical Thinking</h3>
            <p className="text-black mb-4">
              Remember that AI:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Can provide incorrect or outdated information</li>
              <li>May reflect biases in its training data</li>
              <li>Cannot replace human judgment and expertise</li>
              <li>Should be one tool among many in your learning</li>
              <li>Works best when you already understand the basics</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Consequences for Violations</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">First Offense</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Zero on the assignment</li>
                <li>Required meeting with instructor</li>
                <li>AI usage training module</li>
                <li>Written warning in student file</li>
              </ul>
            </div>

            <div className="bg-orange-50 border-l-4 border-orange-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Second Offense</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Failure of the course</li>
                <li>Academic probation</li>
                <li>Referral to Academic Integrity Committee</li>
                <li>Possible suspension from AI tool access</li>
              </ul>
            </div>

            <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Severe or Repeated Violations</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Dismissal from program</li>
                <li>Permanent revocation of AI tool access</li>
                <li>Notation on academic transcript</li>
                <li>No refund of tuition or fees</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">AI Literacy Training</h2>
            <p className="text-black mb-4">
              All students must complete AI literacy training covering:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>How AI tools work and their limitations</li>
              <li>Appropriate and inappropriate uses</li>
              <li>Disclosure requirements and citation</li>
              <li>Critical evaluation of AI-generated content</li>
              <li>Ethical considerations in AI use</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Questions and Support</h2>
            <p className="text-black mb-4">
              For questions about AI usage:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Email:</strong> info@elevateforhumanity.org</li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>AI Tutor Help:</strong> Available 24/7 in student portal</li>
              <li><strong>Office Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST</li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/academic-integrity" className="text-brand-blue-600 hover:underline">Academic Integrity Policy</a></li>
                <li><a href="/policies/acceptable-use" className="text-brand-blue-600 hover:underline">Acceptable Use Policy</a></li>
                <li><a href="/policies/student-code" className="text-brand-blue-600 hover:underline">Student Code of Conduct</a></li>
                <li><a href="/policies/copyright" className="text-brand-blue-600 hover:underline">Copyright Policy</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
