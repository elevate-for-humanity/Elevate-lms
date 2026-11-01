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
if __name__=='__main__':unittest.main()
