"""Align known recorded narration without inventing word times."""
import json,re,subprocess,sys
from pocketsphinx import Decoder
from alignment_lexicon import install_pronunciations
audio,script=sys.argv[1:3]
text=open(script).read()
if re.search(r"\d",text):
    raise ValueError("FORCED_ALIGNMENT_EXPLICIT_NUMBER_PRONUNCIATION_REQUIRED")
words=re.findall(r"[a-z]+(?:'[a-z]+)?",text.lower())
if not words: raise ValueError("FORCED_ALIGNMENT_EMPTY_SCRIPT")
decoder=Decoder(samprate=16000)
install_pronunciations(decoder, words)
pcm=subprocess.check_output(["ffmpeg","-v","error","-i",audio,"-f","s16le","-ac","1","-ar","16000","pipe:1"])
duration=len(pcm)/32000
decoder.set_align_text(" ".join(words))
decoder.start_utt()
decoder.process_raw(pcm,full_utt=True)
decoder.end_utt()
timed=[{"word":re.sub(r"\(\d+\)$","",s.word),"start":s.start_frame/100,"end":(s.end_frame+1)/100} for s in decoder.seg() if s.word not in ["<s>","</s>","<sil>"]]
if [w["word"] for w in timed]!=words: raise ValueError("FORCED_ALIGNMENT_SCRIPT_MISMATCH")
for i,w in enumerate(timed):
    if w["end"]<=w["start"] or w["start"]<0 or w["end"]>duration+0.02 or (i and w["start"]<timed[i-1]["end"]):
        raise ValueError("FORCED_ALIGNMENT_INVALID_MEASURED_TIME")
print(json.dumps(timed))
