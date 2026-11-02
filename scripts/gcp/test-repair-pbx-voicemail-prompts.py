import importlib.util,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('repair',Path(__file__).with_name('repair-pbx-voicemail-prompts.py'));repair=importlib.util.module_from_spec(spec);spec.loader.exec_module(repair)
class Safety(unittest.TestCase):
 def test_preserves_custom_files_and_rolls_back_only_added_files(self):
  with tempfile.TemporaryDirectory() as temp:
   root=Path(temp)/'sounds/en';root.mkdir(parents=True);custom=root/'beep.ulaw';custom.write_bytes(b'custom')
   files,dirs=repair.install_files(root,{'beep.ulaw':b'stock','digits/0.ulaw':b'zero'})
   self.assertEqual(custom.read_bytes(),b'custom');self.assertEqual((root/'digits/0.ulaw').read_bytes(),b'zero')
   repair.rollback(files,dirs);self.assertEqual(custom.read_bytes(),b'custom');self.assertFalse((root/'digits').exists())
 def test_rejects_symlink_without_touching_destination(self):
  with tempfile.TemporaryDirectory() as temp:
   root=Path(temp);outside=root/'outside';outside.mkdir();(root/'digits').symlink_to(outside,target_is_directory=True)
   with self.assertRaisesRegex(ValueError,'SYMLINK_REJECTED'):repair.install_files(root,{'digits/0.ulaw':b'bad'})
   self.assertFalse((outside/'0.ulaw').exists())
 def test_rejects_archive_that_does_not_match_official_digest(self):
  with self.assertRaisesRegex(ValueError,'CHECKSUM_MISMATCH'):repair.members(b'bad archive')
if __name__=='__main__':unittest.main()
