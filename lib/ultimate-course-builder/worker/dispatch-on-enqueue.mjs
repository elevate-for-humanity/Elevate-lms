// Request the existing trusted GitHub course dispatcher immediately after an
// eligible job is durably queued. Scheduled dispatch remains the fallback.
// Never give a web client the token or call Google Cloud with user credentials.
export async function requestCourseDispatch({env=process.env, request=fetch}={}) {
  const token=env.COURSE_DISPATCH_GITHUB_TOKEN;
  if (!token) return {requested:false,reason:'token_not_configured'};
  if (env.COURSE_DISPATCH_DISABLED==='true') return {requested:false,reason:'disabled'};
  const response=await request(
    'https://api.github.com/repos/elevate-for-humanity/Elevate-lms/actions/workflows/dispatch-google-course-job.yml/dispatches',
    {method:'POST',headers:{Authorization:'Bearer '+token,
      Accept:'application/vnd.github+json','Content-Type':'application/json',
      'X-GitHub-Api-Version':'2022-11-28'},
     body:JSON.stringify({ref:'main'}),signal:AbortSignal.timeout(8000)});
  if(response.status!==204) throw Error('COURSE_DISPATCH_REQUEST_HTTP_'+response.status);
  return {requested:true};
}
export async function notifyCourseDispatcher(input) {
  try { return await requestCourseDispatch(input); }
  catch (error) {
    // The durable queued row is not rolled back: the 5-minute recovery
    // workflow can still dispatch it. No secret or sensitive response body logged.
    console.error('COURSE_DISPATCH_WAKEUP_FAILED',error instanceof Error?error.message:'unknown');
    return {requested:false,reason:'request_failed'};
  }
}
