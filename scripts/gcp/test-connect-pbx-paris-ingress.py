import importlib.util
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('ingress',Path(__file__).with_name('connect-pbx-paris-ingress.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Tests(unittest.TestCase):
 def test_enters_paris_before_operator_fallback(self):
  text=m.ingress_plan();self.assertIn('exten => +14632401404,1,Answer()',text);self.assertLess(text.index('Stasis(elevate-paris)'),text.index('Goto(internal,0,1)'));self.assertNotIn('exten => _',text)
 def test_only_carrier_context_is_changed(self):
  source='[before]\ncontext=other\n[twilio]\ntype=endpoint\ncontext=elevate-twilio-in\n[after]\ncontext=keep\n';result=m.update_endpoint(source);self.assertIn('context=other',result);self.assertIn('context=keep',result);self.assertEqual(result.count('context=elevate-paris-inbound'),1)
 def test_ambiguous_endpoint_is_rejected(self):
  with self.assertRaises(ValueError):m.update_endpoint('[twilio]\ntype=endpoint\ncontext=a\ncontext=b\n')
 def test_netmask_readback_is_normalized(self):
  import ipaddress
  text='\n'.join(str(ipaddress.ip_network(x).network_address)+'/'+str(ipaddress.ip_network(x).netmask) for x in m.SIGNALING)
  self.assertTrue(m.verified_identity(text));self.assertFalse(m.verified_identity('Match:0.0.0.0/0'))
 def test_restart_guard_rejects_pending_channels(self):
  self.assertTrue(m.idle_state('0 active calls\n0 active channels\n'))
  self.assertFalse(m.idle_state('0 active calls\n1 active channel\n'))
 def test_tls_configuration_uses_owned_certificate_paths(self):
  text=m.tls_endpoint('[elevate-twilio-tls]\ntype=transport\nprotocol=tls\n[other]\nkeep=yes\n')
  self.assertIn('cert_file=/etc/asterisk/tls/phone.crt',text)
  self.assertIn('allow_reload=yes',text)
  self.assertIn('[other]\nkeep=yes',text)
 def test_failure_evidence_never_emits_arbitrary_exception_text(self):
  self.assertEqual(m.failure_evidence(ValueError('secret=private'))['reason'],'PBX_UNEXPECTED_FAILURE')
  self.assertEqual(m.failure_evidence(ValueError('PBX_INGRESS_READBACK_FAILED'))['reason'],'PBX_INGRESS_READBACK_FAILED')
  self.assertEqual(m.failure_evidence(m.subprocess.TimeoutExpired(['private'],30))['reason'],'PBX_COMMAND_TIMEOUT')
 def test_candidate_diagnostics_are_redacted_and_check_actual_asterisk_access(self):
  from unittest.mock import patch
  from types import SimpleNamespace
  import json
  transport='cert_file : /etc/asterisk/tls/phone.crt\npriv_key_file : /etc/asterisk/tls/phone.key\n'
  with patch.object(m,'cli',return_value=transport),patch.object(m,'run',side_effect=['yes\n','no\n','Public Key Algorithm: rsaEncryption']) as access,patch.object(m.subprocess,'run',return_value=SimpleNamespace(stdout='Permission denied secret=private',stderr='no shared cipher')):
   evidence=m.attempted_tls_evidence()
  self.assertEqual(evidence['candidateFilesReadable'],{'cert_file':True,'priv_key_file':False})
  self.assertTrue(evidence['candidateLogSignals']['noSharedCipher'])
  self.assertTrue(evidence['candidateLogSignals']['permissionDenied'])
  self.assertNotIn('private',json.dumps(evidence));self.assertNotIn('/etc/',json.dumps(evidence))
  self.assertTrue(all(call.args[0][2:4]==['--user','asterisk'] for call in access.call_args_list[:2]))
 def test_outbound_aor_uses_the_owned_dedicated_trunk(self):
  original='[before]\nkeep=yes\n[twilio-aor]\ntype=aor\ncontact=sip:elevate-standalone.pstn.twilio.com:5061;transport=tls\n[twilio]\ntype=endpoint\n'
  changed=m.update_outbound_aor(original)
  self.assertIn(r'contact=sip:elevate-4632401404.pstn.twilio.com:5061\;transport=tls',changed)
  self.assertIn('[before]\nkeep=yes',changed)
  self.assertEqual(changed,m.update_outbound_aor(changed))
 def test_unreviewed_aor_is_rejected(self):
  with self.assertRaisesRegex(ValueError,'CONTACT_REQUIRES_REVIEW'):
   m.update_outbound_aor('[twilio-aor]\ntype=aor\ncontact=sip:other.example\n')
 def test_sip_probe_preserves_trust_and_uses_carrier_rsa_ciphers(self):
  context=m.sip_tls_context()
  self.assertEqual(context.minimum_version,m.ssl.TLSVersion.TLSv1_2)
  self.assertEqual(context.maximum_version,m.ssl.TLSVersion.TLSv1_2)
  self.assertTrue(context.check_hostname);self.assertEqual(context.verify_mode,m.ssl.CERT_REQUIRED)
  ciphers=[c for c in context.get_ciphers() if c['protocol']=='TLSv1.2']
  self.assertTrue(ciphers);self.assertTrue(all(c['auth']=='auth-rsa' for c in ciphers))
 def test_retirement_commits_new_contact_before_any_tls_changes(self):
  from unittest.mock import patch
  import tempfile
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);fragment=root/'elevate-twilio.conf'
   fragment.write_text('[twilio-aor]\ntype=aor\ncontact=sip:elevate-standalone.pstn.twilio.com:5061;transport=tls\n')
   def command(value):
    if value=='core show channels count':return '0 active calls\n0 active channels'
    if value=='module reload res_pjsip.so':return 'Module reloaded'
    if value=='pjsip show aor twilio-aor':return fragment.read_text().replace('\\;', ';')
    self.fail('Unexpected command '+value)
   with patch.object(m,'ROOT',root),patch.object(m,'cli',side_effect=command),patch.object(m,'trusted_sip_tls',side_effect=AssertionError('TLS activation must remain separate')):
    self.assertTrue(m.retire_standalone_contact()['retiredContactRemoved'])
   self.assertNotIn('elevate-standalone',fragment.read_text())
if __name__=='__main__':unittest.main()
