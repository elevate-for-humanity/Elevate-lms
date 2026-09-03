# Milady RISE Partner Program - Setup Guide

## 🎓 Program Overview

**Milady RISE** (Recognizing Industry Safety & Empowerment) is a FREE certification program for barber students and professionals covering:

1. **Domestic Violence Awareness**
2. **Human Trafficking Awareness**
3. **Infection Control** (2-hour course)

**Benefits:**

- ✅ FREE certification for all students
- ✅ $500 RISE Scholarship eligibility (10 awards twice/year)
- ✅ Client Well-Being & Safety Certification
- ✅ Professional credibility and community impact
- ✅ Required for modern barber professionals

---

## 🔑 Your Custom School Code

**School:** Elevate for Humanity Career and Technical Institute
**Custom Code:** `efhcti-rise295`
**Redemptions:** 1,000 students
**Status:** ACTIVE

⚠️ **Important:** This code is ONLY for your students and staff. Do not share publicly.

---

## 📋 Student Enrollment Instructions

### Step 1: Direct Students to Registration Page

Send students to: https://www.miladytraining.com/bundles/client-well-being-safety-certification

### Step 2: Create Account or Login

- Click "Enroll Now"
- Register for new account (or login if existing)
- Fill out student information

### Step 3: Apply Promo Code at Checkout

- Enter code: `efhcti-rise295`
- **Important:** No spaces, periods, or commas before/after code
- Complete enrollment (should show $0.00 with code)

### Step 4: Complete Courses

- Domestic Violence Awareness
- Human Trafficking Awareness
- Infection Control (2 hours)

### Step 5: Receive Certification

- Download certificate upon completion
- Eligible to apply for $500 RISE Scholarship

---

## 🎯 Integration into Elevate Platform

### Option 1: Required Curriculum Component

Add to barber apprenticeship requirements:

```markdown
## Barber Apprenticeship Requirements

### Phase 1: Foundation (Weeks 1-4)

- ✅ Orientation and safety
- ✅ **Milady RISE Certification** (REQUIRED)
  - Domestic Violence Awareness
  - Human Trafficking Awareness
  - Infection Control
- ✅ Basic barbering techniques
- ✅ Sanitation and hygiene
```

### Option 2: First Week Assignment

Make it mandatory in Week 1:

```
Week 1 Checklist:
□ Complete orientation
□ Sign apprenticeship agreement
□ Complete Milady RISE Certification (use code: efhcti-rise295)
□ Submit certificate to instructor
□ Begin hands-on training
```

### Option 3: Homework Assignment

Assign as homework with deadline:

```
Homework Assignment - Due: End of Week 1

Complete the Milady RISE Client Well-Being & Safety Certification

1. Go to: https://www.miladytraining.com/bundles/client-well-being-safety-certification
2. Use code: efhcti-rise295
3. Complete all 3 courses
4. Download your certificate
5. Upload certificate to your student portal

This is REQUIRED to continue in the program.
```

---

## 📧 Email Template for Students

```
Subject: REQUIRED: Complete Your Milady RISE Certification

Dear [Student Name],

Congratulations on joining the Elevate for Humanity Barber Apprenticeship Program!

As part of your training, you are REQUIRED to complete the Milady RISE Client Well-Being & Safety Certification. This FREE certification covers:

• Domestic Violence Awareness
• Human Trafficking Awareness
• Infection Control

This certification will:
✓ Make you a more professional and aware barber
✓ Help you recognize and respond to client safety issues
✓ Make you eligible for a $500 RISE Scholarship

HOW TO ENROLL (Takes 5 minutes):

1. Visit: https://www.miladytraining.com/bundles/client-well-being-safety-certification

2. Click "Enroll Now" and create your account

3. At checkout, enter code: efhcti-rise295
   (This makes it FREE - no spaces before/after the code!)

4. Complete the courses (approximately 2-3 hours total)

5. Download your certificate and upload it to your student portal

DEADLINE: [Insert Date - recommend end of Week 1]

Questions? Contact us at [your email]

Best regards,
Elizabeth Greene
CEO, Elevate for Humanity Career & Training Institute
```

---

## 📱 Add to Student Portal

### Create RISE Page in Student Portal

