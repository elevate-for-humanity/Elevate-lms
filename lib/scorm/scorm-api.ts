// SCORM API Wrapper
// Supports SCORM 1.2 and SCORM 2004 (SCORM 2004 4th Edition)
export type SCORMVersion = '1.2' | '2004';
export class SCORMAPIWrapper {
  private lmsAPI: any;
  private initialized: boolean = false;
  private version: SCORMVersion | null = null;
  constructor() {
    this.lmsAPI = this.findAPI(window);
    this.detectVersion();
  }
  // Find the SCORM API in the window hierarchy
  private findAPI(win: Window): any {
    let attempts = 0;
    const maxAttempts = 500;
    let currentWindow: Window | null = win;
    while (currentWindow && attempts < maxAttempts) {
      attempts++;
      // Check for SCORM 1.2 API
      if ((currentWindow as any).API) {
        return (currentWindow as any).API;
      }
      // Check for SCORM 2004 API
      if ((currentWindow as any).API_1484_11) {
        return (currentWindow as any).API_1484_11;
      }
      // Move up to parent window
      if (currentWindow.parent && currentWindow.parent !== currentWindow) {
        currentWindow = currentWindow.parent;
      } else {
        break;
      }
    }
    return null;
  }
  // Detect SCORM version
  private detectVersion(): void {
    if (!this.lmsAPI) {
      this.version = null;
      return;
    }
    if (this.lmsAPI.LMSInitialize) {
      this.version = '1.2';
    } else if (this.lmsAPI.Initialize) {
      this.version = '2004';
    }
  }
  // Initialize the SCORM session
  initialize(): boolean {
    if (this.initialized) {
      return true;
    }
    if (!this.lmsAPI) {
      // Error logged
      return false;
    }
    try {
      const result =
        this.version === '1.2' ? this.lmsAPI.LMSInitialize('') : this.lmsAPI.Initialize('');
      this.initialized = result === 'true';
      if (this.initialized) {
        // `);
      } else {
        // Error logged
      }
      return this.initialized;
    } catch (error) {
      /* Error handled silently */
      // Error: $1
      return false;
    }
  }
  // Get a value from the LMS
  getValue(element: string): string {
    if (!this.initialized) {
      return '';
    }
    try {
      const value =
        this.version === '1.2' ? this.lmsAPI.LMSGetValue(element) : this.lmsAPI.GetValue(element);
      return value || '';
    } catch (error) {
      /* Error handled silently */
      // Error logged
      return '';
    }
  }
  // Set a value in the LMS
  setValue(element: string, value: string): boolean {
    if (!this.initialized) {
      return false;
    }
    try {
      const result =
        this.version === '1.2'
          ? this.lmsAPI.LMSSetValue(element, value)
          : this.lmsAPI.SetValue(element, value);
      return result === 'true';
    } catch (error) {
      /* Error handled silently */
      // Error logged
      return false;
    }
  }
  // Commit data to the LMS
  commit(): boolean {
    if (!this.initialized) {
      return false;
    }
    try {
      const result = this.version === '1.2' ? this.lmsAPI.LMSCommit('') : this.lmsAPI.Commit('');
      return result === 'true';
    } catch (error) {
      /* Error handled silently */
      // Error: $1
      return false;
    }
  }
  // Terminate the SCORM session
  terminate(): boolean {
    if (!this.initialized) {
      return false;
    }
    try {
      const result = this.version === '1.2' ? this.lmsAPI.LMSFinish('') : this.lmsAPI.Terminate('');
      this.initialized = false;
      if (result === 'true') {
        //
      }
      return result === 'true';
    } catch (error) {
      /* Error handled silently */
      // Error: $1
      return false;
    }
  }
  // Get last error code
  getLastError(): string {
    if (!this.lmsAPI) return '';
    try {
      return this.version === '1.2' ? this.lmsAPI.LMSGetLastError() : this.lmsAPI.GetLastError();
    } catch (error) {
      /* Error handled silently */
      return '';
    }
  }
  // Get error description
  getErrorString(errorCode: string): string {
    if (!this.lmsAPI) return '';
    try {
      return this.version === '1.2'
        ? this.lmsAPI.LMSGetErrorString(errorCode)
        : this.lmsAPI.GetErrorString(errorCode);
    } catch (error) {
      /* Error handled silently */
      return '';
    }
  }
  // Helper: Set lesson status
  setStatus(
    status: 'passed' | 'completed' | 'failed' | 'incomplete' | 'browsed' | 'not attempted',
  ): boolean {
    const element = this.version === '1.2' ? 'cmi.core.lesson_status' : 'cmi.completion_status';
    const value =
      this.version === '2004' && (status === 'passed' || status === 'failed')
        ? status === 'passed'
          ? 'completed'
          : 'incomplete'
        : status;
    const success = this.setValue(element, value);
    if (this.version === '2004' && (status === 'passed' || status === 'failed')) {
      this.setValue('cmi.success_status', status);
    }
    return success && this.commit();
  }
  // Helper: Set score
  setScore(score: number, min: number = 0, max: number = 100): boolean {
    const prefix = this.version === '1.2' ? 'cmi.core.score' : 'cmi.score';
    this.setValue(`${prefix}.raw`, score.toString());
    this.setValue(`${prefix}.min`, min.toString());
    this.setValue(`${prefix}.max`, max.toString());
    if (this.version === '2004') {
      const scaled = (score - min) / (max - min);
      this.setValue(`${prefix}.scaled`, scaled.toFixed(2));
    }
    return this.commit();
  }
  // Helper: Set progress/location
  setProgress(location: string): boolean {
    const element = this.version === '1.2' ? 'cmi.core.lesson_location' : 'cmi.location';
    return this.setValue(element, location) && this.commit();
  }
  // Helper: Get progress/location
  getProgress(): string {
    const element = this.version === '1.2' ? 'cmi.core.lesson_location' : 'cmi.location';
    return this.getValue(element);
  }
  // Helper: Set session time
  setSessionTime(seconds: number): boolean {
    const element = this.version === '1.2' ? 'cmi.core.session_time' : 'cmi.session_time';
    const timeString = this.formatTime(seconds);
    return this.setValue(element, timeString) && this.commit();
  }
  // Format time for SCORM
  private formatTime(seconds: number): string {
    if (this.version === '1.2') {
      // SCORM 1.2 format: HHHH:MM:SS.SS
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours.toString().padStart(4, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`;
    } else {
      // SCORM 2004 format: ISO 8601 duration (PT#H#M#S)
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `PT${hours}H${minutes}M${secs}S`;
    }
  }
  // Helper: Set suspend data (for saving progress)
  setSuspendData(data: string): boolean {
    const element = this.version === '1.2' ? 'cmi.suspend_data' : 'cmi.suspend_data';
    return this.setValue(element, data) && this.commit();
  }
  // Helper: Get suspend data
  getSuspendData(): string {
    const element = this.version === '1.2' ? 'cmi.suspend_data' : 'cmi.suspend_data';
    return this.getValue(element);
  }
  // Check if API is available
  isAvailable(): boolean {
    return this.lmsAPI !== null;
  }
  // Get SCORM version
  getVersion(): SCORMVersion | null {
    return this.version;
  }
  // Check if initialized
  isInitialized(): boolean {
    return this.initialized;
  }
}
// Singleton instance
let scormAPI: SCORMAPIWrapper | null = null;
export function getSCORMAPI(): SCORMAPIWrapper {
  if (!scormAPI) {
    scormAPI = new SCORMAPIWrapper();
  }
  return scormAPI;
}
// React hook for SCORM
export function useSCORM() {
  const scorm = getSCORMAPI();
  return {
    initialize: () => scorm.initialize(),
    terminate: () => scorm.terminate(),
    setStatus: (status: Parameters<typeof scorm.setStatus>[0]) => scorm.setStatus(status),
    setScore: (score: number, min?: number, max?: number) => scorm.setScore(score, min, max),
    setProgress: (location: string) => scorm.setProgress(location),
    getProgress: () => scorm.getProgress(),
    setSessionTime: (seconds: number) => scorm.setSessionTime(seconds),
    setSuspendData: (data: string) => scorm.setSuspendData(data),
    getSuspendData: () => scorm.getSuspendData(),
    isAvailable: () => scorm.isAvailable(),
    isInitialized: () => scorm.isInitialized(),
    getVersion: () => scorm.getVersion(),
  };
}
