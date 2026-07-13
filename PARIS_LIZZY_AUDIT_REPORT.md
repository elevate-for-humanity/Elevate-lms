# PARIS & LIZZY AI INTEGRATION AUDIT

**Generated:** 2026-07-13  
**Status:** ⚠️ NEEDS VERIFICATION

---

## 1. PARIS AI AUDIT

### Configuration

| Setting | Value | Status |
|---------|-------|--------|
| API Provider | Anthropic (Claude) | ✅ Configured |
| API Endpoint | `https://api.anthropic.com/v1/messages` | ✅ |
| Model | `claude-3-5-sonnet-20241022` (env: ANTHROPIC_MODEL) | ✅ |
| Max Tokens | 4096 (env: ANTHROPIC_MAX_TOKENS) | ✅ |
| API Key | `process.env.ANTHROPIC_API_KEY` | ⚠️ **NOT SET** |

### Required Environment Variables

```bash
# Required for production
ANTHROPIC_API_KEY=sk-ant-xxxxx  # Get from console.anthropic.com

# Optional overrides
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_MAX_TOKENS=4096
```

### Fallback Behavior

When `ANTHROPIC_API_KEY` is not set, PARIS returns demo responses:
- ✅ **Graceful fallback** - returns JSON demo responses
- ✅ **No crashes** - continues to work
- ⚠️ **No real AI** - just simulated responses

### Usage Locations

| File | Purpose | Status |
|------|---------|--------|
| `lib/ai/paris-ai.ts` | Main class | ✅ Implemented |
| `app/api/zora/route.ts` | Zora chat | ⚠️ Needs verification |
| `app/api/enrollment/decision/route.ts` | Enrollment AI | ⚠️ Needs verification |
| `app/api/enrollment/reevaluate/route.ts` | Re-evaluation | ⚠️ Needs verification |

### Paris Capabilities

| Feature | Status | Notes |
|---------|--------|-------|
| Command execution | ✅ | `executeCommand()` method |
| Content generation | ✅ | `generateContent()` method |
| Code analysis | ✅ | `analyzeCode()` method |
| Marketing posts | ✅ | Social media generation |
| Agent creation | ✅ | Workforce agent generation |
| Repository import | ✅ | GitHub import |

### Verification Checklist

- [ ] `ANTHROPIC_API_KEY` configured in Northflank
- [ ] Test `executeCommand()` with real API
- [ ] Verify chat history persisting to database
- [ ] Check `/api/zora` endpoint responds

---

## 2. LIZZY (Tidio) AI AUDIT

### Configuration

| Setting | Value | Status |
|---------|-------|--------|
| Provider | Tidio (Lyro AI) | ✅ Configured |
| Public Key | `process.env.NEXT_PUBLIC_TIDIO_KEY` | ⚠️ **NOT SET** |
| Chatbot Name | Lizzy | ✅ |
| Welcome Message | Configured | ✅ |
| Quick Replies | Programs, Funding, Apply, Advisor | ✅ |
| Human Handoff | Enabled | ✅ |
| Operating Hours | Indiana timezone | ✅ |

### Required Environment Variables

```bash
# Required for production
NEXT_PUBLIC_TIDIO_KEY=xxxxx  # Get from admin.tidio.com

# Phone/Email (in chatbot config)
# 317-314-3757
# admissions@elevateforhumanity.org
```

### Features Configured

| Feature | Status | Notes |
|---------|--------|-------|
| Welcome message | ✅ | Proactive chat |
| Quick reply buttons | ✅ | 4 buttons |
| Proactive messages | ✅ | 30-60 second delays |
| Offline message | ✅ | 24hr response |
| Human handoff | ✅ | Queue with position |
| Knowledge base | ✅ | System prompt configured |

### Lizzy System Prompt

The chatbot is configured with comprehensive training on:
- Elevate for Humanity programs
- Funding options (WIOA, Workforce Ready)
- Application process
- Career outcomes
- Escalation procedures

### Verification Checklist

- [ ] `NEXT_PUBLIC_TIDIO_KEY` configured in Northflank
- [ ] Tidio account active at `admin.tidio.com`
- [ ] Lyro AI assistant configured
- [ ] Chat widget loads on website
- [ ] Lead capture working
- [ ] Human handoff to admissions@elevateforhumanity.org

---

## 3. ISSUES FOUND

### Critical Issues

| Issue | Severity | Fix |
|-------|----------|-----|
| `ANTHROPIC_API_KEY` not configured | 🔴 HIGH | Add to Northflank |
| `NEXT_PUBLIC_TIDIO_KEY` not configured | 🔴 HIGH | Add to Northflank |
| `/api/webhooks/subscriptions` disabled | 🔴 HIGH | Re-enable + add secret |

### Production Impact

| Component | Without Config | With Config |
|----------|---------------|-------------|
| PARIS | Demo responses | Claude AI |
| LIZZY | Widget won't load | Working chatbot |
| Webhooks | Events rejected | Events processed |

