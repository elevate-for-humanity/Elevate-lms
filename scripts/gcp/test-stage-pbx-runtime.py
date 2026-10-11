import argparse
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('pbx_stage', Path(__file__).with_name('stage-pbx-runtime.py'))
stage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stage)
REVISION = 'a' * 40


class StagingBoundary(unittest.TestCase):
    def archive(self, root, mutate=None, extra=None):
        values = {name: ('public-source-' + name).encode() for name in stage.FILES}
        manifest = {'version': 1, 'revision': REVISION, 'nodeVersion': 'v22.0.0',
                    'files': {name: hashlib.sha256(value).hexdigest() for name, value in values.items()}}
        if mutate:
            mutate(manifest)
        archive = root / 'runtime.tgz'
        with tarfile.open(archive, 'w:gz') as output:
            for name, value in [('manifest.json', json.dumps(manifest).encode()), *values.items()]:
                info = tarfile.TarInfo(name); info.size = len(value)
                output.addfile(info, io.BytesIO(value))
            if extra:
                output.addfile(extra)
        return archive, stage.digest_file(archive)

    def test_exact_reviewed_payload_is_verified_without_extracting_archive_paths(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary); archive, digest = self.archive(root)
            result = stage.unpack_verified(archive, digest, REVISION, root / 'files')
            self.assertEqual(result['revision'], REVISION)
            self.assertEqual(len(result['files']), 10)
            self.assertTrue((root / 'files/bin/node').is_file())

    def test_changed_bundle_revision_or_member_digest_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary); archive, digest = self.archive(root)
            with self.assertRaisesRegex(ValueError, 'bundle_digest_mismatch'):
                stage.unpack_verified(archive, '0' * 64, REVISION, root / 'out1')
            with self.assertRaisesRegex(ValueError, 'manifest_invalid'):
                stage.unpack_verified(archive, digest, 'b' * 40, root / 'out2')
            archive, digest = self.archive(root, lambda m: m['files'].__setitem__('bin/node', '0' * 64))
            with self.assertRaisesRegex(ValueError, 'payload_digest_mismatch'):
                stage.unpack_verified(archive, digest, REVISION, root / 'out3')

    def test_path_traversal_links_and_extra_members_cannot_escape_allowlist(self):
        for filename, kind in [('../../etc/overwrite', tarfile.REGTYPE), ('unreviewed', tarfile.SYMTYPE)]:
            with tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary); member = tarfile.TarInfo(filename); member.type = kind
                archive, digest = self.archive(root, extra=member)
                with self.assertRaisesRegex(ValueError, 'file_set_invalid'):
                    stage.unpack_verified(archive, digest, REVISION, root / 'out')

    def test_existing_symlink_target_is_never_adopted_or_replaced(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary); target = root / 'existing'; target.write_text('preserve')
            link = root / 'node'; link.symlink_to(target)
            with self.assertRaisesRegex(ValueError, 'symlink_requires_review'):
                stage.validate_destination(link, stage.digest_file(target))
            self.assertEqual(target.read_text(), 'preserve')

    def test_active_or_failed_units_require_review_before_any_install(self):
        for state in [{'LoadState': 'loaded', 'ActiveState': 'active', 'SubState': 'running'},
                      {'LoadState': 'loaded', 'ActiveState': 'failed', 'SubState': 'failed'}, {}]:
            with patch.object(stage, 'unit_state', return_value=state):
                with self.assertRaisesRegex(ValueError, 'unit_requires_review'):
                    stage.require_inactive_units()
        with patch.object(stage, 'unit_state', return_value={'LoadState': 'not-found', 'ActiveState': 'inactive', 'SubState': 'dead'}):
            stage.require_inactive_units()

    def test_invalid_install_invocation_fails_before_commands_or_file_changes(self):
        with patch.object(stage.os, 'geteuid', return_value=0), patch.object(stage, 'run') as command:
            with self.assertRaisesRegex(ValueError, 'bundle_path'):
                stage.install(argparse.Namespace(revision=REVISION, archive='/unrelated/file', sha256='a' * 64))
            command.assert_not_called()


if __name__ == '__main__':
    unittest.main()
