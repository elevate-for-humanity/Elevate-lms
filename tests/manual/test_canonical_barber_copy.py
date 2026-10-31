import copy,hashlib,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts/manual'))
from copy_reviewed_barber_media import PAIRS,SOURCE,DESTINATION,validated_identity

class CanonicalBarberCopyTests(unittest.TestCase):
    def fixture(self):
        sections=[{'heading':'Plan the service','body':'Confirm the requested result and required supervised practice.'}]
        text='\n\n'.join(s['heading']+'. '+s['body'] for s in sections);sha=hashlib.sha256(text.encode()).hexdigest()
        manifest={'courseId':SOURCE,'lessonId':PAIRS[0][0],'sourceTranscriptSha256':sha,'sha256':'a'*64,'candidateVideoId':'reviewed-candidate','storagePath':f'course-videos/manual-lessons/{SOURCE}/{PAIRS[0][0]}/reviewed-'+('b'*64)+'/completed-lesson-manual.mp4','visualShots':[{},{}],'technicalChecks':{'fullDecode':True,'storedBytesHashMatches':True,'blackAtLeastPoint4Seconds':False,'silenceAtLeast1SecondAtMinus45dB':False}}
        source={'id':PAIRS[0][0],'course_id':SOURCE,'title':'Haircutting','order_index':1,'practical_required':True,'video_status':'complete','media_quality_status':'approved','is_published':True,'content_json':{'experience':{'readingGuide':{'sections':sections}},'manualMediaDraft':{'encodedReview':manifest},'manualMediaPublication':{'candidateVideoId':'reviewed-candidate'}},'media_quality_evidence':{'mediaSha256':'a'*64,'visualReview':{'reviewedShots':2}}}
        dest={'id':PAIRS[0][1],'course_id':DESTINATION,'title':'Haircutting','order_index':1,'practical_required':True,'content_json':{'experience':{'readingGuide':{'sections':copy.deepcopy(sections)}},'manualMediaDraft':{'sourceTranscriptSha256':sha}}}
        return source,dest
    def test_only_exact_original_lesson_pair(self):
        s,d=self.fixture();self.assertEqual(validated_identity(s,d)[0]['sha256'],'a'*64)
        d['id']=PAIRS[1][1]
        with self.assertRaisesRegex(ValueError,'PAIR_INVALID'):validated_identity(s,d)
    def test_course_identity_cannot_be_swapped(self):
        s,d=self.fixture();d['course_id']=SOURCE
        with self.assertRaisesRegex(ValueError,'PAIR_INVALID'):validated_identity(s,d)
    def test_actual_destination_instruction_must_match(self):
        s,d=self.fixture();d['content_json']['experience']['readingGuide']['sections'][0]['body']='Different instruction'
        with self.assertRaisesRegex(ValueError,'SOURCE_NOT_ATTACHED'):validated_identity(s,d)
    def test_practical_requirements_cannot_be_removed(self):
        s,d=self.fixture();d['practical_required']=False
        with self.assertRaisesRegex(ValueError,'PRACTICAL_REQUIREMENT'):validated_identity(s,d)
    def test_unreviewed_film_is_rejected(self):
        s,d=self.fixture();s['media_quality_status']='pending'
        with self.assertRaisesRegex(ValueError,'SOURCE_NOT_REVIEWED'):validated_identity(s,d)
    def test_hash_mismatch_is_rejected(self):
        s,d=self.fixture();s['media_quality_evidence']['mediaSha256']='c'*64
        with self.assertRaisesRegex(ValueError,'REVIEW_IDENTITY_CHANGED'):validated_identity(s,d)
    def test_missing_actual_frame_review_is_rejected(self):
        s,d=self.fixture();s['media_quality_evidence']['visualReview']['reviewedShots']=0
        with self.assertRaisesRegex(ValueError,'VISUAL_REVIEW_MISSING'):validated_identity(s,d)
    def test_foreign_storage_path_is_rejected(self):
        s,d=self.fixture();s['content_json']['manualMediaDraft']['encodedReview']['storagePath']='course-videos/manual-lessons/elsewhere/film.mp4'
        with self.assertRaisesRegex(ValueError,'STORAGE_IDENTITY_CHANGED'):validated_identity(s,d)
    def test_incomplete_stored_byte_check_is_rejected(self):
        s,d=self.fixture();s['content_json']['manualMediaDraft']['encodedReview']['technicalChecks']['storedBytesHashMatches']=False
        with self.assertRaisesRegex(ValueError,'TECHNICAL_REVIEW_MISSING'):validated_identity(s,d)
    def test_all_fourteen_pairs_are_unique(self):
        self.assertEqual(len(PAIRS),14);self.assertEqual(len({x[0] for x in PAIRS}),14);self.assertEqual(len({x[1] for x in PAIRS}),14)

if __name__=='__main__':unittest.main()