---

## 4. REQUIRED SECRETS

### Missing from Northflank

```bash
# AI - Required
ANTHROPIC_API_KEY=sk-ant-xxxxx  # Get from console.anthropic.com

# Chatbot - Required
NEXT_PUBLIC_TIDIO_KEY=xxxxx  # Get from admin.tidio.com
```

### Already Configured

```bash
# Stripe - Configured
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51OKSVyH4a2yrVOt5vMzAwR0TjvMKgzZeTzqXPjEq8AjZ4UP9tkFkPobctLFk1PM4Gun45J20Kyiy5n0Wtq7p3HFn006LgyFvPP
STRIPE_WEBHOOK_SECRET=whsec_RTrnoB3fnjCR03yL3f3pos1zQJDC54ns
```

---

## 5. WEBHOOK FIX PLAN

### Step 1: Re-enable subscriptions webhook

1. Go to: https://dashboard.stripe.com/webhooks
2. Find: `https://www.elevateforhumanity.org/api/webhooks/subscriptions`
3. Click **Enable**

### Step 2: Add signing secret to Northflank

```bash
STRIPE_WEBHOOK_SECRET=whsec_RTrnoB3fnjCR03yL3f3pos1zQJDC54ns
```

### Step 3: Verify all webhooks

| Endpoint | Events | Error Rate | Status |
|----------|--------|------------|--------|
| `/api/webhooks/stripe` | 9 | 0% | ✅ Good |
| `/api/webhooks/subscriptions` | 0 | 100% | ❌ Disabled |
| `/api/testing/webhook` | 1 | 0% | ✅ Good |
| `/api/cosmetology/webhook` | 2 | 100% | ⚠️ Failing |

### Step 4: Fix cosmetology webhook (100% error rate)

Check `app/api/cosmetology/webhook/route.ts`:
- Verify `STRIPE_WEBHOOK_SECRET_COSMETOLOGY` is set
- Check signature verification logic
- Review error logs for specific failures

---

## 6. COMPLETE NORTHFLANK CONFIGURATION

### All Required Secrets

```bash
# ========================
# DATABASE
# ========================
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# ========================
# STRIPE (CONFIGURED)
# ========================
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51OKSVyH4a2yrVOt5vMzAwR0TjvMKgzZeTzqXPjEq8AjZ4UP9tkFkPobctLFk1PM4Gun45J20Kyiy5n0Wtq7p3HFn006LgyFvPP
STRIPE_WEBHOOK_SECRET=whsec_RTrnoB3fnjCR03yL3f3pos1zQJDC54ns
STRIPE_WEBHOOK_SECRET_STORE=whsec_3Xr50E0UHiCGlak5TP3VLnic9Vht2ZTx
STRIPE_WEBHOOK_SECRET_BARBER=whsec_HIaJAeyPAjAullAwGhZdYR5tjh7uqRmK
STRIPE_WEBHOOK_SECRET_LICENSE=whsec_nqp8Bxypw9WeCBKxaRkoDRukOR3KYrrC
STRIPE_WEBHOOK_SECRET_DONATIONS=whsec_kJOzN8dKE7ibPZaMILRfkxCnTkNTwGrU
STRIPE_WEBHOOK_SECRET_SUPERSONIC=whsec_dcXAG4u5tfJ9teSmItuvVONsweC9A8Uz

# ========================
# AI - REQUIRED (NOT SET)
# ========================
ANTHROPIC_API_KEY=sk-ant-xxxxx  # ⚠️ MISSING

# ========================
# CHATBOT - REQUIRED (NOT SET)
# ========================
NEXT_PUBLIC_TIDIO_KEY=xxxxx  # ⚠️ MISSING

# ========================
# OPTIONAL
# ========================
OPENAI_API_KEY=sk-xxxxx  # For additional AI features
GROQ_API_KEY=gsk_xxxxx  # For Zora chat fallback
```

---

## 7. SUMMARY

| Component | Repository | Runtime | Production | Action Required |
|-----------|------------|---------|------------|----------------|
| PARIS | ✅ | ✅ | ⚠️ | Configure `ANTHROPIC_API_KEY` |
| LIZZY | ✅ | ✅ | ⚠️ | Configure `NEXT_PUBLIC_TIDIO_KEY` |
| Webhooks | ✅ | ⚠️ | ⚠️ | Fix subscriptions, cosmetology |

### Immediate Actions

1. **Get ANTHROPIC_API_KEY** from console.anthropic.com
2. **Get NEXT_PUBLIC_TIDIO_KEY** from admin.tidio.com
3. **Re-enable** `/api/webhooks/subscriptions` in Stripe Dashboard
4. **Add** `STRIPE_WEBHOOK_SECRET` to Northflank
5. **Fix** cosmetology webhook error rate

---

**Report Generated By:** OpenHands AI Integration Audit  
**Date:** 2026-07-13
