// Explicit metadata projection only. Never serialize a runtime environment.
const endpointKeys = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL', 'STUDIO_BROWSER_URL', 'STUDIO_BROWSER_PUBLIC_URL', 'ULTIMATE_LEARNER_RUNTHROUGH_URL'];
export function runtimeBoundary(revision) {
  const spec = revision.spec || {};
  const annotations = revision.metadata?.annotations || {};
  const containers = spec.containers || [];
  return {
    revision: revision.metadata?.name,
    serviceAccount: spec.serviceAccountName,
    ready: revision.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True',
    minInstances: annotations['autoscaling.knative.dev/minScale'] ?? '0',
    maxInstances: annotations['autoscaling.knative.dev/maxScale'] ?? null,
    containers: containers.map(container => {
      const entries = container.env || [];
      return {
        image: container.image,
        limits: container.resources?.limits,
        startupProbe: container.startupProbe?.httpGet?.path ?? null,
        livenessProbe: container.livenessProbe?.httpGet?.path ?? null,
        environmentKeys: entries.map(e => e.name),
        secretReferences: entries.filter(e => e.valueFrom?.secretKeyRef).map(e => ({
          variable: e.name, secret: e.valueFrom.secretKeyRef.name, version: e.valueFrom.secretKeyRef.key,
        })),
        endpoints: entries.filter(e => endpointKeys.includes(e.name)).map(e => {
          let host = null;
          try { const url = new URL(e.value); if (url.protocol === 'https:') host = url.hostname; } catch {}
          return { variable: e.name, host, secretReference: Boolean(e.valueFrom?.secretKeyRef) };
        }),
        mounts: (container.volumeMounts || []).map(m => ({name:m.name,path:m.mountPath})),
      };
    }),
    volumes: (spec.volumes || []).map(v => ({name:v.name,cloudStorage:v.csi?.driver === 'gcsfuse.run.googleapis.com',ephemeral:Boolean(v.emptyDir)})),
    // A mounted auth directory alone does not establish session restoration.
    sessionRestorationVerified: false,
  };
}
