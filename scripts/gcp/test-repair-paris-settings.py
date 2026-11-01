import importlib.util
from pathlib import Path
import unittest
import tempfile
from unittest.mock import patch
spec = importlib.util.spec_from_file_location('repair', Path(__file__).with_name('repair-paris-settings.py'))
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
class SettingsTests(unittest.TestCase):
    def system(self):
        return dict(status='active', ai_enabled=True, greeting='Welcome to Elevate.', ai_instructions='Ask one question at a time.')
    def test_authoritative_settings_and_extensions(self):
        result=m.settings(self.system(), [{'extension':'105'},{'extension':'0'},{'extension':'102'}])
        self.assertEqual(result['PARIS_GREETING'],'Welcome to Elevate.')
        self.assertEqual(result['PARIS_ALLOWED_EXTENSIONS'],'102,105')
    def test_rejects_disabled_missing_injected_or_duplicate_settings(self):
        for override in [dict(status='inactive'),dict(ai_enabled=False),dict(greeting=''),dict(ai_instructions='\0')]:
            with self.assertRaises(ValueError): m.settings({**self.system(),**override},[{'extension':'0'}])
        for extensions in [[{'extension':'102'},{'extension':'102'}],[{'extension':'SIP/attacker'}],[]]:
            with self.assertRaises(ValueError):m.settings(self.system(),extensions)
    def test_systemd_quoting_preserves_text_without_shell_evaluation(self):
        self.assertEqual(m.environment_text({'PARIS_GREETING':'Hi "there"\\next\nnew line $HOME `date`'}),'PARIS_GREETING="Hi \\"there\\"\\\\next\nnew line $HOME `date`"\n')
    def test_refuses_active_or_unknown_calls(self):
        for output in ['1 active call','unknown','']:
            with patch.object(m,'run',return_value=output),self.assertRaises(ValueError):m.require_idle()
        with patch.object(m,'run',return_value='0 active calls\n'):m.require_idle()
    def test_directory_falls_back_to_assigned_mailbox_without_device_registration(self):
        text=m.directory_text({'PARIS_ALLOWED_EXTENSIONS':'102,105'})
        self.assertIn('DIALPLAN_EXISTS(elevate-pwa-extensions,102,1)',text)
        self.assertIn('Gosub(elevate-pwa-extensions,102,1)',text)
        self.assertIn('VoiceMail(102@elevate,u)',text)
        self.assertIn('VoiceMail(105@elevate,u)',text)
        self.assertNotIn('Return()',text)
        with self.assertRaises(ValueError):m.directory_text({'PARIS_ALLOWED_EXTENSIONS':'SIP/attacker'})
    def test_rolls_back_source_and_settings_after_failed_restart(self):
        with tempfile.TemporaryDirectory() as temporary:
            real_path=Path
            root=Path(temporary)
            live=root/'live';live.mkdir()
            source=root/'source';source.mkdir()
            for name in ['launch.mjs','turn-adapter.mjs','ari-media.mjs']:
                (live/name).write_text('old-'+name);(source/name).write_text('new-'+name)
            config=root/'etc/elevate-pbx/paris-dashboard-settings.conf'
            config.parent.mkdir(parents=True);config.write_text('old-settings')
            main=root/'opt/elevate-pbx/repo/infra/pbx/asterisk/extensions.conf'
            main.parent.mkdir(parents=True);main.write_text('old-dialplan')
            def mapped(value):
                text=str(value)
                return root/text.lstrip('/') if text.startswith(('/etc/','/var/lib/','/opt/elevate-pbx/')) else real_path(value)
            failed=False
            def command(args):
                nonlocal failed
                if args[:2]==['systemctl','is-active']:return 'active'
                if args[-3:]==['id','-g','asterisk']:return '0'
                if args==['systemctl','restart','elevate-paris-gateway.service'] and not failed:
                    failed=True;raise ValueError('restart failed')
                return ''
            with patch.object(m,'Path',side_effect=mapped),patch.object(m,'ROOT',live),patch.object(m,'run',side_effect=command),patch.object(m,'require_idle'),patch.object(m,'read_authority',return_value=m.settings(self.system(),[{'extension':'0'}])):
                with self.assertRaises(ValueError):m.repair(source)
            self.assertTrue(failed)
            self.assertEqual(config.read_text(),'old-settings')
            self.assertEqual(main.read_text(),'old-dialplan')
            for name in ['launch.mjs','turn-adapter.mjs','ari-media.mjs']:
                self.assertEqual((live/name).read_text(),'old-'+name)
            self.assertFalse((root/'etc/systemd/system/elevate-paris-turn.service.d/30-dashboard-settings.conf').exists())
if __name__=='__main__': unittest.main()
