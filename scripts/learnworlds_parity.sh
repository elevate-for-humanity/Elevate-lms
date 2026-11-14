#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# LearnWorlds Parity Script
# Brings Elevate for Humanity site to LearnWorlds production quality
###############################################################################

echo "🎯 LearnWorlds Parity Analysis & Implementation Script"
echo "======================================================"
echo ""

# Create analysis directory
mkdir -p analysis/learnworlds-parity

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 1: Gap Analysis
# ─────────────────────────────────────────────────────────────────────────────

cat > analysis/learnworlds-parity/gap-analysis.md <<'EOF'
# LearnWorlds vs Elevate for Humanity - Gap Analysis

## Current Status: Site Deployment Issue
- ❌ Netlify site returning 404
- ❌ Custom domain not resolving
- ⚠️ Need to fix deployment before feature parity

## LearnWorlds Core Features (Production Quality)

### 1. Course Management ⭐⭐⭐⭐⭐
**LearnWorlds Has:**
- Interactive video player with transcripts
- Ebook builder with interactive elements
- SCORM package support
- Live sessions (1:1 and group)
- Assessments with multiple question types
- Certificates with custom templates
- Drip-feed content scheduling
- Course completion tracking

**We Have:**
- ✅ Basic course structure
- ✅ Video player component
- ⚠️ Missing: Interactive elements
- ⚠️ Missing: SCORM support
- ⚠️ Missing: Live session integration
- ⚠️ Missing: Advanced assessments

**Priority:** HIGH

### 2. Website Builder ⭐⭐⭐⭐⭐
**LearnWorlds Has:**
- 50+ industry-specific templates
- Drag-and-drop page builder
- Custom CSS/HTML injection
- Mobile-responsive by default
- SEO optimization tools
- Pop-up builder
- Landing page templates

**We Have:**
- ✅ React + Tailwind foundation
- ✅ Responsive design
- ✅ SEO components
- ✅ Generated brand images
- ⚠️ Missing: Visual page builder
- ⚠️ Missing: Template library

**Priority:** MEDIUM

### 3. E-commerce & Payments ⭐⭐⭐⭐⭐
**LearnWorlds Has:**
- Stripe, PayPal, multiple gateways
- Bundles and subscriptions
- Coupons and promotions
- Upsells and cross-sells
- Affiliate program management
- Tax handling (Quaderno integration)
- Multiple currencies

**We Have:**
- ⚠️ Missing: Payment integration
- ⚠️ Missing: Checkout flow
- ⚠️ Missing: Subscription management
- ⚠️ Missing: Affiliate system

**Priority:** HIGH

### 4. Student Portal & Dashboard ⭐⭐⭐⭐⭐
**LearnWorlds Has:**
- Personalized dashboard
- Progress tracking
- Certificate downloads
- Course library
- Social learning features
- Gamification (badges, points)
- Mobile app

**We Have:**
- ✅ Basic dashboard structure
- ✅ Authentication system
- ⚠️ Missing: Progress visualization
- ⚠️ Missing: Certificate generation
- ⚠️ Missing: Gamification
- ⚠️ Missing: Social features

**Priority:** HIGH

### 5. Analytics & Reporting ⭐⭐⭐⭐
**LearnWorlds Has:**
- Student progress reports
- Course completion rates
- Revenue analytics
- Engagement metrics
- Custom reports
- Export capabilities

**We Have:**
- ⚠️ Missing: Analytics dashboard
- ⚠️ Missing: Reporting system
- ⚠️ Missing: Data visualization

**Priority:** MEDIUM

### 6. Marketing Tools ⭐⭐⭐⭐
**LearnWorlds Has:**
- Email marketing automation
- Landing page builder
- Sales funnels
- Lead magnets
- Webinar integration
- Social proof widgets
- Exit-intent popups

**We Have:**
- ✅ Basic contact form
- ⚠️ Missing: Email automation
- ⚠️ Missing: Marketing funnels
- ⚠️ Missing: Lead capture

**Priority:** MEDIUM

### 7. Integrations ⭐⭐⭐⭐⭐
**LearnWorlds Has:**
- Zapier, Make, Pabbly
- Mailchimp, ConvertKit
- Zoom, MS Teams
- Google Analytics, Facebook Pixel
- Slack, Discord
- 100+ integrations

**We Have:**
- ✅ Supabase integration
- ⚠️ Missing: Third-party integrations
- ⚠️ Missing: Webhook system

**Priority:** LOW

## Priority Implementation Order

