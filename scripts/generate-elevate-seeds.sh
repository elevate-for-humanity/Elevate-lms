#!/usr/bin/env bash
set -euo pipefail

SEED_DIR="seeds/elevate"
mkdir -p "$SEED_DIR"

echo "🌱 Generating Elevate Page Content Seeds..."
echo ""

###########################################
# Generate main JSON seed file
###########################################

cat << 'EOF' > "$SEED_DIR/elevate.json"
{
  "meta": {
    "version": "1.0",
    "generated": true,
    "generatedAt": "2025-11-13T00:00:00Z",
    "source": "scripts/generate-elevate-seeds.sh",
    "project": "Elevate for Humanity",
    "phone": "317-314-3757",
    "phoneFormatted": "(317) 314-3757",
    "baseURL": "https://elevateconnectsdirectory.org",
    "supportEmail": "support@elevateconnectsdirectory.org"
  },

  "student_onboarding": {
    "id": "student_onboarding",
    "title": "Student Onboarding Script",
    "category": "onboarding",
    "audience": "students",
    "steps": [
      {
        "step": 1,
        "name": "Awareness",
        "script": "Hi! We're Elevate for Humanity. You may qualify for FREE credentialed training in programs like CNA, Barber Apprenticeship, HVAC, and Building Tech. All programs lead to real certifications and job placement support. Are you interested in starting today?",
        "cta": "Start Application",
        "ctaUrl": "https://elevateconnectsdirectory.org/apply"
      },
      {
        "step": 2,
        "name": "Enrollment",
        "script": "Great! You can enroll online at https://elevateconnectsdirectory.org. Just select your program and click 'Enroll Now.' The application usually takes about 3–5 minutes.",
        "cta": "Enroll Now",
        "ctaUrl": "https://elevateconnectsdirectory.org/apply"
      },
      {
        "step": 3,
        "name": "Account Creation",
        "script": "When you create your account, use your phone number or email. As soon as you're done, you'll get access to your Student Dashboard.",
        "cta": "Create Account",
        "ctaUrl": "https://elevateconnectsdirectory.org/signup"
      },
      {
        "step": 4,
        "name": "Orientation",
        "script": "Before classes begin, please complete the short online orientation inside your dashboard. It explains your program, expectations, and what support you have.",
        "cta": "Start Orientation",
        "ctaUrl": "https://elevateconnectsdirectory.org/lms/dashboard"
      },
      {
        "step": 5,
        "name": "ID Verification",
        "script": "We'll need a picture of your ID and a selfie for verification. You can upload both directly from your phone or computer inside the dashboard.",
        "cta": "Upload ID",
        "ctaUrl": "https://elevateconnectsdirectory.org/lms/profile"
      },
      {
        "step": 6,
        "name": "Program Assignment",
        "script": "After we review your application and verify your information, you'll be assigned to a training provider. Your dashboard will update with class dates, location (if in-person), or virtual access details.",
        "cta": "View Dashboard",
        "ctaUrl": "https://elevateconnectsdirectory.org/lms/dashboard"
      },
      {
        "step": 7,
        "name": "Training Start",
        "script": "You'll receive reminders and updates inside your dashboard. You can track your progress, see upcoming sessions, and message support if you need help.",
        "cta": "View Courses",
        "ctaUrl": "https://elevateconnectsdirectory.org/lms/courses"
      },
      {
        "step": 8,
        "name": "Certification",
        "script": "When you finish all requirements, Elevate will issue your state-recognized certificate. You'll receive a serial number that can be verified publicly.",
        "cta": "View Certificates",
        "ctaUrl": "https://elevateconnectsdirectory.org/lms/certificates"
      },
      {
        "step": 9,
        "name": "Job Placement",
        "script": "After you're certified, we help connect you with employers, apprenticeships, and workforce partners. Our goal is to support you from training into actual employment.",
        "cta": "Contact Support",
        "ctaUrl": "https://elevateconnectsdirectory.org/contact"
      }
    ],
    "supportLine": "Anytime you need help, call or text us at 317-314-3757."
  },

  "partner_onboarding": {
    "id": "partner_onboarding",
    "title": "Partner Onboarding Script",
    "category": "onboarding",
    "audience": "partners",
    "steps": [
      {
        "step": 1,
        "name": "Outreach",
        "script": "Hi, this is Elevate for Humanity. We're building a statewide network of credentialed training partners, and we'd love to explore adding your program as an official provider. We work with schools, barbershops, training centers, and employers who want to offer approved training and get student referrals.",
        "cta": "Learn More",
        "ctaUrl": "https://elevateconnectsdirectory.org/program-holder/apply"
      },
      {
        "step": 2,
        "name": "Application",
        "script": "You can apply to become a partner here: https://elevateconnectsdirectory.org/program-holder/apply. We'll review your license, training outline, and capacity.",
        "cta": "Apply Now",
        "ctaUrl": "https://elevateconnectsdirectory.org/program-holder/apply"
      },
      {
        "step": 3,
        "name": "Approval",
        "script": "Once you're approved, we'll give you access to a Partner Dashboard. There, you'll see students assigned to your programs, manage their progress, and submit completions.",
        "cta": "Access Dashboard",
        "ctaUrl": "https://elevateconnectsdirectory.org/program-holder/dashboard"
      },
      {
        "step": 4,
        "name": "Delegates",
        "script": "You can add instructors, admin staff, and delegates. Each person will receive their own secure login so they can manage their part of the pipeline.",
        "cta": "Manage Team",
        "ctaUrl": "https://elevateconnectsdirectory.org/program-holder/dashboard"
      },
      {
        "step": 5,
        "name": "Student Flow",
        "script": "Students who select your program will appear in your dashboard with their details. You'll review them, finalize onboarding, and update their status as they move through training.",
        "cta": "View Students",
        "ctaUrl": "https://elevateconnectsdirectory.org/program-holder/dashboard"
      },
      {
        "step": 6,
        "name": "Completion",
        "script": "When a student finishes, you simply mark them as 'Completed' in your dashboard. Elevate will handle issuing the certificate and updating the public verification tool.",
        "cta": "Mark Complete",
        "ctaUrl": "https://elevateconnectsdirectory.org/program-holder/dashboard"
      },
      {
        "step": 7,
        "name": "Compliance",
        "script": "We'll periodically review your logs, attendance, and documentation to keep everything aligned with state, workforce, and credentialing standards.",
        "cta": "View Reports",
        "ctaUrl": "https://elevateconnectsdirectory.org/program-holder/dashboard"
      }
    ]
  },

  "employer_onboarding": {
    "id": "employer_onboarding",
    "title": "Employer Onboarding Script",
    "category": "onboarding",
    "audience": "employers",
    "steps": [
      {
        "step": 1,
        "name": "Initial Outreach",
        "script": "Hi! This is Elevate for Humanity. We connect employers with credentialed talent in CNA, HVAC, Barbering, Building Tech, and related workforce roles. Would you like to partner with us for direct candidate referrals or potential OJT/WEX (On-the-Job Training) opportunities?",
        "cta": "Partner With Us",
        "ctaUrl": "https://elevateconnectsdirectory.org/contact"
      },
      {
        "step": 2,
        "name": "Agreement",
        "script": "We'll send a simple employer agreement outlining roles, expectations, and how referrals work. Once it's signed, we'll add you to our employer list and begin sending candidates that fit your needs.",
        "cta": "Sign Agreement",
        "ctaUrl": "https://elevateconnectsdirectory.org/contact"
      },
      {
        "step": 3,
        "name": "Referral Flow",
        "script": "You tell us the roles, schedule, and requirements you're hiring for. We match you with students who have completed their training and are ready to work.",
        "cta": "Submit Requirements",
        "ctaUrl": "https://elevateconnectsdirectory.org/contact"
      },
      {
        "step": 4,
        "name": "Wage Reimbursement",
        "script": "If you're eligible, we'll help you connect with workforce partners to explore wage reimbursement or On-the-Job Training funds. This can lower your cost of hiring while supporting our learners.",
        "cta": "Learn About OJT",
        "ctaUrl": "https://elevateconnectsdirectory.org/contact"
      },
      {
        "step": 5,
        "name": "Follow-Up",
        "script": "We'll check in with you and the candidate after hiring to see how things are going, help with any concerns, and keep improving the pipeline.",
        "cta": "Contact Support",
        "ctaUrl": "https://elevateconnectsdirectory.org/contact"
      }
    ]
  },

  "admin_operations": {
    "id": "admin_operations",
    "title": "Admin Operations",
    "category": "operations",
    "audience": "admins",
    "tasks": [
      {
        "task": "Login",
        "description": "Go to https://elevateconnectsdirectory.org/admin/dashboard and log in using your admin credentials.",
        "url": "https://elevateconnectsdirectory.org/admin/dashboard"
      },
      {
        "task": "Review Applications",
        "description": "Go to the 'Students' section. Filter for 'New' or 'Pending' applications. Confirm ID, eligibility, and program selection. Assign the student to a training provider.",
        "url": "https://elevateconnectsdirectory.org/admin/applications"
      },
      {
        "task": "Progress Monitoring",
        "description": "Check each program or partner for active students. Review attendance, milestones, and any flags or notes. Send reminders or messages as needed.",
        "url": "https://elevateconnectsdirectory.org/admin/dashboard"
      },
      {
        "task": "Issue Certificates",
        "description": "Navigate to 'Certificates' > 'Issue Certificate.' Select the student and the program they completed. Enter completion date and confirm. The system generates a certificate and a unique serial number.",
        "url": "https://elevateconnectsdirectory.org/admin/certificates/issue"
      },
      {
        "task": "Public Verification",
        "description": "Anyone can verify a certificate at https://elevateconnectsdirectory.org/cert/verify/[serial]. Just enter the serial number on the certificate.",
        "url": "https://elevateconnectsdirectory.org/cert/verify"
      },
      {
        "task": "Reporting",
        "description": "Use the 'Reports' section to see completion rates, partner performance, active vs. inactive students, and program-level data. Export reports weekly or monthly for grants, workforce partners, and internal review.",
        "url": "https://elevateconnectsdirectory.org/admin/reports"
      }
    ]
  },

  "phone_scripts": {
    "id": "phone_scripts",
    "title": "Phone Call Scripts",
    "category": "communication",
    "audience": "support_staff",
    "scripts": [
      {
        "scenario": "Greeting",
        "script": "Hi, thank you for calling Elevate for Humanity, this is [Name]. How can I help you today?"
      },
      {
        "scenario": "Enrollment Interest",
        "script": "Perfect! Enrollment is free for qualifying students, and it only takes a few minutes. You can start at https://elevateconnectsdirectory.org. If you'd like, I can text or email you the link right now."
      },
      {
        "scenario": "Free Training Question",
        "script": "Yes. We work with state and workforce partners so that qualifying students do not pay out of pocket for tuition. Our goal is to remove barriers so you can focus on training and getting certified."
      },
      {
        "scenario": "Program Selection",
        "script": "We offer multiple pathways: CNA, Barber Apprenticeship, HVAC, Building Tech, Peer Recovery and other workforce programs. I can help you choose based on your interests, schedule, and goals."
      }
    ]
  },

  "sms_templates": {
    "id": "sms_templates",
    "title": "SMS Text Scripts",
    "category": "communication",
    "audience": "support_staff",
    "templates": [
      {
        "name": "Initial Outreach",
        "message": "Hi! This is Elevate for Humanity. You may qualify for FREE credentialed training (CNA, Barber, HVAC, Building Tech & more). Start here: https://elevateconnectsdirectory.org Reply YES if you want help.",
        "trigger": "cold_outreach"
      },
      {
        "name": "YES Response",
        "message": "Awesome! What program are you most interested in: CNA, Barber, HVAC, Building Tech, or not sure yet?",
        "trigger": "reply_yes"
      },
      {
        "name": "Post-Enrollment",
        "message": "Great job! Your application is submitted. Log in to your Student Dashboard for updates: https://elevateconnectsdirectory.org/lms/dashboard Text SUPPORT if you need help.",
        "trigger": "enrollment_complete"
      }
    ]
  },

  "email_templates": {
    "id": "email_templates",
    "title": "Email Templates",
    "category": "communication",
    "audience": "support_staff",
    "templates": [
      {
        "name": "Acceptance Email",
        "subject": "You're In! Your Elevate Training Is Ready 🎉",
        "body": "Hello [First Name],\n\nWelcome to Elevate for Humanity!\n\nYour application has been approved, and your training pathway is ready.\n\nYou can log into your Student Dashboard anytime here:\nhttps://elevateconnectsdirectory.org/lms/dashboard\n\nNext Steps:\n1. Complete your online orientation.\n2. Upload your ID for verification.\n3. Watch for your training provider assignment.\n4. Begin classes and track your progress in your dashboard.\n\nWe're here to support you from enrollment to employment.\n\nIf you have any questions, call or text us at 317-314-3757.\n\nWith gratitude,\nElevate for Humanity\nhttps://elevateconnectsdirectory.org",
        "trigger": "application_approved"
      }
    ]
  },

  "social_media": {
    "id": "social_media",
    "title": "Social Media Scripts",
    "category": "marketing",
    "audience": "marketing_team",
    "platforms": {
      "facebook": {
        "long_post": "🎓 FREE Credentialed Training Available NOW!\n\nElevate for Humanity offers 100% FREE training in:\n✅ CNA (Certified Nursing Assistant)\n✅ Barber Apprenticeship\n✅ HVAC Technician\n✅ Building Tech\n\nAll programs include:\n✅ State-recognized certifications\n✅ Job placement support\n✅ No out-of-pocket costs\n\n📞 Call/Text: 317-314-3757\n🌐 Apply: https://elevateconnectsdirectory.org\n\n#ElevateForHumanity #FreeTraining #CareerChange",
        "short_post": "FREE credentialed training in CNA, Barber, HVAC & Building Tech. No cost. Real credentials. Real jobs. Apply: https://elevateconnectsdirectory.org"
      },
      "instagram": {
        "caption": "Your next chapter starts here. 📚✨\n\nFREE credentialed training in CNA, Barber, HVAC & Building Tech.\n\nNo cost. Real credentials. Real jobs.\n\nLink in bio 👆\nOr call: 317-314-3757\n\n#ElevateYourFuture #FreeTraining #NewCareer #ElevateForHumanity"
      },
      "twitter": {
        "post": "🚀 FREE credentialed training in CNA, Barber, HVAC & Building Tech\n\n✅ No cost\n✅ Real certifications\n✅ Job placement support\n\nApply: https://elevateconnectsdirectory.org\nCall: 317-314-3757\n\n#ElevateForHumanity #FreeTraining"
      }
    },
    "viral_cta": {
      "title": "100-Share Campaign",
      "content": "Can we hit 100 shares today?\n\nEvery share brings someone closer to FREE credentialed training in CNA, HVAC, Building Tech, Barber Apprenticeship, and more.\n\nIf you believe in second chances, fresh starts, and real opportunities:\n\n👉 Share this post\n👉 Tag someone who needs this\n\n📞 Call or Text: 317-314-3757\n🌐 Enroll: https://elevateconnectsdirectory.org\n\n#ElevateYourFuture #ElevateForHumanity #FreeCredentialedTraining #LevelUpWithElevate"
    },
    "hashtags": [
      "#ElevateYourFuture",
      "#ElevateForHumanity",
      "#FreeCredentialedTraining",
      "#WorkforceReadyNow",
      "#LevelUpWithElevate",
      "#SecondChances",
      "#CareerChange",
      "#FreeTraining"
    ]
  },

  "program_pitches": {
    "id": "program_pitches",
    "title": "Program Pitch Scripts",
    "category": "marketing",
    "audience": "sales_team",
    "programs": {
      "cna": {
        "name": "CNA (Certified Nursing Assistant)",
        "pitch": "Our CNA program prepares you to provide hands-on care in hospitals, long-term care, and home health settings. It's fully credentialed, designed to meet employer expectations, and leads directly to in-demand jobs.",
        "url": "https://elevateconnectsdirectory.org/programs/cna"
      },
      "barber": {
        "name": "Barber Apprenticeship",
        "pitch": "We are one of only a few approved barber apprenticeship sponsors in the state. You train in real barbershops, learn from working barbers, and work your way toward your license while building a client base.",
        "url": "https://elevateconnectsdirectory.org/programs/barber"
      },
      "hvac": {
        "name": "HVAC Technician",
        "pitch": "Our HVAC pathway gives you the fundamentals to start working with heating, ventilation, and air conditioning systems. This is a high-demand, high-pay field with strong long-term career growth.",
        "url": "https://elevateconnectsdirectory.org/programs/hvac"
      },
      "building_tech": {
        "name": "Building Tech",
        "pitch": "Building Tech prepares you for building maintenance, facilities operations, and related roles. It's ideal for people who like hands-on work, problem-solving, and keeping buildings running smoothly.",
        "url": "https://elevateconnectsdirectory.org/programs"
      }
    }
  },

  "quick_links": {
    "id": "quick_links",
    "title": "Quick Link Directory",
    "category": "reference",
    "audience": "all",
    "students": {
      "homepage": "https://elevateconnectsdirectory.org",
      "hvac": "https://elevateconnectsdirectory.org/programs/hvac",
      "barber": "https://elevateconnectsdirectory.org/programs/barber",
      "cna": "https://elevateconnectsdirectory.org/programs/cna",
      "portal": "https://elevateconnectsdirectory.org/lms/dashboard"
    },
    "partners": {
      "apply": "https://elevateconnectsdirectory.org/program-holder/apply",
      "dashboard": "https://elevateconnectsdirectory.org/program-holder/dashboard",
      "delegate": "https://elevateconnectsdirectory.org/delegate/dashboard"
    },
    "admins": {
      "dashboard": "https://elevateconnectsdirectory.org/admin/dashboard",
      "certificates": "https://elevateconnectsdirectory.org/admin/certificates/issue",
      "reports": "https://elevateconnectsdirectory.org/admin/reports"
    },
    "public": {
      "verify": "https://elevateconnectsdirectory.org/cert/verify",
      "contact": "https://elevateconnectsdirectory.org/contact"
    }
  },

  "follow_up_sequences": {
    "id": "follow_up_sequences",
    "title": "Follow-Up Scripts",
    "category": "communication",
    "audience": "support_staff",
    "sequences": [
      {
        "name": "24-Hour Follow-Up",
        "trigger": "no_response_24h",
        "message": "Hi [Name], this is Elevate for Humanity. We saw you started an application yesterday. Do you have any questions? We're here to help! Call or text: 317-314-3757"
      },
      {
        "name": "7-Day Follow-Up",
        "trigger": "incomplete_application_7d",
        "message": "Hi [Name], just checking in! Your Elevate application is still open. Need help finishing it? We can walk you through it. Call/text: 317-314-3757 or visit: https://elevateconnectsdirectory.org"
      },
      {
        "name": "Post-Enrollment Check-In",
        "trigger": "enrollment_complete_24h",
        "message": "Hi [Name]! Congrats on enrolling with Elevate! Have you completed your orientation yet? Let us know if you need any help. Text SUPPORT or call 317-314-3757."
      }
    ]
  },

  "voicemail": {
    "id": "voicemail",
    "title": "Voicemail Script",
    "category": "communication",
    "audience": "support_staff",
    "script": "Hi, you've reached Elevate for Humanity. We're here to help you access FREE credentialed training in CNA, Barber Apprenticeship, HVAC, Building Tech, and more. Please leave your name, phone number, and which program you're interested in, and we'll call you back within 24 hours. Or visit us online at elevateconnectsdirectory.org to enroll now. Thank you!"
  }
}
EOF

