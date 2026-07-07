# SEO CONTENT STRATEGY & DISCOVERABILITY PLAN

**Generated:** July 7, 2026  
**Objective:** Maximize search rankings and AI discoverability

---

## CONTENT CLUSTERS FOR TOPICAL AUTHORITY

### Cluster 1: Healthcare Training (HIGHEST PRIORITY)
**Hub Page:** `/programs/healthcare`

| Pillar Pages | Supporting Content |
|--------------|-------------------|
| Medical Assistant | Cost, Salary, Certification, Requirements, Career Path, FAQ |
| Phlebotomy | Cost, Salary, Certification, Requirements, FAQ |
| CNA (Certified Nursing Assistant) | Cost, Salary, Certification, Requirements, FAQ |
| EKG Technician | Cost, Salary, Certification, Requirements, FAQ |
| Pharmacy Technician | Cost, Salary, PTCB Certification, Requirements, FAQ |
| Patient Care Technician | Cost, Salary, Certification, Requirements, FAQ |
| Medical Billing & Coding | Cost, Salary, Certification, Requirements, FAQ |
| CPR/First Aid | Cost, Certification, Requirements, FAQ |

### Cluster 2: Skilled Trades
**Hub Page:** `/programs/skilled-trades`

| Pillar Pages | Supporting Content |
|--------------|-------------------|
| HVAC | Cost, Salary, EPA 608, Requirements, Career Path, FAQ |
| CDL (Commercial Driver's License) | Cost, Salary, Requirements, Career Path, FAQ |
| Welding | Cost, Salary, Certification, Requirements, FAQ |
| Building Maintenance | Cost, Salary, Certification, Requirements, FAQ |
| Electrical | Cost, Salary, Certification, Requirements, FAQ |
| Plumbing | Cost, Salary, Certification, Requirements, FAQ |

### Cluster 3: Technology
**Hub Page:** `/programs/technology`

| Pillar Pages | Supporting Content |
|--------------|-------------------|
| CompTIA A+ | Cost, Salary, Certification, Requirements, FAQ |
| CompTIA Security+ | Cost, Salary, Certification, Requirements, FAQ |
| IT Support | Cost, Salary, Certification, Requirements, FAQ |
| Cybersecurity | Cost, Salary, Certification, Requirements, FAQ |
| Microsoft Office | Cost, Certification, Requirements, FAQ |

### Cluster 4: Barber & Beauty Apprenticeships
**Hub Page:** `/barber-and-beauty-apprenticeships`

| Pillar Pages | Supporting Content |
|--------------|-------------------|
| Barber License | Cost, Requirements, Indiana State Board, FAQ |
| Cosmetology License | Cost, Requirements, Indiana State Board, FAQ |
| Esthetician License | Cost, Requirements, Indiana State Board, FAQ |
| Nail Technician | Cost, Requirements, Indiana State Board, FAQ |
| Host Shop Directory | Barber Shops, Salons, Spas, Partners |
| Apprenticeship FAQ | Hours, Competencies, Testing, Licensing |

### Cluster 5: Workforce & Funding
**Hub Page:** `/funding`

| Pillar Pages | Supporting Content |
|--------------|-------------------|
| WIOA Eligibility | Requirements, Income Limits, Qualifying Programs |
| Workforce Ready Grant | Requirements, Programs, Application |
| JRI Funding | Requirements, Programs, Application |
| Scholarships | Requirements, Programs, Application |
| Employer Partnerships | Benefits, Process, Requirements |

### Cluster 6: Testing & Certifications
**Hub Page:** `/testing`

| Pillar Pages | Supporting Content |
|--------------|-------------------|
| Certiport Testing | Available Exams, Locations, Scheduling |
| EPA 608 | Cost, Requirements, Exam Prep |
| OSHA 30 | Cost, Requirements, Exam Prep |
| CPR/AED | Cost, Certification, Scheduling |
| NHA Certifications | Cost, Requirements, Exam Prep |

---

## RICH STRUCTURED DATA IMPLEMENTATION

### Required Schema Types

| Schema | Pages | Priority |
|--------|-------|----------|
| EducationalOrganization | Homepage, About | HIGH |
| Course | Program pages | HIGH |
| CourseInstance | Class schedules | MEDIUM |
| EducationalOccupationalCredential | Certificate pages | HIGH |
| FAQPage | FAQ pages | HIGH |
| Event | Upcoming events | MEDIUM |
| LocalBusiness | Location pages | MEDIUM |
| Product | Store products | MEDIUM |
| Review | Testimonial pages | MEDIUM |
| VideoObject | Video pages | MEDIUM |
| BreadcrumbList | All pages | HIGH |
| JobPosting | Career pages | LOW |
| Person | Founder, Staff | MEDIUM |

### FAQ Schema Example

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does healthcare training cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Training may be fully funded for eligible participants through WIOA, Workforce Ready Grant, or partner funding. Contact us to check your eligibility."
      }
    }
  ]
}
```

### Course Schema Example

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Medical Assistant Training",
  "description": "Comprehensive medical assistant training program...",
  "provider": {
    "@type": "Organization",
    "name": "Elevate for Humanity"
  },
  "hasCourseInstance": {
    "@type": "CourseInstance",
    "courseMode": "inPerson",
    "courseWorkload": "P20W",
    "location": {
      "@type": "Place",
      "address": "Indianapolis, IN"
    }
  }
}
```

