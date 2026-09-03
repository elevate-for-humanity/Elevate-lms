#!/usr/bin/env python3
"""
Load env chunks (.env_local_1.txt, 2, 3) and exec the given command.
Handles unquoted values with special chars that break bash sourcing.
Usage: python3 scripts/run-with-env.py pnpm tsx scripts/verify-bnpl-stripe.ts
"""
import os, re, sys, subprocess
from pathlib import Path

ROOT = Path(__file__).parent.parent

def parse_chunk(path: Path) -> dict:
    """Parse a .env file. Last non-empty value for a key wins."""
    result = {}
    try:
        text = path.read_text(errors='replace')
    except FileNotFoundError:
        return result
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        m = re.match(r'^([A-Za-z_][A-Za-z0-9_]*)=(.*)', line)
        if not m:
            continue
        key, val = m.group(1), m.group(2)
        # Strip surrounding quotes if present
        if (val.startswith('"') and val.endswith('"')) or \
           (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        result[key] = val
    return result

env = dict(os.environ)

# Load chunks — later non-empty values override earlier empty ones
for chunk in ['.env_local_1.txt', '.env_local_2.txt', '.env_local_3.txt']:
    parsed = parse_chunk(ROOT / chunk)
    for k, v in parsed.items():
        if v:  # only override with non-empty values
            env[k] = v
        elif k not in env:
            env[k] = v

# Also set SUPABASE_ANON_KEY alias (some scripts use the short form)
if 'NEXT_PUBLIC_SUPABASE_ANON_KEY' in env and env['NEXT_PUBLIC_SUPABASE_ANON_KEY']:
    env.setdefault('SUPABASE_ANON_KEY', env['NEXT_PUBLIC_SUPABASE_ANON_KEY'])
if 'NEXT_PUBLIC_SUPABASE_URL' in env and env['NEXT_PUBLIC_SUPABASE_URL']:
    env.setdefault('SUPABASE_URL', env['NEXT_PUBLIC_SUPABASE_URL'])

if len(sys.argv) < 2:
    # Debug mode: print key status
    for k in ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY',
              'STRIPE_SECRET_KEY', 'SEZZLE_PUBLIC_KEY', 'SEZZLE_PRIVATE_KEY',
              'AFFIRM_PUBLIC_KEY', 'AFFIRM_PRIVATE_KEY', 'AFFIRM_PRIVATE_API_KEY',
              'SEZZLE_ENVIRONMENT', 'AFFIRM_ENVIRONMENT']:
        v = env.get(k, '')
        print(f"{k} = {'SET (' + v[:10] + '...)' if v else 'MISSING'}")
    sys.exit(0)

result = subprocess.run(sys.argv[1:], env=env)
sys.exit(result.returncode)
