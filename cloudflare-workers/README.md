# Cloudflare Workers - SCORM Player

## Overview

This Cloudflare Worker serves SCORM training courses from Cloudflare R2 storage with proper CORS headers and tracking.

## Services Used

### 1. Cloudflare Stream (Already Integrated ✅)
- **Purpose:** Video hosting and CDN
- **Used for:** AI-generated videos, course videos
- **Integration:** `server/cloudflare-stream.ts`
- **Status:** Active and working

### 2. Cloudflare R2 + Worker (Optional)
- **Purpose:** SCORM course delivery
- **Used for:** JRI training modules
- **Domain:** `scorm.www.elevateforhumanity.org`
- **Status:** Configured but not deployed

## Deployment

### Prerequisites

1. **Cloudflare Account** with:
   - R2 storage enabled
   - Workers enabled
   - Domain `www.elevateforhumanity.org` added

2. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

### Step 1: Create R2 Bucket

```bash
# Create bucket for SCORM courses
wrangler r2 bucket create elevate-scorm-courses
```

### Step 2: Upload SCORM Courses

```bash
# Upload JRI SCORM packages to R2
cd lms-content/jri
for file in *.zip; do
  unzip "$file" -d "$(basename "$file" .zip)"
done

# Upload to R2
wrangler r2 object put elevate-scorm-courses/jri-badge-1/index.html --file=./1-jri-badge-1/index.html
# Repeat for all SCORM files
```

### Step 3: Create KV Namespace (for tracking)

```bash
# Create KV namespace
wrangler kv:namespace create "SCORM_TRACKING"

# Copy the ID and update wrangler.toml
# Replace "your-kv-namespace-id" with the actual ID
```

### Step 4: Deploy Worker

```bash
cd cloudflare-workers
wrangler deploy
```

### Step 5: Configure DNS

In Cloudflare Dashboard:
1. Go to DNS settings for `www.elevateforhumanity.org`
2. Add CNAME record:
   - **Name:** `scorm`
   - **Target:** `elevate-scorm-worker.workers.dev`
   - **Proxy:** Enabled (orange cloud)

### Step 6: Set Environment Variable

In Netlify (or your deployment platform):
```bash
NEXT_PUBLIC_SCORM_CDN_URL=https://scorm.www.elevateforhumanity.org
```

## How It Works

### With Cloudflare Worker (Deployed):
```
Student → scorm.www.elevateforhumanity.org → Cloudflare Worker → R2 Storage
```

### Without Worker (Fallback):
```
Student → /scorm/jri-core/index.html → Next.js public folder
```

## SCORM Courses

Current SCORM packages in `lms-content/jri/`:
1. JRI Introduction
2. JRI Badge 1 - Mindsets
3. JRI Badge 2 - Professionalism
4. JRI Badge 3 - Communication
5. JRI Badge 4 - Social Skills
6. JRI Badge 5 - Problem Solving
7. JRI Badge 6 - Teamwork

## Testing

### Test Worker Locally:
```bash
cd cloudflare-workers
wrangler dev
```

### Test SCORM Delivery:
```bash
curl https://scorm.www.elevateforhumanity.org/jri-badge-1/index.html
```

## Monitoring

View worker logs:
```bash
wrangler tail
```

View R2 storage usage:
```bash
wrangler r2 bucket list
```

## Cost Estimate

- **R2 Storage:** $0.015/GB/month (~$0.02/month for SCORM files)
- **R2 Requests:** $0.36 per million reads (~free for typical usage)
- **Workers:** 100,000 requests/day free, then $0.50 per million
- **Total:** ~$1-2/month for typical usage

## Alternative: Keep Using Next.js

If you don't want to deploy the worker:
1. Keep SCORM files in `public/scorm/`
2. Don't set `NEXT_PUBLIC_SCORM_CDN_URL`
3. Files served directly from Netlify/Next.js
4. Works perfectly fine, no Cloudflare needed

## Current Status

✅ **Cloudflare Stream** - Active (videos)
❌ **Cloudflare Worker** - Not deployed (SCORM)
✅ **Fallback** - Working (local SCORM files)

**Recommendation:** Deploy worker only if you need:
- Global CDN for SCORM files
- Separate storage from Next.js
- Advanced SCORM tracking

Otherwise, local serving works great!
