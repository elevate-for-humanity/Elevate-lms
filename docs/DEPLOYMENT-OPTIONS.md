# Deployment Options for Licensees

## How Licensees Use the Platform

When someone licenses Elevate, they have different options depending on their tier:

---

## Self-Serve Plans (Starter / Professional)

### What They Get
- **Hosted SaaS** — We host it, they use it
- **Their own tenant** — Isolated data, their branding
- **Subdomain or custom domain** — e.g., `acme.elevateplatform.com` or `training.acme.org`

### What They Can Customize
- Logo and colors
- Organization name
- Program names and content
- Email templates (limited)
- Landing page copy

### What They Cannot Do
- Access source code
- Self-host
- Modify core functionality
- White-label completely (Elevate branding remains in footer)
- Resell or sublicense

### How It Works
1. They sign up via `/store`
2. Trial starts immediately
3. They configure their tenant via admin dashboard
4. Students access via their subdomain
5. Billing is automatic via Stripe

---

## Enterprise Plans (Implementation / Implementation + Annual)

### What They Get
- **Full source code** — Complete Next.js codebase
- **Single-tenant deployment** — Their own infrastructure
- **No Elevate branding** — Full white-label rights
- **Configuration docs** — Setup and deployment guides

### Deployment Options

#### Option 1: Self-Hosted (They Manage)
They deploy to their own infrastructure:
- Netlify / Netlify
- AWS / GCP / Azure
- On-premise servers

**They handle:**
- Hosting costs
- SSL certificates
- Database (Postgres/Supabase)
- Email service (SendGrid, etc.)
- Maintenance and updates

#### Option 2: Managed Hosting (We Host for Them)
We deploy and manage their instance:
- Dedicated infrastructure
- We handle updates
- They focus on operations

**Additional cost:** Typically $500-2,000/month depending on scale

#### Option 3: Hybrid
- We do initial deployment
- They take over management
- We provide support as needed

### What They Can Customize
- Everything
- Full source code access
- Custom features
- Custom integrations
- Complete rebranding
- Database schema changes

### What They Can Do
- Run multiple sites (with appropriate license)
- Integrate with their existing systems
- Build custom features
- Resell (with reseller agreement)

---

## Comparison Table

| Capability | Starter | Professional | Enterprise |
|------------|---------|--------------|------------|
| **Hosting** | We host | We host | Self-host or managed |
| **Source Code** | ❌ | ❌ | ✅ |
| **White-Label** | Partial | Partial | Full |
| **Custom Domain** | ✅ | ✅ | ✅ |
| **Custom Features** | ❌ | ❌ | ✅ |
| **Integrations** | Limited | API access | Full |
| **Multi-Site** | ❌ | ❌ | ✅ |
| **Resell Rights** | ❌ | ❌ | With agreement |

---

## Technical Requirements for Enterprise Self-Hosting

### Minimum Requirements
- Node.js 18+
- PostgreSQL 14+ (or Supabase)
- 2GB RAM minimum
- SSL certificate

### Recommended Stack
- **Hosting:** Netlify (easiest) or AWS/GCP
- **Database:** Supabase or managed Postgres
- **Email:** SendGrid or Resend
- **Storage:** S3 or Cloudflare R2
- **Auth:** Built-in (Supabase Auth)

### Environment Variables Needed
```
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENDGRID_API_KEY=
NEXT_PUBLIC_SITE_URL=
```

---

## Onboarding Flow by Tier

### Self-Serve (Starter/Professional)
1. Sign up at `/store`
2. Enter payment info
3. Trial starts
4. Configure branding in admin
5. Add programs
6. Invite students
7. Go live

**Time to launch:** Same day

### Enterprise
1. Request license at `/store/request-license`
2. Discovery call (understand needs)
3. Contract and payment
4. We provision or they deploy
5. Configuration assistance
6. Training session
7. Go live

**Time to launch:** 2-4 weeks typical

---

## Common Enterprise Use Cases

### 1. Workforce Board
- Multiple programs across region
- WIOA compliance reporting
- Employer partnerships
- Case management integration

### 2. Training Provider
- Branded student portal
- Certificate issuance
- Employer job board
- Apprenticeship tracking

### 3. Nonprofit
- Grant-funded programs
- Outcome tracking
- Funder reporting
- Volunteer management

### 4. Government Agency
- Statewide deployment
- Multi-region support
- Compliance requirements
- Data residency needs

---

## Migration Path

### From Self-Serve to Enterprise

When a Professional customer outgrows SaaS:

1. **Data export** — We provide full data export
2. **License upgrade** — Pay enterprise fee (minus recent SaaS payments as credit)
3. **Deployment** — We help deploy their instance
4. **Data import** — Migrate their data
5. **Cutover** — Switch DNS, go live

**Typical timeline:** 1-2 weeks

---

## What Licensees Should NOT Expect

❌ We build custom features for free  
❌ Unlimited support on self-serve plans  
❌ Source code on SaaS plans  
❌ Hosting included in implementation license  
❌ Guaranteed outcomes or placements  
❌ Compliance certification  

---

## Pricing Summary

| Need | Recommended Plan | Price |
|------|------------------|-------|
| Small pilot (<100 students) | Starter | $99/mo |
| Growing org (100-500 students) | Professional | $299/mo |
| Full control, self-hosted | Implementation | $35-50K |
| Full control + ongoing support | Impl + Annual | $60-90K |
| Existing licensee renewal | Annual Renewal | $15-30K |
