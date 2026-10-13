"""Offline pronunciation support; alignment still measures the actual recording."""
import re
CUSTOM = {
 "disinfected":"D IH S IH N F EH K T IH D", "signoff":"S AY N AO F",
 "resistive":"R IH Z IH S T IH V", "igniter":"IH G N AY T ER",
 "protectant":"P R AH T EH K T AH N T", "perms":"P ER M Z",
 "relaxers":"R IH L AE K S ER Z", "updos":"AH P D UW Z",
 "hairstyling":"HH EH R S T AY L IH NG",
 "substantiating":"S AH B S T AE N SH I EY T IH NG",
 "hvac":"HH EY CH V AE K",
}
PHONES=set("AA AE AH AO AW AY B CH D DH EH ER EY F G HH IH IY JH K L M N NG OW OY P R S SH T TH UH UW V W Y Z ZH".split())
def install_pronunciations(decoder, words, predict=None):
    missing=sorted({w for w in words if not decoder.lookup_word(w)})
    if not missing: return []
    if predict is None and any(w not in CUSTOM for w in missing):
        from g2p_en import G2p
        predict=G2p()
    added=[]
    for word in missing:
        phones=CUSTOM.get(word)
        if not phones:
            raw=predict(word)
            tokens=[re.sub(r"[012]$","",p) for p in raw if p!=" "]
            if not tokens or any(p not in PHONES for p in tokens):
                raise ValueError("FORCED_ALIGNMENT_UNSUPPORTED_PRONUNCIATION:"+word)
            phones=" ".join(tokens)
        decoder.add_word(word,phones)
        added.append(word)
    return added
