import hashlib
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('visual_timeline', Path(__file__).parents[2] / 'scripts/manual/visual_timeline.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class VisualTimelineTests(unittest.TestCase):
    def setUp(self):
        self.captions = [{'text': 'Heating adds heat.', 'start': 0, 'end': 2.013}, {'text': 'Cooling removes heat.', 'start': 2.013, 'end': 4.027}]
        self.images = [{'id': 'heat', 'sha256': 'a'}, {'id': 'cool', 'sha256': 'b'}]
        self.cues = [{'firstChunk': i, 'endChunk': i + 1, 'photoId': image['id'], 'narrationSha256': hashlib.sha256(self.captions[i]['text'].encode()).hexdigest(), 'relevance': 'Reviewed equipment image illustrates this exact narrated function.'} for i, image in enumerate(self.images)]

    def test_measured_boundaries_do_not_accumulate_frame_rounding(self):
        result = module.reviewed_visual_timeline(self.cues, self.captions, self.images)
        self.assertEqual(sum(row['frames'] for row in result), round(4.027 * 24))

    def test_duplicate_photo_bytes_are_rejected_even_with_different_ids(self):
        self.images[1]['sha256'] = 'a'
        with self.assertRaisesRegex(RuntimeError, 'REPEATED'):
            module.reviewed_visual_timeline(self.cues, self.captions, self.images)

    def test_gaps_and_stale_narration_are_rejected(self):
        self.cues[0]['endChunk'] = 2
        with self.assertRaises(RuntimeError):
            module.reviewed_visual_timeline(self.cues, self.captions, self.images)
        with self.assertRaisesRegex(RuntimeError, 'REQUIRED'):
            module.reviewed_visual_timeline([], self.captions, self.images)


if __name__ == '__main__':
    unittest.main()
