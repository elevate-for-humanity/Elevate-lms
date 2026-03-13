# SEO Monitoring Checklist

**Daily, Weekly, and Monthly Tasks**

---

## Daily Monitoring (10 minutes)

### Google Search Console Alerts

Check for email notifications regarding:

- [ ] **Index Coverage Increase** — Indexed pages increased >10% day-over-day
- [ ] **Indexed but Blocked** — URL marked "Indexed, though blocked by robots"
- [ ] **Submitted URL Marked Noindex** — Sitemap URL rejected
- [ ] **Manual Actions** — Any manual action detected (ESCALATE IMMEDIATELY)

### Quick Response Protocol

If an alert fires:

1. **Apply `noindex` immediately** if exposure is unclear
2. **Identify route and source** (sitemap, link, deploy)
3. **Fix content or configuration**
4. **Re-submit URL** for indexing only after review

---

## Weekly Monitoring (30 minutes)

### Search Console Coverage Scan

- [ ] Navigate to **Pages > Indexing**
- [ ] Check "Indexed" count matches expected (compare to whitelist)
- [ ] Review "Not indexed" reasons
- [ ] Check for "Crawled - currently not indexed" (content quality signal)

### Index Count Audit

| Metric | Expected | Actual | Status |
|--------|----------|--------|--------|
| Indexed pages | ~50 | | ☐ |
| Sitemap URLs | ~50 | | ☐ |
| Blocked by robots | 0 indexed | | ☐ |

### Surprise URL Check

- [ ] No `/auth/*` URLs indexed
- [ ] No `/admin/*` URLs indexed
- [ ] No `/dashboard/*` URLs indexed
- [ ] No `/checkout/*` URLs indexed
- [ ] No query string URLs indexed

---

## Monthly Monitoring (1 hour)

### Full Indexed Page Inventory

Export all indexed URLs from Search Console and verify:

- [ ] Every indexed URL is in `seo-index-whitelist.json`
- [ ] No duplicate content indexed
- [ ] All canonicals point to production domain
- [ ] No thin content pages indexed

### Metadata Audit

- [ ] Run `pnpm seo:check` locally
- [ ] Verify no duplicate titles
- [ ] Verify no duplicate descriptions
- [ ] Check title lengths (≤60 chars)
- [ ] Check description lengths (140-160 chars)

### Canonical Audit

- [ ] All indexed pages have self-referencing canonical
- [ ] No canonicals point to staging/preview domains
- [ ] No canonical chains or loops

### Content Quality Check

For each indexed resource page:

- [ ] Content is still accurate
- [ ] No outdated information
- [ ] Disclosures still present
- [ ] Links still work

---

## Quarterly Review (2 hours)

### Whitelist Review

- [ ] Review all pages in `seo-index-whitelist.json`
- [ ] Remove any pages that should no longer be indexed
- [ ] Add any new pages that meet indexing criteria
- [ ] Document changes with date and reason

### Performance Review

- [ ] Check average position trends
- [ ] Review click-through rates
- [ ] Identify underperforming indexed pages
- [ ] Decide: improve content or remove from index

### Governance Compliance

- [ ] All indexed pages align with authoritative documents
- [ ] No compliance language issues
- [ ] No unsupported claims
- [ ] Resource pages follow template

---

## Alert Response Procedures

### Unexpected Indexing Detected

```
1. Immediately add noindex to affected page
2. Request removal via Search Console (if sensitive)
3. Identify how page became indexed
4. Fix root cause (sitemap, robots, metadata)
5. Document incident
```

### Manual Action Received

```
1. ESCALATE to Platform Governance immediately
2. Do not make changes without review
3. Document the action and affected URLs
4. Prepare remediation plan
5. Submit reconsideration request after fixes
```

### Index Bloat Detected

```
1. Compare indexed count to whitelist count
2. Identify unauthorized indexed URLs
3. Apply noindex to all non-whitelisted pages
4. Update robots.txt if needed
5. Monitor for 7 days
```

---

## Tools & Access

### Required Access

- [ ] Google Search Console (Owner or Full access)
- [ ] Google Analytics 4 (Editor access)
- [ ] Repository access (for whitelist updates)

### Useful Commands

```bash
# Run SEO validation locally
pnpm seo:check

# View current whitelist
cat config/seo-index-whitelist.json

# Check robots.txt
curl https://www.elevateforhumanity.org/robots.txt

# Check sitemap
curl https://www.elevateforhumanity.org/sitemap.xml
```

---

## Escalation Contacts

| Issue | Contact | Response Time |
|-------|---------|---------------|
| Manual Action | Platform Governance | Immediate |
| Security Issue | Security Team | Immediate |
| Index Bloat | SEO Owner | 24 hours |
| Content Issue | Content Team | 48 hours |

---

## Documentation

- [SEO Governance Rules](/docs/SEO-GOVERNANCE.md)
- [SEO Governance Summary](/docs/SEO-GOVERNANCE-SUMMARY.md)
- [Indexing Whitelist](/config/seo-index-whitelist.json)
- [Authoritative Documents](/governance)

---

*Last Updated: January 2025*
*Owner: Platform Governance*
