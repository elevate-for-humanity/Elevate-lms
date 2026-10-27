// Canonical 1920x1080 SlideLesson coordinates, shared with encoded-pixel OCR.
export const FOOTAGE_TITLE_LAYOUT = 'footage-title-v1';
export const FOOTAGE_TITLE_BOX = Object.freeze({
  canvasWidth: 1920, canvasHeight: 1080,
  left: 60, top: 80, width: 1800, height: 240,
  fontSize: 80, paddingY: 24, paddingX: 32, borderWidth: 5, contentGap: 40,
});

export function footageTitleCropFilter() {
  const box = FOOTAGE_TITLE_BOX;
  // Exclude the decorative border; retain the card's text and whitespace.
  return `crop=iw*${box.width - box.borderWidth}/${box.canvasWidth}:ih*${box.height}/${box.canvasHeight}:iw*${box.left + box.borderWidth}/${box.canvasWidth}:ih*${box.top}/${box.canvasHeight}`;
}
