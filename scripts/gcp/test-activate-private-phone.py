import importlib.util
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('activation',Path(__file__).with_name('activate-private-phone.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class GuardTests(unittest.TestCase):
    def test_unverified_or_active_calls_refuse_changes(self):
        for value in ['','No such command','1 active call','10 active calls']:
            self.assertFalse(module.unused(value))
        self.assertTrue(module.unused('0 active channels\n0 active calls\n'))
    def test_failed_listener_restores_only_started_units(self):
        calls=[]
        def run(args):
            calls.append(args)
            if args[0]=='docker': return 'true' if args[1]=='inspect' else '0 active calls'
            if args[1]=='show': return 'LoadState=loaded\nActiveState='+('active' if args[2]==module.UNITS[0] else 'inactive')+'\nSubState='+('running' if args[2]==module.UNITS[0] else 'dead')
            return ''
        with self.assertRaisesRegex(ValueError,'private_services_not_healthy'):
            module.activate(run=run,probe=lambda *_:False,wait=lambda _:None)
        stopped=[args[2] for args in calls if args[:2]==['systemctl','stop']]
        self.assertEqual(stopped,list(reversed(module.UNITS[1:])))
if __name__=='__main__': unittest.main()
