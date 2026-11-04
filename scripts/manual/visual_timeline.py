"""Validate reviewed picture choices against measured narration cue boundaries."""
import hashlib


def reviewed_visual_timeline(cues, captions, images, fps=24):
    if not cues or not captions:
        raise RuntimeError('REVIEWED_VISUAL_CUES_REQUIRED')
    lookup = {image['id']: image for image in images}
    used = set()
    cursor = 0
    visuals = []
    for cue in cues:
        start, end = cue.get('firstChunk'), cue.get('endChunk')
        if type(start) is not int or type(end) is not int or start != cursor or not start < end <= len(captions):
            raise RuntimeError('VISUAL_NARRATION_COVERAGE_INVALID')
        image = lookup.get(cue.get('photoId'))
        if not image or image['sha256'] in used:
            raise RuntimeError('VISUAL_PHOTO_REPEATED_OR_UNKNOWN')
        text = ' '.join(part['text'] for part in captions[start:end])
        if cue.get('narrationSha256') != hashlib.sha256(text.encode()).hexdigest():
            raise RuntimeError('VISUAL_NARRATION_SOURCE_CHANGED')
        if not isinstance(cue.get('relevance'), str) or len(cue['relevance'].strip()) < 20:
            raise RuntimeError('VISUAL_RELEVANCE_REVIEW_REQUIRED')
        first, last = captions[start], captions[end - 1]
        # Round absolute boundaries, avoiding accumulated rounding drift per shot.
        first_frame, end_frame = round(first['start'] * fps), round(last['end'] * fps)
        if end_frame <= first_frame:
            raise RuntimeError('VISUAL_DURATION_INVALID')
        visuals.append({'image': image, 'duration': (end_frame - first_frame) / fps,
                        'frames': end_frame - first_frame, 'start': first['start'], 'end': last['end'],
                        'title': cue.get('title') or first['text'], 'relevance': cue['relevance'],
                        'firstChunk': start, 'endChunk': end})
        used.add(image['sha256'])
        cursor = end
    if cursor != len(captions):
        raise RuntimeError('VISUAL_NARRATION_COVERAGE_INVALID')
    return visuals
