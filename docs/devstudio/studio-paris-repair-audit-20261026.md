# Studio container and PARIS repair audit — October 26, 2026

Source baseline: `1470ff43ea3f2c122142f53b33b65219a85cb14b`.

## Status

Five confirmed source defects repaired and regression tested. This is an evidence-backed repair pass, not certification that every Studio/PARIS line or deployed capability is error-free. No production deployment, traffic change, database mutation, email, phone call, or course replay was performed.

## Findings

| Finding | Root cause | Correction | Regression evidence |
| --- | --- | --- | --- |
| A terminal closed during resume can still start a shell | Resume awaits persistence/directory lookup and then unconditionally spawns | Recheck session state before spawn; preserve closed state on errors; interrupt starting sessions at shutdown | Before: replacement spawn reached; after: no spawn, 409 closed state survives encrypted restore |
| Silence can be treated as another PARIS utterance after a reply | Voice turn cleared frames and quiet count but retained heard=true | Clear heard when consuming an utterance | Before: heard remains true; after: reset before adapter request and remains false after reply |
| Repository sync certifies a different restored repository | Existing checkouts ignored requested repoUrl and always used origin | Check origin matches requested repository before network/update operations; leave mismatched checkout unchanged | Before: unexpected success; after: repository_origin_mismatch and unchanged files/HEAD |
| Studio health rejects valid installation credentials | Canonical health probed the user-only /user API | Probe the exact Elevate-lms main ref, forbid redirects, disable cache | Before: simulated App repository access incorrectly unhealthy; after: repository access accepted, 403 rejected |
| Credential failures crash Studio health | getGitHubToken rejection escaped the health route | Return explicit github_authentication_unavailable and false prerequisites without leaking raw error | Before: thrown fixture credential error; after: unhealthy capability response, no leaked value |

## Validation

- Full browser/container Node suite plus PBX tests and the first two health regressions: **154 passed, 3 skipped** (157 total). Skips require STUDIO_BROWSER_EXECUTABLE_PATH/real Chromium, absent here.
- Final CI command for credential/App authentication, health, terminal, repository and all PBX tests: **89 passed, 0 failed**. Includes the third health regression added after the wider pass.
- PARIS/Studio/deployment-control Node suites: **148 passed, 0 failed**.
- Final focused Vitest: Studio surface contract, run reconciliation, text streaming and runtime availability: **45 passed in 4 files**.
- Syntax checks for modified .mjs production files passed. git diff --check passed.
- Targeted production lint passed with no output. The test source is ignored by the repository lint configuration (warning, not a test result).
- Broad Vitest attempts did not complete; interrupted. An earlier stale source assertion expected /user; updated to require the exact repository API and redirect rejection, then rechecked in the final 45-test pass. Do not count the interrupted broad run as passed.
- Studio TypeScript was attempted through scripts/run-bounded-build.mjs but could not acquire the shared validation lock held by a separate Marketing build. Interrupted the waiting audit command without disturbing that build. No completed Studio typecheck result.
- Full Marketing/Admin/LMS builds and Docker image build were not completed for this repair head. Docker/Chromium executables and a direct authenticated Google runtime session were unavailable in this audit environment.

## Current upstream release evidence (baseline only)

GitHub main CI Required Gate and CI Preflight failed at run 40438117944. The downloaded preflight log identifies two teaching-photos.test.ts regressions: generated.bytes on undefined and a replacement-required error/diagnostic expectation mismatch. These precede this audit and belong to the concurrent storage-first course-media change. This repair does not revert that policy or change those tests. Successful image builds and supervision on main do not verify this repair head or deployed PARIS behavior.

Deployment state in the sampled check list: Admin deployment in progress, LMS/Marketing pending. Not proof of a ready new revision. Studio terminal/browser, real voice audio/transfers, conversation restore, repair execution and live runtime SHA still require acceptance against the deployed repair revision.

## Scope reviewed

Inspected container Dockerfile/startup, browser service workspace and terminal routes, repository sync and checkpoint integration, terminal persistence/lifecycle, browser storage and process transport, PARIS ARI/media turn processing and voice adapter, GitHub credential resolution/App tokens, canonical Studio health, Studio run reconciliation, engineering staging/control paths, and CI/deployment verification definitions. Review/testing depth varies by surface. The uncompleted full-suite and runtime checks above remain open; this report does not assert exhaustive coverage of all Studio/PARIS modules.