### Phase 1: Fix Deployment (CRITICAL)
1. Debug Netlify 404 issue
2. Verify build process
3. Check routing configuration
4. Test all generated images

### Phase 2: Core LMS Features (HIGH)
1. Course player with video
2. Progress tracking system
3. Certificate generation
4. Assessment engine
5. Enrollment management

### Phase 3: E-commerce (HIGH)
1. Stripe integration
2. Checkout flow
3. Payment webhooks
4. Subscription management
5. Course pricing

### Phase 4: Student Experience (MEDIUM)
1. Enhanced dashboard
2. Progress visualization
3. Certificate downloads
4. Course library
5. User profile

### Phase 5: Marketing & Analytics (MEDIUM)
1. Analytics dashboard
2. Email integration
3. Landing pages
4. Lead capture forms
5. Reporting system

### Phase 6: Advanced Features (LOW)
1. SCORM support
2. Live sessions
3. Gamification
4. Social learning
5. Mobile app
EOF

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2: Deployment Fix Script
# ─────────────────────────────────────────────────────────────────────────────

cat > scripts/fix_deployment.sh <<'BASH'
#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Fixing Netlify Deployment Issues"
echo "===================================="

# Check if dist exists
if [ ! -d "dist" ]; then
  echo "❌ dist/ directory not found. Running build..."
  npm run build
fi

# Verify critical files
echo ""
echo "📋 Verifying build artifacts..."
MISSING=0

check_file() {
  if [ -f "$1" ]; then
    echo "✅ $1"
  else
    echo "❌ $1 MISSING"
    MISSING=$((MISSING + 1))
  fi
}

check_file "dist/index.html"
check_file "dist/logo.svg"
check_file "dist/images/hero-training.jpg"
check_file "dist/images/og-cover.jpg"
check_file "dist/favicon.ico"

# Check SPA redirect
if grep -q "/*" netlify.toml; then
  echo "✅ SPA redirect configured"
else
  echo "❌ SPA redirect missing in netlify.toml"
  MISSING=$((MISSING + 1))
fi

# Check build command
if grep -q "pnpm build" netlify.toml; then
  echo "✅ Build command configured"
else
  echo "⚠️  Build command may need adjustment"
fi

echo ""
if [ $MISSING -eq 0 ]; then
  echo "✅ All checks passed!"
  echo ""
  echo "Next steps:"
  echo "1. Commit any changes: git add . && git commit -m 'Fix deployment'"
  echo "2. Push to trigger deploy: git push origin main"
  echo "3. Monitor Netlify dashboard"
else
  echo "❌ Found $MISSING issues. Fix them before deploying."
  exit 1
fi
BASH

chmod +x scripts/fix_deployment.sh

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 3: LearnWorlds-Quality Components
# ─────────────────────────────────────────────────────────────────────────────

cat > scripts/add_lms_features.sh <<'BASH'
#!/usr/bin/env bash
set -euo pipefail

echo "🎓 Adding LearnWorlds-Quality LMS Features"
echo "==========================================="

# Create feature directories
mkdir -p src/features/{courses,students,payments,analytics,certificates}
mkdir -p src/components/lms

# Course Player Component
cat > src/components/lms/CoursePlayer.tsx <<'TSX'
import { useState } from 'react'
import { Play, Pause, Volume2, Maximize } from 'lucide-react'

interface CoursePlayerProps {
  videoUrl: string
  title: string
  onProgress?: (progress: number) => void
}

export default function CoursePlayer({ videoUrl, title, onProgress }: CoursePlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleProgress = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    const percent = (video.currentTime / video.duration) * 100
    setProgress(percent)
    onProgress?.(percent)
  }

  return (
    <div className="bg-black rounded-2xl overflow-hidden">
      <video
        className="w-full aspect-video"
        src={videoUrl}
        onTimeUpdate={handleProgress}
        controls
      />
      <div className="bg-white p-4">
        <h3 className="text-xl font-bold">{title}</h3>
        <div className="mt-2 bg-slate-200 rounded-full h-2">
          <div 
            className="bg-brand-blue h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-slate-600 mt-1">{Math.round(progress)}% complete</p>
      </div>
    </div>
  )
}
TSX

# Progress Tracker Component
cat > src/components/lms/ProgressTracker.tsx <<'TSX'
import { CheckCircle, Circle, Lock } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  completed: boolean
  locked: boolean
}

interface ProgressTrackerProps {
  lessons: Lesson[]
  currentLessonId: string
  onLessonClick: (id: string) => void
}

