import importlib.util,pathlib,unittest
spec=importlib.util.spec_from_file_location('requested',pathlib.Path(__file__).resolve().parents[2]/'scripts/manual/render_requested_films.py');r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
ID='0caedcdb-44b4-4956-ae27-c363c34c84d1'
class SelectionTests(unittest.TestCase):
    def test_exact_single_selection(self):self.assertEqual(r.selected_lessons(ID,{}),[ID])
    def test_saved_selection(self):self.assertEqual(r.selected_lessons('saved-request',{'mode':'encode-review-candidate','lessonIds':[ID]}),[ID])
    def test_duplicate_rejected(self):
        with self.assertRaisesRegex(ValueError,'DUPLICATE'):r.selected_lessons('saved-request',{'mode':'encode-review-candidate','lessonIds':[ID,ID]})
    def test_empty_selection_rejected(self):
        with self.assertRaisesRegex(ValueError,'SIZE_INVALID'):r.selected_lessons('saved-request',{'mode':'encode-review-candidate','lessonIds':[]})
    def test_invalid_identifier_rejected(self):
        with self.assertRaises(ValueError):r.selected_lessons('unexpected-input',{})
    def test_review_request_is_explicitly_scoped(self):self.assertEqual(r.selected_lessons('review-request',{'mode':'refresh-review-previews','lessonIds':[ID]}),[ID])
    def test_review_cannot_request_encoding(self):
        with self.assertRaisesRegex(ValueError,'MODE_INVALID'):r.selected_lessons('review-request',{'mode':'encode-review-candidate','lessonIds':[ID]})
if __name__=='__main__':unittest.main()
