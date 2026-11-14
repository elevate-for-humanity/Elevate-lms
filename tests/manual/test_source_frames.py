import importlib.util,pathlib,sys,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'scripts/manual'))
from prepare_source_frames import source_ids
ID='01bbcba4-988a-4893-b832-5785b369efa5'
class SourceSelectionTests(unittest.TestCase):
    def test_exact_source(self):self.assertEqual(source_ids([ID]),[ID])
    def test_empty_rejected(self):
        with self.assertRaisesRegex(ValueError,'INVALID'):source_ids([])
    def test_duplicate_rejected(self):
        with self.assertRaisesRegex(ValueError,'DUPLICATE'):source_ids([ID,ID])
    def test_invalid_identifier(self):
        with self.assertRaises(ValueError):source_ids(['invalid'])
if __name__=='__main__':unittest.main()
