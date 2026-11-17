# Expired-only quarantine recovery

This separately reviewed procedure addresses a quarantined provisioner whose persisted leases have all expired. It does not fix the original reload/rollback failure or prove ringing. The original reload repair's existing-device guard remains unchanged.

Use the manual **Recover expired-only PBX quarantine** workflow only after its source is reviewed and merged through legitimate checks. It runs from main in the protected production environment, using the existing Google identity and infrastructure concurrency group. No push event dispatches recovery.

1. Obtain fresh read-only audit evidence and coordinate with the incident operator. Do not duplicate an ongoing audit or call test.
2. Dispatch with an empty `expected_state_sha256` for preview. The script requires the reviewed runtime source hash and service command contract, the expected running process's generated directory/container, a recent allowlisted quarantine event, and authenticated private/public `503 provisioner_unavailable` responses. It verifies every stored lease is expired, no calls/channels, no registered contacts, and no unknown PWA endpoints. Missing, ambiguous or changing evidence blocks recovery.
3. Review the preview fingerprint and operational evidence. Dispatch again with that exact fingerprint only when the reviewed recovery is approved. The procedure snapshots all retained generations, source and a hash manifest into a root-only rollback directory, verifies and fsyncs those copies, rechecks state and activity, then stops the provisioner with its existing `--invalidate` hook intact. It requires removal of the generated symlink and PWA endpoints before starting it once.
4. Success requires authenticated private and public provisioning status and an active service. Coordinate a fresh authorized device registration and ringing/audio/caller-ID/voicemail acceptance with the incident operator. Do not treat `RECOVERED` as ringing acceptance.

The snapshot contains credentials and remains private on the VM. Only fixed result fields, counts and hashes are emitted. Never upload snapshots or raw journals. No database records, carrier settings or service source are changed. The Asterisk container is not restarted.

This is not a general recovery for live leases or registered devices. Activity can change between CLI observations and service stop; the procedure rechecks immediately before stop but cannot atomically lock SIP registration. Coordinate an idle maintenance interval. Existing calls are not intentionally hung up; any observed call or registration blocks the operation.

A failed stop/start or authenticated check returns `RECOVERY_UNVERIFIED`. The service may then be stopped or unhealthy. Preserve the private snapshot and inspect fresh read-only evidence. Do not automatically restore the expired credential symlink, repeatedly restart, or undo a new legitimate registration. Restoring expired credentials would defeat lease enforcement; the snapshot is incident/rollback evidence for an independently reviewed follow-up, not an automatic credential-restoration plan.