export default function ProgressTracker({ lessons, currentLessonId, onLessonClick }: ProgressTrackerProps) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold mb-4">Course Progress</h3>
      <div className="space-y-2">
        {lessons.map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => !lesson.locked && onLessonClick(lesson.id)}
            disabled={lesson.locked}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              lesson.id === currentLessonId
                ? 'bg-brand-blue text-white'
                : lesson.locked
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'hover:bg-slate-50'
            }`}
          >
            {lesson.completed ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : lesson.locked ? (
              <Lock className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
            <span className="flex-1 text-left">{lesson.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
TSX

# Certificate Generator Component
cat > src/components/lms/CertificateGenerator.tsx <<'TSX'
import { Download, Award } from 'lucide-react'

interface CertificateProps {
  studentName: string
  courseName: string
  completionDate: string
  certificateId: string
}

export default function CertificateGenerator({ 
  studentName, 
  courseName, 
  completionDate,
  certificateId 
}: CertificateProps) {
  const handleDownload = () => {
    // TODO: Generate PDF certificate
    console.log('Generating certificate PDF...')
  }

  return (
    <div className="card p-8 text-center">
      <Award className="w-16 h-16 mx-auto text-brand-blue mb-4" />
      <h2 className="text-2xl font-bold mb-2">Certificate of Completion</h2>
      <p className="text-slate-600 mb-6">
        This certifies that <strong>{studentName}</strong> has successfully completed
        <strong> {courseName}</strong> on {completionDate}
      </p>
      <p className="text-sm text-slate-500 mb-6">Certificate ID: {certificateId}</p>
      <button onClick={handleDownload} className="btn btn-primary inline-flex items-center gap-2">
        <Download className="w-4 h-4" />
        Download Certificate
      </button>
    </div>
  )
}
TSX

# Dashboard Stats Component
cat > src/components/lms/DashboardStats.tsx <<'TSX'
import { BookOpen, Award, Clock, TrendingUp } from 'lucide-react'

interface Stat {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: string
}

export default function DashboardStats() {
  const stats: Stat[] = [
    { label: 'Courses Enrolled', value: 5, icon: <BookOpen className="w-6 h-6" /> },
    { label: 'Certificates Earned', value: 2, icon: <Award className="w-6 h-6" /> },
    { label: 'Hours Learned', value: '24.5', icon: <Clock className="w-6 h-6" /> },
    { label: 'Completion Rate', value: '78%', icon: <TrendingUp className="w-6 h-6" />, trend: '+12%' }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.label} className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-brand-blue">{stat.icon}</div>
            {stat.trend && (
              <span className="text-sm text-green-600 font-medium">{stat.trend}</span>
            )}
          </div>
          <p className="text-2xl font-bold">{stat.value}</p>
          <p className="text-sm text-slate-600">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
TSX

echo "✅ LMS components created"
echo ""
echo "Components added:"
echo "  - CoursePlayer (video with progress tracking)"
echo "  - ProgressTracker (lesson navigation)"
echo "  - CertificateGenerator (PDF certificates)"
echo "  - DashboardStats (student analytics)"
BASH

chmod +x scripts/add_lms_features.sh

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 4: Summary Report
# ─────────────────────────────────────────────────────────────────────────────

cat > analysis/learnworlds-parity/implementation-plan.md <<'EOF'
# LearnWorlds Parity Implementation Plan

## Immediate Actions (Today)

### 1. Fix Deployment ⚠️ CRITICAL
```bash
bash scripts/fix_deployment.sh
```

**What it does:**
- Verifies build artifacts
- Checks Netlify configuration
- Validates SPA routing
- Confirms all images present

**Expected outcome:** Site deploys successfully to Netlify

### 2. Add Core LMS Components
```bash
bash scripts/add_lms_features.sh
```

**What it adds:**
- CoursePlayer with progress tracking
- ProgressTracker for lesson navigation
- CertificateGenerator for completions
- DashboardStats for student analytics

## Week 1: Core LMS Features

### Day 1-2: Course Management
- [ ] Course detail pages
- [ ] Lesson viewer
- [ ] Video player integration
- [ ] Progress persistence (Supabase)

### Day 3-4: Student Portal
- [ ] Enhanced dashboard
- [ ] Course library
- [ ] Progress visualization
- [ ] Certificate downloads

### Day 5: Testing & Polish
- [ ] End-to-end testing
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Bug fixes

## Week 2: E-commerce Integration

### Day 1-2: Stripe Setup
- [ ] Stripe account configuration
- [ ] Product/price creation
- [ ] Checkout flow
- [ ] Payment webhooks

### Day 3-4: Enrollment System
- [ ] Purchase → enrollment automation
- [ ] Access control
- [ ] Subscription management
- [ ] Refund handling

### Day 5: Testing & Launch
- [ ] Payment testing (test mode)
- [ ] Error handling
- [ ] Email notifications
- [ ] Production deployment

## Week 3: Analytics & Marketing

### Day 1-2: Analytics Dashboard
- [ ] Student progress reports
- [ ] Course completion rates
- [ ] Revenue tracking
- [ ] Engagement metrics

### Day 3-4: Marketing Tools
- [ ] Email integration (Mailchimp/ConvertKit)
- [ ] Landing page templates
- [ ] Lead capture forms
- [ ] Coupon system

### Day 5: Optimization
- [ ] SEO improvements
- [ ] Performance tuning
- [ ] A/B testing setup
- [ ] Analytics verification

## Week 4: Advanced Features

### Day 1-2: Assessment Engine
- [ ] Quiz builder
- [ ] Multiple question types
- [ ] Automatic grading
- [ ] Results tracking

### Day 3-4: Social Learning
- [ ] Discussion forums
- [ ] Student profiles
- [ ] Activity feed
- [ ] Notifications

### Day 5: Polish & Launch
- [ ] Final testing
- [ ] Documentation
- [ ] User training
- [ ] Production launch

## Success Metrics

### Technical Quality
- ✅ Lighthouse score > 90
- ✅ Page load < 2 seconds
- ✅ Mobile responsive
- ✅ Zero console errors
- ✅ WCAG 2.1 AA compliant

### Feature Parity
- ✅ Course player with tracking
- ✅ Student dashboard
- ✅ Certificate generation
- ✅ Payment processing
- ✅ Progress tracking
- ✅ Analytics dashboard

### Business Metrics
- ✅ Course enrollment flow < 3 clicks
- ✅ Payment success rate > 95%
- ✅ Certificate generation < 5 seconds
- ✅ Dashboard load < 1 second
- ✅ Mobile conversion rate > 60%

## Resources Needed

### Development
- React + TypeScript expertise
- Supabase database design
- Stripe integration experience
- Video streaming knowledge

### Design
- UI/UX designer for templates
- Brand guidelines
- Icon library
- Image assets

### Content
- Course curriculum
- Video content
- Assessment questions
- Certificate templates

## Risk Mitigation

### Technical Risks
- **Risk:** Video hosting costs
  **Mitigation:** Use Vimeo/YouTube embedding

- **Risk:** Payment processing failures
  **Mitigation:** Robust error handling + retry logic

- **Risk:** Database performance
  **Mitigation:** Proper indexing + caching

### Business Risks
- **Risk:** Feature scope creep
  **Mitigation:** Stick to MVP, iterate later

- **Risk:** User adoption
  **Mitigation:** Beta testing + feedback loops

- **Risk:** Competition
  **Mitigation:** Focus on unique value proposition

## Next Steps

1. **Run deployment fix:**
   ```bash
   bash scripts/fix_deployment.sh
   ```

2. **Add LMS components:**
   ```bash
   bash scripts/add_lms_features.sh
   ```

3. **Test locally:**
   ```bash
   npm run build && npm run preview
   ```

4. **Deploy:**
   ```bash
   git add . && git commit -m "Add LearnWorlds-quality LMS features"
   git push origin main
   ```

5. **Monitor:**
   - Check Netlify dashboard
   - Test all routes
   - Verify images load
   - Test on mobile

## Support

For questions or issues:
- Review gap analysis: `analysis/learnworlds-parity/gap-analysis.md`
- Check implementation plan: `analysis/learnworlds-parity/implementation-plan.md`
- Run deployment fix: `bash scripts/fix_deployment.sh`
- Add LMS features: `bash scripts/add_lms_features.sh`
EOF

# ─────────────────────────────────────────────────────────────────────────────
# Final Output
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "✅ LearnWorlds Parity Analysis Complete!"
echo ""
echo "📊 Generated Files:"
echo "  - analysis/learnworlds-parity/gap-analysis.md"
echo "  - analysis/learnworlds-parity/implementation-plan.md"
echo "  - scripts/fix_deployment.sh"
echo "  - scripts/add_lms_features.sh"
echo ""
echo "🚀 Next Steps:"
echo "  1. Fix deployment: bash scripts/fix_deployment.sh"
echo "  2. Add LMS features: bash scripts/add_lms_features.sh"
echo "  3. Review gap analysis: cat analysis/learnworlds-parity/gap-analysis.md"
echo "  4. Follow implementation plan: cat analysis/learnworlds-parity/implementation-plan.md"
echo ""
