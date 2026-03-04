/**
 * Digital Products Store
 * Public store for one-time digital purchases (NO login required)
 *
 * IMPORTANT: These are separate from platform subscriptions
 * - Digital products: One-time payment, instant delivery
 * - Platform subscriptions: Recurring, unlocks LMS access
 */

export interface DigitalProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // in cents
  priceDisplay: string;
  category: 'toolkit' | 'guide' | 'course' | 'template' | 'donation';
  stripePriceId?: string; // One-time payment price ID
  deliveryType: 'download' | 'email' | 'access';
  downloadUrl?: string;
  fileSize?: string;
  features: string[];
  image?: string;
  featured?: boolean;
}

export const DIGITAL_PRODUCTS: DigitalProduct[] = [
  {
    id: 'capital-readiness-guide',
    name: 'The Elevate Capital Readiness Guide',
    slug: 'capital-readiness-guide',
    description:
      'Build trust before you chase capital. A practical guide for licensed businesses, workforce-aligned employers, and nonprofits that want funding, credibility, and sustainable growth.',
    price: 3900, // $39.00
    priceDisplay: '$39',
    category: 'guide',
    deliveryType: 'download',
    fileSize: '15 MB',
    features: [
      'Full ebook (PDF)',
      'Integrated workbook',
      'Readiness scoring system',
      '10 actionable chapters',
      'The Elevate Model framework',
      'Lifetime updates',
    ],
    image: '/images/pages/shop-hero.jpg',
    featured: true,
  },
  {
    id: 'tax-toolkit',
    name: 'Start a Tax Business Toolkit',
    slug: 'tax-toolkit',
    description:
      'Step-by-step digital toolkit to launch your tax business. Includes templates, checklists, and marketing materials.',
    price: 4900, // $49.00
    priceDisplay: '$49',
    category: 'toolkit',
    deliveryType: 'download',
    fileSize: '25 MB',
    features: [
      'Business plan template',
      'Client intake forms',
      'Marketing materials',
      'Pricing calculator',
      'IRS compliance checklist',
      'Social media templates',
    ],
    stripePriceId: 'price_1SqluqIRNf5vPH3ACSGhnzrO',
    featured: true,
  },
  {
    id: 'grant-guide',
    name: 'Grant Readiness Guide',
    slug: 'grant-guide',
    description:
      'Learn how to prepare your organization for funding. Complete guide to grant applications and compliance.',
    price: 2900, // $29.00
    priceDisplay: '$29',
    category: 'guide',
    deliveryType: 'download',
    fileSize: '5 MB',
    features: [
      'Grant application checklist',
      'Budget template',
      'Narrative writing guide',
      'Compliance requirements',
      'Funder research tips',
    ],
    stripePriceId: 'price_1SqluqIRNf5vPH3Au88XZjmR',
    featured: true,
  },
  {
    id: 'fund-ready-course',
    name: 'Fund-Ready Mini Course',
    slug: 'fund-ready-course',
    description:
      'Short course focused on compliance and positioning for workforce funding. Video lessons and workbook included.',
    price: 14900, // $149.00
    priceDisplay: '$149',
    category: 'course',
    deliveryType: 'access',
    features: [
      '5 video lessons',
      'Downloadable workbook',
      'Compliance templates',
      'Positioning framework',
      'Email support',
      'Lifetime access',
    ],
    stripePriceId: 'price_1SqluqIRNf5vPH3AD2ZIRqg0',
    featured: true,
  },
  {
    id: 'workforce-compliance',
    name: 'Workforce Compliance Checklist',
    slug: 'workforce-compliance',
    description:
      'Essential compliance checklist for workforce training programs. WIOA, FERPA, and accreditation requirements.',
    price: 3900, // $39.00
    priceDisplay: '$39',
    category: 'template',
    deliveryType: 'download',
    fileSize: '2 MB',
    features: [
      'WIOA compliance checklist',
      'FERPA requirements',
      'Accreditation prep',
      'Documentation templates',
      'Audit readiness guide',
    ],
    stripePriceId: 'price_1SqlurIRNf5vPH3AtDLNBIVX',
  },
  {
    id: 'donation',
    name: 'Support Our Mission',
    slug: 'donation',
    description:
      'Make a tax-deductible donation to support workforce training and career pathways.',
    price: 0, // Custom amount
    priceDisplay: 'Custom',
    category: 'donation',
    deliveryType: 'email',
    features: ['Tax-deductible receipt', 'Impact report', 'Donor recognition'],
    stripePriceId: 'price_donation_custom',
  },
  // AI STUDIO PRODUCTS
  {
    id: 'ai-studio-starter',
    name: 'AI Studio - Starter',
    slug: 'ai-studio-starter',
    description:
      'Generate AI videos, images, avatars, and voiceovers for your courses. Perfect for individual creators.',
    price: 9900, // $99/month
    priceDisplay: '$99/mo',
    category: 'toolkit',
    deliveryType: 'access',
    features: [
      '50 AI video generations/month',
      '200 AI images/month',
      '100 voiceovers/month',
      '10 AI avatar videos/month',
      'HD quality exports',
      'Commercial license',
    ],
    stripePriceId: 'price_1SqlurIRNf5vPH3A6j37XvWk',
    featured: true,
    image: '/images/pages/shop-hero.jpg',
  },
  {
    id: 'ai-studio-pro',
    name: 'AI Studio - Professional',
    slug: 'ai-studio-pro',
    description:
      'Unlimited AI content generation for training providers and schools. Includes custom AI instructors.',
    price: 29900, // $299/month
    priceDisplay: '$299/mo',
    category: 'toolkit',
    deliveryType: 'access',
    features: [
      'Unlimited AI video generations',
      'Unlimited AI images',
      'Unlimited voiceovers',
      'Unlimited AI avatar videos',
      '4K quality exports',
      'Custom AI instructor voices',
      'White-label exports',
      'API access',
      'Priority support',
    ],
    stripePriceId: 'price_1SqlusIRNf5vPH3AqLbVXWn2',
    featured: true,
    image: '/images/pages/shop-hero.jpg',
  },
  {
    id: 'ai-instructor-pack',
    name: 'AI Instructor Pack',
    slug: 'ai-instructor-pack',
    description:
      '6 pre-built AI instructors with unique voices and personalities for different course categories.',
    price: 49900, // $499 one-time
    priceDisplay: '$499',
    category: 'toolkit',
    deliveryType: 'access',
    features: [
      'Dr. Sarah Chen - Healthcare',
      'Marcus Johnson - Skilled Trades',
      'James Williams - Barbering',
      'Lisa Martinez - Technology',
      'Robert Davis - CDL/Transportation',
      'Angela Thompson - Business',
      'Custom voice cloning',
      'Lesson script generator',
      'Lifetime access',
    ],
    stripePriceId: 'price_1SqlusIRNf5vPH3AT11GLqso',
    featured: true,
    image: '/images/pages/shop-hero.jpg',
  },
  {
    id: 'community-hub-license',
    name: 'Community Hub License',
    slug: 'community-hub-license',
    description:
      'Launch your own learning community with forums, marketplace, and member management.',
    price: 199900, // $1,999 one-time
    priceDisplay: '$1,999',
    category: 'toolkit',
    deliveryType: 'access',
    features: [
      'Full community platform',
      'Discussion forums',
      'Member marketplace',
      'Teacher community',
      'Developer community',
      'Admin tools',
      'Custom branding',
      'Unlimited members',
      'Source code access',
    ],
    stripePriceId: 'price_1SqlusIRNf5vPH3A4OVqbua3',
    image: '/images/pages/shop-hero.jpg',
  },
  {
    id: 'crm-hub-license',
    name: 'CRM Hub License',
    slug: 'crm-hub-license',
    description:
      'Complete CRM system with contacts, campaigns, deals, and email marketing. Built for training providers.',
    price: 149900, // $1,499 one-time
    priceDisplay: '$1,499',
    category: 'toolkit',
    deliveryType: 'access',
    features: [
      'Contact management',
      'Email campaigns',
      'Deal pipeline',
      'Lead tracking',
      'Appointment scheduling',
      'Follow-up reminders',
      'HubSpot integration',
      'Salesforce integration',
      'Custom reports',
    ],
    stripePriceId: 'price_1SqlutIRNf5vPH3AIb2JXemT',
    image: '/images/pages/shop-hero.jpg',
  },
  {
    id: 'ai-tutor-license',
    name: 'AI Tutor License',
    slug: 'ai-tutor-license',
    description:
      '24/7 AI tutoring system for your students. Chat, essay help, study guides, and personalized learning.',
    price: 99900, // $999 one-time
    priceDisplay: '$999',
    category: 'toolkit',
    deliveryType: 'access',
    features: [
      'AI chat tutor',
      'Essay assistance',
      'Study guide generator',
      'Quiz practice mode',
      'Progress tracking',
      'Multiple AI personalities',
      'Voice interaction',
      'Unlimited students',
      'API access',
    ],
    stripePriceId: 'price_1SqlutIRNf5vPH3A3dTfpAoH',
    featured: true,
    image: '/images/pages/shop-hero.jpg',
  },
  {
    id: 'sam-gov-assistant',
    name: 'SAM.gov Registration Assistant',
    slug: 'sam-gov-assistant',
    description:
      'AI-guided walkthrough for SAM.gov registration. Step-by-step chat assistant helps you register for federal grants.',
    price: 0, // Free
    priceDisplay: 'Free',
    category: 'guide',
    deliveryType: 'access',
    features: [
      'Step-by-step SAM.gov walkthrough',
      'UEI registration guidance',
      'NAICS code recommendations',
      'Document checklist',
      'Common mistakes to avoid',
      'Grants.gov integration tips',
      'Renewal reminders',
      'Free forever',
    ],
    featured: true,
    image: '/images/pages/shop-hero.jpg',
  },
  {
    id: 'grants-gov-navigator',
    name: 'Grants.gov Navigator',
    slug: 'grants-gov-navigator',
    description:
      'AI assistant to help you search, filter, and apply for federal grants on Grants.gov. Includes application tips.',
    price: 4900, // $49 one-time
    priceDisplay: '$49',
    category: 'toolkit',
    deliveryType: 'access',
    features: [
      'Grant search assistance',
      'Eligibility checker',
      'Application timeline tracker',
      'Budget template generator',
      'Narrative writing tips',
      'Compliance checklist',
      'Deadline reminders',
      'Workspace organization',
    ],
    stripePriceId: 'price_grants_nav_49',
    featured: true,
    image: '/images/pages/shop-hero.jpg',
  },
];

