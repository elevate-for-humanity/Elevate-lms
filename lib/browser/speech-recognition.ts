export type BrowserSpeechRecognitionResultList = {
  length: number;
  [index: number]: {
    isFinal?: boolean;
    [index: number]: { transcript: string };
  };
};

export type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: { resultIndex?: number; results: BrowserSpeechRecognitionResultList }) => void)
    | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type SpeechRecognitionWindow = {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
};

export function createBrowserSpeechRecognition(): BrowserSpeechRecognition | null {
  if (typeof window === 'undefined') return null;

  const speechWindow = window as unknown as SpeechRecognitionWindow;
  const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
  return Recognition ? new Recognition() : null;
}

/** Recognition results are cumulative; interim words replace earlier hypotheses. */
export function speechSessionText(prefix: string, results: BrowserSpeechRecognitionResultList): string {
  const transcript = Array.from({ length: results.length }, (_, index) =>
    results[index][0]?.transcript ?? '',
  ).join(' ').trim();
  const before = prefix.trimEnd();
  return `${before}${before && transcript ? ' ' : ''}${transcript}`;
}
