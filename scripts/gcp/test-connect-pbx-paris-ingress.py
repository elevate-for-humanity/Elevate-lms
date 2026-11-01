import importlib.util
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('ingress',Path(__file__).with_name('connect-pbx-paris-ingress.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Tests(unittest.TestCase):
 def test_enters_paris_before_operator_fallback(self):
  text=m.ingress_plan();self.assertIn('exten => +14632401404,1,Answer()',text);self.assertLess(text.index('Stasis(elevate-paris)'),text.index('Goto(internal,0,1)'));self.assertNotIn('exten => _',text)
 def test_only_carrier_context_is_changed(self):
  source='[before]\ncontext=other\n[twilio]\ntype=endpoint\ncontext=elevate-twilio-in\n[after]\ncontext=keep\n';result=m.update_endpoint(source);self.assertIn('context=other',result);self.assertIn('context=keep',result);self.assertEqual(result.count('context=elevate-paris-inbound'),1);self.assertIn('identify_by=ip',result)
 def test_ambiguous_endpoint_is_rejected(self):
  with self.assertRaises(ValueError):m.update_endpoint('[twilio]\ntype=endpoint\ncontext=a\ncontext=b\n')
 def test_netmask_readback_is_normalized(self):
  import ipaddress
  text='\n'.join(str(ipaddress.ip_network(x).network_address)+'/'+str(ipaddress.ip_network(x).netmask) for x in m.SIGNALING)
  self.assertTrue(m.verified_identity(text));self.assertFalse(m.verified_identity('Match:0.0.0.0/0'));self.assertFalse(m.verified_identity(text+'\nMatch:0.0.0.0/0'))
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
  with patch.object(m,'cli',return_value=transport),patch.object(m,'run',side_effect=['yes\n','no\n','Public Key Algorithm: rsaEncryption']) as access,patch.object(m,'current_attempt_messages',return_value=('Permission denied secret=private no shared cipher',True)):
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
 def test_rsa_configuration_preserves_routes_and_existing_acme_challenge(self):
  original='{\n auto_https disable_redirects\n}\nphone.elevateforhumanity.org {\n tls {\n issuer acme {\n disable_http_challenge\n }\n }\n reverse_proxy 127.0.0.1:8088\n}\n'
  configured=m.rsa_gateway_config(original)
  self.assertIn('key_type rsa2048',configured)
  self.assertIn('disable_http_challenge',configured);self.assertIn('reverse_proxy 127.0.0.1:8088',configured)
  self.assertEqual(configured.count('key_type rsa2048'),1)
  self.assertEqual(m.rsa_gateway_config(configured).count('key_type rsa2048'),1)
 def test_unowned_gateway_configuration_cannot_be_replaced(self):
  with self.assertRaisesRegex(ValueError,'CONFIGURATION_REQUIRES_REVIEW'):m.rsa_gateway_config('other.example { tls internal }')
 def test_existing_rsa_certificate_does_not_restart_gateway(self):
  from unittest.mock import patch
  pair=(Path('/owned/cert'),Path('/owned/key'))
  with patch.object(m,'certificate_uses_rsa',return_value=True),patch.object(m,'cli',side_effect=AssertionError('No restart needed')):
   self.assertEqual(m.ensure_rsa_gateway_certificate(pair),pair)
 def test_gateway_mount_requires_the_existing_owned_file(self):
  with self.assertRaisesRegex(ValueError,'MOUNT_UNVERIFIED'):
   m.require_gateway_mount({'State':{'Running':True},'Mounts':[{'Destination':'/etc/caddy/Caddyfile','Source':'/other','Type':'bind'}]},Path('/owned/Caddyfile'))
 def exercise_gateway_rotation(self,success,busy=False):
  from unittest.mock import patch
  import tempfile,json
  real_path=Path
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);config=root/'Caddyfile';before='phone.elevateforhumanity.org {\n tls {\n issuer acme {\n disable_http_challenge\n }\n }\n reverse_proxy 127.0.0.1:8088\n}\n';config.write_text(before)
   storage=root/'certificates';owned=storage/'issuer'/'phone.elevateforhumanity.org';owned.mkdir(parents=True)
   cert=owned/'phone.elevateforhumanity.org.crt';key=cert.with_suffix('.key');metadata=cert.with_suffix('.json')
   for resource in [cert,key,metadata]:resource.write_text('old-'+resource.suffix)
   other=storage/'issuer'/'other.example';other.mkdir();(other/'keep.key').write_text('unrelated-private-key')
   backup=root/'private-backup';backup.mkdir(mode=0o700)
   def mapped(value):
    return config if str(value)=='/opt/elevate-pbx/tls-proxy/Caddyfile' else storage if str(value)=='/var/lib/elevate-pbx-tls/data/caddy/certificates' else real_path(value)
   container={'Id':'same-container','Image':'same-image','State':{'Running':True},'Mounts':[{'Destination':'/etc/caddy/Caddyfile','Source':str(config),'Type':'bind'}]}
   restarts=[]
   def execute(args):
    if args[:2]==['docker','inspect']:return json.dumps([container])
    if args[:2]==['docker','restart']:
     restarts.append(args[2])
     if success:
      for resource in [cert,key,metadata]:resource.write_text('issued-'+resource.suffix)
     return args[2]
    if 'validate' in args:return ''
    self.fail('Unexpected command '+str(args))
   with patch.object(m,'Path',side_effect=mapped),patch.object(m,'certificate_uses_rsa',side_effect=[False,True] if success else [False]),patch.object(m,'cli',return_value='0 active calls\n0 active channels',side_effect=['0 active calls\n0 active channels','1 active call\n1 active channel'] if busy else None),patch.object(m,'gateway_ws_ready',return_value=True),patch.object(m,'run',side_effect=execute),patch.object(m,'certificate_pair',return_value=(cert,key)),patch.object(m.tempfile,'mkdtemp',return_value=str(backup)),patch.object(m.time,'monotonic',side_effect=[0,1] if success else [0,100]),patch('builtins.print') as output:
    if busy:
     with self.assertRaisesRegex(ValueError,'CALL_STARTED_BEFORE_GATEWAY_RESTART'):m.ensure_rsa_gateway_certificate((cert,key))
     self.assertEqual(config.read_text(),before);self.assertEqual(key.read_text(),'old-.key');self.assertEqual(len(restarts),0)
    elif success:
     self.assertEqual(m.ensure_rsa_gateway_certificate((cert,key)),(cert,key))
     self.assertIn('key_type rsa2048',config.read_text());self.assertEqual(key.read_text(),'issued-.key');self.assertEqual(len(restarts),1)
     self.assertNotIn('unrelated-private-key',str(output.call_args_list))
    else:
     with self.assertRaisesRegex(ValueError,'TRUSTED_RSA_CERTIFICATE_NOT_ISSUED'):m.ensure_rsa_gateway_certificate((cert,key))
     self.assertEqual(config.read_text(),before);self.assertEqual(key.read_text(),'old-.key');self.assertEqual(cert.read_text(),'old-.crt');self.assertEqual(metadata.read_text(),'old-.json');self.assertEqual(len(restarts),2)
   self.assertEqual((other/'keep.key').read_text(),'unrelated-private-key');self.assertFalse(backup.exists())
 def test_rsa_issuance_preserves_gateway_identity_and_unrelated_certificates(self):self.exercise_gateway_rotation(True)
 def test_failed_rsa_issuance_restores_the_previous_working_gateway(self):self.exercise_gateway_rotation(False)
 def test_a_call_starting_during_preflight_prevents_gateway_restart(self):self.exercise_gateway_rotation(False,True)
 def test_listener_owner_must_be_the_current_containers_asterisk(self):
  ss='LISTEN 0 128 0.0.0.0:5061 0.0.0.0:* users:(("asterisk",pid=123,fd=5))'
  self.assertTrue(m.listener_ownership(ss,'PID COMMAND\n123 asterisk')['listenerOwnerVerified'])
  self.assertFalse(m.listener_ownership(ss,'PID COMMAND\n456 asterisk')['listenerOwnerVerified'])
  self.assertFalse(m.listener_ownership('','PID COMMAND\n123 asterisk')['listenerOwnerVerified'])
 def test_only_new_messages_are_classified_for_the_candidate(self):
  from unittest.mock import patch
  from types import SimpleNamespace
  with patch.object(m,'messages_cursor',return_value=(7,200)),patch.object(m.subprocess,'run',return_value=SimpleNamespace(returncode=0,stdout='fresh TLS error')) as command:
   self.assertEqual(m.current_attempt_messages((7,100)),('fresh TLS error',True))
   self.assertEqual(command.call_args.args[0][-1],'101')
 def test_log_rotation_starts_the_new_file_and_unknown_offsets_are_not_evidence(self):
  from unittest.mock import patch
  from types import SimpleNamespace
  with patch.object(m,'messages_cursor',return_value=(8,20)),patch.object(m.subprocess,'run',return_value=SimpleNamespace(returncode=0,stdout='new file')) as command:
   self.assertEqual(m.current_attempt_messages((7,100)),('new file',True));self.assertEqual(command.call_args.args[0][-1],'1')
   self.assertEqual(m.current_attempt_messages(None),('',False))
if __name__=='__main__':unittest.main()
