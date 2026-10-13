export const LOCAL_TRANSCRIPTION_MODEL: string;
export function loadLocalTranscriber(): Promise<any>;
export function decodeFloatPcm(buffer: Buffer): Float32Array;
export function recognizedWords(result: any, durationSeconds?: number): Array<{word: string; start: number; end: number}>;
// The text-only mode intentionally omits word timings; timestamped recognition
// remains the default and requires measured word evidence.
export function transcribeLocalAudio(input: Buffer | string, options: { wordTimings: false }): Promise<{ text: string; provider: string; model: string }>;
export function transcribeLocalAudio(input: Buffer | string, options?: { wordTimings?: true }): Promise<{ text: string; words: Array<{ word: string; start: number; end: number }>; provider: string; model: string }>;
