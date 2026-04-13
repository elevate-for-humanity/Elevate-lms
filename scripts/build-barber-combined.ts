import fs from "fs";
import path from "path";
import { execSync } from "child_process";

type Segment = {
  source: string;
  start: number;
  end: number;
  label: string;
};

type Manifest = {
  output: string;
  audioSource: {
    file: string;
  };
  segments: Segment[];
};

const ROOT = "/workspaces/Elevate-lms";

function abs(p: string) {
  return path.isAbsolute(p) ? p : path.join(ROOT, p);
}

function run(cmd: string) {
  console.log(`\n$ ${cmd}\n`);
  execSync(cmd, { stdio: "inherit" });
}

function ffprobeDuration(file: string): number {
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`;
  const out = execSync(cmd).toString().trim();
  return Number(out);
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir: string) {
  ensureDir(dir);
  for (const name of fs.readdirSync(dir)) {
    fs.rmSync(path.join(dir, name), { recursive: true, force: true });
  }
}

function validateManifest(manifest: Manifest) {
  if (!manifest.segments.length) {
    throw new Error("Manifest has no segments.");
  }

  for (const [i, seg] of manifest.segments.entries()) {
    if (!fs.existsSync(abs(seg.source))) {
      throw new Error(`Segment ${i} source missing: ${seg.source}`);
    }
    if (seg.end <= seg.start) {
      throw new Error(`Segment ${i} has invalid times: start=${seg.start}, end=${seg.end}`);
    }

    const allowed = new Set(["scenic keeper", "instructional keeper"]);
    if (!allowed.has(seg.label)) {
      throw new Error(`Segment ${i} rejected. Invalid keeper label: ${seg.label}`);
    }

    const dur = ffprobeDuration(abs(seg.source));
    if (seg.start < 0 || seg.end > dur) {
      throw new Error(
        `Segment ${i} exceeds source duration. source=${seg.source} duration=${dur} start=${seg.start} end=${seg.end}`
      );
    }
  }

  if (!fs.existsSync(abs(manifest.audioSource.file))) {
    throw new Error(`Audio source missing: ${manifest.audioSource.file}`);
  }
}

function build() {
  const manifestPath = abs("public/videos/barber-lessons/manifests/barber-combined-manifest.json");
  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  validateManifest(manifest);

  const tmpDir = abs("public/videos/barber-lessons/tmp/barber-combined");
  cleanDir(tmpDir);

  const listFile = path.join(tmpDir, "concat.txt");
  const segmentFiles: string[] = [];

  manifest.segments.forEach((seg, i) => {
    const outFile = path.join(tmpDir, `seg-${String(i + 1).padStart(3, "0")}.mp4`);
    const duration = seg.end - seg.start;

    const cmd = [
      `ffmpeg -y`,
      `-ss ${seg.start}`,
      `-i "${abs(seg.source)}"`,
      `-t ${duration}`,
      `-vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p"`,
      `-af "aresample=44100"`,
      `-c:v libx264 -preset ultrafast -crf 20`,
      `-c:a aac -b:a 192k -ar 44100 -ac 2`,
      `"${outFile}"`
    ].join(" ");

    run(cmd);
    segmentFiles.push(outFile);
  });

  fs.writeFileSync(
    listFile,
    segmentFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n")
  );

  const stitchedVideo = path.join(tmpDir, "stitched-video.mp4");
  run(
    `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c:v libx264 -preset ultrafast -crf 20 -c:a aac -b:a 192k "${stitchedVideo}"`
  );

  const stitchedDuration = ffprobeDuration(stitchedVideo);

  const narrationFile = abs(manifest.audioSource.file);
  const outputFile = abs(manifest.output);
  ensureDir(path.dirname(outputFile));

  run(
    [
      `ffmpeg -y`,
      `-i "${stitchedVideo}"`,
      `-i "${narrationFile}"`,
      `-map 0:v:0`,
      `-map 1:a:0`,
      `-t ${stitchedDuration}`,
      `-c:v copy`,
      `-c:a aac -b:a 192k -ar 44100 -ac 2`,
      `-movflags +faststart`,
      `"${outputFile}"`
    ].join(" ")
  );

  const finalDuration = ffprobeDuration(outputFile);
  console.log(`\nBuild complete.`);
  console.log(`Output: ${outputFile}`);
  console.log(`Duration: ${finalDuration.toFixed(2)} seconds`);
}

build();