## Exact production-source comparisons

Each block compares numbered baseline lines (left) with repair lines (right). Added/changed source and comments are intentional corrections described above. Unchanged context is retained.

### services/studio-browser/terminal-sessions.mjs

```text
 104     if(s.startingPromise)return s.startingPromise;							     |	 104     if(s.state==='closed')throw new TerminalSessionError('terminal_session_closed',409);
 105     if(s.state==='running'&&s.shell)return s;							     |	 105     if(s.startingPromise)return s.startingPromise;
 106     if(this.activeCount()>=this.maxActive)throw new TerminalSessionError('terminal_capacity_reached',42 |	 106     if(s.state==='running'&&s.shell)return s;
 107     s.state='starting';s.exitCode=null;s.version++;						     |	 107     if(this.activeCount()>=this.maxActive)throw new TerminalSessionError('terminal_capacity_reached',42
 108     s.startingPromise=(async()=>{									     |	 108     s.state='starting';s.exitCode=null;s.version++;
 109       await this.flush(s);										     |	 109     s.startingPromise=(async()=>{
 110       const cwd=await fs.realpath(s.cwd).catch(()=>{throw new TerminalSessionError('terminal_directory_ |	 110       await this.flush(s);
 111       if(cwd!==this.cwd&&!cwd.startsWith(this.cwd+path.sep))throw new TerminalSessionError('terminal_di |	 111       const cwd=await fs.realpath(s.cwd).catch(()=>{throw new TerminalSessionError('terminal_directory_
 112       const shell=this.spawnShell('/bin/bash',['--noprofile','--norc'],{cwd,env:{...process.env,HOME:'/ |	 112       if(cwd!==this.cwd&&!cwd.startsWith(this.cwd+path.sep))throw new TerminalSessionError('terminal_di
 113       s.shell=shell;s.state='running';s.version++;							     |	 113       // Stop/shutdown can run while persistence or directory resolution awaits.
 114       let directoryBytes='';									     |	 114       // Recheck immediately before spawning so a closed terminal stays closed.
 115       shell.stdio?.[3]?.on('data',chunk=>{								     |	 115       if(s.state!=='starting')throw new TerminalSessionError(s.state==='closed'?'terminal_session_close
 116         directoryBytes+=chunk.toString('utf8');							     |	 116       const shell=this.spawnShell('/bin/bash',['--noprofile','--norc'],{cwd,env:{...process.env,HOME:'/
 117         if(directoryBytes.length>8192){directoryBytes='';return;}					     |	 117       s.shell=shell;s.state='running';s.version++;
 118         let end;											     |	 118       let directoryBytes='';
 119         while((end=directoryBytes.indexOf('\0'))>=0){						     |	 119       shell.stdio?.[3]?.on('data',chunk=>{
 120           const next=directoryBytes.slice(0,end);directoryBytes=directoryBytes.slice(end+1);	     |	 120         directoryBytes+=chunk.toString('utf8');
 121           if(path.resolve(next)===next&&(next===this.cwd||next.startsWith(this.cwd+path.sep))&&next!==s |	 121         if(directoryBytes.length>8192){directoryBytes='';return;}
 122         }												     |	 122         let end;
 123       });												     |	 123         while((end=directoryBytes.indexOf('\0'))>=0){
 124       shell.stdout.on('data',chunk=>this.record(s,'stdout',chunk.toString('utf8')));		     |	 124           const next=directoryBytes.slice(0,end);directoryBytes=directoryBytes.slice(end+1);
 125       shell.stderr.on('data',chunk=>this.record(s,'stderr',chunk.toString('utf8')));		     |	 125           if(path.resolve(next)===next&&(next===this.cwd||next.startsWith(this.cwd+path.sep))&&next!==s
 126       shell.on('error',()=>{if(s.shell!==shell)return;s.shell=null;s.state='exited';s.exitCode=127;this |	 126         }
 127       shell.on('close',code=>{if(s.shell!==shell)return;s.shell=null;if(!['closed','interrupted'].inclu |	 127       });
 128       await this.flush(s);return s;								     |	 128       shell.stdout.on('data',chunk=>this.record(s,'stdout',chunk.toString('utf8')));
 129     })().finally(()=>{s.startingPromise=null;});							     |	 129       shell.stderr.on('data',chunk=>this.record(s,'stderr',chunk.toString('utf8')));
 130     try{return await s.startingPromise;}catch(error){if(s.shell){s.state='interrupted';s.shell.kill('SI |	 130       shell.on('error',()=>{if(s.shell!==shell)return;s.shell=null;s.state='exited';s.exitCode=127;this
 131   }												     |	 131       shell.on('close',code=>{if(s.shell!==shell)return;s.shell=null;if(!['closed','interrupted'].inclu
 132   async create(owner){										     |	 132       await this.flush(s);return s;
 133     if(!validOwner(owner))throw new TerminalSessionError('terminal_owner_required',400);		     |	 133     })().finally(()=>{s.startingPromise=null;});
 134     const s={id:crypto.randomUUID(),owner,cwd:this.cwd,output:[],cursor:0,bytes:0,exitCode:null,state:' |	 134     try{return await s.startingPromise;}catch(error){if(s.state!=='closed'){s.state='interrupted';s.ver
 135     this.pruneCache();this.sessions.set(s.id,s);							     |	 135   }
 136     try{await this.start(s);return {id:s.id,cwd:s.cwd,state:s.state,persistent:Boolean(this.directory)} |	 136   async create(owner){
 137   }												     |	 137     if(!validOwner(owner))throw new TerminalSessionError('terminal_owner_required',400);
 138   async output(owner,id,after=0){									     |	 138     const s={id:crypto.randomUUID(),owner,cwd:this.cwd,output:[],cursor:0,bytes:0,exitCode:null,state:'
 139     const s=await this.get(owner,id);await this.flush(s);						     |	 139     this.pruneCache();this.sessions.set(s.id,s);
 140     return {id:s.id,output:s.output.filter(x=>x.seq>after),cursor:s.cursor,exitCode:s.exitCode,state:s. |	 140     try{await this.start(s);return {id:s.id,cwd:s.cwd,state:s.state,persistent:Boolean(this.directory)}
 142   async input(owner,id,data){const s=await this.get(owner,id);if(s.state!=='running'||!s.shell)throw ne |	 142   async output(owner,id,after=0){
 143   async resume(owner,id){const s=await this.get(owner,id);if(s.state==='closed')throw new TerminalSessi |	 143     const s=await this.get(owner,id);await this.flush(s);
 144   async stop(owner,id){const s=await this.get(owner,id);s.state='closed';s.exitCode=s.exitCode??0;s.ver |	 144     return {id:s.id,output:s.output.filter(x=>x.seq>after),cursor:s.cursor,exitCode:s.exitCode,state:s.
 145   async shutdown(){										     |	 145   }
 146     for(const s of this.sessions.values()){clearTimeout(s.timer);s.timer=null;if(s.shell){s.state='inte |	 146   async input(owner,id,data){const s=await this.get(owner,id);if(s.state!=='running'||!s.shell)throw ne
 147     await Promise.all([...this.sessions.values()].map(s=>this.flush(s)));				     |	 147   async resume(owner,id){const s=await this.get(owner,id);if(s.state==='closed')throw new TerminalSessi
 148   }												     |	 148   async stop(owner,id){const s=await this.get(owner,id);s.state='closed';s.exitCode=s.exitCode??0;s.ver
 149 }													     |	 149   async shutdown(){
													     >	 150     for(const s of this.sessions.values()){clearTimeout(s.timer);s.timer=null;if(s.shell||s.state==='st
													     >	 151     await Promise.all([...this.sessions.values()].map(s=>this.flush(s)));
													     >	 152   }
													     >	 153 }
```

