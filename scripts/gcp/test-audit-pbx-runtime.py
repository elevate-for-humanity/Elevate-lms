import importlib.util
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location('pbx_audit', Path(__file__).with_name('audit-pbx-runtime.py'))
pbx = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pbx)
class RuntimeEvidence(unittest.TestCase):
    def test_context_or_wildcard_is_not_an_operator_route(self):
        self.assertFalse(pbx.operator_configured("[ Context 'internal' ]\n '_X.' => 1. Dial(PJSIP/${EXTEN},30)"))
        self.assertFalse(pbx.operator_configured("There is no existence of '0@internal'"))
        self.assertTrue(pbx.operator_configured(" '0' => 1. Gosub(elevate-operator,s,1) [extensions.conf:10]"))
    def test_zero_mailboxes_is_not_a_configured_mailbox(self):
        self.assertEqual(pbx.mailbox_count('0 voicemail users configured.'), 0)
        self.assertEqual(pbx.mailbox_count('3 voicemail users configured.'), 3)
        self.assertIsNone(pbx.mailbox_count('No such command'))
if __name__ == '__main__': unittest.main()
