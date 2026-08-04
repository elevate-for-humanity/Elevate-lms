"use client";

// Browser polyfills -- buffer npm package not installed
// Provide Buffer via browser-native TextEncoder/Decoder + atob/btoa

if (typeof globalThis.process === 'undefined') {
  (globalThis).process = { browser: true, env: {} };
}

if (typeof globalThis.Buffer === 'undefined') {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  (globalThis).Buffer = class {
    static from(s, e='utf8') {
      if (e==='base64') {
        const b = atob(s);
        const u = new Uint8Array(b.length);
        for (let i=0;i<b.length;i++) u[i]=b.charCodeAt(i);
        return new MinimalBuffer(u);
      }
      return new MinimalBuffer(enc.encode(s));
    }
    static alloc(n, f=0) { return new MinimalBuffer(new Uint8Array(n).fill(f)); }
    static isBuffer(x) { return x instanceof MinimalBuffer; }
    bytes;
    constructor(d) {
      if (d instanceof ArrayBuffer) this.bytes = new Uint8Array(d);
      else if (d instanceof Uint8Array) this.bytes = d;
      else if (typeof d === 'string') this.bytes = enc.encode(d);
      else this.bytes = new Uint8Array(0);
    }
    toString(e='utf8') {
      if (e==='hex') return Array.from(this.bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
      if (e==='base64') { let s=''; for (const b of this.bytes) s+=String.fromCharCode(b); return btoa(s); }
      return dec.decode(this.bytes);
    }
  };
}
(globalThis).buffer = { Buffer: globalThis.Buffer };

function syncSupabaseSessionToCookies() {
  try {
    const k = 'sb-cuxzzpsyufcewtmicszk-auth-token';
    const s = localStorage.getItem(k);
    if (!s) return;
    const sess = JSON.parse(s);
    if (!sess?.access_token) return;
    document.cookie = k+'='+encodeURIComponent(JSON.stringify(sess))+'; max-age='+(14*24*60*60)+'; path=/; SameSite=Lax';
  } catch {}
}
syncSupabaseSessionToCookies();
