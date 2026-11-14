# Elevate for Humanity
**Production Build Sync: 2026-06-21T03:00:00Z**

## Enterprise AI Workforce Operating System

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Azure-green)](https://supabase.com/)

**The only AI-powered workforce operating system with DOL-registered apprenticeship tracking, payment enforcement, and government compliance built in.**

[Website](https://www.elevateforhumanity.org) • [Documentation](ARCHITECTURE_DOCUMENTATION.md) • [API Docs](#api) • [Contributing](#contributing)

</div>

---

## 🎯 What is Elevate for Humanity?

Elevate for Humanity is an **Enterprise AI Workforce Operating System** that combines:

- 📚 **Learning Management System** - AI-powered course generation
- 🏛️ **DOL-Registered Apprenticeships** - Official RAPIDS codes
- 📍 **Geofenced Timeclock** - GPS-verified training hours
- 💳 **Payment Enforcement** - Automatic lockout for non-payment
- 📊 **Government Compliance** - WIOA reporting automated
- 🤖 **AI Agents** - MCP-enabled workflow automation

---

## ✨ Features

### For Apprentices
- AI-generated RTI coursework
- GPS-verified clock-in at host shops
- Progress tracking and competency sign-offs
- Verifiable digital credentials

### For Employers
- Host shop management
- Apprentice oversight dashboard
- Hour approval and competency tracking
- Document signing

### For Agencies
- WIOA compliance reporting
- DOL submission automation
- Multi-tenant management
- Real-time analytics

---

## 🏆 Programs

| Program | RAPIDS Code | Hours | Status |
|---------|-------------|-------|--------|
| Barber Apprenticeship | 0030CB | 2,000 | ✅ Live |
| Esthetician Apprenticeship | 2089CB | 2,000 | ✅ Live |
| Nail Technician Apprenticeship | 2090CB | 2,000 | ✅ Live |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **Backend** | Supabase (Azure PostgreSQL), Edge Functions |
| **AI** | OpenAI GPT-4, MCP (Model Context Protocol) |
| **Payments** | Stripe (Subscriptions, Lockout Enforcement) |
| **Auth** | Supabase Auth (MFA, JWT) |
| **Hosting** | Northflank (Azure) |
| **Storage** | Supabase Storage (S3-compatible) |

---

## 📁 Project Structure

```
Elevate-lms/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication routes
│   ├── (app)/             # Authenticated app routes
│   │   ├── apprentice/    # Apprentice dashboard
│   │   ├── employer/       # Employer portal
│   │   └── admin/         # Admin panel
│   ├── api/               # API routes
│   │   ├── mcp/           # MCP server for AI agents
│   │   └── ...            # Other endpoints
│   └── programs/          # Public program pages
├── packages/
│   ├── db/                # Database types & schemas
│   ├── shared/            # Shared utilities
│   └── ui/                # UI components
├── lib/                   # Shared libraries
│   ├── ai/                # AI service layer
│   ├── billing/           # Stripe integration
│   └── supabase/          # Supabase clients
└── scripts/               # Build & deployment scripts
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Supabase account
- Stripe account
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/elevate-for-humanity/Elevate-lms.git
cd Elevate-lms

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Fill in your environment variables
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_anon_key
# OPENAI_API_KEY=your_openai_key
# STRIPE_SECRET_KEY=your_stripe_key

# Start development server
pnpm dev
```

### Build for Production

```bash
pnpm build
pnpm start
```

---

## <a name="api"></a> 🔌 API

### MCP Server (AI Agents)

The MCP server enables external AI agents to interact with the platform:

```bash
# Health check
curl https://www.elevateforhumanity.org/api/mcp

# List available tools
curl -X POST https://www.elevateforhumanity.org/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

**Available Tools:**
- `get_apprentice_progress` - Get apprentice hours & competencies
- `clock_in` - GPS-verified clock in
- `clock_out` - Clock out with hours calculation
- `get_enrollment_status` - Check payment/suspension status
- `list_courses` - Get program courses
- `get_analytics` - Platform metrics
- `search_knowledge` - Knowledge base search

### REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/*` | * | Authentication |
| `/api/users/*` | GET/PATCH | User management |
| `/api/programs/*` | GET/POST | Program management |
| `/api/timeclock/*` | POST/GET | Timeclock operations |
| `/api/billing/*` | * | Stripe billing |
| `/api/reports/*` | GET | Reporting |
| `/api/ai/*` | POST | AI operations |

---

## 🤖 AI Agents

Elevate for Humanity supports AI agents via the Model Context Protocol (MCP):

### Available Agents

| Agent | Description |
|-------|-------------|
| **Enrollment Agent** | Handles apprentice enrollment |
| **Timeclock Agent** | Manages clock-in/out with GPS |
| **Billing Agent** | Payment collection and lockout |
| **Compliance Agent** | WIOA reporting |
| **Course Agent** | AI content generation |

### Using with AI Assistants

```javascript
// Example: Using MCP with Claude
const response = await fetch('https://www.elevateforhumanity.org/api/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'get_apprentice_progress',
      arguments: { apprentice_id: 'user-123' }
    }
  })
});
```

---

## 📊 Impact Metrics

| Metric | Value |
|--------|-------|
| Apprentices Enrolled | 200+ |
| DOL Programs | 3 (Live) |
| WIOA Compliance | 100% |
| AI Course Generation | 80% time saved |
| Billing Overhead | $0 |

---

## 🔐 Security

- Row-Level Security (RLS) on all tables
- JWT authentication with MFA support
- Rate limiting on API endpoints
- Audit logging for compliance
- HTTPS-only (TLS 1.3)

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Contact

- **Website:** [elevateforhumanity.org](https://www.elevateforhumanity.org)
- **Email:** info@elevateforhumanity.org
- **DOL Registration:** 2025-IN-132301
- **GitHub:** [github.com/elevate-for-humanity](https://github.com/elevate-for-humanity)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a service
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [OpenAI](https://openai.com/) - AI capabilities

---

<div align="center">

**Built with ❤️ for workforce development**

</div>