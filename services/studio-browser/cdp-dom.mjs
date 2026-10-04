// DOM queries execute in the frame's own execution context. Input travels over CDP.
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const matcher = (value) =>
  value instanceof RegExp ? { regex: value.source, flags: value.flags } : { text: String(value) };

// Self-contained because CdpFrame.evaluate serializes this function.
async function domOperation({ steps, operation, argument, source }) {
  const normalize = (value) =>
    String(value ?? '')
      .replace(/\s+/g, ' ')
      .trim();
  const matches = (value, match, exact = false) =>
    match.regex !== undefined
      ? new RegExp(match.regex, match.flags).test(normalize(value))
      : exact
        ? normalize(value) === normalize(match.text)
        : normalize(value).toLowerCase().includes(normalize(match.text).toLowerCase());
  const visible = (el) => {
    const style = getComputedStyle(el),
      rect = el.getBoundingClientRect();
    return (
      style.visibility !== 'hidden' &&
      style.visibility !== 'collapse' &&
      style.display !== 'none' &&
      rect.width > 0 &&
      rect.height > 0
    );
  };
  const role = (el) =>
    el.getAttribute('role') ||
    {
      BUTTON: 'button',
      TEXTAREA: 'textbox',
      SELECT: el.multiple ? 'listbox' : 'combobox',
      OPTION: 'option',
      IMG: 'img',
      FIELDSET: 'group',
      A: el.hasAttribute('href') ? 'link' : '',
    }[el.tagName] ||
    (el.tagName === 'INPUT'
      ? ({
          checkbox: 'checkbox',
          radio: 'radio',
          button: 'button',
          submit: 'button',
          range: 'slider',
          number: 'spinbutton',
          hidden: '',
        }[el.type] ?? 'textbox')
      : /^H[1-6]$/.test(el.tagName)
        ? 'heading'
        : '');
  const name = (el) => {
    const ids = el.getAttribute('aria-labelledby');
    if (ids)
      return ids
        .split(/\s+/)
        .map((id) => el.getRootNode().getElementById(id)?.textContent || '')
        .join(' ');
    return (
      el.getAttribute('aria-label') ||
      Array.from(el.labels || [])
        .map((label) => label.textContent)
        .join(' ') ||
      el.getAttribute('alt') ||
      (el.tagName === 'INPUT' && ['submit', 'button'].includes(el.type)
        ? el.value
        : el.textContent) ||
      el.getAttribute('title') ||
      ''
    );
  };
  // Open shadow roots are queryable; closed roots deliberately remain browser-private.
  const descendants = (root, selector = '*') => {
    const found = Array.from(root.querySelectorAll(selector));
    if (root.shadowRoot) found.push(...descendants(root.shadowRoot, selector));
    for (const element of root.querySelectorAll('*')) {
      if (element.shadowRoot) found.push(...descendants(element.shadowRoot, selector));
    }
    return found;
  };
  const deepActiveElement = () => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active;
  };
  const deepHit = (x, y) => {
    let hit = document.elementFromPoint(x, y);
    while (hit?.shadowRoot) {
      const inner = hit.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === hit) break;
      hit = inner;
    }
    return hit;
  };
  const composedContains = (container, node) => {
    while (node) {
      if (node === container || container.contains(node)) return true;
      node = node.getRootNode()?.host;
    }
    return false;
  };
  const query = (plan, root = document) => {
    let elements = [root];
    for (const step of plan) {
      if (step.kind === 'nth') {
        elements = elements.slice(
          step.index < 0 ? elements.length + step.index : step.index,
          (step.index < 0 ? elements.length + step.index : step.index) + 1,
        );
        continue;
      }
      if (step.kind === 'filter') {
        elements = elements.filter(
          (el) =>
            (!step.hasText || matches(el.textContent, step.hasText)) &&
            (!step.has || query(step.has, el).length > 0),
        );
        continue;
      }
      elements = [
        ...new Set(
          elements.flatMap((el) => {
            if (step.kind === 'css') return descendants(el, step.selector);
            return descendants(el).filter((candidate) => {
              if (step.kind === 'testid') return candidate.getAttribute('data-testid') === step.id;
              if (step.kind === 'role')
                return (
                  role(candidate) === step.role &&
                  (step.includeHidden ||
                    (!candidate.closest('[aria-hidden="true"]') && visible(candidate))) &&
                  (!step.name || matches(name(candidate), step.name, step.exact))
                );
              if (step.kind === 'text')
                return (
                  matches(candidate.textContent, step.text, step.exact) &&
                  ![...candidate.children, ...(candidate.shadowRoot?.children || [])].some((child) =>
                    matches(child.textContent, step.text, step.exact),
                  )
                );
              return false;
            });
          }),
        ),
      ];
    }
    return elements;
  };
  const elements = query(steps);
  if (operation === 'count') return elements.length;
  if (elements.length > 1)
    throw new Error(`Strict locator resolved to ${elements.length} elements`);
  const el = elements[0];
  if (operation === 'state') return { attached: !!el, visible: !!el && visible(el) };
  if (!el) return { retry: 'Element not attached' };
  if (operation === 'attribute') return { value: el.getAttribute(argument) };
  if (operation === 'value') return { value: el.value };
  if (operation === 'evaluate') return { value: await (0, eval)(`(${source})`)(el, argument) };
  if (operation === 'box') {
    if (!visible(el)) return { value: null };
    const rect = el.getBoundingClientRect();
    return { value: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
  }
  if (!visible(el)) return { retry: 'Element not visible' };
  if (el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true')
    return { retry: 'Element disabled' };
  el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  if (operation === 'focus' || operation === 'fill') {
    if (
      operation === 'fill' &&
      (el.readOnly ||
        !(el.isContentEditable || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT'))
    )
      throw new Error('Element is not editable');
    el.focus();
    if (deepActiveElement() !== el) return { retry: 'Element could not receive focus' };
    return { value: true };
  }
  if (operation === 'select') {
    if (el.tagName !== 'SELECT') throw new Error('Element is not a select');
    const values = argument;
    const options = Array.from(el.options);
    const selected = values.map((item) =>
      options.find((option, index) =>
        typeof item === 'string'
          ? option.value === item
          : item.value !== undefined
            ? option.value === item.value
            : item.label !== undefined
              ? option.label === item.label
              : index === item.index,
      ),
    );
    if (selected.some((option) => !option)) return { retry: 'Option not present' };
    if (!el.multiple && selected.length > 1)
      throw new Error('Select does not accept multiple values');
    options.forEach((option) => {
      option.selected = selected.includes(option);
    });
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return { value: selected.map((option) => option.value) };
  }
  if (operation === 'checked') return { value: !!el.checked };
  const rect = el.getBoundingClientRect();
  const x =
    Math.max(0, rect.left) + (Math.min(innerWidth, rect.right) - Math.max(0, rect.left)) / 2;
  const y =
    Math.max(0, rect.top) + (Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top)) / 2;
  const hit = deepHit(x, y);
  if (!hit || !composedContains(el, hit)) return { retry: 'Element is obscured' };
  return { value: { x, y, width: rect.width, height: rect.height } };
}

export class CdpLocator {
  constructor(frame, steps) {
    this.frame = frame;
    this.steps = steps;
  }
  append(step) {
    return new CdpLocator(this.frame, [...this.steps, step]);
  }
  locator(selector) {
    return this.append({ kind: 'css', selector });
  }
  getByTestId(id) {
    return this.append({ kind: 'testid', id });
  }
  getByText(text, options = {}) {
    return this.append({ kind: 'text', text: matcher(text), exact: !!options.exact });
  }
  getByRole(role, options = {}) {
    return this.append({
      kind: 'role',
      role,
      name: options.name === undefined ? null : matcher(options.name),
      exact: !!options.exact,
      includeHidden: !!options.includeHidden,
    });
  }
  filter({ has, hasText } = {}) {
    if (has && has.frame !== this.frame)
      throw new Error('has locator must belong to the same frame');
    return this.append({
      kind: 'filter',
      has: has?.steps,
      hasText: hasText === undefined ? null : matcher(hasText),
    });
  }
  first() {
    return this.nth(0);
  }
  nth(index) {
    if (!Number.isInteger(index)) throw new Error('Locator index must be an integer');
    return this.append({ kind: 'nth', index });
  }
  async raw(operation, argument, source) {
    return this.frame.evaluate(domOperation, { steps: this.steps, operation, argument, source });
  }
  async run(operation, argument, options = {}, source) {
    const end = Date.now() + (options.timeout ?? 10000);
    while (true) {
      const result = await this.raw(operation, argument, source);
      if (!result?.retry) return result?.value;
      if (Date.now() >= end) throw new Error(`Locator ${operation} timed out: ${result.retry}`);
      await pause(Math.min(100, Math.max(1, end - Date.now())));
    }
  }
  count() {
    return this.raw('count');
  }
  async isVisible() {
    return (await this.raw('state')).visible;
  }
  async waitFor({ state = 'visible', timeout = 10000 } = {}) {
    if (!['visible', 'hidden', 'attached', 'detached'].includes(state))
      throw new Error(`Unsupported locator state: ${state}`);
    const end = Date.now() + timeout;
    while (true) {
      const status = await this.raw('state');
      if (
        (state === 'visible' && status.visible) ||
        (state === 'hidden' && !status.visible) ||
        (state === 'attached' && status.attached) ||
        (state === 'detached' && !status.attached)
      )
        return;
      if (Date.now() >= end) throw new Error(`Locator did not become ${state}`);
      await pause(100);
    }
  }
  async boundingBox() {
    const box = await this.run('box');
    if (!box) return null;
    const offset = await this.frame.offset();
    return { ...box, x: box.x + offset.x, y: box.y + offset.y };
  }
  inputValue(options) {
    return this.run('value', null, options);
  }
  getAttribute(name, options) {
    return this.run('attribute', name, options);
  }
  evaluate(fn, arg, options) {
    return this.run('evaluate', arg, options, fn.toString());
  }
  focus(options) {
    return this.run('focus', null, options);
  }
  async fill(value, options) {
    await this.run('fill', null, options);
    await this.frame.page.keyboard.press('ControlOrMeta+A');
    await this.frame.page.keyboard.press('Backspace');
    if (String(value)) await this.frame.page.keyboard.insertText(String(value));
  }
  async press(key, options) {
    await this.focus(options);
    await this.frame.page.keyboard.press(key);
  }
  selectOption(value, options) {
    return this.run('select', Array.isArray(value) ? value : [value], options);
  }
  async click(options = {}) {
    // Two equal layout samples guard against clicking moving controls.
    const end = Date.now() + (options.timeout ?? 10000);
    let previous;
    while (true) {
      const point = await this.run('point', null, { timeout: Math.max(0, end - Date.now()) });
      if (
        previous &&
        ['x', 'y', 'width', 'height'].every((key) => Math.abs(point[key] - previous[key]) < 0.5)
      ) {
        const offset = await this.frame.offset();
        return this.frame.page.mouse.click(point.x + offset.x, point.y + offset.y, options);
      }
      if (Date.now() >= end) throw new Error('Locator did not become stable');
      previous = point;
      await pause(32);
    }
  }
  async check(options) {
    if (await this.run('checked', null, options)) return;
    await this.click(options);
    if (!(await this.run('checked', null, options)))
      throw new Error('Checkbox or radio did not become checked');
  }
}
export const locator = (frame, selector) => new CdpLocator(frame, []).locator(selector);
export const getByTestId = (frame, id) => new CdpLocator(frame, []).getByTestId(id);
export const getByText = (frame, text, options) =>
  new CdpLocator(frame, []).getByText(text, options);
export const getByRole = (frame, role, options) =>
  new CdpLocator(frame, []).getByRole(role, options);
