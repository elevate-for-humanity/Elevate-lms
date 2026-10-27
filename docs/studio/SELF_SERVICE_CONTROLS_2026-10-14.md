# Studio and Course Builder self-service

Open Admin → Studio → Repository Workspace.

- Editor + Preview reads the existing Studio container checkout, including untracked files. GitHub API failures no longer become an empty success response.
- Select a file to edit it. Save in container stores the current buffer in the workspace without publishing it.
- Runtime + Terminal uses that same checkout. Folder buttons expand and collapse. Reconnect terminal starts another terminal after a stopped or disconnected session.
- Commit is a separate production source action. In the runtime editor, type CONFIRM PUSH to commit to main. File SHA checks and the server confirmation still apply.
- HTML/SVG preview renders the editor buffer immediately. Next.js page preview displays the deployed route; unsaved changes do not appear there. A successful production build and deployment are required for those source changes.
- A runtime connection is not evidence that a model is running. PARIS uses the shared configured AI gateway, with the same existing spending authorization as Studio chat. A missing owned model must not silently be treated as a working self-hosted model. Hosting and model inference can still have costs.

Course Builder: select a course, then a lesson, then one of its 20 checkpoint buttons. Diagnose checkpoint & preview reads saved evidence. Fix this checkpoint saves a targeted request; during active work it waits for a checkpoint boundary and preserves the current render. An explicit render repair gets a new render revision so previously rejected encoded segments are not reused. Resuming the same repair preserves its render revision and encoded progress. Media QA remains mandatory.

Live checks performed before this source update: a real Studio terminal `pwd` returned `/workspace/project`; a saved learning-objectives diagnostic reported passed; a future learner-runthrough repair returned the durable deferred-repair acknowledgement while the worker continued. Source tests cover container files, confirmation delivery, inference-budget denial, render revision isolation, and lease-preserving checkpoint repairs. Do not interpret this document as proof that a pending deployment or course has finished.
