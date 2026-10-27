import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
spec=importlib.util.spec_from_file_location('includes',Path(__file__).with_name('repair-pwa-config-includes.py'))
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
class IncludeTests(unittest.TestCase):
    def setUp(self):
        self.directory=tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        m.BASE=Path(self.directory.name)/'asterisk'
        m.BASE.mkdir()
        m.EXPECTED_UID=m.os.getuid()
        m.BACKUPS=Path(self.directory.name)/'rollback'
        self.original={'pjsip.conf':b'[twilio]\ntype=endpoint\ncontext=pstn-in\n','extensions.conf':b'[internal]\nexten => 0,1,Gosub(elevate-operator,s,1)\n[pstn-in]\nexten => _X.,1,Goto(internal,0,1)\n'}
        for name,data in self.original.items():
            (m.BASE/name).write_bytes(data)
            (m.BASE/name).chmod(0o640)
        self.calls='0 active calls\n'
        self.commands=[]
        self.fail_reload=False
        def run(args):
            self.commands.append(args)
            if 'core show channels count' in args:return self.calls
            if 'pjsip show endpoints' in args:return 'Endpoint: twilio/fixture Not in use\n'
            if args[0:2]==['docker','inspect']:
                return json.dumps([{'Type':'bind','Source':str(m.BASE),'Destination':'/etc/asterisk'}])
            if 'module reload res_pjsip.so' in args and self.fail_reload:
                self.fail_reload=False
                return "The module 'res_pjsip.so' reported a reload failure"
            return 'Reloaded'
        m.run=run
    def test_adds_only_missing_includes_preserving_carrier_contexts(self):
        result=m.repair('a'*40)
        self.assertTrue(result['changed'])
        self.assertFalse(result['asteriskRestarted'])
        for name,target in m.TARGETS.items():
            self.assertTrue((m.BASE/name).read_bytes().startswith(self.original[name]))
            self.assertTrue(m.referenced(m.BASE,name,target))
            self.assertEqual((m.BACKUPS/('pwa-includes-'+'a'*40)/name).read_bytes(),self.original[name])
        self.assertFalse(any('restart' in command for command in self.commands))
    def test_follows_existing_indirect_includes_without_reloading(self):
        for name,target in m.TARGETS.items():
            (m.BASE/name).write_text('#include "owned-'+name+'"\n')
            (m.BASE/('owned-'+name)).write_text('#tryinclude "'+target+'"\n')
        result=m.repair('a'*40)
        self.assertFalse(result['changed'])
        self.assertFalse(any('module reload res_pjsip.so' in c for c in self.commands))
    def test_reload_failure_restores_exact_original_config(self):
        self.fail_reload=True
        with self.assertRaisesRegex(ValueError,'pwa_includes_rolled_back'):
            m.repair('a'*40)
        for name,data in self.original.items():self.assertEqual((m.BASE/name).read_bytes(),data)
    def test_active_calls_block_all_configuration_writes(self):
        self.calls='1 active call\n'
        with self.assertRaisesRegex(ValueError,'active_call'):
            m.repair('a'*40)
        for name,data in self.original.items():self.assertEqual((m.BASE/name).read_bytes(),data)
    def test_ambiguous_dynamic_and_external_includes_block(self):
        for line in ['#exec "anything"','#include "../outside.conf"','#include "/etc/passwd"','#include "ambiguous name.conf"']:
            (m.BASE/'pjsip.conf').write_text(line+'\n')
            with self.assertRaises(ValueError):m.referenced(m.BASE,'pjsip.conf',m.TARGETS['pjsip.conf'])
if __name__=='__main__':unittest.main()
