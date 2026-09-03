// Production compatibility entrypoint for the Admin-owned video renderer.
// Keep the canonical Remotion project at the repository root; this shim exists
// so packaged Admin runtimes that execute with process.cwd() === apps/admin can
// resolve the same composition tree without maintaining a duplicate renderer.
import '../../../remotion-src/index';
