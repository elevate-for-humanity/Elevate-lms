import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute = promisify(execFile);

// Technical evidence only. This never establishes instructional acceptance.
export async function inspectCourseMedia(file, run = execute) {
  const {stdout} = await run('ffprobe', ['-v','error','-show_format','-show_streams','-of','json',file],
    {timeout:60000,maxBuffer:1024*1024});
  const data=JSON.parse(stdout);
  const durationSeconds=Number(data.format?.duration);
  const video=(data.streams??[]).filter(s=>s.codec_type==='video');
  const audio=(data.streams??[]).filter(s=>s.codec_type==='audio');
  const result={container:data.format?.format_name,durationSeconds,
    video:video.map(s=>({codec:s.codec_name,width:s.width,height:s.height})),
    audio:audio.map(s=>({codec:s.codec_name,channels:s.channels,sampleRate:s.sample_rate})),
    decodePassed:false,mediaAcceptanceVerified:false};
  if(!Number.isFinite(durationSeconds)||durationSeconds<=0||!video.length||!audio.length) return result;
  await run('ffmpeg',['-hide_banner','-v','error','-xerror','-i',file,'-map','0:v:0','-map','0:a:0','-f','null','-'],
    {timeout:180000,maxBuffer:1024*1024});
  result.decodePassed=true;
  return result;
}
