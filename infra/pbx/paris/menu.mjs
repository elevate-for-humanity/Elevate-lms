// The same authoritative menu drives both the spoken opening and keypad routes.
// Never derive a destination from generated speech or an arbitrary dial string.
export function menuOptions(raw=process.env.PARIS_MENU_OPTIONS || '[]', allowed=process.env.PARIS_ALLOWED_EXTENSIONS || '') {
  let options;
  try { options=JSON.parse(raw); } catch { throw Error('PARIS_MENU_INVALID'); }
  const extensions=new Set(String(allowed).split(',').filter(v=>/^[1-9]\d{2}$/.test(v)));
  const digits=new Set();
  if(!Array.isArray(options) || options.length>10)throw Error('PARIS_MENU_INVALID');
  for(const option of options){
    if(!option || !/^[0-9]$/.test(option.digit) || typeof option.digit!=='string' || digits.has(option.digit) ||
       typeof option.label!=='string' || !option.label.trim() || option.label.length>160 || [...option.label].some(c=>c.charCodeAt(0)<32) ||
       (option.extension!=='0' && !extensions.has(option.extension)) || (option.digit==='0' && option.extension!=='0'))
      throw Error('PARIS_MENU_INVALID');
    digits.add(option.digit);
  }
  return options;
}

export function menuRoute(digit, options) {
  const extension=digit==='0' ? '0' : options.find(option=>option.digit===digit)?.extension;
  if(!extension)return null;
  return {type:extension==='0' ? 'operator' : 'extension',extension};
}

export function openingText(greeting, options) {
  const text=[greeting.trim(),...options.map(option=>`For ${option.label.trim()}, press ${option.digit}.`)].join(' ');
  // Preserve the existing bounded 80-second audio envelope; reject oversized
  // saved menus at deployment instead of silently dropping their final choices.
  if(text.length>1200)throw Error('PARIS_MENU_GREETING_TOO_LONG');
  return text;
}