echo "✅ elevate.json created in $SEED_DIR"
echo ""

###########################################
# Generate individual category files
###########################################

echo "📦 Generating individual category seed files..."

# Student Onboarding
cat << 'EOF' > "$SEED_DIR/student_onboarding.json"
{
  "category": "student_onboarding",
  "steps": 9,
  "data": "See elevate.json for full content"
}
EOF

# Partner Onboarding
cat << 'EOF' > "$SEED_DIR/partner_onboarding.json"
{
  "category": "partner_onboarding",
  "steps": 7,
  "data": "See elevate.json for full content"
}
EOF

# Social Media
cat << 'EOF' > "$SEED_DIR/social_media.json"
{
  "category": "social_media",
  "platforms": ["facebook", "instagram", "twitter"],
  "data": "See elevate.json for full content"
}
EOF

echo "✅ Individual category files created"
echo ""

###########################################
# Generate README
###########################################

cat << 'EOF' > "$SEED_DIR/README.md"
# Elevate Content Seeds

This directory contains structured JSON seeds for all Elevate scripts and content.

## Files

- **elevate.json** - Master seed file with all content
- **student_onboarding.json** - Student onboarding steps
- **partner_onboarding.json** - Partner onboarding steps
- **social_media.json** - Social media content

## Usage

