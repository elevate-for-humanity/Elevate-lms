# Technical Architecture Documentation
**Elevate for Humanity Platform**
**Version 1.0 | March 2026**

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ELEVATE FOR HUMANITY                              │
│                    Enterprise AI Workforce Operating System                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         PRESENTATION LAYER                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │   LMS App    │  │ Admin Portal │  │ Partner Hub  │              │   │
│  │  │  (Public)    │  │  (Internal)  │  │ (Employers)  │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  Apprentice  │  │   Mentor     │  │   Dev Studio │              │   │
│  │  │  Dashboard   │  │   Portal     │  │ (WebContainer)│              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│  ┌──────────────────────────────────▼──────────────────────────────────┐   │
│  │                         API GATEWAY LAYER                            │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Next.js 15 API Routes                      │   │   │
│  │  │   /api/auth  /api/users  /api/courses  /api/programs         │   │   │
│  │  │   /api/timeclock  /api/billing  /api/ai  /api/reports        │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │ Rate Limit  │  │    Auth     │  │    CORS     │  │   Audit   │  │   │
│  │  │   Middleware│  │   Guard     │  │   Config    │  │   Logger  │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│  ┌──────────────────────────────────▼──────────────────────────────────┐   │
│  │                         BUSINESS LOGIC LAYER                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │   Enrollment │  │   Learning   │  │   Billing    │              │   │
│  │  │   Service    │  │   Engine     │  │   Service    │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │   Timeclock  │  │   Credential │  │   Reporting  │              │   │
│  │  │   Service    │  │   Service    │  │   Service    │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │      AI      │  │   Payment    │  │   Compliance │              │   │
│  │  │   Service    │  │   Enforce    │  │   Service    │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│  ┌──────────────────────────────────▼──────────────────────────────────┐   │
│  │                         DATA LAYER (Supabase)                        │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │   │
│  │  │   PostgreSQL   │  │    Realtime    │  │    Storage     │        │   │
│  │  │  (150+ tables) │  │   (Live Sync)  │  │  (S3/Blob)     │        │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘        │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │   │
│  │  │    Auth        │  │     Edge       │  │    Vector      │        │   │
│  │  │  (MFA/JWT)     │  │   Functions    │  │   Search       │        │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘        │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Application Architecture

### 2.1 Monorepo Structure
```
Elevate-lms/
├── apps/
│   ├── admin/              # Internal admin portal (Next.js)
│   └── ...
├── packages/
│   ├── db/                 # Database types & schemas
│   ├── shared/             # Shared utilities
│   └── ui/                 # Shared UI components
├── app/                    # Main LMS application (Next.js 15)
│   ├── (auth)/             # Authentication routes
│   ├── (app)/              # Authenticated app routes
│   │   ├── apprentice/     # Apprentice dashboard
│   │   ├── employer/       # Employer portal
│   │   ├── mentor/         # Mentor dashboard
│   │   └── admin/          # Admin routes
│   ├── api/                # API routes
│   │   ├── auth/
│   │   ├── users/
│   │   ├── courses/
│   │   ├── programs/
│   │   ├── timeclock/
│   │   ├── billing/
│   │   ├── ai/
│   │   └── reports/
│   └── programs/           # Public program pages
├── lib/                    # Shared libraries
│   ├── supabase/           # Supabase clients
│   ├── auth/               # Authentication utilities
│   ├── billing/            # Billing (Stripe) integration
│   ├── barber/             # Barber apprenticeship logic
│   └── ...
└── scripts/                # Build & deployment scripts
```

### 2.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15, React 19, TypeScript | UI framework |
| **Styling** | Tailwind CSS, shadcn/ui | Design system |
| **State** | React Context, URL state | Client state |
| **API** | Next.js Route Handlers | API layer |
| **Database** | Supabase (PostgreSQL) | Primary database |
| **Auth** | Supabase Auth | Authentication |
| **Storage** | Supabase Storage | File storage |
| **Realtime** | Supabase Realtime | Live updates |
| **AI** | OpenAI GPT-4 | AI features |
| **Payments** | Stripe | Billing |
| **Deployment** | Northflank | Hosting |

---

## 3. Database Architecture

