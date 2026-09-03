// lib/scorm/api.ts
// SCORM API adapter for both 1.2 and 2004

export class ScormAPI {
  private attemptId: string;
  private version: '1.2' | '2004';
  private data: Map<string, string> = new Map();
  private initialized = false;
  private terminated = false;

  constructor(attemptId: string, version: '1.2' | '2004') {
    this.attemptId = attemptId;
    this.version = version;
  }

  // SCORM 1.2 API
  LMSInitialize(param: string): string {
    if (this.initialized) return 'false';
    this.initialized = true;
    this.loadData();
    return 'true';
  }

  LMSFinish(param: string): string {
    if (!this.initialized || this.terminated) return 'false';
    this.terminated = true;
    this.saveData();
    return 'true';
  }

  LMSGetValue(key: string): string {
    if (!this.initialized) return '';
    return this.data.get(key) || '';
  }

  LMSSetValue(key: string, value: string): string {
    if (!this.initialized || this.terminated) return 'false';
    this.data.set(key, value);
    return 'true';
  }

  LMSCommit(param: string): string {
    if (!this.initialized) return 'false';
    this.saveData();
    return 'true';
  }

  LMSGetLastError(): string {
    return '0';
  }

  LMSGetErrorString(errorCode: string): string {
    return 'No error';
  }

  LMSGetDiagnostic(errorCode: string): string {
    return '';
  }

  // SCORM 2004 API
  Initialize(param: string): string {
    return this.LMSInitialize(param);
  }

  Terminate(param: string): string {
    return this.LMSFinish(param);
  }

  GetValue(key: string): string {
    return this.LMSGetValue(key);
  }

  SetValue(key: string, value: string): string {
    return this.LMSSetValue(key, value);
  }

  Commit(param: string): string {
    return this.LMSCommit(param);
  }

  GetLastError(): string {
    return this.LMSGetLastError();
  }

  GetErrorString(errorCode: string): string {
    return this.LMSGetErrorString(errorCode);
  }

  GetDiagnostic(errorCode: string): string {
    return this.LMSGetDiagnostic(errorCode);
  }

  private async loadData() {
    try {
      const response = await fetch(`/api/scorm/attempts/${this.attemptId}/data`);
      if (response.ok) {
        const json = await response.json();
        this.data = new Map(Object.entries(json.data || {}));
      }
    } catch (error) {
      /* Error handled silently */
      // Error: $1
    }
  }

  private async saveData() {
    try {
      const dataObj = Object.fromEntries(this.data);
      await fetch(`/api/scorm/attempts/${this.attemptId}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataObj }),
      });
    } catch (error) {
      /* Error handled silently */
      // Error: $1
    }
  }
}

// Expose API to window for SCORM content
export function initializeScormAPI(attemptId: string, version: '1.2' | '2004') {
  const api = new ScormAPI(attemptId, version);

  if (version === '1.2') {
    (window as any).API = api;
  } else {
    (window as any).API_1484_11 = api;
  }

  return api;
}
