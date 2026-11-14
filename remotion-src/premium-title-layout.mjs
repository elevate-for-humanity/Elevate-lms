// Inspection region around the approved compositor's heading at y=78.
// This includes its whitespace without resizing the delivered phone pixels.
export const PREMIUM_TITLE_LAYOUT = 'approved-premium-title-v1';
export const PREMIUM_TITLE_BOX = Object.freeze({
  canvasWidth: 1920, canvasHeight: 1080,
  left: 54, top: 60, right: 54, height: 148,
});

export function premiumTitleCropFilter() {
  const box = PREMIUM_TITLE_BOX;
  return `crop=iw*${box.canvasWidth - box.left - box.right}/${box.canvasWidth}:ih*${box.height}/${box.canvasHeight}:iw*${box.left}/${box.canvasWidth}:ih*${box.top}/${box.canvasHeight}`;
}