### 3.1 Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CORE TABLES                             │
├─────────────────────────────────────────────────────────────────┤
│  users ────────────────────────────────────────────────────────  │
│    │                                                            │
│    ├── profiles ──────────── Apprentice, Employer, Mentor       │
│    │       │                                                     │
│    │       ├── barber_enrollments                               │
│    │       ├── esthetician_enrollments                          │
│    │       ├── nail_tech_enrollments                            │
│    │       │                                                     │
│    │       ├── timeclock_entries                                │
│    │       ├── approved_hours                                   │
│    │       ├── competencies                                     │
│    │       │                                                     │
│    │       └── documents                                        │
│    │                │                                           │
│    │                ├── barber_documents                        │
│    │                ├── esthetician_documents                   │
│    │                └── nail_tech_documents                     │
│    │                                                            │
│    ├── enrollments ──────────── Program enrollments              │
│    │       │                                                     │
│    │       ├── host_shops (for employers)                       │
│    │       └── partner_relationships                            │
│    │                                                            │
│    ├── subscriptions ──────── Stripe subscriptions               │
│    │                                                            │
│    └── automated_decisions ──── Audit log                       │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Key Tables

| Table | Purpose | Rows (est.) |
|-------|---------|-------------|
| `profiles` | User profiles | 1,000+ |
| `barber_enrollments` | Barber program data | 200+ |
| `timeclock_entries` | Clock in/out records | 50,000+ |
| `approved_hours` | Verified training hours | 10,000+ |
| `competencies` | Skill tracking | 5,000+ |
| `courses` | LMS courses | 100+ |
| `lessons` | Course lessons | 1,000+ |
| `enrollments` | Program enrollments | 500+ |

### 3.3 Row-Level Security (RLS)

```sql
-- Example: Apprentices can only see their own data
CREATE POLICY "Apprentice sees own profile"
ON profiles FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM roles WHERE user_id = auth.uid() AND role IN ('admin', 'employer')
  )
);

-- Example: Employers see their apprentices
CREATE POLICY "Employer sees apprentices"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM host_shops hs
    JOIN enrollments e ON e.host_shop_id = hs.id
    WHERE hs.user_id = auth.uid() AND e.user_id = profiles.id
  )
);
```

---

## 4. API Architecture

### 4.1 RESTful Endpoints

```
Authentication
├── POST   /api/auth/signup          # User registration
├── POST   /api/auth/login           # User login
├── POST   /api/auth/logout          # User logout
├── POST   /api/auth/refresh         # Token refresh
└── GET    /api/auth/session         # Get current session

Users
├── GET    /api/users/me             # Current user profile
├── PATCH  /api/users/me             # Update profile
├── GET    /api/users/:id            # Get user (admin)
└── GET    /api/users/list           # List users (admin)

Programs
├── GET    /api/programs             # List programs
├── GET    /api/programs/:slug       # Get program details
├── POST   /api/programs/enroll      # Enroll in program
└── GET    /api/programs/progress    # Get progress

Timeclock
├── POST   /api/timeclock/clock-in   # Clock in (with geofence)
├── POST   /api/timeclock/clock-out  # Clock out
├── POST   /api/timeclock/heartbeat  # GPS heartbeat
├── GET    /api/timeclock/history    # Get clock history
└── GET    /api/timeclock/today      # Today's entries

Billing
├── GET    /api/billing/subscription # Get subscription
├── POST   /api/billing/checkout     # Create checkout
├── POST   /api/billing/portal       # Customer portal
├── POST   /api/billing/webhook      # Stripe webhook
└── GET    /api/billing/invoices     # List invoices

AI
├── POST   /api/ai/course-generate   # Generate course
├── POST   /api/ai/lesson-generate   # Generate lesson
├── POST   /api/ai/chat              # AI chat
└── GET    /api/ai/usage             # Usage stats

Reports
├── GET    /api/reports/hours        # Hours report
├── GET    /api/reports/progress     # Progress report
├── GET    /api/reports/compliance   # Compliance report
└── GET    /api/reports/employer     # Employer report
```

### 4.2 API Security

```typescript
// Rate limiting
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
};

// CORS configuration
const corsOptions = {
  origin: ['https://elevateforhumanity.org', 'https://admin.elevateforhumanity.org'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
```

---

## 5. Authentication & Authorization

