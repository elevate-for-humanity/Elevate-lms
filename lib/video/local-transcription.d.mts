export const LOCAL_TRANSCRIPTION_MODEL: string;
export function loadLocalTranscriber(): Promise<any>;
export function decodeFloatPcm(buffer: Buffer): Float32Array;
export function recognizedWords(result: any): Array<{word: string; start: number; end: number}>;
export function transcribeLocalAudio(input: Buffer | string, options?: { wordTimings?: boolean; textProfile?: 'default' | 'wide' | 'nonoverlap' }): Promise<{text: string; words: Array<{word: string; start: number; end: number}>; provider: string; model: string}>;
