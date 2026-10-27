from pathlib import Path
import json
from pocketsphinx import Decoder
from alignment_lexicon import install_pronunciations
words=json.loads(Path(__file__).with_name("course-vocabulary-preflight.json").read_text())
decoder=Decoder(samprate=16000)
added=install_pronunciations(decoder,words)
missing=[w for w in words if not decoder.lookup_word(w)]
if missing: raise ValueError("COURSE_VOCABULARY_NOT_COVERED:"+str(missing))
print(json.dumps({"courseVocabularyWords":len(words),"pronunciationsAdded":len(added),"missing":0}))
