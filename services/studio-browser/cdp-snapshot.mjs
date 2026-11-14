/** Executed inside a frame. Bound traversal before computing styles or names;
 * a large dashboard must not scan every hidden control before applying its cap. */
export function readBrowserSnapshot(offset = 0) {
  const started = performance.now();
  const controls = [], headings = [], text = [];
  const roots = [document.body || document.documentElement];
  const styles = new WeakMap();
  let scanned = 0, textLength = 0, truncated = false;
  const clean = (value, max = 300) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  const visible = element => {
    if (!element) return false;
    if (styles.has(element)) return styles.get(element);
    const style = window.getComputedStyle(element), rect = element.getBoundingClientRect();
    const result = style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    styles.set(element, result);return result;
  };
  while (roots.length) {
    const root = roots.shift();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (++scanned > 6000 || performance.now() - started > 250) { truncated = true;break; }
      if (node.nodeType === Node.TEXT_NODE) {
        if (textLength >= 6000 || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(node.parentElement?.tagName || '') || !visible(node.parentElement)) continue;
        const value = clean(node.textContent, 6000 - textLength);
        if (value) {text.push(value);textLength += value.length + 1;}
        continue;
      }
      if (node.shadowRoot) roots.push(node.shadowRoot);
      if (node.matches('h1,h2,h3,h4,h5,h6') && visible(node)) {
        if (headings.length < 40) headings.push({level:Number(node.tagName.slice(1)),text:clean(node.textContent,240)});
        else truncated = true;
      }
      if (!node.matches('button,a[href],input,select,textarea,[role="button"],[contenteditable="true"]') || !visible(node)) continue;
      if (controls.length >= 80) {truncated = true;continue;}
      const ref = `e${offset + controls.length + 1}`, tag = node.tagName.toLowerCase();
      if (node.getAttribute('data-studio-ref') !== ref) node.setAttribute('data-studio-ref',ref);
      controls.push({ref,role:node.getAttribute('role') || (tag === 'a' ? 'link' : tag),
        name:clean(node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent || node.getAttribute('placeholder')),
        type:clean(node.getAttribute('type'),40) || undefined,
        value:tag === 'select' ? clean(node.value,500) : undefined,
        placeholder:clean(node.getAttribute('placeholder'),160) || undefined,
        href:tag === 'a' ? clean(node.href,1000) : undefined,
        disabled:Boolean(node.disabled || node.getAttribute('aria-disabled') === 'true')});
    }
    if (scanned > 6000 || performance.now() - started > 250) break;
  }
  return {title:clean(document.title,300),url:window.location.href,visibleText:clean(text.join(' '),6000),headings,controls,
    ...(truncated ? {truncated:true} : {})};
}
