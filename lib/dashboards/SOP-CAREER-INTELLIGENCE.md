# Career Intelligence SOP

## Overview
This SOP covers the setup, configuration, and usage of the Career Intelligence system for job matching, salary insights, and career planning.

---

## API Configuration

### Required Environment Variables

| Variable | Service | Where to Get |
|----------|---------|--------------|
| `ADZUNA_APP_ID` | Adzuna Job Search | dashboard.adzuna.com |
| `ADZUNA_APP_KEY` | Adzuna Job Search | dashboard.adzuna.com |
| `ADZUNA_COUNTRY` | Adzuna Region | Set to `us` |
| `ONET_API_KEY` | O*NET Career Data | services.onetcenter.org |
| `USAJOBS_API_KEY` | USAJOBS Federal Jobs | usajobs.gov/api |
| `CAREERONESTOP_USER_ID` | CareerOneStop | CareerOneStop.org |
| `CAREERONESTOP_API_KEY` | CareerOneStop | CareerOneStop.org |

### Setup Steps

1. **Northflank Dashboard**
   - Go to Configuration → Environment Variables
   - Add each variable from the table above
   - Redeploy the LMS service

2. **Verify Configuration**
   - Check logs for: `[onet] ONET_API_KEY not set`
   - Should disappear after adding keys

---

## Using Career Intelligence in Course Builder

### Overview
The Course Builder automatically fetches O*NET career context when generating courses. This provides:
- Real labor market data
- Job task alignment
- Skills and knowledge requirements

### How It Works
1. Admin enters program topic (e.g., "HVAC Technician")
2. System searches O*NET for matching SOC code
3. O*NET data is injected into AI prompt
4. Generated course is aligned to real job requirements

### Customization
Edit `lib/course-builder/orchestrator.ts`:
- Modify `fetchCareerContext()` for custom career data
- Add additional data sources as needed

---

## Using Career Intelligence Dashboard

### Student View (LMS Placement Page)
Location: `/lms/placement`

Shows:
- Internal job postings from database
- Adzuna job listings (when configured)
- Salary insights
- Employer partner count

### Admin View (Dev Studio)
Location: `/admin/studio`

Includes:
- Career Intelligence Panel
- Job Demand Metrics
- Salary Analytics

---

## Adzuna API Endpoints

### Search Jobs
```
GET /api/jobs/search?what=Medical+Assistant&where=Indianapolis
```

**Parameters:**
- `what` - Job title or keyword
- `where` - City or ZIP code
- `distance` - Radius in miles (default: 10)
- `salary_min` - Minimum salary
- `salary_max` - Maximum salary
- `results_per_page` - Number of results (max: 100)

### Salary Insights
```
GET /api/jobs/salary?title=HVAC+Technician&where=Indianapolis
```

**Parameters:**
- `title` - Job title (required)
- `where` - City or ZIP code (optional)

---

## Integration with Programs

### Program Page (Public)
Each program page shows:
- Career outcomes
- Average salary
- Job demand indicator
- Direct link to placement page

### Implementation
Edit `components/programs/ProgramDetailPage.tsx` to include:
```typescript
import { getProgramCareerIntelligence } from '@/lib/dashboards/career-intelligence';

const careerData = await getProgramCareerIntelligence(
  program.title,
  program.jobTitle,
  program.socCode,
  userLocation
);
```

---

## License Compliance

### Required Attributions

**CareerOneStop:**
> "This site incorporates information from CareerOneStop, a service of the U.S. Department of Labor's Employment and Training Administration."

**O*NET:**
> "O*NET OnLine by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). O*NET® is a trademark of USDOL/ETA."

**Adzuna:**
> "Jobs sourced by Adzuna"

### Requirements
- All job/career pages must be **public** (no login)
- No **paywall** for job data
- Display **attributions** on career pages
- Data must be **free** to access

---

## Troubleshooting

### Jobs Not Showing
1. Check environment variables are set
2. Verify API keys are valid
3. Check Northflank logs for errors
4. Test API endpoint directly

### O*NET Errors
1. Verify ONET_API_KEY is set
2. Check rate limits (O*NET has usage limits)
3. Data is cached 7 days - may need to wait

### Salary Data Missing
- Adzuna only provides salary data when available
- Some job listings don't include salary
- Try different location or job title

---

## Maintenance

### Caching
- Adzuna: 15-minute cache
- O*NET: 7-day cache
- CareerOneStop: Check individual API docs

### Updates
- API keys may need renewal
- Check API provider documentation for changes
- Monitor usage limits

### Monitoring
- Check `/admin/system-health` for API status
- Review logs for warning messages
- Track API response times

---

## Support

For issues with:
- **Adzuna API**: developer.adzuna.com
- **O*NET API**: services.onetcenter.org
- **USAJOBS**: developer.usajobs.gov
- **CareerOneStop**: careeronestop.org
