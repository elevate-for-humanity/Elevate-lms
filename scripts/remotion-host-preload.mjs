// Opt-in preload for local CLI rendering; production installs the same
// compatibility boundary from remotion-render.ts before creating its server.
import {installRemotionHostCompatibility} from '../lib/video/remotion-host-compat.mjs';
installRemotionHostCompatibility();
