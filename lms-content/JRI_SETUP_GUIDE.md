# Job Readiness Initiative (JRI) - LMS Setup Guide

## 📦 Downloaded Content

Successfully downloaded **8 JRI SCORM modules** from EmployIndy:

1. **Introduction to Job Ready Indy (JRI)** - Overview and program introduction
2. **Badge 1: Mindsets** - Growth mindset and positive thinking
3. **Badge 2: Self-Management** - Time management and organization
4. **Badge 3: Learning Strategies** - Effective learning techniques
5. **Badge 4: Social Skills** - Communication and teamwork
6. **Badge 5: Workplace Skills** - Professional workplace behaviors
7. **Badge 6: Launch a Career** - Job search and career planning
8. **Facilitation Resources** - Instructor guides and materials

**Format:** SCORM 2004 3rd Edition
**Location:** `/lms-content/jri/`
**Total Size:** ~500KB (8 files)

---

## 🎯 What is JRI?

Job Readiness Initiative (JRI) is a comprehensive workforce readiness curriculum that helps learners develop essential soft skills and workplace competencies. It's designed to prepare individuals for successful employment through:

- **6 Badge System** - Progressive skill development
- **Interactive Content** - Engaging SCORM modules
- **Facilitation Support** - Resources for instructors
- **Competency-Based** - Measurable outcomes

---

## 🚀 How to Upload to Your LMS

### Option 1: Moodle

1. **Login to Moodle** as administrator
2. **Create a new course** or select existing course
3. **Turn editing on**
4. **Add an activity** → **SCORM package**
5. **Upload the SCORM file:**
   - Drag and drop the `.zip` file
   - Or click "Choose a file" and select the module
6. **Configure settings:**
   - Display: New window
   - Grading method: Highest grade
   - Attempts: Unlimited (or set limit)
7. **Save and display**
8. **Repeat for all 8 modules**

### Option 2: Canvas LMS

1. **Login to Canvas** as instructor/admin
2. **Go to your course**
3. **Navigate to Modules**
4. **Click the + button** to add content
5. **Select "External Tool"**
6. **Upload SCORM package:**
   - Use Canvas Commons or
   - Use third-party SCORM player (Rustici, SCORM Cloud)
7. **Configure and publish**
8. **Repeat for all 8 modules**

### Option 3: Blackboard Learn

1. **Login to Blackboard** as instructor
2. **Go to your course**
3. **Content** → **Build Content** → **Content Package (SCORM)**
4. **Browse and upload** the `.zip` file
5. **Submit**
6. **Configure availability** and settings
7. **Repeat for all 8 modules**

### Option 4: Custom LMS (Elevate Platform)

Since you're building your own platform, you'll need a SCORM player. See below for integration options.

---

## 🔧 Integrating SCORM into Elevate Platform

### Recommended SCORM Players

#### 1. **SCORM Cloud (Rustici Software)** - Easiest

- **Website:** https://cloud.scorm.com/
- **Pricing:** Free tier available, then $99/month
- **Features:**
  - Hosted SCORM player
  - API for integration
  - Tracking and reporting
  - No server setup needed

**Integration Steps:**

```javascript
// 1. Upload SCORM to SCORM Cloud
// 2. Get course ID
// 3. Embed in your app

<iframe
  src="https://cloud.scorm.com/ScormEngineInterface/defaultui/player/modern.html?configuration=YOUR_CONFIG&registration=USER_ID&course=COURSE_ID"
  width="100%"
  height="600px"
/>
```

#### 2. **SCORM.js** - Open Source

- **GitHub:** https://github.com/pipwerks/scorm-api-wrapper
- **Pricing:** Free
- **Features:**
  - JavaScript SCORM API wrapper
  - Client-side tracking
  - Lightweight

**Integration Steps:**

```bash
npm install scorm-api-wrapper
```