```typescript
// app/student/rise/page.tsx
export default function MiladyRISEPage() {
  return (
    <div className="container mx-auto py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-4">
            Milady RISE Certification
          </h1>
          <p className="text-lg mb-4">
            Client Well-Being & Safety - REQUIRED for all barber students
          </p>
          <div className="flex items-center gap-4">
            <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">
              FREE with code
            </span>
            <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">
              $500 Scholarship Eligible
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">What You'll Learn</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="font-bold mb-2">Domestic Violence Awareness</h3>
              <p className="text-sm text-gray-600">
                Recognize signs and provide safe support to clients
              </p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="text-4xl mb-4">🚨</div>
              <h3 className="font-bold mb-2">Human Trafficking Awareness</h3>
              <p className="text-sm text-gray-600">
                Identify warning signs and know how to help
              </p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="text-4xl mb-4">🧼</div>
              <h3 className="font-bold mb-2">Infection Control</h3>
              <p className="text-sm text-gray-600">
                2-hour course on safety and sanitation
              </p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">How to Enroll</h2>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
              <div>
                <p className="font-semibold">Visit the enrollment page</p>
                <a href="https://www.miladytraining.com/bundles/client-well-being-safety-certification"
                   target="_blank"
                   className="text-emerald-600 hover:underline text-sm">
                  https://www.miladytraining.com/bundles/client-well-being-safety-certification
                </a>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
              <div>
                <p className="font-semibold">Click "Enroll Now" and create account</p>
                <p className="text-sm text-gray-600">Or login if you already have an account</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
              <div>
                <p className="font-semibold">Enter promo code at checkout</p>
                <div className="mt-2 bg-white border-2 border-emerald-500 rounded-lg p-4 inline-block">
                  <p className="text-xs text-gray-600 mb-1">Your school code:</p>
                  <code className="text-2xl font-mono font-bold text-emerald-600">efhcti-rise295</code>
                  <p className="text-xs text-gray-600 mt-1">⚠️ No spaces before or after!</p>
                </div>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">4</span>
              <div>
                <p className="font-semibold">Complete the courses</p>
                <p className="text-sm text-gray-600">Takes approximately 2-3 hours total</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">5</span>
              <div>
                <p className="font-semibold">Upload your certificate</p>
                <button className="mt-2 bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600">
                  Upload Certificate
                </button>
              </div>
            </li>
          </ol>
        </div>

        <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">💰 $500 RISE Scholarship</h2>
          <p className="mb-4">
            Once certified, you're eligible to apply for the RISE Scholarship!
          </p>
          <ul className="space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <span className="text-purple-600">✓</span>
              <span>10 scholarships awarded twice per year (Spring & Fall)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">✓</span>
              <span>$500 per scholarship</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">✓</span>
              <span>Open to students and professionals</span>
            </li>
          </ul>
          <a href="https://www.milady.com/rise-scholarship"
             target="_blank"
             className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
            Learn About Scholarship
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 Marketing Materials

### Download Milady RISE Logos

Milady provides logos to promote your partnership:

- Download here: [Link provided by Jessica Boyd]
- Use on your website, social media, and marketing materials
- Shows you're a RISE Partner School

### Social Media Posts

**Instagram/Facebook:**

```
🎓 Exciting News! Elevate for Humanity is now a Milady RISE Partner School!

All our barber students get FREE access to:
✅ Domestic Violence Awareness training
✅ Human Trafficking Awareness training
✅ Infection Control certification

Plus, they're eligible for a $500 RISE Scholarship! 💰

We're training barbers who don't just cut hair—they make a real difference in their communities. 💈✨

#MiladyRISE #BarberTraining #CommunityImpact #ElevateForHumanity
```

**LinkedIn:**

```
Proud to announce: Elevate for Humanity Career & Training Institute is now a Milady RISE Partner School.

Our barber apprentices will receive comprehensive training in:
• Domestic Violence Awareness
• Human Trafficking Awareness
• Infection Control & Safety

This partnership reinforces our commitment to developing well-rounded professionals who lead with both skill and purpose.

Learn more about our programs: www.elevateforhumanity.org
```

---

## 📊 Tracking & Reporting

### Track Student Completion

Create a tracking spreadsheet:

| Student Name | Enrollment Date | Completion Date | Certificate Uploaded | Scholarship Applied |
| ------------ | --------------- | --------------- | -------------------- | ------------------- |
| John Doe     | 01/15/2025      | 01/20/2025      | ✅                   | ❌                  |
| Jane Smith   | 01/15/2025      | Pending         | ❌                   | ❌                  |

### Monthly Report for Jessica Boyd

Send monthly updates to jessica.boyd@cengage.com:

```
Subject: Milady RISE Monthly Report - [Month Year]

