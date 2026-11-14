import importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('proxy',Path(__file__).with_name('repair-paris-turn-proxy.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Tests(unittest.TestCase):
 def original(self):return 'phone.elevateforhumanity.org {\n  tls {\n    key_type rsa2048\n  }\n  respond /healthz "ok" 200\n  handle {\n    reverse_proxy 127.0.0.1:8088\n  }\n}\n'
 def test_private_route_precedes_catchall_and_retains_existing_tls(self):
  changed=m.render(self.original());self.assertIn('key_type rsa2048',changed);self.assertIn('reverse_proxy 127.0.0.1:8088',changed)
  self.assertLess(changed.index('handle @parisTurn'),changed.index('  handle {'))
  self.assertIn('remote_ip 127.0.0.1 ::1',changed);self.assertIn('method POST',changed);self.assertIn('max_size 220KB',changed)
  self.assertIn('reverse_proxy 127.0.0.1:8091',changed);self.assertIn('respond 403',changed)
 def test_repair_is_idempotent(self):self.assertEqual(m.render(m.render(self.original())),m.render(self.original()))
 def test_unreviewed_existing_route_is_never_replaced(self):
  for extra in ['  handle /internal/paris/turn { respond 404 }\n','  @parisTurn path /other\n']:
   with self.assertRaisesRegex(ValueError,'EXISTING_ROUTE_REQUIRES_REVIEW'):m.render(self.original().replace(m.ANCHOR,extra+m.ANCHOR))
 def test_ambiguous_hosts_and_health_anchors_are_rejected(self):
  for text in [self.original()*2,self.original().replace(m.HOST,'other.example'),self.original().replace(m.ANCHOR,'')]:
   with self.assertRaisesRegex(ValueError,'HOST_SCOPE_UNVERIFIED'):m.render(text)
 def test_only_the_existing_running_config_mount_is_accepted(self):
  container={'State':{'Running':True},'Mounts':[{'Type':'bind','Source':str(m.FILE),'Destination':'/etc/caddy/Caddyfile'}]};m.require_mount(container)
  container['Mounts'][0]['Source']='/unrelated/Caddyfile'
  with self.assertRaisesRegex(ValueError,'MOUNT_UNVERIFIED'):m.require_mount(container)
 def test_root_ownership_and_nonwritable_config_are_required(self):
  from unittest.mock import Mock
  from types import SimpleNamespace
  filename=Mock();filename.is_symlink.return_value=False;filename.is_file.return_value=True;filename.stat.return_value=SimpleNamespace(st_uid=0,st_mode=0o600)
  m.require_file_ownership(filename)
  for change in ['symlink','owner','writable']:
   filename.is_symlink.return_value=change=='symlink';filename.stat.return_value=SimpleNamespace(st_uid=1000 if change=='owner' else 0,st_mode=0o622 if change=='writable' else 0o600)
   with self.assertRaisesRegex(ValueError,'OWNERSHIP_UNVERIFIED'):m.require_file_ownership(filename)
 def test_failed_auth_readback_restores_the_same_bind_mounted_inode(self):
  import tempfile,json
  from unittest.mock import patch
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);config=root/'Caddyfile';original=self.original();config.write_text(original);inode=config.stat().st_ino;reloads=[]
   def command(args):
    if args[:2]==['docker','inspect']:return json.dumps([{'State':{'Running':True},'Mounts':[{'Type':'bind','Source':str(config),'Destination':'/etc/caddy/Caddyfile'}]}])
    if args[-1]=='core show channels count':return '0 active calls\n0 active channels\n'
    if 'reload' in args:reloads.append(config.read_text());return ''
    if 'validate' in args:return ''
    self.fail('Unexpected command')
   with patch.object(m,'require_file_ownership'),patch.object(m,'FILE',config),patch.object(m,'BACKUPS',root/'backups'),patch.object(m,'run',side_effect=command),patch.object(m,'private_status',side_effect=[404,500]),patch('builtins.print'):
    with self.assertRaisesRegex(ValueError,'AUTH_READBACK_FAILED'):m.repair()
   self.assertEqual(config.read_text(),original);self.assertEqual(config.stat().st_ino,inode)
   self.assertEqual(len(reloads),2);self.assertIn(m.BLOCK,reloads[0]);self.assertEqual(reloads[1],original)
 def test_pending_channel_blocks_changes_even_with_zero_active_calls(self):
  import tempfile,json
  from unittest.mock import patch
  with tempfile.TemporaryDirectory() as directory:
   config=Path(directory)/'Caddyfile';original=self.original();config.write_text(original)
   def command(args):
    if args[:2]==['docker','inspect']:return json.dumps([{'State':{'Running':True},'Mounts':[{'Type':'bind','Source':str(config),'Destination':'/etc/caddy/Caddyfile'}]}])
    if args[-1]=='core show channels count':return '0 active calls\n1 active channel\n'
    self.fail('Unexpected mutation')
   with patch.object(m,'require_file_ownership'),patch.object(m,'FILE',config),patch.object(m,'run',side_effect=command),patch.object(m,'private_status',side_effect=AssertionError('Must refuse before network calls')):
    with self.assertRaisesRegex(ValueError,'ACTIVE_CALLS_OR_UNKNOWN'):m.repair()
   self.assertEqual(config.read_text(),original)
if __name__=='__main__':unittest.main()