```javascript
import SCORM from 'scorm-api-wrapper';

// Initialize SCORM
SCORM.init();

// Track completion
SCORM.set('cmi.completion_status', 'completed');
SCORM.set('cmi.score.raw', 85);

// Save data
SCORM.save();
```

#### 3. **H5P** - Alternative (Not SCORM but similar)

- **Website:** https://h5p.org/
- **Pricing:** Free
- **Features:**
  - Interactive content
  - Easy authoring
  - WordPress plugin available

---

## 📊 Tracking & Reporting

### Data Points to Track

SCORM packages track:

- **Completion status** (completed, incomplete, not attempted)
- **Score** (0-100%)
- **Time spent** (total time in module)
- **Progress** (percentage complete)
- **Attempts** (number of tries)
- **Interactions** (quiz answers, activities)

### Database Schema for SCORM Tracking

```sql
CREATE TABLE scorm_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  course_id VARCHAR(255),
  module_name VARCHAR(255),
  completion_status VARCHAR(50),
  score_raw INTEGER,
  score_min INTEGER,
  score_max INTEGER,
  time_spent INTEGER, -- in seconds
  attempts INTEGER,
  last_accessed TIMESTAMP,
  completed_at TIMESTAMP,
  cmi_data JSONB -- store all SCORM data
);
```

---

## 🎓 JRI Badge System

### Badge Progression

Students earn badges by completing modules:

1. **Introduction** → Understanding JRI
2. **Badge 1: Mindsets** → Growth mindset certificate
3. **Badge 2: Self-Management** → Organization certificate
4. **Badge 3: Learning Strategies** → Learning certificate
5. **Badge 4: Social Skills** → Communication certificate
6. **Badge 5: Workplace Skills** → Professional certificate
7. **Badge 6: Launch a Career** → Career readiness certificate

### Badge Requirements

- Complete all lessons in module
- Pass quizzes (typically 80% or higher)
- Complete activities/reflections
- Demonstrate competency

---

## 🎨 Creating Badge Graphics

You'll want to create visual badges for students. Here's what you need:

### Badge Design Specs

- **Size:** 300x300px (PNG with transparency)
- **Style:** Professional, modern
- **Colors:** Match Elevate branding (emerald green, orange)
- **Elements:** Badge shape, icon, text

### Badge Files to Create

1. `badge-jri-mindsets.png`
2. `badge-jri-self-management.png`
3. `badge-jri-learning-strategies.png`
4. `badge-jri-social-skills.png`
5. `badge-jri-workplace-skills.png`
6. `badge-jri-launch-career.png`
7. `badge-jri-complete.png` (all 6 badges earned)

---

## 📱 Mobile App Integration

For the React Native app, you can:

### Option 1: WebView

```javascript
import { WebView } from 'react-native-webview';

<WebView
  source={{ uri: 'https://cloud.scorm.com/player/...' }}
  style={{ flex: 1 }}
  onMessage={(event) => {
    // Handle SCORM completion
    const data = JSON.parse(event.nativeEvent.data);
    if (data.status === 'completed') {
      // Award badge, update progress
    }
  }}
/>;
```

### Option 2: Native SCORM Player

- More complex but better UX
- Requires native iOS/Android SCORM libraries
- Can work offline

---

## 🔐 Access Control

### Who Should Access JRI?

- **All students** enrolled in training programs
- **Required** before starting technical training
- **Self-paced** or instructor-led
- **Free** (funded by WIOA/workforce grants)

### Enrollment Logic

```javascript
// Auto-enroll new students in JRI
async function enrollStudent(userId) {
  const jriModules = [
    'jri-introduction',
    'jri-badge-1-mindsets',
    'jri-badge-2-self-management',
    'jri-badge-3-learning-strategies',
    'jri-badge-4-social-skills',
    'jri-badge-5-workplace-skills',
    'jri-badge-6-launch-career',
  ];

  for (const module of jriModules) {
    await enrollUserInCourse(userId, module);
  }
}
```

---

## 📈 Reporting for Workforce Boards

