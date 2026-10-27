"""Record a CPU quantization derived from the existing verified checkpoint."""
import hashlib
import json
import re
import struct
import sys
from pathlib import Path

MODEL = 'Qwen/Qwen2.5-7B-Instruct'
REVISION = 'a09a35458c702b33eeacc393d103063234e8bc28'
ENGINE = '5aeac37a35b44fde4bdffaec9159f2fcb253b622'


def finalize(model_path, source_path, engine):
    model = Path(model_path)
    source = json.loads(Path(source_path).read_text())
    shards = source.get('shards', [])
    if (source.get('model') != MODEL or source.get('revision') != REVISION or engine != ENGINE
            or len(shards) != 4 or len({s.get('file') for s in shards}) != 4
            or any(not re.fullmatch(r'[a-f0-9]{64}', s.get('sha256', '')) or not s.get('bytes', 0) > 0 for s in shards)):
        raise ValueError('APPROVED_SOURCE_MANIFEST_REQUIRED')
    if model.name != 'model-q4_k_m.gguf' or not 24 <= model.stat().st_size <= 6 * 2**30:
        raise ValueError('BOUNDED_CPU_MODEL_REQUIRED')
    with model.open('rb') as handle:
        if handle.read(4) != b'GGUF' or struct.unpack('<I', handle.read(4))[0] != 3:
            raise ValueError('GGUF_V3_REQUIRED')
        handle.seek(0)
        digest = hashlib.file_digest(handle, 'sha256').hexdigest()
    manifest = {'source': source, 'engine': {'repository': 'ggml-org/llama.cpp', 'revision': ENGINE},
                'quantization': 'Q4_K_M', 'sha256': digest, 'bytes': model.stat().st_size,
                'contextTokens': 8192, 'gpu': False}
    (model.parent / 'cpu-model-manifest.json').write_text(json.dumps(manifest, sort_keys=True))
    (model.parent / 'model.sha256').write_text(digest + '  ' + model.name + '\n')
    print(json.dumps({'model': MODEL, 'sourceRevision': REVISION, 'quantization': 'Q4_K_M', 'bytes': model.stat().st_size, 'sha256': digest, 'gpu': False}))
    return manifest


if __name__ == '__main__':
    finalize(*sys.argv[1:])
