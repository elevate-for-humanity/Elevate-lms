# MARKETING SERVICE FIX GUIDE

## EXECUTIVE SUMMARY

The `elevate-marketing` service is configured with the WRONG Dockerfile (`Dockerfile.northflank-lms` or `Dockerfile.lms`) when it should be using `Dockerfile.marketing`.

This causes:
1. The container to build the wrong app (LMS instead of Marketing)
2. Missing marketing-specific routes and pages
3. Blank output because the marketing standalone wasn't built

---

## STEP-BY-STEP FIX

### Step 1: Delete Duplicate Service (If Exists)

In Northflank Dashboard:

1. Go to **Services**
2. Find `elevate-marketing-standalone`
3. Click **Delete**
4. Confirm deletion

### Step 2: Verify elevate-marketing Configuration

Go to: **Services → elevate-marketing → Code → Build options**

Check these settings:

| Setting | Current (Wrong) | Should Be |
|---------|----------------|-----------|
| Dockerfile | Dockerfile.northflank-lms or Dockerfile.lms | **Dockerfile.marketing** |
| Branch | main | main |
| Build type | - | Dockerfile |

### Step 3: Update Dockerfile Path

In Northflank Dashboard:

1. Navigate to **elevate-marketing** service
2. Go to **Code → Build options**
3. Find **Dockerfile path**
4. Change it to: `/Dockerfile.marketing`
5. Save

### Step 4: Update Health Check Port

Go to **elevate-marketing → Health checks**

Update these settings:

| Setting | Value |
|---------|-------|
| Port | **3000** |
| Path | `/api/ping` |
| Initial Delay | 60 |
| Interval | 10 |
| Timeout | 5 |
| Failure Threshold | 3 |

### Step 5: Update Upstream Port

Go to **elevate-marketing → Networking → Upstream**

| Setting | Value |
|---------|-------|
| Port | **3000** |
| Protocol | HTTP |

### Step 6: Check CMD Override

Go to **elevate-marketing → CMD override**

⚠️ **IMPORTANT**: If there's a CMD override, it should be **EMPTY** or match the Dockerfile CMD exactly.

The Dockerfile.marketing has:
```
CMD ["node", "--max-http-header-size=32768", "server.js"]
```

If the override shows something different (like `node /app/server.js` or `node apps/marketing/server.js`), **remove it**.

### Step 7: Trigger New Build

1. Go to **Deployments**
2. Click **Deploy**
3. Wait for build to complete
4. Monitor logs for "RUNTIME VERIFICATION PASSED"

### Step 8: Verify Deployment

After deployment:

1. Check **/api/ping** returns 200
2. Visit **www.elevateforhumanity.org** - should show marketing site
3. Check container logs for any errors

---

## VERIFICATION COMMANDS

### Check Current Dockerfile

```bash
# In Northflank Shell, check what's in the container
cat /proc/1/cmdline
ls -la /app
find /app -name "server.js" -type f
```

### Check Version Endpoint

```bash
curl http://localhost:3000/api/version
# or
curl http://localhost:8080/api/version
```

Expected response should show `"service": "marketing"`

### Check Correct Files Exist

```bash
# Should find these files in marketing container:
/app/server.js                           # Main server
/app/.next/server/                       # Server chunks
/app/.next/static/                       # Static assets
/app/public/                            # Public assets
/app/package.json                        # Should show @elevate/marketing
```

---

## WHAT THE CORRECT DOCKERFILE SHOULD BUILD

`Dockerfile.marketing` runs:
```bash
pnpm --filter @elevate/marketing build
```

This creates:
- `/app/apps/marketing/.next/standalone/server.js`
- `/app/apps/marketing/.next/static/`
- `/app/apps/marketing/.next/server/`
- `/app/apps/marketing/public/`

Then copies them to:
- `/app/server.js`
- `/app/.next/static/`
- `/app/.next/server/`
- `/app/public/`

---

## IF STILL BROKEN

If after fixing the Dockerfile path the service still doesn't work:

1. **Abort all pending builds** in Northflank
2. **Delete all old deployments** except the newest
3. **Trigger a fresh build** from the newest commit
4. **Monitor build logs** for any errors

---

## CURRENT COMMITS

The latest fixes are in these commits:

```
d9af511271 docs: update audit report with .next/server fix details
7b10e40bfa fix: add missing .next/server directory to all Dockerfiles
```

Make sure the service is building from the latest commit (d9af511271 or newer).

---

## CONTACT

If issues persist after following these steps, collect:
1. Build logs
2. Runtime logs
3. Output of verification commands above
4. Screenshot of Dockerfile path setting