### 5.1 Auth Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User ──▶ Login Page ──▶ Supabase Auth ──▶ JWT Token            │
│                              │                                   │
│                              ├── Email/Password                  │
│                              ├── Magic Link                      │
│                              ├── OAuth (Google)                  │
│                              └── MFA (TOTP)                      │
│                                                                  │
│  JWT Token ──▶ API Routes ──▶ RLS Policies ──▶ Database         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| `admin` | Full system access |
| `employer` | Manage apprentices, approve hours |
| `apprentice` | Access courses, clock in/out |
| `mentor` | View apprentice progress |
| `learner` | Take courses, view certificates |
| `viewer` | Read-only access |

### 5.3 RLS Implementation

```typescript
// Supabase RLS policies
const policies = [
  // Users can only read their own profile
  { table: 'profiles', action: 'SELECT', using: 'auth.uid() = id' },
  
  // Employers can read their apprentices' profiles
  { table: 'profiles', action: 'SELECT', using: 'host_shop_access(auth.uid(), id)' },
  
  // Apprentices can only write their own timeclock
  { table: 'timeclock_entries', action: 'INSERT', using: 'auth.uid() = user_id' },
  
  // Admins can read all
  { table: '*', action: 'SELECT', using: "auth.jwt() -> 'role' = 'admin'" },
];
```

---

## 6. AI Architecture

### 6.1 AI Service Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI SERVICE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Course     │  │    Lesson    │  │    Quiz      │          │
│  │  Generator   │  │  Generator   │  │  Generator   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Content    │  │     AI       │  │   Prompt     │          │
│  │ Moderation   │  │   Tutor      │  │  Templates   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                   OpenAI GPT-4 API                    │       │
│  │  • gpt-4-turbo (course generation)                   │       │
│  │  • gpt-4 (chat/tutor)                                │       │
│  │  • gpt-4-vision (document analysis)                  │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 AI Features

| Feature | Model | Use Case |
|---------|-------|----------|
| Course Generation | GPT-4 Turbo | Create full courses from prompts |
| Lesson Generation | GPT-4 Turbo | Generate lesson content |
| Quiz Generation | GPT-4 | Create assessments |
| AI Tutor | GPT-4 | Chat-based learning assistant |
| Content Moderation | GPT-4 | Filter inappropriate content |
| Summarization | GPT-3.5 | Course summaries |

---

## 7. Real-time Systems

### 7.1 Supabase Realtime

```typescript
// Subscribe to timeclock updates
supabase
  .channel('timeclock')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'timeclock_entries',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    if (payload.eventType === 'INSERT') {
      updateClockStatus('clocked_in');
    }
  })
  .subscribe();
```

### 7.2 Presence & Broadcasting

```typescript
// Track online users
supabase.channel('online-users')
  .on('presence', { event: 'sync' }, () => {
    const state = presences();
    updateOnlineCount(Object.keys(state).length);
  })
  .subscribe();
```

---

## 8. Caching Strategy

### 8.1 Cache Layers

| Layer | Technology | TTL | Use Case |
|-------|------------|-----|----------|
| CDN | Northflank Edge | 60s | Static assets |
| API | Next.js ISR | 60s | Public pages |
| Database | PostgreSQL | - | Query caching |
| In-Memory | Node.js | 5min | Session data |

### 8.2 Cache Headers

```typescript
// Public content (CDN cache)
res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

// Private content (no cache)
res.setHeader('Cache-Control', 'no-store, max-age=0');

// User-specific (browser cache)
res.setHeader('Cache-Control', 'private, max-age=300');
```

---

## 9. Deployment Architecture

### 9.1 Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                       DEPLOYMENT ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GitHub ──▶ GitHub Actions ──▶ Northflank Build                 │
│                                                  │               │
│                                                  ▼               │
│                              ┌─────────────────────────────────┐ │
│                              │        Northflank               │ │
│                              │  ┌────────────────────────────┐ │ │
│                              │  │    LMS Service             │ │ │
│                              │  │    (Node.js 20)            │ │ │
│                              │  │    Port: 8080              │ │ │
│                              │  └────────────────────────────┘ │ │
│                              │  ┌────────────────────────────┐ │ │
│                              │  │    Admin Service           │ │ │
│                              │  │    (Node.js 20)            │ │ │
│                              │  │    Port: 3000              │ │ │
│                              │  └────────────────────────────┘ │ │
│                              └─────────────────────────────────┘ │
│                                                  │               │
│                                                  ▼               │
│                              ┌─────────────────────────────────┐ │
│                              │         Supabase                │ │
│                              │  ┌─────────┐ ┌───────────────┐  │ │
│                              │  │Database │ │   Storage     │  │ │
│                              │  └─────────┘ └───────────────┘  │ │
│                              │  ┌─────────┐ ┌───────────────┐  │ │
│                              │  │  Auth   │ │   Realtime    │  │ │
│                              │  └─────────┘ └───────────────┘  │ │
│                              └─────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Scaling Configuration