Hi Jessica,

Here's our monthly RISE update for Elevate for Humanity:

Students Enrolled: 25
Students Completed: 18 (72%)
Certificates Issued: 18
Scholarship Applications: 3

We've integrated RISE into Week 1 of our barber apprenticeship program and are seeing great engagement!

Best,
Elizabeth Greene
```

---

## 💡 Best Practices (From Jessica Boyd)

### 1. Lead by Example

✅ **Complete the certification yourself first**

- Shows students it's important
- You can speak from experience
- Increases student completion rates

### 2. Make it Required, Not Optional

✅ **Integrate into curriculum**

- Week 1 requirement
- Part of orientation
- Required for program completion

### 3. Maximize Downtime

✅ **Post instructions everywhere**

- Breakroom poster
- Student lounge
- Bathroom mirror
- Email signatures

---

## 📞 Support Contacts

### Milady RISE Program Support

- **Email:** [RISE support email from Milady]
- **Website:** https://www.milady.com/rise

### Your Milady Representative

- **Name:** Jessica Boyd
- **Title:** Senior Community and Insights Specialist
- **Email:** jessica.boyd@cengage.com
- **Phone:** (919) 623-4623
- **Time Zone:** Eastern

### Elevate Internal Contact

- **Name:** Elizabeth Greene
- **Title:** CEO
- **Email:** Elizabethpowell6262@gmail.com
- **Phone:** (317) 760-7908

---

## 📅 Important Dates

### Scholarship Application Deadlines

- **Spring Scholarship:** Applications due [TBD - check with Milady]
- **Fall Scholarship:** Applications due [TBD - check with Milady]

### Annual Survey

- Participate in yearly survey or focus group (up to 60 minutes)
- Provides feedback on RISE program
- Helps improve beauty education

---

## ✅ Implementation Checklist

### Week 1: Setup

- [ ] Complete RISE certification yourself (Elizabeth)
- [ ] Download Milady RISE logos
- [ ] Create student portal page for RISE
- [ ] Draft student email template
- [ ] Create tracking spreadsheet

### Week 2: Launch

- [ ] Add RISE to barber apprenticeship curriculum
- [ ] Email all current barber students
- [ ] Post instructions in breakroom/study areas
- [ ] Add RISE info to student handbook
- [ ] Update website with RISE partner logo

### Week 3: Promote

- [ ] Post on social media (Instagram, Facebook, LinkedIn)
- [ ] Send email to prospective students
- [ ] Add RISE to enrollment materials
- [ ] Create poster for physical location

### Ongoing:

- [ ] Track student completion weekly
- [ ] Send monthly report to Jessica Boyd
- [ ] Remind students about scholarship deadlines
- [ ] Celebrate student certifications
- [ ] Share success stories

---

## 🎉 Success Metrics

### Goals for Year 1

- **100% of barber students** complete RISE certification
- **At least 3 students** apply for RISE scholarship
- **1-2 students** win $500 scholarship
- **Promote RISE** on all marketing materials

### Long-term Impact

- Students become community advocates
- Enhanced professional reputation
- Increased enrollment (students want comprehensive training)
- Stronger partnership with Milady/Cengage

---

## 📚 Additional Resources

### Milady Resources

- **Milady Training:** https://www.miladytraining.com
- **Milady RISE:** https://www.milady.com/rise
- **Instagram:** @miladypro
- **Facebook:** /MiladyProfessional
- **LinkedIn:** /company/milady

### Related Certifications

- **OSHA Safety:** Already partnered with CareerSafe
- **Barbering License:** State of Indiana requirements
- **First Aid/CPR:** Consider adding to curriculum

---

## 🚀 Next Steps

1. **Elizabeth:** Complete RISE certification yourself this week
2. **Tech Team:** Add RISE page to student portal
3. **Marketing:** Download logos and create social posts
4. **Operations:** Integrate into Week 1 curriculum
5. **All Staff:** Complete RISE certification to lead by example

---

## 📝 Notes

- Program is FREE - no cost to school or students
- Milady can discontinue program with notice
- Code redemptions: 1,000 (plenty for growth)
- Support provided via email
- Quarterly updates from Milady about any changes

---

**This partnership elevates our barber program and shows we train professionals who make a real difference!** 💈✨
