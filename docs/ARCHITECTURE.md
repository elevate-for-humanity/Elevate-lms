# Architecture Documentation

**Platform:** Elevate for Humanity Workforce Marketplace  
**Version:** 2.0.0  
**Last Updated:** January 4, 2026

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Data Architecture](#data-architecture)
6. [Security Architecture](#security-architecture)
7. [Deployment Architecture](#deployment-architecture)
8. [Integration Architecture](#integration-architecture)
9. [Scalability & Performance](#scalability--performance)
10. [Monitoring & Observability](#monitoring--observability)

---

## System Overview

### Platform Type
**Multi-Sided Workforce Marketplace** connecting:
- Job seekers with training opportunities
- Training providers with students
- Employers with trained candidates
- Workforce boards with compliance data
- Government funders with outcome reporting

### Architecture Style
- **Frontend:** Server-Side Rendered (SSR) + Static Site Generation (SSG)
- **Backend:** Serverless API (Edge Runtime)
- **Database:** PostgreSQL with Row Level Security
- **Deployment:** Serverless (Netlify)
- **Pattern:** Jamstack + API-first

---

## Architecture Principles

### 1. **Multi-Tenancy**
- Organization-based isolation
- Shared database with tenant_id filtering
- Row Level Security (RLS) enforcement
- Tenant-specific feature flags

### 2. **Security First**
- Authentication required for all protected routes
- Authorization via RLS policies
- Input validation on all endpoints
- Audit logging for critical actions

### 3. **Scalability**
- Serverless architecture (auto-scaling)
- Edge caching for static content
- Database connection pooling
- Async processing for heavy operations

### 4. **Compliance**
- WIOA reporting automation
- FERPA data protection
- Audit trail for all data changes
- Data retention policies

### 5. **Developer Experience**
- TypeScript for type safety
- Component-based architecture
- API-first design
- Comprehensive error handling

---

## Technology Stack

### Frontend Layer

#### Framework
- **Next.js 16.1.1** - React framework with App Router
- **React 19.2.1** - UI library
- **TypeScript 5.9.3** - Type safety

#### UI Components
- **Tailwind CSS 3.4.18** - Utility-first CSS
- **Radix UI** - Accessible component primitives
- **Framer Motion 12.23.24** - Animations
- **Lucide React 0.471.2** - Icons

#### State Management
- **Zustand 5.0.9** - Global state
- **React Hook Form 7.66.1** - Form state
- **SWR 2.3.6** - Data fetching

#### Validation
- **Zod 4.1.12** - Schema validation
- **@hookform/resolvers 5.2.2** - Form validation

### Backend Layer

#### Runtime
- **Node.js 20+** - JavaScript runtime
- **Edge Runtime** - Netlify Edge Functions
- **Next.js API Routes** - API endpoints

#### Database
- **Supabase** - PostgreSQL + Auth + Storage
- **PostgreSQL 15** - Relational database
- **Row Level Security** - Authorization

#### Authentication
- **Supabase Auth** - User authentication
- **JWT Tokens** - Session management
- **OAuth Providers** - Social login

### Infrastructure Layer

#### Hosting
- **Netlify** - Serverless deployment
- **Edge Network** - Global CDN
- **Serverless Functions** - API execution

#### Storage
- **Supabase Storage** - File storage
- **Cloud storage** - Asset storage (optional)

#### Monitoring
- **Sentry 10.32.1** - Error tracking
- **Analytics** - Performance monitoring
- **Custom Health Checks** - System monitoring

### Integration Layer

#### Payments
- **Stripe 19.3.1** - Payment processing
- **Affirm** - Buy now, pay later

#### Communication
- **Resend 6.4.2** - Transactional email
- **SendGrid 8.1.6** - Marketing email (optional)

#### AI/ML
- **OpenAI 6.9.1** - AI tutors and content generation

#### Video
- **Video.js 8.23.4** - Video player
- **Cloudflare Stream** - Video hosting (optional)

#### Documents
- **PDF-lib 1.17.1** - PDF generation
- **jsPDF 3.0.4** - PDF creation
- **Signature Pad 5.1.1** - E-signatures

---

## System Components

### 1. Frontend Application

```
app/
├── (auth)/              # Authentication routes
│   ├── login/
│   ├── signup/
│   └── invite/
├── (dashboard)/         # Protected dashboards
│   ├── client-portal/
│   └── org/
├── (marketing)/         # Public pages
│   ├── about/
│   ├── programs/
│   └── contact/
├── (partner)/           # Partner portal
│   └── attendance/
├── admin/               # Admin panel
│   ├── dashboard/
│   ├── users/
│   └── reports/
├── courses/             # Course catalog
│   ├── [courseId]/
│   │   ├── learn/      # Course player
│   │   └── lessons/
│   └── catalog/
└── api/                 # API routes
    ├── auth/
    ├── courses/
    ├── enrollments/
    ├── payments/
    └── [200+ endpoints]
```

### 2. Component Library

```
components/
├── ui/                  # Base UI components
│   ├── button.tsx
│   ├── input.tsx
│   └── dialog.tsx
├── course/              # Course components
│   ├── CourseCard.tsx
│   └── CoursePlayer.tsx
├── lms/                 # LMS components
│   ├── LessonContent.tsx
│   └── ProgressBar.tsx
├── admin/               # Admin components
│   ├── AdminNav.tsx
│   └── UserTable.tsx
└── [331 components]
```

### 3. API Layer

```
app/api/
├── auth/                # Authentication
│   ├── signup/
│   ├── login/
│   └── session/
├── courses/             # Course management
│   ├── route.ts         # List/create courses
│   ├── [courseId]/      # Course details
│   └── metadata/
├── enrollments/         # Enrollment management
│   ├── route.ts         # List/create enrollments
│   ├── create/
│   └── checkout/
├── progress/            # Progress tracking
│   └── route.ts
├── payments/            # Payment processing
│   ├── stripe/
│   └── affirm/
└── [200+ endpoints]
```

### 4. Database Layer

```
supabase/
├── migrations/          # Schema migrations (349 files)
│   ├── 001_initial_schema.sql
│   ├── 002_multi_tenant_foundation.sql
│   └── [347 more migrations]
├── seeds/               # Seed data
│   ├── 000_master_seed.sql
│   └── [23 seed files]
└── rls-policies.sql     # Row Level Security
```

---

## Data Architecture

### Database Schema

#### Core Tables

**Users & Authentication**
```sql
profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT,
  tenant_id UUID,
  created_at TIMESTAMP
)
```

**Multi-Tenancy**
```sql
tenants (
  id UUID PRIMARY KEY,
  name TEXT,
  slug TEXT UNIQUE,
  settings JSONB,
  created_at TIMESTAMP
)

licenses (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  plan TEXT,
  features JSONB,
  expires_at TIMESTAMP
)
```

**Learning Management**
```sql
courses (
  id UUID PRIMARY KEY,
  title TEXT,
  slug TEXT UNIQUE,
  instructor_id UUID,
  status TEXT,
  price DECIMAL,
  created_at TIMESTAMP
)

modules (
  id UUID PRIMARY KEY,
  course_id UUID,
  title TEXT,
  order_index INTEGER
)

lessons (
  id UUID PRIMARY KEY,
  module_id UUID,
  course_id UUID,
  title TEXT,
  content_type TEXT,
  content_url TEXT,
  order_index INTEGER
)
```

**Enrollment & Progress**
```sql
enrollments (
  id UUID PRIMARY KEY,
  user_id UUID,
  course_id UUID,
  status TEXT,
  progress_percentage INTEGER,
  enrolled_at TIMESTAMP,
  completed_at TIMESTAMP
)

lesson_progress (
  id UUID PRIMARY KEY,
  user_id UUID,
  lesson_id UUID,
  status TEXT,
  completed_at TIMESTAMP
)
```

**Payments**
```sql
payment_history (
  id UUID PRIMARY KEY,
  user_id UUID,
  enrollment_id UUID,
  amount DECIMAL,
  currency TEXT,
  stripe_payment_intent TEXT,
  status TEXT,
  created_at TIMESTAMP
)
```

**Compliance**
```sql
audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  action TEXT,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMP
)

employment_tracking (
  id UUID PRIMARY KEY,
  user_id UUID,
  employer TEXT,
  position TEXT,
  start_date DATE,
  wage DECIMAL
)
```

### Data Flow

#### Enrollment Flow
```
User → Browse Courses → Select Course → Create Enrollment
  ↓
Payment Required? → Yes → Stripe Checkout → Payment Success
  ↓                  ↓
  No                 ↓
  ↓                  ↓
Enrollment Created → Email Notification → Access Course
```

#### Progress Tracking Flow
```
User → Start Lesson → Watch Video → Mark Complete
  ↓
Update lesson_progress → Calculate course progress
  ↓
Update enrollments.progress_percentage
  ↓
100% Complete? → Yes → Generate Certificate
  ↓               ↓
  No              ↓
Continue         Update enrollment.completed_at
```

### Row Level Security (RLS)

#### Policy Examples

**Students can view own enrollments:**
```sql
CREATE POLICY "Users can view own enrollments"
ON enrollments FOR SELECT
USING (auth.uid() = user_id);
```

**Instructors can view own courses:**
```sql
CREATE POLICY "Instructors can view own courses"
ON courses FOR SELECT
USING (auth.uid() = instructor_id);
```

**Admins can view all data:**
```sql
CREATE POLICY "Admins can view all"
ON enrollments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

**Multi-tenant isolation:**
```sql
CREATE POLICY "Tenant isolation"
ON profiles FOR SELECT
USING (
  tenant_id = (
    SELECT tenant_id FROM profiles
    WHERE id = auth.uid()
  )
);
```

---

## Security Architecture

### Authentication Flow

```
User → Login Form → Supabase Auth → JWT Token
  ↓
Store in HTTP-only Cookie
  ↓
Include in API Requests → Verify Token → Access Granted
```

### Authorization Layers

1. **Route Protection** - Middleware checks authentication
2. **RLS Policies** - Database-level authorization
3. **API Validation** - Input validation with Zod
4. **Role Checks** - Application-level role verification

### Security Features

#### Input Validation
```typescript
// Zod schema validation
const enrollmentSchema = z.object({
  courseId: z.string().uuid(),
  userId: z.string().uuid(),
  paymentMethod: z.enum(['stripe', 'affirm', 'free'])
});
```

#### XSS Protection
```typescript
// DOMPurify sanitization
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
```

#### CSRF Protection
- Built into Next.js
- SameSite cookies
- Origin verification

#### Rate Limiting
```typescript
// API rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────┐
│           Netlify Edge Network               │
│  (Global CDN + Edge Functions)              │
└─────────────────┬───────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────────┐          ┌───────▼──────┐
│  Static    │          │  Serverless  │
│  Assets    │          │  Functions   │
│  (SSG)     │          │  (API)       │
└────────────┘          └───────┬──────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌───────▼────────┐      ┌──────▼──────┐
            │   Supabase     │      │   Stripe    │
            │   PostgreSQL   │      │   Payments  │
            └────────────────┘      └─────────────┘
```

### Deployment Process

1. **Code Push** → GitHub repository
2. **Trigger** → Netlify webhook
3. **Build** → Next.js build (8GB memory)
4. **Deploy** → Netlify serverless
5. **Verify** → Health checks
6. **Promote** → Production traffic

### Environment Configuration

**Development:**
- Local Next.js server
- Local Supabase (optional)
- Stripe test mode

**Staging:**
- Netlify preview deployment
- Staging database
- Stripe test mode

**Production:**
- Netlify production
- Production database
- Stripe live mode

---

## Integration Architecture

### External Services

#### Payment Processing (Stripe)
```
User → Checkout → Create Session → Stripe Hosted Page
  ↓
Payment Complete → Webhook → Update Database
  ↓
Send Confirmation Email → Grant Access
```

#### Email Delivery (Resend)
```
Trigger Event → Queue Email → Resend API → Delivery
  ↓
Track Status → Update Database
```

#### AI Integration (OpenAI)
```
User Question → API Request → OpenAI → Response
  ↓
Format Response → Display to User
```

### API Integration Patterns

#### Webhook Handling
```typescript
// Stripe webhook handler
export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const event = stripe.webhooks.constructEvent(
    await request.text(),
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object);
      break;
    // ... other events
  }
}
```

#### Third-Party API Calls
```typescript
// OpenAI integration
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }]
});
```

---

## Scalability & Performance

### Scalability Strategy

#### Horizontal Scaling
- **Serverless functions** - Auto-scale with demand
- **Database connection pooling** - Efficient connections
- **CDN caching** - Reduce origin requests

#### Vertical Scaling
- **Database** - Supabase auto-scaling
- **Build memory** - 8GB for large builds

### Performance Optimizations

#### Frontend
- **Code splitting** - Dynamic imports
- **Image optimization** - Next.js Image component
- **Font optimization** - Next.js Font optimization
- **Bundle analysis** - Webpack bundle analyzer

#### Backend
- **Edge runtime** - Low latency API responses
- **Database indexes** - Optimized queries
- **Caching** - Redis for session data

#### Database
- **Indexes** - All foreign keys indexed
- **Query optimization** - Explain analyze
- **Connection pooling** - PgBouncer

### Performance Metrics

**Target Metrics:**
- **Time to First Byte (TTFB):** < 200ms
- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.5s
- **API Response Time:** < 500ms

---

## Monitoring & Observability

### Monitoring Stack

#### Error Tracking (Sentry)
- JavaScript errors
- API errors
- Performance issues
- User feedback

#### Performance Monitoring
- Web vitals
- API latency
- Build times
- Deployment status

#### Custom Health Checks
```typescript
// Health check endpoint
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    stripe: await checkStripe(),
    email: await checkEmail()
  };
  
  return Response.json({
    status: allHealthy(checks) ? 'healthy' : 'degraded',
    checks
  });
}
```

### Logging Strategy

#### Application Logs
```typescript
import { logger } from '@/lib/logger';

