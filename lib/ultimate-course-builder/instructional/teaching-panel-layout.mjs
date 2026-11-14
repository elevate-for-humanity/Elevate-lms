/** Fit the complete authored card above the caption band. measure must use
 * the compositor's actual font; never truncate teaching text to make it fit. */
export function fitTeachingPanel(label, value, measure) {
  const width = 646, height = 640, wordSpacing = 4;
  const lines = (text, size) => {
    let count = 1, used = 0;
    for (const word of String(text).split(/\s+/).filter(Boolean)) {
      const measured = measure(word, size);
      if (!Number.isFinite(measured) || measured < 0)
        throw new Error('ULTIMATE_TEACHING_PANEL_OVERFLOW');
      if (measured > width) return Infinity;
      const gap = used ? measure(' ', size) + wordSpacing : 0;
      if (used && used + gap + measured > width) { count++; used = measured; }
      else used += gap + measured;
    }
    return count;
  };
  for (let size = 64; size >= 44; size -= 2) {
    const labelSize = Math.min(size, label.length > 30 ? 56 : 64);
    const valueSize = Math.min(size, value.length > 100 ? 52 : 64);
    const contentHeight = lines(label, labelSize) * labelSize * 1.25 +
      lines(value, valueSize) * valueSize * 1.25 + 2 * 28 + 28;
    if (contentHeight <= height) return {labelSize, valueSize, wordSpacing};
  }
  throw new Error('ULTIMATE_TEACHING_PANEL_OVERFLOW');
}
