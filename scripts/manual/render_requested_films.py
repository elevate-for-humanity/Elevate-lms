"""Process an explicitly selected list of already reviewed saved lessons, sequentially."""
import json,os,subprocess,sys,uuid
from pathlib import Path

def selected_lessons(value,request):
    if value in ('saved-request','review-request','verify-request'):
        if request.get('mode') not in ('encode-review-candidate','refresh-review-previews','verify-uploaded-films'): raise ValueError('MANUAL_REQUEST_MODE_INVALID')
        if value=='review-request' and request.get('mode')!='refresh-review-previews': raise ValueError('MANUAL_REQUEST_MODE_INVALID')
        if value=='verify-request' and request.get('mode')!='verify-uploaded-films': raise ValueError('MANUAL_REQUEST_MODE_INVALID')
        ids=request.get('lessonIds',[])
    else: ids=[value]
    if not isinstance(ids,list) or not 1<=len(ids)<=35: raise ValueError('MANUAL_SELECTION_SIZE_INVALID')
    normalized=[str(uuid.UUID(x)) for x in ids]
    if len(set(normalized))!=len(normalized): raise ValueError('MANUAL_SELECTION_DUPLICATE')
    return normalized

if __name__=='__main__':
    root=Path(__file__).parent
    request=json.loads((root/'film-request.json').read_text())
    for lesson in selected_lessons(os.environ['LESSON_ID'],request):
        subprocess.run([sys.executable,str(root/'render_saved_lesson.py')],env={**os.environ,'LESSON_ID':lesson,'MANUAL_REVIEW_ONLY':'true' if os.environ['LESSON_ID']=='review-request' else 'false','MANUAL_VERIFY_UPLOADED':'true' if os.environ['LESSON_ID']=='verify-request' else 'false'},check=True)