| Component | Instances | Memory | Scaling |
|-----------|-----------|--------|---------|
| LMS | 2-10 | 8GB | Auto |
| Admin | 1-5 | 4GB | Auto |
| Database | 1 (Supabase) | 8GB | Managed |

---

## 10. Monitoring & Observability

### 10.1 Logging

```typescript
// Structured logging
console.log(JSON.stringify({
  level: 'info',
  message: 'User logged in',
  userId: user.id,
  timestamp: new Date().toISOString(),
  metadata: { ip: req.ip, userAgent: req.headers['user-agent'] }
}));
```

### 10.2 Health Checks

```typescript
// /api/health endpoint
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    storage: await checkStorage(),
    auth: await checkAuth(),
    uptime: process.uptime(),
  };
  
  const healthy = Object.values(checks).every(Boolean);
  return Response.json({ healthy, checks }, { status: healthy ? 200 : 503 });
}
```

### 10.3 Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| Uptime | 99.9% | < 99% |
| Response Time | < 500ms | > 1s |
| Error Rate | < 1% | > 5% |
| CPU Usage | < 80% | > 90% |
| Memory | < 80% | > 90% |

---

## 11. Security Architecture

### 11.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Network Layer                                            │   │
│  │  • HTTPS only (TLS 1.3)                                  │   │
│  │  • WAF (Web Application Firewall)                        │   │
│  │  • DDoS protection                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Application Layer                                        │   │
│  │  • JWT authentication                                     │   │
│  │  • RBAC authorization                                     │   │
│  │  • Rate limiting                                          │   │
│  │  • Input validation                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Data Layer                                               │   │
│  │  • Row-level security (RLS)                               │   │
│  │  • Encryption at rest                                     │   │
│  │  • Encryption in transit                                  │   │
│  │  • Audit logging                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 OWASP Compliance

| OWASP Top 10 | Status | Implementation |
|--------------|--------|----------------|
| A01 Broken Access Control | ✅ | RLS + RBAC |
| A02 Cryptographic Failures | ✅ | TLS 1.3 + encryption |
| A03 Injection | ✅ | Parameterized queries |
| A04 Insecure Design | ✅ | Threat modeling |
| A05 Security Misconfiguration | ✅ | Hardened configs |
| A06 Vulnerable Components | ✅ | Dependency scanning |
| A07 Auth Failures | ✅ | MFA + lockout |
| A08 Data Integrity | ✅ | Audit logging |
| A09 Logging Failures | ✅ | Structured logging |
| A10 SSRF | ✅ | URL validation |

---

## 12. Disaster Recovery

### 12.1 Backup Strategy

| Backup Type | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| Database | Daily | 30 days | Supabase |
| Files | Daily | 30 days | Supabase Storage |
| Config | On deploy | 90 days | Git |

### 12.2 Recovery Procedures

1. **Database Recovery**: Point-in-time recovery via Supabase
2. **File Recovery**: Restore from backup bucket
3. **Configuration**: Redeploy from Git

---

## 13. Future Architecture

### 13.1 Planned Enhancements

- [ ] **MCP Integration**: Model Context Protocol for AI agents
- [ ] **Blockchain Credentials**: Verifiable credentials on-chain
- [ ] **Edge Computing**: Vercel Edge for global latency
- [ ] **Multi-tenancy**: White-label for enterprises

### 13.2 Scalability Roadmap

```
Phase 1 (Current): 1,000 users
Phase 2 (6mo):     10,000 users  - Add read replicas
Phase 3 (12mo):    100,000 users - Add CDN, caching
Phase 4 (18mo):    1M users      - Add microservices
```

---

*Documentation Version: 1.0*
*Last Updated: March 2026*
*Maintained by: Elevate for Humanity Engineering Team*