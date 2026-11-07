/**
 * The premium caption track is checked again on decoded 1280px and 390px
 * frames. Keep authored cue words intact while ensuring long cues have enough
 * vertical room in the 180px native bottom bar; never hide or trim words.
 */
export function premiumCaptionFontSize(caption) {
 const n=String(caption??'').trim().length;
 return n>78?44:n>54?52:60;
}
