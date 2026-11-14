declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'consent',
      targetId: string,
      config?: Record<string, unknown>,
    ) => void;
    dataLayer: unknown[];
    tidioChatApi?: {
      open: () => void;
      close: () => void;
      show: () => void;
      hide: () => void;
      setVisitorData: (data: Record<string, unknown>) => void;
      on: (event: string, callback: () => void) => void;
    };
  }
}

export {};
