# NORTHFLANK QUICK FIX CHECKLIST

## elevate-marketing Service

### Critical Settings to Check/Change:

- [ ] **Dockerfile path**: Change to `/Dockerfile.marketing`
- [ ] **Port**: Change to `3000`
- [ ] **Health check path**: `/api/ping`
- [ ] **CMD override**: MUST BE EMPTY (or match `node server.js`)
- [ ] **Delete `elevate-marketing-standalone`** if it exists

---

## Steps:

1. **Go to**: Services → elevate-marketing → Code → Build options
2. **Change Dockerfile path to**: `/Dockerfile.marketing`
3. **Save**

4. **Go to**: Services → elevate-marketing → Health checks
5. **Change port to**: `3000`
6. **Save**

7. **Go to**: Services → elevate-marketing → CMD override
8. **DELETE any existing override** (should be empty)
9. **Save**

10. **Go to**: Services → Deployments
11. **ABORT all pending builds except the newest**
12. **DEPLOY the newest build**

13. **Wait for "READY" status**
14. **Test**: `curl https://www.elevateforhumanity.org/api/ping`

---

## Expected After Fix:

```
{"ok":true,"service":"marketing","uptime":123,"timestamp":"..."}
```

---

## If Service Won't Start:

Run in Shell (SSH):
```bash
pwd
ls -la /app
cat /proc/1/cmdline
find /app -name "server.js"
```

Report output to developer.
