// Stub for @sentry/nextjs when package not installed
export const init = () => {};
export const captureException = (err: Error) => console.error('[Sentry Stub]', err);
export const captureMessage = (msg: string) => console.log('[Sentry Stub]', msg);
export const addBreadcrumb = () => {};
export const setUser = () => {};
export const setContext = () => {};
export const startSpan = () => ({ finish: () => {} });
export const startTransaction = () => ({ finish: () => {} });
export const withScope = (cb: (scope: unknown) => void) => cb({});
export const configureScope = () => {};
export const withSentryConfig = (config: unknown) => config;
export default {
  init,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setContext,
  startSpan,
  startTransaction,
  withScope,
  configureScope,
};