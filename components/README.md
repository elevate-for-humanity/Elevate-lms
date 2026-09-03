# Components Directory Structure

This directory contains all reusable UI components organized by domain.

## Directory Structure

```
components/
├── ai/                    # AI-powered features
│   ├── AIAssistant.tsx
│   ├── AICareerCounseling.tsx
│   ├── AIInstructor.tsx
│   └── AITutor.tsx
│
├── analytics/             # Analytics and reporting
│   ├── EngagementCharts.tsx
│   ├── LearningAnalytics.tsx
│   └── PerformanceDashboard.tsx
│
├── auth/                  # Authentication components
│   ├── LoginForm.tsx
│   ├── ProtectedRoute.tsx
│   └── RequireRole.tsx
│
├── certificates/          # Certificate generation and display
│   ├── CertificateDownload.tsx
│   ├── CertificateGenerator.tsx
│   └── VerifiedCredentials.tsx
│
├── communication/         # Messaging and notifications
│   ├── AnnouncementsSystem.tsx
│   ├── LiveChatSupport.tsx
│   └── NotificationCenter.tsx
│
├── compliance/            # Regulatory compliance
│   ├── ComplianceBadges.tsx
│   ├── PathwayDisclosure.tsx
│   └── WIOACompliance.tsx
│
├── course/                # Course-related components
│   ├── CourseCard.tsx
│   ├── CoursePlayer.tsx
│   ├── LessonPlayer.tsx
│   └── ProgressTracker.tsx
│
├── dashboard/             # Dashboard widgets
│   ├── ActivityFeed.tsx
│   ├── ProgressChart.tsx
│   └── StatsGrid.tsx
│
├── employer/              # Employer portal components
│   ├── TalentPipeline.tsx
│   ├── WorkforceAnalytics.tsx
│   └── JobPostings.tsx
│
├── enrollment/            # Enrollment flow
│   ├── ApplicationForm.tsx
│   ├── EligibilityChecker.tsx
│   └── PaymentFlow.tsx
│
├── forms/                 # Form components
│   ├── SignaturePad.tsx
│   ├── FileUpload.tsx
│   └── FormValidation.tsx
│
├── gamification/          # Gamification features
│   ├── Achievements.tsx
│   ├── Leaderboard.tsx
│   └── ProgressBadges.tsx
│
├── layout/                # Layout components
│   ├── SiteHeader.tsx
│   ├── SiteFooter.tsx
│   └── ConditionalLayout.tsx
│
├── lms/                   # LMS-specific components
│   ├── ContentLibrary.tsx
│   ├── GradeBook.tsx
│   └── AttendanceTracker.tsx
│
├── marketing/             # Marketing components
│   ├── HeroSection.tsx
│   ├── TestimonialCarousel.tsx
│   └── TrustBadges.tsx
│
├── mobile/                # Mobile-specific components
│   ├── MobileNav.tsx
│   ├── OfflineBanner.tsx
│   └── VideoDownload.tsx
│
├── payment/               # Payment components
│   ├── StripeCheckout.tsx
│   ├── PaymentPlan.tsx
│   └── InvoiceDisplay.tsx
│
├── portal/                # Portal-specific components
│   ├── StudentPortal.tsx
│   ├── StaffPortal.tsx
│   └── EmployerPortal.tsx
│
├── scheduling/            # Calendar and scheduling
│   ├── CalendarWidget.tsx
│   ├── AppointmentBooker.tsx
│   └── AvailabilityPicker.tsx
│
├── social/                # Social features
│   ├── DiscussionForum.tsx
│   ├── PeerReview.tsx
│   └── Collaboration.tsx
│
├── support/               # Support components
│   ├── HelpCenter.tsx
│   ├── TicketForm.tsx
│   └── ChatWidget.tsx
│
├── templates/             # Page templates
│   ├── StateCareerTrainingPage.tsx
│   ├── StateCommunityServicesPage.tsx
│   └── StateTaxPreparationPage.tsx
│
├── ui/                    # Base UI components (shadcn)
│   ├── button.tsx
│   ├── card.tsx
│   └── dialog.tsx
│
├── video/                 # Video components
│   ├── VideoPlayer.tsx
│   ├── VideoHero.tsx
│   └── VideoRecorder.tsx
│
└── workforce/             # Workforce development
    ├── SkillsAssessment.tsx
    ├── CareerPathway.tsx
    └── JobPlacement.tsx
```

## Component Registry

All components are registered in the database table `component_registry` for:

- Feature flag management
- Usage analytics
- A/B testing
- Dynamic loading

## Usage

```tsx
import { AIInstructor } from '@/components/ai/AIInstructor';
import { CourseCard } from '@/components/course/CourseCard';
import { Button } from '@/components/ui/button';
```