---

## INTERNAL LINKING STRUCTURE

### Required Links Per Page

Every page MUST include links to:

| Category | Examples |
|----------|----------|
| Related Programs | /programs/medical-assistant |
| Funding Options | /funding, /wioa-eligibility |
| Application | /apply |
| Contact | /contact |
| Resources | /resources |
| Related Certifications | /testing |
| Employer Info | /employer |

### Navigation Requirements

| Element | Requirement |
|---------|-------------|
| Primary Nav | Programs, Funding, Testing, About, Apply |
| Breadcrumbs | Home > Category > Page |
| Related Content | 3-5 related page links per article |
| Footer Nav | All major sections |
| CTA Placement | Header, above fold, below content, footer |

---

## LOCAL SEO PAGES

### Required Location Pages

| Location | Page URL | Content Required |
|----------|----------|------------------|
| Indianapolis | /locations/indianapolis | Local info, partner employers, workforce agencies |
| Martinsville | /locations/martinsville | Local info, partner employers |
| Marion County | /locations/marion-county | Local workforce resources |
| Statewide Indiana | /locations/indiana | State resources, regional info |

### Location Page Template

```
- Location-specific H1
- Local workforce statistics
- Regional employer partnerships
- Nearby workforce agencies (WorkOne locations)
- Transportation information
- Local success stories
- Contact information for that location
- Links to programs available in that area
```

---

## E-E-A-T SIGNALS

### Experience
- [ ] Real student photos and videos
- [ ] Graduate testimonials
- [ ] Campus/classroom photos
- [ ] Instructor introductions
- [ ] Day-in-the-life content

### Expertise
- [ ] Instructor credentials
- [ ] Industry certifications listed
- [ ] Curriculum details
- [ ] Exam pass rates
- [ ] Career outcomes data

### Authoritativeness
- [ ] DOL registration documented
- [ ] ETPL listing verified
- [ ] Industry partner logos
- [ ] Accreditation information
- [ ] Press coverage
- [ ] Community involvement

### Trustworthiness
- [ ] Physical address verified
- [ ] Phone number prominent
- [ ] Privacy policy complete
- [ ] Terms of service clear
- [ ] Contact form working
- [ ] Reviews displayed
- [ ] Security badges

---

## CTAs BY PAGE TYPE

### Homepage
- [ ] Hero: Apply Now
- [ ] Programs: View Programs
- [ ] Funding: Check Eligibility
- [ ] Footer: Contact Us

### Program Pages
- [ ] Hero: Apply Now
- [ ] Cost Section: Check Funding Eligibility
- [ ] Career Section: View Career Paths
- [ ] Sidebar: Talk to Advisor
- [ ] Bottom: Schedule Consultation

