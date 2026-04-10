import type { ModuleSeed } from '../types';

export const module7: ModuleSeed = {
  slug: 'barber-module-7',
  title: 'Module 7: Professional & Business Skills',
  moduleOrder: 7,
  objective: 'Apply professional standards, business knowledge, and client retention strategies to build a sustainable barbering career.',
  lessons: [
    {
      slug: 'barber-lesson-40',
      title: 'Building Your Clientele',
      lessonOrder: 1,
      durationMin: 20,
      objective: 'Apply strategies to attract and retain clients.',
      style: 'theory',
      stateBoardFocus: ['client retention', 'professional image', 'rebooking'],
      sections: [
        {
          type: 'text',
          heading: 'First Impressions',
          body: [
            'Clients decide within the first 30 seconds whether they will return. Be on time, be clean, be professional.',
            'Your station reflects your standards. A clean, organized station signals competence before you pick up a tool.',
          ],
        },
        {
          type: 'table',
          heading: 'Retention Strategies',
          rows: [
            { label: 'Remember names', value: 'Use the client\'s name during the service. It signals that they matter.' },
            { label: 'Client card', value: 'Keep notes on style, products used, and last visit. Review before each appointment.' },
            { label: 'Follow up', value: 'A text after a new client\'s first visit goes a long way.' },
            { label: 'Rebook', value: 'Recommend the next appointment before they leave the chair.' },
          ],
        },
        {
          type: 'text',
          heading: 'Social Media',
          body: [
            'Post your work consistently. Before-and-after photos with client permission are the most effective content.',
            'Use local hashtags and tag your shop location to attract nearby clients.',
            'Respond to comments and DMs promptly — social media is a customer service channel.',
          ],
        },
        {
          type: 'callout',
          heading: 'The Rebook Rule',
          tone: 'tip',
          body: [
            'Every client who leaves without a next appointment is a client you may lose. Recommend rebooking at the end of every service: "You\'ll want to come back in 3–4 weeks to keep this looking sharp."',
          ],
        },
      ],
      competencyChecks: [
        'Identifies at least 3 client retention strategies',
        'Explains the purpose of a client card',
        'Describes how to use social media to attract local clients',
        'States the rebook recommendation at the end of service',
      ],
    },
    {
      slug: 'barber-lesson-41',
      title: 'Booth Rental vs. Commission vs. Ownership',
      lessonOrder: 2,
      durationMin: 20,
      objective: 'Compare barbershop business models and their financial implications.',
      style: 'theory',
      stateBoardFocus: ['booth rental', 'commission', 'shop ownership', 'self-employment'],
      sections: [
        {
          type: 'table',
          heading: 'Business Models Compared',
          rows: [
            { label: 'Commission', value: 'Work for the shop owner. Receive 40–60% of service revenue. Shop provides clients, supplies, equipment. Good for new barbers.' },
            { label: 'Booth rental', value: 'Pay a weekly or monthly fee to use a chair. Keep 100% of service revenue. Self-employed — responsible for taxes, supplies, and clients.' },
            { label: 'Shop ownership', value: 'Own the business. Maximum income potential. Maximum responsibility. Requires business license, shop license, startup capital.' },
          ],
        },
        {
          type: 'text',
          heading: 'Typical Career Path',
          body: [
            'Most barbers start on commission to build skills and clientele.',
            'Move to booth rental when clientele is strong enough to cover the booth fee and generate profit.',
            'Consider ownership after 5+ years of experience and a solid client base.',
          ],
        },
        {
          type: 'callout',
          heading: 'Self-Employment Tax',
          tone: 'warning',
          body: [
            'Booth renters are self-employed. You pay both the employee and employer portions of Social Security and Medicare taxes — approximately 15.3% on top of income tax. Set aside 25–30% of gross income for taxes.',
          ],
        },
      ],
      competencyChecks: [
        'Describes the commission model and its advantages for new barbers',
        'Explains what booth rental means financially',
        'Identifies the tax obligations of a self-employed barber',
        'States the typical career progression through business models',
      ],
    },
    {
      slug: 'barber-lesson-42',
      title: 'Pricing, Tipping & Financial Basics',
      lessonOrder: 3,
      durationMin: 20,
      objective: 'Set competitive prices and manage basic barbershop finances.',
      style: 'theory',
      stateBoardFocus: ['pricing strategy', 'tipping', 'self-employment taxes', 'quarterly taxes'],
      sections: [
        {
          type: 'steps',
          heading: 'Setting Your Prices',
          steps: [
            'Research local market rates — know what comparable barbers charge.',
            'Factor in your experience level. New barbers typically price below market; experienced barbers at or above.',
            'Price for the service, not the time.',
            'Raise prices as your clientele grows — do not undervalue your work.',
          ],
        },
        {
          type: 'text',
          heading: 'Tipping',
          body: [
            'The standard tip for barbering is 15–20%.',
            'Never expect a tip but always appreciate one.',
            'Make it easy — have a tip jar or use a payment system that prompts for tips.',
          ],
        },
        {
          type: 'table',
          heading: 'Financial Basics for Self-Employed Barbers',
          rows: [
            { label: 'Track all income', value: 'Cash and card. Every dollar must be reported.' },
            { label: 'Set aside for taxes', value: '25–30% of gross income.' },
            { label: 'Keep receipts', value: 'All business expenses (supplies, tools, education) are deductible.' },
            { label: 'Quarterly taxes', value: 'Pay estimated taxes quarterly to avoid IRS penalties.' },
          ],
        },
      ],
      competencyChecks: [
        'Explains how to research and set competitive prices',
        'States the standard tip percentage for barbering',
        'Identifies the percentage of income to set aside for taxes',
        'Explains the quarterly estimated tax requirement',
      ],
    },
    {
      slug: 'barber-lesson-43',
      title: 'Professionalism & Ethics',
      lessonOrder: 4,
      durationMin: 15,
      objective: 'Apply professional and ethical standards in the barbershop.',
      style: 'theory',
      stateBoardFocus: ['professional ethics', 'scope of practice', 'client confidentiality', 'continuing education'],
      sections: [
        {
          type: 'table',
          heading: 'The Barber\'s Code',
          rows: [
            { label: 'No negative talk', value: 'Never speak negatively about other barbers or shops. It reflects poorly on you.' },
            { label: 'Confidentiality', value: 'What happens in the chair stays in the chair. Client conversations are private.' },
            { label: 'Scope of practice', value: 'Do not perform services outside your license. Refer when appropriate.' },
            { label: 'Honesty', value: 'Be honest about what you can and cannot achieve. Never promise results you cannot deliver.' },
          ],
        },
        {
          type: 'text',
          heading: 'Handling Difficult Clients',
          body: [
            'Stay calm. Listen without interrupting.',
            'Offer to fix the issue at no charge if it is your error.',
            'If a client is abusive or threatening, you have the right to refuse service.',
            'Document incidents per shop policy.',
          ],
        },
        {
          type: 'callout',
          heading: 'Continuing Education',
          tone: 'info',
          body: [
            'Indiana requires continuing education for license renewal. The barbering industry evolves constantly — attend trade shows, watch tutorials, and practice new techniques.',
          ],
        },
      ],
      competencyChecks: [
        'States the four elements of the barber\'s code',
        'Describes how to handle a client complaint professionally',
        'Identifies services outside the barber\'s scope of practice',
        'States Indiana\'s continuing education requirement for license renewal',
      ],
    },
    {
      slug: 'barber-lesson-44',
      title: 'Styling Products & Finishing',
      lessonOrder: 5,
      durationMin: 15,
      objective: 'Select and apply appropriate styling products for different hair types.',
      style: 'practical',
      stateBoardFocus: ['styling products', 'product selection', 'application technique'],
      sections: [
        {
          type: 'table',
          heading: 'Styling Products',
          rows: [
            { label: 'Pomade', value: 'Medium to high hold, medium to high shine. Classic barbershop finish.' },
            { label: 'Clay', value: 'Medium to high hold, matte finish. Modern styles.' },
            { label: 'Cream', value: 'Light hold, natural finish. Good for textured or curly hair.' },
            { label: 'Gel', value: 'Strong hold, high shine. Waves and slick styles.' },
            { label: 'Wax', value: 'Flexible hold. Mustaches and detailed styling.' },
          ],
        },
        {
          type: 'steps',
          heading: 'Application Technique',
          steps: [
            'Start with a small amount — you can always add more.',
            'Warm product between palms before applying.',
            'Work through hair evenly from roots to ends.',
            'Style with comb or fingers to desired shape.',
            'Add more product only if needed — avoid buildup.',
          ],
        },
        {
          type: 'callout',
          heading: 'Product Selection Logic',
          tone: 'tip',
          body: [
            'IF client wants shine: pomade or gel.',
            'IF client wants matte: clay or cream.',
            'IF client has textured/curly hair: cream or light pomade.',
            'IF client wants maximum hold: gel or strong pomade.',
          ],
        },
      ],
      competencyChecks: [
        'Identifies all five product types and their hold/finish characteristics',
        'Selects appropriate product based on hair type and desired finish',
        'Applies product correctly — warms between palms, works evenly through hair',
        'Avoids over-applying product',
      ],
    },
  ],
  checkpoint: {
    slug: 'barber-module-7-checkpoint',
    title: 'Professional Skills Checkpoint',
    lessonOrder: 6,
    durationMin: 20,
    objective: 'Demonstrate mastery of professional and business skills.',
    instructions: ['Answer all questions before reviewing results.', 'A score of 70% or higher is required to advance to Module 8.'],
    rubric: ['Identifies business model differences', 'States tax set-aside percentage', 'Names styling products and their finishes', 'States standard tip percentage', 'Identifies elements of the barber\'s code'],
    quiz: {
      passingScore: 70,
      questions: [
        { prompt: 'In a booth rental arrangement, who keeps 100% of service revenue?', choices: ['The shop owner', 'The barber', 'They split it 50/50', 'The landlord'], answerIndex: 1, rationale: 'Booth renters are self-employed and keep all service revenue after paying their booth fee.' },
        { prompt: 'What percentage of income should a self-employed barber set aside for taxes?', choices: ['5–10%', '10–15%', '25–30%', '50%'], answerIndex: 2, rationale: 'Self-employed individuals pay both income tax and self-employment tax, totaling approximately 25–30%.' },
        { prompt: 'Which styling product provides high hold with a matte finish?', choices: ['Pomade', 'Gel', 'Clay', 'Cream'], answerIndex: 2, rationale: 'Clay provides medium to high hold with a matte finish, popular for modern styles.' },
        { prompt: 'The standard tip for barbering services is:', choices: ['5–10%', '15–20%', '25–30%', 'Tips are not expected'], answerIndex: 1, rationale: '15–20% is the standard tip for personal service professionals including barbers.' },
        { prompt: 'What is the most effective social media content for barbers?', choices: ['Motivational quotes', 'Before-and-after photos of client work', 'Product advertisements', 'Shop interior photos'], answerIndex: 1, rationale: 'Before-and-after photos showcase your skill directly and attract new clients.' },
        { prompt: 'Which business model is recommended for a barber just starting out?', choices: ['Booth rental', 'Shop ownership', 'Commission', 'Freelance'], answerIndex: 2, rationale: 'Commission is best for new barbers — the shop provides clients, supplies, and equipment while skills are being built.' },
      ],
    },
  },
};
