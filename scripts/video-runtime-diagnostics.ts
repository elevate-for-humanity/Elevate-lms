import { videoRuntimeDiagnostics } from '../lib/video/ffmpeg-runtime';

try {
  const diagnostics = videoRuntimeDiagnostics();
  console.log(JSON.stringify({ ok: true, ...diagnostics }, null, 2));
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
}