/**
 * Get product by slug
 */
export function getDigitalProduct(slug: string): DigitalProduct | undefined {
  return DIGITAL_PRODUCTS.find((p) => p.slug === slug);
}

/**
 * Get featured products
 */
export function getFeaturedProducts(): DigitalProduct[] {
  return DIGITAL_PRODUCTS.filter((p) => p.featured);
}

/**
 * Get products by category
 */
export function getProductsByCategory(
  category: DigitalProduct['category']
): DigitalProduct[] {
  return DIGITAL_PRODUCTS.filter((p) => p.category === category);
}

/**
 * SAM.gov Registration Walkthrough Script
 * Detailed step-by-step guided conversation for SAM.gov registration
 */
export const SAM_GOV_WALKTHROUGH_STEPS = [
  {
    id: 'welcome',
    message: `Welcome! I'll walk you through registering in SAM.gov step-by-step.

**SAM.gov** (System for Award Management) is required to:
- Receive federal grants
- Bid on government contracts
- Get listed as a federal vendor

Registration is **FREE** - never pay a third party!

Let's start. Do you already have a Login.gov account?`,
    options: ['Yes, I have Login.gov', 'No, I need to create one'],
  },
  {
    id: 'create-logingov',
    message: `**Step 1: Create Your Login.gov Account**

Do this now:
1. Open a new tab → go to **login.gov**
2. Click **"Create an account"**
3. Enter your **work email address**
4. Create a password (12+ characters, mix of letters/numbers/symbols)
5. Choose authentication method:
   - **Recommended:** Authentication app (Google Authenticator, Authy)
   - Or: Phone/SMS, Security key
6. Check your email and click the verification link

⏱️ This takes about 5 minutes.

Come back when you've created your Login.gov account.`,
    options: ['Done - I created my Login.gov account', 'I\'m having trouble'],
  },
  {
    id: 'logingov-trouble',
    message: `**Login.gov Troubleshooting:**

**Can't receive verification email?**
- Check spam/junk folder
- Try a different email address
- Wait 10 minutes and request again

**Authentication app issues?**
- Make sure your phone's time is synced
- Try backup codes if provided

**Locked out?**
- Use "Forgot password" link
- Contact Login.gov support: login.gov/help

Ready to try again?`,
    options: ['Yes, let me try again', 'Done - I created my Login.gov account'],
  },
  {
    id: 'goto-sam',
    message: `**Step 2: Go to SAM.gov**

Do this now:
1. Open a new tab → go to **sam.gov**
2. Click **"Sign In"** (top right corner)
3. Select **"Accept"** on the terms
4. Sign in with your **Login.gov credentials**
5. Complete any additional verification prompts

You should now see the SAM.gov dashboard.

Are you logged into SAM.gov?`,
    options: ['Yes, I\'m in SAM.gov', 'The site isn\'t loading', 'I can\'t sign in'],
  },
  {
    id: 'sam-loading-issue',
    message: `**SAM.gov Loading Issues:**

**Site slow or not loading?**
- SAM.gov can be slow during peak hours (try early morning)
- Clear your browser cache
- Try a different browser (Chrome recommended)
- Disable ad blockers temporarily

**Getting error messages?**
- The site may be under maintenance
- Check status at: sam.gov/content/status

Try again in a few minutes.`,
    options: ['Let me try again', 'It\'s working now'],
  },
  {
    id: 'start-registration',
    message: `**Step 3: Start Entity Registration**

Do this now:
1. On SAM.gov dashboard, click **"Register Entity"** or **"Get Started"**
2. You'll see: "What would you like to do?"
3. Select: **"Register a New Entity in SAM"**
4. Click **"Continue"**

You'll now enter the registration wizard.

What do you see on your screen?`,
    options: ['I see the registration form', 'I see "Get Unique Entity ID" option', 'I\'m confused about what to click'],
  },
  {
    id: 'get-uei-first',
    message: `**You Need a UEI First!**

Before full registration, you need a **Unique Entity Identifier (UEI)**.

Do this now:
1. Click **"Get Unique Entity ID"**
2. Select your entity type:
   - **Business or Organization** (most common)
   - Individual
   - Foreign Entity
3. Click **"Continue"**

The UEI is assigned **instantly** after you enter basic info.

Have you started the UEI process?`,
    options: ['Yes, I\'m getting my UEI', 'What info do I need for UEI?'],
  },
  {
    id: 'uei-info-needed',
    message: `**Information Needed for UEI:**

Have these ready:
- **Legal Business Name** (exactly as on IRS documents)
- **Physical Address** (street address, no PO Box)
- **Start Date** (when your org was established)
- **Entity Type** (LLC, Corp, Non-profit, etc.)

**For Non-Profits:**
- Your 501(c)(3) determination letter date

**For Businesses:**
- State of incorporation
- EIN (Employer Identification Number)

Ready to continue?`,
    options: ['Yes, I have this info', 'How do I get an EIN?'],
  },
  {
    id: 'get-ein',
    message: `**Getting an EIN (Employer Identification Number):**

If you don't have an EIN:
1. Go to **irs.gov**
2. Search for "EIN application"
3. Click **"Apply for an EIN Online"**
4. Complete the application (free, takes 10 minutes)
5. You'll receive your EIN **immediately**

⚠️ You MUST have an EIN to complete SAM.gov registration.

Do you have your EIN now?`,
    options: ['Yes, I have my EIN', 'I\'ll get my EIN and come back'],
  },
  {
    id: 'enter-core-data',
    message: `**Step 4: Enter Core Data**

You should now be in the "Core Data" section.

Fill in each field:

**Legal Business Name:**
- Enter EXACTLY as shown on IRS documents
- Include Inc., LLC, etc. if part of legal name

**Doing Business As (DBA):**
- Only if you operate under a different name
- Leave blank if same as legal name

**Physical Address:**
- Must be a street address (no PO Box)
- This is where your org physically operates

Click "Save and Continue" after each section.

Are you entering your core data?`,
    options: ['Yes, entering core data now', 'What about mailing address?'],
  },
  {
    id: 'mailing-address',
    message: `**Mailing Address Section:**

**If same as physical address:**
- Check the box "Same as physical address"

**If different:**
- Enter your mailing address
- PO Box IS allowed for mailing address

**Start Date:**
- Enter when your organization was legally formed
- Check your articles of incorporation

Continue filling out the form and click "Save and Continue".`,
    options: ['Done with addresses, what\'s next?'],
  },
  {
    id: 'entity-info',
    message: `**Step 5: Entity Information**

Now you'll enter business details:

**Entity Type:** Select one:
- Corporation
- Limited Liability Company (LLC)
- Non-Profit Organization
- Sole Proprietorship
- Partnership

**Profit Structure:**
- For-Profit
- Non-Profit

**Organization Structure:**
- How your org is legally structured

**State of Incorporation:**
- The state where you registered your business

Are you filling this out?`,
    options: ['Yes, what about small business status?', 'Done, what\'s next?'],
  },
  {
    id: 'small-business',
    message: `**Small Business Designations:**

Check any that apply:

**Small Business:**
- Based on SBA size standards for your industry
- Most training providers qualify

**Socioeconomic Categories:**
- Woman-Owned Small Business
- Minority-Owned Business
- Veteran-Owned Small Business
- Service-Disabled Veteran-Owned
- HUBZone (check if your address qualifies)
- 8(a) Business Development Program

These can help you qualify for set-aside contracts.`,
    options: ['Got it, what\'s next?'],
  },
  {
    id: 'naics-codes',
    message: `**Step 6: NAICS Codes**

NAICS codes describe what your organization does.

**For Training Providers, use these:**
- **611430** - Professional and Management Development Training
- **611519** - Other Technical and Trade Schools
- **611710** - Educational Support Services

**For Workforce Development:**
- **624310** - Vocational Rehabilitation Services
- **561311** - Employment Placement Agencies

**How to add:**
1. Click "Add NAICS Code"
2. Enter the 6-digit code
3. Mark one as "Primary"
4. Add others as secondary

You can add up to 10 codes.`,
    options: ['Added my NAICS codes', 'How do I find the right codes?'],
  },
  {
    id: 'find-naics',
    message: `**Finding Your NAICS Codes:**

1. Go to **census.gov/naics**
2. Click "Search" 
3. Enter keywords like:
   - "training"
   - "education"
   - "workforce"
   - "vocational"
4. Review descriptions to find best match

**Tip:** Look at what similar organizations use. Your primary code should be your main revenue source.

Found your codes?`,
    options: ['Yes, added my codes', 'I\'ll use the training codes you suggested'],
  },
  {
    id: 'financial-info',
    message: `**Step 7: Financial Information**

This section sets up how you'll receive payments.

**EIN/TIN:**
- Enter your 9-digit Employer Identification Number
- Format: XX-XXXXXXX

**Bank Account (for ACH payments):**
- Bank Name
- Bank Address
- Routing Number (9 digits)
- Account Number
- Account Type (Checking or Savings)

**Double-check these numbers!** Errors cause payment delays.

Are you entering financial info?`,
    options: ['Yes, entering bank info', 'Can I skip this for now?'],
  },
  {
    id: 'skip-financial',
    message: `**About Skipping Financial Info:**

You CAN submit without bank info, BUT:
- You won't be able to receive electronic payments
- You'll need to update this before receiving any grants
- Paper checks take much longer

**Recommendation:** Enter bank info now to avoid delays later.

If you don't have a business bank account yet, open one first.`,
    options: ['I\'ll enter my bank info now', 'I\'ll add it later and continue'],
  },
  {
    id: 'points-of-contact',
    message: `**Step 8: Points of Contact**

You MUST add these contacts:

**1. Government Business POC (required)**
- Primary contact for federal business
- Usually the owner or executive director

**2. Electronic Business POC (required)**
- Receives SAM.gov notifications
- Can be same person as above

**3. Accounts Receivable POC**
- Handles payments and invoices
- Your bookkeeper or accountant

**For each contact, enter:**
- Full name
- Title
- US phone number
- Email address

Adding your contacts now?`,
    options: ['Yes, adding contacts', 'Can I be all the contacts?'],
  },
  {
    id: 'same-contact',
    message: `**Using Yourself as All Contacts:**

Yes! For small organizations, one person can be all contacts.

Just enter your information for each POC type:
- Use the same name, phone, email
- Use appropriate titles:
  - Government POC: "Owner" or "Executive Director"
  - Electronic POC: "Administrator"
  - Accounts Receivable: "Financial Officer"

This is common for small businesses and non-profits.`,
    options: ['Got it, adding myself as contacts'],
  },
  {
    id: 'certifications',
    message: `**Step 9: Representations & Certifications**

This is a series of YES/NO questions about your organization.

**Answer honestly - false statements are federal crimes.**

Common questions:
- "Are you delinquent on federal taxes?" → Most answer NO
- "Has your org been convicted of fraud?" → Most answer NO
- "Are you debarred from federal programs?" → Most answer NO
- "Do you have unpaid federal debts?" → Most answer NO

**If you answer YES to anything:**
- You may need to provide explanation
- It doesn't automatically disqualify you

Read each question carefully.`,
    options: ['Completing certifications now', 'What if I\'m unsure about an answer?'],
  },
  {
    id: 'cert-unsure',
    message: `**Unsure About Certification Answers:**

**If genuinely unsure:**
- Check with your accountant about tax status
- Review any legal history
- Consult an attorney if needed

**Common confusion:**
- "Federal debt" = money owed TO the government
- "Debarment" = officially banned from federal programs
- "Conviction" = criminal conviction, not civil lawsuits

**When in doubt:**
- Answer conservatively
- Provide explanation if prompted
- You can update later if needed`,
    options: ['I\'ll answer carefully and continue'],
  },
  {
    id: 'review-submit',
    message: `**Step 10: Review and Submit**

You're almost done! Now review everything:

**Check carefully:**
- Legal name spelled correctly
- EIN matches your IRS documents
- Bank account numbers are correct
- All contacts have valid emails
- NAICS codes are appropriate

**To submit:**
1. Click "Review" to see summary
2. Fix any errors flagged
3. Click "Submit"
4. Save your confirmation number!

Ready to submit?`,
    options: ['Submitting now!', 'I found an error, how do I fix it?'],
  },
  {
    id: 'fix-error',
    message: `**Fixing Errors Before Submission:**

1. Click "Back" to return to that section
2. Make your correction
3. Click "Save and Continue"
4. Return to Review page

**After submission:**
- You can still make changes during the review period
- Log back in and select "Update Entity"

Don't worry - errors can be fixed!`,
    options: ['Fixed it, ready to submit'],
  },
  {
    id: 'submitted',
    message: `**Congratulations! You've Submitted!**

**What happens now:**

📧 **Immediately:** Confirmation email sent

⏱️ **1-2 days:** IRS validates your EIN

🔍 **3-5 days:** SAM.gov reviews your registration

✅ **7-10 days:** Registration activated (if no issues)

**You'll receive:**
- Your UEI number (if you didn't already have one)
- CAGE code (assigned automatically)
- Activation confirmation email

**Save this info:**
- Your UEI number
- Your CAGE code
- Your SAM.gov login credentials`,
    options: ['What do I do while waiting?', 'What\'s next after activation?'],
  },
  {
    id: 'while-waiting',
    message: `**While Waiting for Activation:**

**Check your email daily** for:
- Status updates
- Requests for additional information
- Activation confirmation

**Check SAM.gov status:**
1. Log into SAM.gov
2. Go to "Entity Management"
3. View your registration status

**If asked for more info:**
- Respond promptly
- Delays extend processing time

**Common issues:**
- EIN doesn't match IRS records → Contact IRS
- Address verification failed → Provide utility bill`,
    options: ['Got it, what about Grants.gov?'],
  },
  {
    id: 'after-activation',
    message: `**After Your SAM.gov is Active:**

**You can now:**
1. Apply for federal grants on Grants.gov
2. Bid on government contracts
3. Receive federal payments

**Next steps:**

**For Grants:**
1. Go to **grants.gov**
2. Create an account (use same email)
3. Link your SAM.gov registration
4. Search for grants in your field

**Important reminders:**
- SAM.gov registration expires in 1 YEAR
- Set a calendar reminder to renew
- Keep your info updated`,
    options: ['Tell me about Grants.gov', 'How do I renew SAM.gov?', 'I\'m all set, thanks!'],
  },
  {
    id: 'grants-gov-info',
    message: `**Getting Started with Grants.gov:**

**Create your account:**
1. Go to **grants.gov**
2. Click "Register" (top right)
3. Use the SAME email as SAM.gov
4. Verify your email
5. Complete your profile

**Search for grants:**
1. Click "Search Grants"
2. Filter by:
   - Eligibility (Non-profit, Small Business, etc.)
   - Category (Education, Employment, etc.)
   - Agency (DOL, ED, HHS, etc.)

**For workforce training, search:**
- "workforce development"
- "job training"
- "career pathways"
- "apprenticeship"

Want help finding grants?`,
    options: ['Yes, help me find grants', 'I\'ll explore on my own', 'How do I renew SAM.gov?'],
  },
  {
    id: 'renew-sam',
    message: `**Renewing Your SAM.gov Registration:**

**When to renew:**
- Registration expires after 1 year
- Renew 30-60 days BEFORE expiration
- You'll get email reminders

**How to renew:**
1. Log into SAM.gov
2. Go to "Entity Management"
3. Click "Update Entity"
4. Review and update all information
5. Re-certify representations
6. Submit

**If you let it expire:**
- You can't receive federal payments
- Grant applications may be rejected
- Re-registration takes another 7-10 days

Set a calendar reminder NOW!`,
    options: ['Thanks, I\'ll set a reminder', 'Start over from beginning', 'I\'m done!'],
  },
  {
    id: 'complete',
    message: `**You're All Set!**

**Quick Reference:**

🔗 **SAM.gov** - sam.gov (registration & renewal)
🔗 **Grants.gov** - grants.gov (find & apply for grants)
🔗 **Login.gov** - login.gov (manage your login)
🔗 **NAICS Codes** - census.gov/naics
🔗 **EIN** - irs.gov (apply for EIN)

**Remember:**
- Renew SAM.gov annually
- Keep contact info updated
- Check Grants.gov regularly for opportunities

Good luck with your federal funding journey!

Need to go through this again?`,
    options: ['Start over', 'I\'m done, thanks!'],
  },
];
