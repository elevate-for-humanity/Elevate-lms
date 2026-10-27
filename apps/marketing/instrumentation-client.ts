import { installBrowserRuntimePolyfills } from '@/lib/browser/runtime-polyfills';

installBrowserRuntimePolyfills();

export { onRouterTransitionStart } from '../../instrumentation-client';