### services/studio-browser/repository-sync.mjs

```text
  20     // An unchanged remote is a read-only operation. Rewriting Git config and			     |	  20     // A restored workspace may belong to another project. Never certify or
  21     // FETCH_HEAD on every reconnect forces a full durable workspace upload.			     |	  21     // update that checkout as the requested repository, or rewrite its remote.
  22     const { stdout: advertised } = await run(['ls-remote', '--exit-code', '--heads', 'origin', 'refs/he |	  22     const { stdout: origin } = await run(['remote', 'get-url', 'origin']);
  23     const [remoteSha, remoteRef] = advertised.trim().split(/\s+/);					     |	  23     if (origin.trim() !== repoUrl) throw new Error('repository_origin_mismatch');
  24     const localSha = await run(['rev-parse', '--verify', 'HEAD']).then(result => result.stdout.trim(),  |	  24     // An unchanged remote is a read-only operation. Rewriting Git config and
  25     const localBranch = await run(['symbolic-ref', '--quiet', '--short', 'HEAD']).then(result => result |	  25     // FETCH_HEAD on every reconnect forces a full durable workspace upload.
  26     if (/^[a-f0-9]{40,64}$/.test(remoteSha || '') && remoteRef === 'refs/heads/' + branch &&	     |	  26     const { stdout: advertised } = await run(['ls-remote', '--exit-code', '--heads', 'origin', 'refs/he
  27         localSha === remoteSha && localBranch === branch)						     |	  27     const [remoteSha, remoteRef] = advertised.trim().split(/\s+/);
  28       return { ok: true, branch, sha: remoteSha, changed: false };					     |	  28     const localSha = await run(['rev-parse', '--verify', 'HEAD']).then(result => result.stdout.trim(), 
  29     const configure = async (key, value) => {							     |	  29     const localBranch = await run(['symbolic-ref', '--quiet', '--short', 'HEAD']).then(result => result
  30       let current;											     |	  30     if (/^[a-f0-9]{40,64}$/.test(remoteSha || '') && remoteRef === 'refs/heads/' + branch &&
  31       try { current = (await run(['config', '--get', key])).stdout.trim(); }			     |	  31         localSha === remoteSha && localBranch === branch)
  32       catch (error) { if (error.code !== 1) throw error; }						     |	  32       return { ok: true, branch, sha: remoteSha, changed: false };
  33       if (current !== value) await run(['config', key, value]);					     |	  33     const configure = async (key, value) => {
  34     };												     |	  34       let current;
  35     // Mark the existing remote as a partial clone so checkout lazily retrieves			     |	  35       try { current = (await run(['config', '--get', key])).stdout.trim(); }
  36     // only required blobs. Never fetch a full history of retired video assets.			     |	  36       catch (error) { if (error.code !== 1) throw error; }
  37     await configure('remote.origin.promisor', 'true');						     |	  37       if (current !== value) await run(['config', key, value]);
  38     await configure('remote.origin.partialclonefilter', 'blob:none');				     |	  38     };
  39     await run(['fetch', '--filter=blob:none', '--no-tags', 'origin', branch, '--prune']);		     |	  39     // Mark the existing remote as a partial clone so checkout lazily retrieves
  40     await run(['checkout', branch]);								     |	  40     // only required blobs. Never fetch a full history of retired video assets.
  41     // Merge exactly the fetched revision. A second pull would fetch it again			     |	  41     await configure('remote.origin.promisor', 'true');
  42     // without the blob filter. Fast-forward checks preserve divergent work.			     |	  42     await configure('remote.origin.partialclonefilter', 'blob:none');
  43     await run(['merge', '--ff-only', 'FETCH_HEAD']);						     |	  43     await run(['fetch', '--filter=blob:none', '--no-tags', 'origin', branch, '--prune']);
  44   }												     |	  44     await run(['checkout', branch]);
  45   const { stdout } = await run(['rev-parse', 'HEAD']);						     |	  45     // Merge exactly the fetched revision. A second pull would fetch it again
  46   return { ok: true, branch, sha: stdout.trim(), changed: true };					     |	  46     // without the blob filter. Fast-forward checks preserve divergent work.
  47 }													     |	  47     await run(['merge', '--ff-only', 'FETCH_HEAD']);
													     >	  48   }
													     >	  49   const { stdout } = await run(['rev-parse', 'HEAD']);
													     >	  50   return { ok: true, branch, sha: stdout.trim(), changed: true };
													     >	  51 }
```

