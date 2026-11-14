import unittest
from importlib.machinery import SourceFileLoader
from pathlib import Path

loader = SourceFileLoader('stager', str(Path(__file__).with_name('stage-pbx-operator-voicemail.py')))
module = loader.load_module()

class TestStaging(unittest.TestCase):
    def test_internal_only(self):
        d, v = module.render('101', '101', '123456')
        self.assertIn('[elevate-operator-test]', d)
        self.assertIn('VoiceMail(101@elevate-test,u)', d)
        self.assertNotIn('telnyx', d.lower())
        self.assertNotIn('trunk', d.lower())
        self.assertIn('123456', v)
    def test_rejects_injection(self):
        for value in ['0', '101\\ninclude=outbound', 'abc', '1000']:
            with self.assertRaises(ValueError):
                module.render(value, '101', '123456')
    def test_requires_pin(self):
        with self.assertRaises(ValueError):
            module.render('101', '101', '')

if __name__ == '__main__':
    unittest.main()
