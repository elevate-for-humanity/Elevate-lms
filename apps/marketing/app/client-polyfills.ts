"use client";


import { Buffer } from "buffer";
import process from "process/browser";


const browserGlobals =
  globalThis as typeof globalThis & {
    Buffer?: typeof Buffer;


    buffer?: {
      Buffer: typeof Buffer;
    };


    process?: typeof process;
  };


browserGlobals.Buffer ??=
  Buffer;


browserGlobals.buffer ??= {
  Buffer
};


browserGlobals.process ??=
  process;
