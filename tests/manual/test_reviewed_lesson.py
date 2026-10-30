import hashlib, importlib.util, pathlib, unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('manual',ROOT/'scripts/manual/render_saved_lesson.py')
manual=importlib.util.module_from_spec(spec);spec.loader.exec_module(manual)

class ReviewedSourceTests(unittest.TestCase):
    def row(self):
        return {'content_json':{'experience':{'readingGuide':{'sections':[{'heading':'Review','body':'Saved instruction.'}]}},'manualMediaDraft':{'mode':'manually-reviewed-source-and-photo-selections','sourceTranscriptSha256':hashlib.sha256(b'Review. Saved instruction.').hexdigest(),'photoGroups':[['photo-a','photo-b']],'noAutomaticPublication':True,'reviewRequiredAfterEncoding':True}}}
    def test_exact_reviewed_source(self):
        sections,groups,text=manual.canonical_source(self.row());self.assertEqual(text,'Review. Saved instruction.');self.assertEqual(groups,[['photo-a','photo-b']])
    def test_changed_instruction_stops_before_encoding(self):
        row=self.row();row['content_json']['experience']['readingGuide']['sections'][0]['body']='Changed.'
        with self.assertRaisesRegex(RuntimeError,'MANUAL_SOURCE_CHANGED'):manual.canonical_source(row)
    def test_unreviewed_input_cannot_be_encoded(self):
        row=self.row();row['content_json']['manualMediaDraft']['reviewRequiredAfterEncoding']=False
        with self.assertRaisesRegex(RuntimeError,'MANUAL_SOURCE_REVIEW_REQUIRED'):manual.canonical_source(row)
    def test_unmatched_photo_sections_stop(self):
        row=self.row();row['content_json']['manualMediaDraft']['photoGroups']=[]
        with self.assertRaisesRegex(RuntimeError,'MANUAL_PHOTO_PLAN_INVALID'):manual.canonical_source(row)

if __name__=='__main__':unittest.main()