logger.info('User enrolled', { userId, courseId });
logger.error('Payment failed', { error, userId });
```

#### Audit Logs
```sql
INSERT INTO audit_logs (user_id, action, resource_type, resource_id)
VALUES ($1, 'enrollment_created', 'enrollment', $2);
```

### Alerting

**Critical Alerts:**
- Database connection failures
- Payment processing errors
- Authentication failures
- High error rates

**Warning Alerts:**
- Slow API responses
- High memory usage
- Failed background jobs

---

## Future Architecture Considerations

### Planned Improvements

1. **Microservices** - Extract heavy services (video processing, reporting)
2. **Message Queue** - RabbitMQ/SQS for async processing
3. **GraphQL** - Unified API layer
4. **Mobile Apps** - React Native applications
5. **Real-time** - WebSocket for live features
6. **Analytics** - Dedicated analytics database
7. **Search** - Elasticsearch for advanced search
8. **Caching** - Redis for session and query caching

### Scalability Roadmap

**Phase 1 (Current):** Serverless monolith
**Phase 2 (6 months):** Extract background jobs
**Phase 3 (12 months):** Microservices for heavy operations
**Phase 4 (18 months):** Multi-region deployment

---

## Appendix

### Technology Decisions

**Why Next.js?**
- Server-side rendering for SEO
- API routes for backend
- Built-in optimizations
- Great developer experience

**Why Supabase?**
- PostgreSQL with modern API
- Built-in authentication
- Row Level Security
- Real-time capabilities

**Why Netlify?**
- Seamless Next.js integration
- Global edge network
- Automatic scaling
- Zero-config deployment

**Why Stripe?**
- Industry-standard payments
- Excellent documentation
- Webhook reliability
- PCI compliance

---

**Document Version:** 1.0  
**Last Updated:** January 4, 2026  
**Maintained By:** Engineering Team
