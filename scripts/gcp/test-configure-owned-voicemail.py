import importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('v',Path(__file__).with_name('configure-owned-voicemail.py'));v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
GOOD="-= Info about Application 'VoiceMail' =-\n[Synopsis]\nLeave a voicemail message"
class Registration(unittest.TestCase):
 def test_module_running_and_mailbox_definitions_do_not_prove_application_registration(self):
  self.assertFalse(v.application_registered('app_voicemail.so Comedian Mail 0 Not Running'))
  self.assertFalse(v.application_registered('Your application(s) is (are) not registered'))
  self.assertTrue(v.application_registered(GOOD))
 def test_missing_application_requires_normal_module_reinitialization_and_readback(self):
  calls=[];loaded=False
  def command(args):
   nonlocal loaded
   text=args[-1];calls.append(text)
   if text=='core show application VoiceMail':return GOOD if loaded else 'Your application(s) is (are) not registered'
   if text=='core show channels count':return '0 active channels\n0 active calls\n'
   if text=='module show like app_voicemail.so':return '0 modules loaded'
   if text=='module load app_voicemail.so':loaded=True
   return ''
  result=v.ensure_voicemail_application(command)
  self.assertTrue(result['applicationRegisteredAfter']);self.assertTrue(result['moduleReloadedFromDisk'])
  self.assertIn('module unload app_voicemail.so',calls);self.assertNotIn('module reload app_voicemail.so',calls)
  self.assertTrue(all('-f' not in call and 'force' not in call for call in calls))
 def test_only_alternate_storage_providers_are_disabled_persistently(self):
  original='[modules]\nautoload=yes\nrequire=res_ari.so\n'
  policy=v.voicemail_module_policy(original)
  self.assertIn('require=res_ari.so',policy);self.assertIn('noload=app_voicemail_imap.so',policy)
  self.assertIn('noload=app_voicemail_odbc.so',policy);self.assertNotIn('noload=app_voicemail.so',policy)
  self.assertEqual(v.voicemail_module_policy(policy),policy)
  with self.assertRaisesRegex(ValueError,'policy_conflict'):v.voicemail_module_policy('[modules]\nrequire=app_voicemail_imap.so\n')
 def test_refused_unload_can_use_only_the_explicit_idle_restart_callback(self):
  ready=False;commands=[]
  def command(args):
   text=args[-1];commands.append(text)
   if text=='core show application VoiceMail':return GOOD if ready else 'not registered'
   if text=='core show channels count':return '0 active channels\n0 active calls'
   if text=='module show like app_voicemail.so':return 'app_voicemail.so Comedian Mail 1 Running'
   return ''
  def restart():
   nonlocal ready
   ready=True
  result=v.ensure_voicemail_application(command,restart)
  self.assertTrue(result['existingContainerRestarted']);self.assertTrue(result['applicationRegisteredAfter'])
  self.assertNotIn('module load app_voicemail.so',commands)
 def test_registered_application_only_reloads_its_configuration(self):
  calls=[]
  def command(args):
   calls.append(args[-1]);return GOOD if args[-1]=='core show application VoiceMail' else ''
  self.assertFalse(v.ensure_voicemail_application(command)['moduleReloadedFromDisk'])
  self.assertEqual(calls,['core show application VoiceMail','module reload app_voicemail.so','core show application VoiceMail'])
 def test_active_calls_or_refused_module_unload_stop_without_forcing(self):
  for active in [True,False]:
   calls=[]
   def command(args):
    text=args[-1];calls.append(text)
    if text=='core show application VoiceMail':return 'not registered'
    if text=='core show channels count':return '1 active channels\n1 active call' if active else '0 active channels\n0 active calls'
    if text=='module show like app_voicemail.so':return 'app_voicemail.so Comedian Mail 0 Not Running'
    return ''
   with self.assertRaisesRegex(ValueError,'active_call|unload_refused'):v.ensure_voicemail_application(command)
   self.assertNotIn('module load app_voicemail.so',calls)
if __name__=='__main__':unittest.main()
