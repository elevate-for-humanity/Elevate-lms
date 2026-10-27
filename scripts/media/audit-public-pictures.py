"""Decode referenced public pictures; never treat one-pixel files as usable photos."""
import json
import re
from pathlib import Path
from PIL import Image, ImageStat

refs = {}
for root in ['apps/marketing/app', 'components', 'content', 'data', 'config', 'lib/images']:
    for path in Path(root).rglob('*'):
        if path.suffix not in ['.tsx', '.ts', '.json', '.mjs']:
            continue
        for src in re.findall(r'''["'`](/images/[^"'`\s<>]+\.(?:webp|png|jpe?g|svg|avif))''', path.read_text(errors='replace')):
            refs.setdefault(src, set()).add(str(path))
issues = []
for src, paths in sorted(refs.items()):
    path = Path('public') / src.lstrip('/')
    try:
        if not path.is_file():
            raise ValueError('missing source file')
        if path.suffix == '.svg':
            continue
        with Image.open(path) as image:
            image.load()
            if min(image.size) < 32:
                raise ValueError('one-pixel or undersized image')
            stats = ImageStat.Stat(image.convert('RGB').resize((24, 24)))
            if max(stats.stddev) < 3:
                raise ValueError('nearly blank image')
    except Exception as error:
        issues.append({'src': src, 'reason': str(error), 'files': sorted(paths)})
report = {'distinct_referenced_images': len(refs), 'issues': issues}
Path('docs/audits/public-image-verification-20261014.json').write_text(json.dumps(report, indent=2))
print(json.dumps({'references': len(refs), 'issues': len(issues)}))
if issues:
    print(json.dumps(issues))
    raise SystemExit(1)