EmployIndy and workforce boards want to see:

### Key Metrics

- **Enrollment numbers** - How many started JRI
- **Completion rates** - Percentage who finished
- **Time to complete** - Average days/hours
- **Badge attainment** - Which badges earned
- **Pre/post assessment** - Skill improvement
- **Employment outcomes** - Job placement after JRI

### Sample Report

```
JRI Program Report - Q4 2025
================================
Total Enrolled: 150
Completed All Badges: 98 (65%)
Average Time: 12 hours
Most Popular Badge: Workplace Skills
Employment Rate: 78% (within 90 days)
```

---

## 🛠️ Technical Implementation

### Step 1: Create JRI Course Pages

```typescript
// app/courses/jri/[module]/page.tsx
export default function JRIModulePage({ params }: { params: { module: string } }) {
  return (
    <div className="container mx-auto py-12">
      <h1>JRI: {getModuleName(params.module)}</h1>

      {/* SCORM Player */}
      <div className="scorm-player">
        <iframe
          src={`/api/scorm/player?module=${params.module}`}
          width="100%"
          height="600px"
        />
      </div>

      {/* Progress Tracker */}
      <ProgressBar completion={userProgress} />

      {/* Badge Display */}
      {isCompleted && <BadgeAward badge={params.module} />}
    </div>
  );
}
```

### Step 2: Create SCORM API Endpoint

```typescript
// app/api/scorm/player/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const module = searchParams.get('module');

  // Serve SCORM content
  const scormPath = `/lms-content/jri/${module}`;
  return new Response(/* SCORM HTML */);
}
```

### Step 3: Track Completion

```typescript
// app/api/scorm/track/route.ts
export async function POST(request: Request) {
  const data = await request.json();

  // Save to database
  await db.scormTracking.create({
    userId: data.userId,
    moduleId: data.moduleId,
    completionStatus: data.status,
    score: data.score,
    timeSpent: data.time,
  });

  // Award badge if completed
  if (data.status === 'completed') {
    await awardBadge(data.userId, data.moduleId);
  }
}
```

---

## 📚 Resources

### EmployIndy Support

- **JRI Setup Support:** https://learning.employindy.org/support
- **Documentation:** https://learning.employindy.org/jri
- **Contact:** learning@employindy.org

### SCORM Resources

- **SCORM.com:** https://scorm.com/
- **ADL Initiative:** https://adlnet.gov/projects/scorm/
- **Rustici Software:** https://rusticisoftware.com/

### LMS Integration Guides

- **Moodle SCORM:** https://docs.moodle.org/en/SCORM
- **Canvas SCORM:** https://community.canvaslms.com/
- **Blackboard SCORM:** https://help.blackboard.com/

---

## ✅ Next Steps

1. **Choose SCORM player** (recommend SCORM Cloud for ease)
2. **Create JRI course pages** in Elevate platform
3. **Upload SCORM modules** to player
4. **Test with sample user** to verify tracking
5. **Design badge graphics** for visual rewards
6. **Set up reporting** for workforce boards
7. **Train instructors** on facilitation resources
8. **Launch to students** and monitor completion

---

## 💰 Cost Estimate

### SCORM Cloud (Recommended)

- **Free tier:** 10 registrations/month
- **Starter:** $99/month (100 registrations)
- **Professional:** $299/month (500 registrations)
- **Enterprise:** Custom pricing

### DIY SCORM Player

- **Development time:** 40-80 hours
- **Cost:** $4,000-$12,000 (if hiring developer)
- **Maintenance:** Ongoing

**Recommendation:** Start with SCORM Cloud free tier, upgrade as you grow.

---

## 📞 Support

For questions about JRI setup:

- **EmployIndy:** learning@employindy.org
- **Elevate Tech Support:** dev@www.elevateforhumanity.org

---

## 🎉 Success!

You now have all 8 JRI modules ready to deploy. Follow this guide to integrate them into your LMS and start helping students develop essential workplace skills!