### infra/pbx/paris/ari-media.mjs

```text
 175 async function turn(session){									     |	 175 export async function turn(session,{request=privateTurn,play=speak,finish=end}={}){
 177   const voice=Buffer.concat(session.frames);session.frames=[];session.quiet=0;			     |	 177   const voice=Buffer.concat(session.frames);session.frames=[];session.quiet=0;session.heard=false;
 181     const body=await privateTurn(config.adapter,{callId:session.callId,sessionId:session.id,sequence:se |	 181     const body=await request(config.adapter,{callId:session.callId,sessionId:session.id,sequence:sessio
 184     await speak(session,body.replyAudioUlawBase64);						     |	 184     await play(session,body.replyAudioUlawBase64);
 191       await end(session);										     |	 191       await finish(session);
 192     } else if(body.endCall===true) await end(session,'hangup');					     |	 192     } else if(body.endCall===true) await finish(session,'hangup');
 197     await end(session,'continue');									     |	 197     await finish(session,'continue');
```

### lib/devstudio/health-handler.ts

```text
  36   const githubToken = await getGitHubToken();							     |	  36   let githubAuthError: string | null = null;
  37   const hasGitHub = Boolean(githubToken);								     |	  37   const githubToken = await getGitHubToken().catch(() => {
  38   let githubTokenValid = false;									     |	  38     githubAuthError = 'github_authentication_unavailable';
  39   if (githubToken) {										     |	  39     return null;
  40     try {												     |	  40   });
  41       const response = await fetch('https://api.github.com/user', {				     |	  41   const hasGitHub = Boolean(githubToken);
  42         headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json' },     |	  42   let githubTokenValid = false;
  43         cache: 'no-store',										     |	  43   if (githubToken) {
  44         signal: AbortSignal.timeout(5000),								     |	  44     try {
  45       });												     |	  45       // Installation credentials represent an App, not a user. Probe the
  46       githubTokenValid = response.ok;								     |	  46       // repository PARIS actually needs rather than the user-only endpoint.
  47     } catch {											     |	  47       const response = await fetch('https://api.github.com/repos/elevate-for-humanity/Elevate-lms/git/r
  48       githubTokenValid = false;									     |	  48         headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json' },
  49     }												     |	  49         redirect: 'error',
  50   }												     |	  50         cache: 'no-store',
  51   const activeProvider = ai.activeProvider;							     |	  51         signal: AbortSignal.timeout(5000),
  52   const hasElevate = ai.elevate;									     |	  52       });
  53   const aiConfigured = ai.anyConfigured;								     |	  53       githubTokenValid = response.ok;
  54   // Configuration alone does not establish successful browser or workflow execution.		     |	  54     } catch {
  55   const executionPrerequisitesReady = githubTokenValid && isGoogleRuntimeReady() &&		     |	  55       githubTokenValid = false;
  56     Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&			     |	  56     }
  57     Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) && hasElevate;					     |	  57   }
  58   let nextVersion = 'unknown';									     |	  58   const activeProvider = ai.activeProvider;
  59   try {												     |	  59   const hasElevate = ai.elevate;
  60     nextVersion = require('next/package.json').version;						     |	  60   const aiConfigured = ai.anyConfigured;
  61   } catch {											     |	  61   // Configuration alone does not establish successful browser or workflow execution.
  62     nextVersion = 'unknown';									     |	  62   const executionPrerequisitesReady = githubTokenValid && isGoogleRuntimeReady() &&
  63   }												     |	  63     Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
  64 													     |	  64     Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) && hasElevate;
  65   return NextResponse.json({									     |	  65   let nextVersion = 'unknown';
  66     hasGroq,											     |	  66   try {
  67     hasXAI,											     |	  67     nextVersion = require('next/package.json').version;
  68     hasGemini,											     |	  68   } catch {
  69     hasOpenAI,											     |	  69     nextVersion = 'unknown';
  70     hasAnthropic,											     |	  70   }
  71     hasElevate,											     |	  71 
  72     ownedModel: 'ownedModel' in ai ? ai.ownedModel : { configured: false, verified: false, status: 'una |	  72   return NextResponse.json({
  73     hasCloudflare,											     |	  73     hasGroq,
  74     cloudflare: cloudflareProbe,									     |	  74     hasXAI,
  75     activeProvider,										     |	  75     hasGemini,
  76     hasGitHub,											     |	  76     hasOpenAI,
  77     githubTokenValid,										     |	  77     hasAnthropic,
  78     aiConfigured,											     |	  78     hasElevate,
  79     supabaseUrlPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),	     |	  79     ownedModel: 'ownedModel' in ai ? ai.ownedModel : { configured: false, verified: false, status: 'una
  80     supabaseServiceKeyPresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),			     |	  80     hasCloudflare,
  81     nodeVersion: process.version,									     |	  81     cloudflare: cloudflareProbe,
  82     nextVersion,											     |	  82     activeProvider,
  83     availableProviders: {										     |	  83     hasGitHub,
  84       elevate: hasElevate,										     |	  84     githubTokenValid,
  85       cloudflare: hasCloudflare,									     |	  85     githubAuthError,
  86       groq: hasGroq,										     |	  86     aiConfigured,
  87       xai: hasXAI,											     |	  87     supabaseUrlPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
  88       gemini: hasGemini,										     |	  88     supabaseServiceKeyPresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  89       openai: hasOpenAI,										     |	  89     nodeVersion: process.version,
  90       anthropic: hasAnthropic,									     |	  90     nextVersion,
  91     },												     |	  91     availableProviders: {
  92     git: {												     |	  92       elevate: hasElevate,
  93       endpoint: '/api/admin/dev-studio/git',							     |	  93       cloudflare: hasCloudflare,
  94       remoteUrlPresent: Boolean(process.env.GITHUB_REMOTE_URL || process.env.GITHUB_REPO),		     |	  94       groq: hasGroq,
  95       tokenPresent: hasGitHub,									     |	  95       xai: hasXAI,
  96       tokenValid: githubTokenValid,								     |	  96       gemini: hasGemini,
  97       pushScript: 'pnpm run git:push-main',							     |	  97       openai: hasOpenAI,
  98     },												     |	  98       anthropic: hasAnthropic,
  99     execution: {											     |	  99     },
 100       mode: 'master-studio',									     |	 100     git: {
 101       ready: executionPrerequisitesReady,								     |	 101       endpoint: '/api/admin/dev-studio/git',
 102       verifiedEndToEnd: false,									     |	 102       remoteUrlPresent: Boolean(process.env.GITHUB_REMOTE_URL || process.env.GITHUB_REPO),
 103       status: executionPrerequisitesReady ? 'prerequisites-configured-not-tested' : 'missing-prerequisi |	 103       tokenPresent: hasGitHub,
 104       repositoryWritesReady: githubTokenValid,							     |	 104       tokenValid: githubTokenValid,
 105       legacyShellRemoved: true,									     |	 105       pushScript: 'pnpm run git:push-main',
 107     google: {											     |	 107     execution: {
 108       provider: 'google-cloud', ready: isGoogleRuntimeReady(), project: googleProjectId(),		     |	 108       mode: 'master-studio',
 109       deploymentDispatchReady: githubTokenValid,							     |	 109       ready: executionPrerequisitesReady,
 110       services: getGoogleServices().map(({ key, id }) => ({ key, id })),				     |	 110       verifiedEndToEnd: false,
 111     },												     |	 111       status: executionPrerequisitesReady ? 'prerequisites-configured-not-tested' : 'missing-prerequisi
 112     runtime: 'nodejs',										     |	 112       repositoryWritesReady: githubTokenValid,
 113     service: 'admin',										     |	 113       legacyShellRemoved: true,
 114     nodeEnv: process.env.NODE_ENV ?? 'unknown',							     |	 114     },
 115   });												     |	 115     google: {
 116 }													     |	 116       provider: 'google-cloud', ready: isGoogleRuntimeReady(), project: googleProjectId(),
													     >	 117       deploymentDispatchReady: githubTokenValid,
													     >	 118       services: getGoogleServices().map(({ key, id }) => ({ key, id })),
													     >	 119     },
													     >	 120     runtime: 'nodejs',
													     >	 121     service: 'admin',
													     >	 122     nodeEnv: process.env.NODE_ENV ?? 'unknown',
													     >	 123   });
													     >	 124 }
```
