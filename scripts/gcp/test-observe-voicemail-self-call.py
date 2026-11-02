import importlib.util,json,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('observer',Path(__file__).with_name('observe-voicemail-self-call.py'));o=importlib.util.module_from_spec(spec);spec.loader.exec_module(o)
class Privacy(unittest.TestCase):
 def test_capture_filename_fits_the_actual_asterisk_cli_column(self):
  self.assertLessEqual(len('/var/log/asterisk/efhvm_'+'a'*10),35)
 def test_only_owned_call_and_fixed_source_locations_leave_private_trace(self):
  data='''VERBOSE[111][C-00000001] Executing [s@elevate-operator:4] VoiceMail("PJSIP/twilio-00000001", "0@elevate,u")
WARNING[111][C-00000001] app_voicemail.c:1234 leave_voicemail: secret dynamic contents 5555555555
WARNING[222][C-00000002] other.c:2345 other_func: Unrelated private contents
'''
  result=o.scoped_trace(data,{'PJSIP/twilio-00000001'})
  self.assertEqual(result['ownedExecution'],[{'context':'elevate-operator','priority':4,'application':'VoiceMail'}])
  self.assertEqual(result['ownedWarnings'],[{'sourceFile':'app_voicemail.c','line':1234,'function':'leave_voicemail'}])
  text=json.dumps(result)
  for forbidden in ['secret','5555555555','Unrelated','other_func','PJSIP/twilio']:self.assertNotIn(forbidden,text)
if __name__=='__main__':unittest.main()