### Funding Pages
- [ ] Hero: Check Your Eligibility
- [ ] Programs: See Funded Programs
- [ ] Process: Start Application
- [ ] Contact: Talk to Counselor

### Employer Pages
- [ ] Hero: Partner With Us
- [ ] Benefits: Learn More
- [ ] Contact: Schedule Meeting
- [ ] CTA: Download Partnership Packet

---

## PERFORMANCE TARGETS

| Metric | Target | Priority |
|--------|--------|----------|
| LCP | < 2.5s | HIGH |
| INP | < 200ms | HIGH |
| CLS | < 0.1 | HIGH |
| TTFB | < 200ms | MEDIUM |
| Bundle Size | < 500KB | MEDIUM |
| Image Size | < 100KB hero | MEDIUM |
| JavaScript | < 200KB | MEDIUM |

---

## SEO ENGINE IN ADMIN/DEV STUDIO

### Required Features

| Feature | Description |
|---------|-------------|
| Page Scanner | Scan all public pages for metadata completeness |
| Schema Validator | Validate structured data against Schema.org |
| Link Checker | Find broken internal and external links |
| Orphan Detector | Identify pages with no incoming links |
| Duplicate Detector | Find pages with similar content |
| Sitemap Generator | Auto-generate and update sitemap.xml |
| Core Web Vitals | Measure LCP, INP, CLS per page |
| SEO Score | Calculate overall SEO health score |
| Keyword Analyzer | Suggest keyword opportunities |
| Export Report | Generate PDF/CSV of findings |

### Dashboard Metrics

```
SEO Health Score: 85/100
Pages Scanned: 430
Issues Found: 12
Critical: 2
Warnings: 10

Top Issues:
1. Missing FAQ schema on /programs/hvac
2. No local keywords on /locations/martinsville
3. Missing alt text on 3 images
```

---

## CONTENT CALENDAR

| Month | Focus | Deliverables |
|-------|-------|--------------|
| Month 1 | Healthcare Cluster | 8 pillar pages, 24 supporting pages |
| Month 2 | Trades Cluster | 6 pillar pages, 18 supporting pages |
| Month 3 | Technology + Beauty | 5 pillar pages, 15 supporting pages |
| Month 4 | Funding + Testing | 6 pillar pages, 18 supporting pages |
| Month 5 | Location Pages | 4 local pages, 12 supporting |
| Month 6 | Optimization | Audit, fix, refine all content |

---

## SUCCESS METRICS

| Metric | Target | Timeline |
|--------|--------|----------|
| Organic Traffic | +50% | 6 months |
| Keyword Rankings | Top 10 for 50 keywords | 6 months |
| Click-Through Rate | > 3% | 3 months |
| Pages per Session | > 3 | 3 months |
| Conversion Rate | > 2% | 6 months |
| Backlinks | +25 quality links | 6 months |

---

## BUDGET ESTIMATE

| Category | Estimated Cost |
|----------|---------------|
| Content Creation (6 months) | $15,000 - $30,000 |
| Link Building | $5,000 - $10,000 |
| Technical SEO | $5,000 - $10,000 |
| Tools & Software | $500 - $1,000/year |
| **Total** | **$25,500 - $51,000** |

---

## NEXT STEPS

1. **Immediate (Week 1-2)**
   - Audit existing content for completeness
   - Implement missing FAQ schema
   - Add CTAs to all pages
   - Fix broken links

2. **Short-term (Month 1)**
   - Create Healthcare content cluster
   - Implement all Schema types
   - Build SEO Engine in Dev Studio

3. **Medium-term (Months 2-3)**
   - Create Trades and Technology clusters
   - Develop Local SEO pages
   - Begin link building outreach

4. **Long-term (Months 4-6)**
   - Complete all clusters
   - Optimize performance
   - Measure and refine

---

**Report Version:** 1.0  
**Last Updated:** July 7, 2026
