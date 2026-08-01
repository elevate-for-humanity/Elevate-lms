import { Buffer } from "buffer";
import process from "process/browser";


declare global {
  interface Window {
    Buffer?: typeof Buffer;
    buffer?: {
      Buffer: typeof Buffer;
    };
    process?: typeof process;
  }


  // eslint-disable-next-line no-var
  var Buffer:
    | typeof import("buffer").Buffer
    | undefined;


  // eslint-disable-next-line no-var
  var buffer:
    | {
        Buffer:
          typeof import("buffer").Buffer;
      }
    | undefined;


  // eslint-disable-next-line no-var
  var process:
    | typeof import("process/browser")
    | undefined;
}


/*
 * Some packages reference `Buffer`.
 */
if (
  typeof globalThis.Buffer ===
  "undefined"
) {
  globalThis.Buffer = Buffer;
}


/*
 * The current production error specifically references lowercase
 * `buffer`, so expose the module-compatible object as well.
 */
if (
  typeof globalThis.buffer ===
  "undefined"
) {
  globalThis.buffer = {
    Buffer
  };
}


/*
 * Some older browser dependencies expect a global process object.
 */
if (
  typeof globalThis.process ===
  "undefined"
) {
  globalThis.process = process;
}
