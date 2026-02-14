# Copyright Protection & Monitoring Guide

## Quick Reference

| Contact | Email |
|---------|-------|
| DMCA Agent | dmca@www.elevateforhumanity.org |
| Legal | legal@www.elevateforhumanity.org |
| Phone | 317-314-3757 |

---

## 1. Monitoring Setup

### Google Alerts (Free)

Set up alerts at https://www.google.com/alerts for:

```
"Elevate for Humanity"
"elevateforhumanity.org"
"EFH-ORIGINAL-2024"
"Elizabeth L. Greene" education
"Elevate LMS" -site:elevateforhumanity.org
```

**Settings:**
- How often: As-it-happens
- Sources: Automatic
- Language: English
- Region: Any Region
- How many: All results
- Deliver to: Your email

### Manual Monitoring Checklist (Weekly)

1. **Google Search:**
   - `"Elevate for Humanity" -site:elevateforhumanity.org`
   - `"workforce development" "apprenticeship" similar to your unique phrases`

2. **Image Search:**
   - Reverse image search your logo at images.google.com
   - Check TinEye.com for logo copies

3. **Code Search:**
   - Search GitHub for `EFH-ORIGINAL-2024`
   - Search for unique code snippets from your site

### Paid Monitoring Services

| Service | Cost | Features |
|---------|------|----------|
| Copyscape Premium | $0.03/search | Content plagiarism detection |
| DMCA.com | $10/month | Monitoring + takedown service |
| BrandShield | Enterprise | Full brand protection |

---

## 2. DMCA Takedown Process

### Step 1: Document the Infringement

Before filing, collect:

- [ ] Screenshots of infringing site (with timestamps)
- [ ] URLs of all infringing pages
- [ ] Your original content URLs for comparison
- [ ] Evidence of your watermarks in their code (View Source → search "EFH-ORIGINAL")
- [ ] WHOIS lookup of their domain (whois.domaintools.com)
- [ ] Hosting provider identification (use whatismyipaddress.com/hostname-ip)

### Step 2: Identify Where to File

**Find their hosting provider:**
```bash
# Terminal commands
nslookup [their-domain.com]
whois [their-domain.com]
```

**Common hosting providers and DMCA pages:**

| Provider | DMCA URL |
|----------|----------|
| Netlify | https://netlify.com/legal/dmca-policy |
| Netlify | https://www.netlify.com/dmca/ |
| GitHub Pages | https://support.github.com/contact/dmca-takedown |
| Cloudflare | https://www.cloudflare.com/abuse/form |
| GoDaddy | https://www.godaddy.com/legal/agreements/dmca-copyright |
| AWS | https://aws.amazon.com/forms/report-infringement |
| Google Cloud | https://support.google.com/legal/troubleshooter/1114905 |
| DigitalOcean | https://www.digitalocean.com/company/contact#abuse |
| Hostinger | abuse@hostinger.com |
| Namecheap | https://www.namecheap.com/support/knowledgebase/article.aspx/9196/5/how-to-report-abuse |

### Step 3: File the Takedown

Use the template in Section 4 below.

### Step 4: Follow Up

- Most providers respond within 24-72 hours
- If no response in 5 business days, escalate
- Keep records of all communications

### Step 5: Report to Search Engines

Remove from Google search results:
https://www.google.com/webmasters/tools/legal-removal-request

Remove from Bing:
https://www.bing.com/webmasters/contentremoval

---

## 3. Escalation Path

If hosting provider doesn't respond:

1. **Domain Registrar** - File with whoever registered their domain
2. **Upstream Provider** - File with the data center
3. **Payment Processors** - If they're selling, report to Stripe/PayPal
4. **ICANN Complaint** - https://www.icann.org/compliance/complaint
5. **Legal Action** - Consult attorney for federal court filing

---

## 4. DMCA Takedown Template

```
Subject: DMCA Takedown Notice - Copyright Infringement

To Whom It May Concern:

I am writing to report copyright infringement pursuant to the Digital 
Millennium Copyright Act (17 U.S.C. § 512).

COPYRIGHTED WORK:
The original website and content located at:
https://www.elevateforhumanity.org

INFRINGING MATERIAL:
The following URL(s) contain unauthorized copies of our copyrighted content:
[LIST INFRINGING URLs HERE]

IDENTIFICATION OF INFRINGEMENT:
The infringing site has copied [describe: design, content, code, images, etc.]
from our original website. Our invisible watermarks (searchable as 
"EFH-ORIGINAL-2024" in the page source) prove our original ownership.

GOOD FAITH STATEMENT:
I have a good faith belief that the use of the copyrighted materials 
described above is not authorized by the copyright owner, its agent, 
or the law.

ACCURACY STATEMENT:
I swear, under penalty of perjury, that the information in this 
notification is accurate and that I am the copyright owner or am 
authorized to act on behalf of the owner.

CONTACT INFORMATION:
Name: Elizabeth L. Greene
Organization: Elevate for Humanity
Email: legal@www.elevateforhumanity.org
Phone: 317-314-3757
Address: [Your Address]

SIGNATURE:
/s/ Elizabeth L. Greene
Date: [Current Date]

Please remove or disable access to the infringing material immediately.

Thank you for your prompt attention to this matter.
```

---

## 5. Evidence Your Watermarks Provide

When someone copies your site, your watermarks survive. To prove infringement:

### Check Their Page Source

1. Right-click → View Page Source
2. Search (Ctrl+F) for:
   - `EFH-ORIGINAL-2024`
   - `Elizabeth L. Greene`
   - `Elevate for Humanity`
   - `elevateforhumanity.org`

### Check Their Console

1. Open DevTools (F12)
2. Look for console messages about original ownership

### Check Their localStorage

1. Open DevTools → Application → Local Storage
2. Look for:
   - `site_original_owner`
   - `site_original_id`
   - `site_original_timestamp`

### Check Meta Tags

Search page source for:
```html
<meta name="site-owner" content="Elizabeth L. Greene">
<meta name="site-id" content="EFH-ORIGINAL-2024">
```

---

## 6. Preventive Measures Active

| Protection | Location | Status |
|------------|----------|--------|
| InvisibleWatermark | `components/InvisibleWatermark.tsx` | Active |
| CopyrightProtection | `components/CopyrightProtection.tsx` | Active |
| DMCATrackingPixel | `components/InvisibleWatermark.tsx` | Active |
| Anti-AI Meta Tags | Added dynamically | Active |
| Copy Detection | Adds copyright to clipboard | Active |
| Right-click Protection | On images | Active |

---

## 7. Quick Action Checklist

When you find a copycat:

- [ ] Screenshot everything immediately
- [ ] Save page source (Ctrl+S)
- [ ] Document watermark evidence
- [ ] Identify hosting provider
- [ ] Send DMCA notice
- [ ] Report to Google for de-indexing
- [ ] Set calendar reminder for follow-up (5 days)
- [ ] Log incident in tracking spreadsheet

---

*Last Updated: January 2025*
*Document Owner: Elevate for Humanity Legal Team*