### Import into LMS

```javascript
import seeds from './seeds/elevate/elevate.json';

// Access student onboarding
const studentSteps = seeds.student_onboarding.steps;

// Access phone scripts
const phoneScripts = seeds.phone_scripts.scripts;
```

### Use in React Components

```jsx
import { student_onboarding } from './seeds/elevate/elevate.json';

export function OnboardingFlow() {
  return (
    <div>
      {student_onboarding.steps.map(step => (
        <Step key={step.step} {...step} />
      ))}
    </div>
  );
}
```

### Use in Autopilot

```bash
# Load seeds into autopilot
cat seeds/elevate/elevate.json | jq '.social_media.platforms.facebook'
```

## Structure

All content is organized by:
- **Category**: onboarding, communication, marketing, operations
- **Audience**: students, partners, employers, admins, support_staff
- **Type**: scripts, templates, sequences, pitches

## Phone Number

All scripts reference: **317-314-3757**

## Base URL

All links use: **https://elevateconnectsdirectory.org**
EOF

echo "✅ README.md created in $SEED_DIR"
echo ""
echo "🎉 Seed generation complete!"
echo ""
echo "📁 Generated files:"
echo "   - seeds/elevate/elevate.json (master seed)"
echo "   - seeds/elevate/student_onboarding.json"
echo "   - seeds/elevate/partner_onboarding.json"
echo "   - seeds/elevate/social_media.json"
echo "   - seeds/elevate/README.md"
echo ""
echo "💡 Import these seeds into:"
echo "   - LMS modules"
echo "   - React components"
echo "   - Autopilot scripts"
echo "   - Landing pages"
echo "   - Email campaigns"
echo ""
