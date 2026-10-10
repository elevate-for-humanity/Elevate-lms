"""Bake the existing approved checkpoint and verify every weight shard."""
import hashlib
import json
from pathlib import Path
from huggingface_hub import HfApi, snapshot_download

MODEL = 'Qwen/Qwen2.5-7B-Instruct'
REVISION = 'a09a35458c702b33eeacc393d103063234e8bc28'
DESTINATION = Path('/models/elevate')
info = HfApi().model_info(MODEL, revision=REVISION, files_metadata=True)
if info.sha != REVISION:
    raise RuntimeError('Checkpoint revision mismatch')
snapshot_download(MODEL, revision=REVISION, local_dir=DESTINATION,
                  allow_patterns=['*.json', '*.safetensors', 'merges.txt', 'vocab.json', 'LICENSE'])
index = json.loads((DESTINATION / 'model.safetensors.index.json').read_text())
required = set(index['weight_map'].values())
if len(required) != 4:
    raise RuntimeError('Approved checkpoint shard inventory mismatch')
verified = []
for sibling in info.siblings:
    if sibling.rfilename not in required:
        continue
    if not sibling.lfs or not sibling.lfs.sha256:
        raise RuntimeError('Weight checksum unavailable')
    path = DESTINATION / sibling.rfilename
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for block in iter(lambda: handle.read(8 * 1024 * 1024), b''):
            digest.update(block)
    if path.stat().st_size != sibling.lfs.size or digest.hexdigest() != sibling.lfs.sha256:
        raise RuntimeError('Weight integrity mismatch')
    verified.append({'file': sibling.rfilename, 'sha256': digest.hexdigest(), 'bytes': path.stat().st_size})
if {item['file'] for item in verified} != required:
    raise RuntimeError('Incomplete verified checkpoint')
(DESTINATION / 'elevate-model-manifest.json').write_text(json.dumps({
    'model': MODEL, 'revision': REVISION, 'shards': verified}, sort_keys=True))
print(json.dumps({'model': MODEL, 'revision': REVISION, 'verifiedShards': len(verified)}))
