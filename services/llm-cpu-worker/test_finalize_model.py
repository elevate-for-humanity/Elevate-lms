import contextlib
import io
import json
import struct
import tempfile
import unittest
from pathlib import Path
from finalize_model import finalize, MODEL, REVISION, ENGINE


class ManifestTest(unittest.TestCase):
    def fixture(self, directory):
        model = Path(directory) / 'model-q4_k_m.gguf'
        model.write_bytes(b'GGUF' + struct.pack('<I', 3) + bytes(24))
        source = Path(directory) / 'source.json'
        source.write_text(json.dumps({'model': MODEL, 'revision': REVISION,
            'shards': [{'file': f'model-{i:05d}-of-00004.safetensors', 'sha256': 'a' * 64, 'bytes': 100} for i in range(1, 5)]}))
        return model, source

    def test_records_derived_artifact_without_claiming_production(self):
        with tempfile.TemporaryDirectory() as directory:
            model, source = self.fixture(directory)
            with contextlib.redirect_stdout(io.StringIO()):
                result = finalize(model, source, ENGINE)
            self.assertEqual(result['source']['revision'], REVISION)
            self.assertFalse(result['gpu'])
            self.assertEqual(len(result['sha256']), 64)
            self.assertIn(result['sha256'], (Path(directory) / 'model.sha256').read_text())

    def test_rejects_changed_source_engine_and_invalid_container(self):
        with tempfile.TemporaryDirectory() as directory:
            model, source = self.fixture(directory)
            with self.assertRaisesRegex(ValueError, 'APPROVED_SOURCE'):
                finalize(model, source, 'other-engine')
            content = json.loads(source.read_text()); content['revision'] = 'other'
            source.write_text(json.dumps(content))
            with self.assertRaisesRegex(ValueError, 'APPROVED_SOURCE'):
                finalize(model, source, ENGINE)
            model, source = self.fixture(directory); model.write_bytes(b'not a model' + bytes(24))
            with self.assertRaisesRegex(ValueError, 'GGUF'):
                finalize(model, source, ENGINE)


if __name__ == '__main__':
    unittest.main()
