/** Caption track mode has one owner: the learner's choice.
 *
 * A caption file that finishes loading, and a late-mounting copy of the player,
 * must never disable an enabled track. A disabled track exposes no cues, so a
 * load path that re-derives the mode would silently remove captions from a
 * learner who asked for them and leave the acceptance check reading nothing.
 */
export function captionTrackMode(showCaptions) {
  return showCaptions ? 'showing' : 'disabled';
}

/** A load event is not a learner action, so it may only re-assert the enabled
 * state. Returning null leaves the track exactly as the learner left it. */
export function captionTrackModeAfterLoad(showCaptions) {
  return showCaptions ? 'showing' : null;
}
