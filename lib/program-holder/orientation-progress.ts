/** Credit contiguous playback only, bounded by server elapsed time. */
export function nextOrientationPosition(
  watched: number,
  position: number,
  elapsedSeconds: number,
  duration: number,
) {
  if (
    ![watched, position, elapsedSeconds, duration].every(Number.isFinite) ||
    watched < 0 ||
    position < 0 ||
    duration <= 0
  )
    return null;
  const allowance = Math.min(20, Math.max(0, elapsedSeconds) * 1.25 + 0.75);
  if (position > watched + allowance || position > duration + 1) return null;
  return Math.min(duration, Math.max(watched, position));
}
