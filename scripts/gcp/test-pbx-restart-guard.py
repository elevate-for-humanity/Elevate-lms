import importlib.util
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location('guard', Path(__file__).with_name('pbx-restart-guard.py'))
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)


class RestartGuard(unittest.TestCase):
    def test_zero_calls_alone_is_not_enough(self):
        for endpoints in ['Objects found: 1', 'unrecognized output']:
            with self.assertRaises(ValueError):
                guard.require_idle('0 active calls\n0 active channels\n', endpoints, '0 modules loaded\n')
    def test_active_channels_or_legacy_sip_block_restart(self):
        for channels, legacy in [('0 active calls\n1 active channel\n', '0 modules loaded'),
                                 ('1 active call\n0 active channels\n', '0 modules loaded'),
                                 ('0 active calls\n0 active channels\n', '1 modules loaded')]:
            with self.assertRaises(ValueError):
                guard.require_idle(channels, 'No objects found.', legacy)
    def test_explicit_empty_runtime_is_allowed(self):
        for endpoints in ['No objects found.\n', 'Objects found: 0\n']:
            guard.require_idle('0 active calls\n0 active channels\n', endpoints, '0 modules loaded\n')
    def test_unknown_cli_output_never_passes(self):
        with self.assertRaises(ValueError):
            guard.require_idle('No such command', 'No objects found.', '0 modules loaded')


if __name__ == '__main__': unittest.main()
