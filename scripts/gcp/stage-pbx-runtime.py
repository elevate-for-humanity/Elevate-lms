#!/usr/bin/env python3
"""Stage reviewed PBX executables/units, never credentials, configuration or call routes."""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import pwd
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile

FILES = {
    'bin/node': '/usr/bin/node',
    'infra/pbx/provisioner/server.mjs': '/opt/elevate-pbx/provisioner/server.mjs',
    'infra/pbx/runtime-secrets.mjs': '/opt/elevate-pbx/runtime-secrets.mjs',
    **{f'infra/pbx/paris/{name}.mjs': f'/opt/elevate-pbx/paris/{name}.mjs'
       for name in ['launch', 'ari-media', 'private-turn', 'turn-adapter']},
    **{f'infra/pbx/{folder}/{name}.service': f'/etc/systemd/system/{name}.service'
       for folder, name in [('provisioner', 'elevate-pbx-provisioner'),
                            ('paris', 'elevate-paris-gateway'), ('paris', 'elevate-paris-turn')]},
}
UNITS = ['elevate-pbx-provisioner.service', 'elevate-paris-gateway.service', 'elevate-paris-turn.service']
PREFIX = 'PBX_RUNTIME_STAGE '


def digest_file(filename):
    digest = hashlib.sha256()
    with open(filename, 'rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def run(args, allow_failure=False):
    result = subprocess.run(args, capture_output=True, text=True, timeout=45, check=False)
    if result.returncode and not allow_failure:
        executable = Path(args[0]).name.replace('-', '_')
        raise ValueError('runtime_' + executable + '_failed' if re.fullmatch('[a-z_]+', executable) else 'runtime_command_failed')
    return result


def bundle(args):
    if not re.fullmatch('[0-9a-f]{40}', args.revision):
        raise ValueError('invalid_source_revision')
    version = run([args.node_binary, '--version']).stdout.strip()
    if not re.fullmatch(r'v22\.\d+\.\d+', version) or run([args.node_binary, '-p', 'process.arch']).stdout.strip() != 'x64':
        raise ValueError('tested_node_22_x64_required')
    sources = {name: Path(args.node_binary if name == 'bin/node' else name) for name in FILES}
    manifest = {'version': 1, 'revision': args.revision, 'nodeVersion': version,
                'files': {name: digest_file(source) for name, source in sources.items()}}
    with tarfile.open(args.output, 'w:gz') as archive:
        data = json.dumps(manifest, sort_keys=True).encode()
        info = tarfile.TarInfo('manifest.json'); info.size = len(data); info.mode = 0o600
        archive.addfile(info, io.BytesIO(data))
        for name, source in sources.items():
            info = tarfile.TarInfo(name); info.size = source.stat().st_size
            info.mode = 0o755 if name == 'bin/node' else 0o644
            with source.open('rb') as stream:
                archive.addfile(info, stream)


def unpack_verified(archive_path, archive_sha, revision, directory):
    if not re.fullmatch('[0-9a-f]{64}', archive_sha) or digest_file(archive_path) != archive_sha:
        raise ValueError('runtime_bundle_digest_mismatch')
    with tarfile.open(archive_path, 'r:gz') as archive:
        members = archive.getmembers()
        if len(members) != len(FILES) + 1 or {m.name for m in members} != set(FILES) | {'manifest.json'}:
            raise ValueError('runtime_bundle_file_set_invalid')
        if any(not m.isfile() or m.size < 0 or m.size > (200 * 1024 * 1024 if m.name == 'bin/node' else 512 * 1024) for m in members):
            raise ValueError('runtime_bundle_member_invalid')
        manifest = json.load(archive.extractfile('manifest.json'))
        if manifest.get('version') != 1 or manifest.get('revision') != revision or set(manifest.get('files', {})) != set(FILES):
            raise ValueError('runtime_bundle_manifest_invalid')
        if not re.fullmatch(r'v22\.\d+\.\d+', manifest.get('nodeVersion', '')):
            raise ValueError('runtime_node_version_invalid')
        for name in FILES:
            destination = directory / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            with archive.extractfile(name) as source, destination.open('xb') as output:
                shutil.copyfileobj(source, output, 1024 * 1024)
            if digest_file(destination) != manifest['files'][name]:
                raise ValueError('runtime_payload_digest_mismatch')
            destination.chmod(0o755 if name == 'bin/node' else 0o644)
    return manifest


def validate_destination(destination, expected_digest):
    for parent in [destination, *destination.parents]:
        if parent.is_symlink():
            raise ValueError('runtime_destination_symlink_requires_review')
        if parent.exists() and (parent.stat().st_uid != 0 or parent.stat().st_mode & 0o022):
            raise ValueError('runtime_destination_ownership_requires_review')
        if parent != destination and parent.exists() and not parent.is_dir():
            raise ValueError('runtime_parent_requires_review')
    if destination.exists() and (not destination.is_file() or digest_file(destination) != expected_digest):
        raise ValueError('existing_runtime_file_requires_review')


def unit_state(unit):
    output = run(['systemctl', 'show', unit, '--no-pager', '--property=LoadState,ActiveState,SubState'], True).stdout
    return dict(line.split('=', 1) for line in output.splitlines() if '=' in line)


def require_inactive_units():
    for unit in UNITS:
        state = unit_state(unit)
        if state.get('LoadState') not in ['loaded', 'not-found'] or state.get('ActiveState') != 'inactive' or state.get('SubState') != 'dead':
            raise ValueError('existing_runtime_unit_requires_review')


def containers():
    output = run(['docker', 'inspect', 'pbx_asterisk_1', 'elevate-pbx-wss-proxy', '--format',
                  '{{.Name}} {{.Id}} {{.State.Running}} {{.State.StartedAt}} {{.Image}}']).stdout
    rows = [line.split() for line in output.splitlines()]
    if len(rows) != 2 or {r[0] for r in rows} != {'/pbx_asterisk_1', '/elevate-pbx-wss-proxy'} or any(len(r) != 5 or r[2] != 'true' for r in rows):
        raise ValueError('existing_pbx_containers_unverified')
    return sorted(rows)


def install(args):
    if os.geteuid() != 0 or not re.fullmatch('[0-9a-f]{40}', args.revision):
        raise ValueError('invalid_install_invocation')
    if args.archive != f'/tmp/elevate-pbx-runtime-{args.revision}.tgz':
        raise ValueError('invalid_runtime_bundle_path')
    before = containers()
    require_inactive_units()
    needs_user = False
    created_user = False
    try:
        account = pwd.getpwnam('elevate-paris')
        if not 0 < account.pw_uid < 1000 or account.pw_shell not in ['/usr/sbin/nologin', '/sbin/nologin']:
            raise ValueError('existing_paris_account_requires_review')
    except KeyError:
        needs_user = True
    installed = []
    with tempfile.TemporaryDirectory(prefix='elevate-pbx-runtime-') as staging:
        directory = Path(staging)
        manifest = unpack_verified(args.archive, args.sha256, args.revision, directory)
        for name, path in FILES.items():
            validate_destination(Path(path), manifest['files'][name])
        if run([str(directory / 'bin/node'), '--version']).stdout.strip() != manifest['nodeVersion']:
            raise ValueError('runtime_node_execution_unverified')
        if run([str(directory / 'bin/node'), '-p', 'process.arch']).stdout.strip() != 'x64':
            raise ValueError('runtime_node_architecture_unverified')
        for name in FILES:
            if name.endswith('.mjs'):
                run([str(directory / 'bin/node'), '--check', str(directory / name)])
        try:
            if needs_user:
                run(['useradd', '--system', '--user-group', '--no-create-home', '--home-dir', '/nonexistent',
                     '--shell', '/usr/sbin/nologin', 'elevate-paris'])
                created_user = True
            for name, path in FILES.items():
                destination = Path(path)
                if destination.exists():
                    continue  # Exact hash/ownership was checked; never overwrite an existing runtime.
                destination.parent.mkdir(parents=True, exist_ok=True, mode=0o755)
                with tempfile.NamedTemporaryFile(prefix='.elevate-stage-', dir=destination.parent, delete=False) as output:
                    temporary = Path(output.name)
                    with (directory / name).open('rb') as source:
                        shutil.copyfileobj(source, output, 1024 * 1024)
                try:
                    temporary.chmod(0o755 if name == 'bin/node' else 0o644)
                    os.link(temporary, destination)  # Atomic create; fails if another writer created the target.
                    installed.append(destination)
                finally:
                    temporary.unlink(missing_ok=True)
            run(['systemd-analyze', 'verify', *[FILES[name] for name in FILES if name.endswith('.service')]])
            run(['systemctl', 'daemon-reload'])
            require_inactive_units()
            if any(unit_state(unit).get('LoadState') != 'loaded' for unit in UNITS):
                raise ValueError('staged_units_not_loaded')
            for name, path in FILES.items():
                validate_destination(Path(path), manifest['files'][name])
            if containers() != before:
                raise ValueError('existing_pbx_containers_changed')
        except Exception:
            # Only new files made by this invocation may be removed. Never remove a
            # concurrently activated runtime or a different file from another owner.
            require_inactive_units()
            for path in reversed(installed):
                name = next(name for name, target in FILES.items() if target == str(path))
                if path.is_file() and not path.is_symlink() and digest_file(path) == manifest['files'][name]:
                    path.unlink()
            run(['systemctl', 'daemon-reload'], True)
            if created_user:
                run(['userdel', 'elevate-paris'], True)
            raise
    Path(args.archive).unlink(missing_ok=True)
    return {'result': 'PASS', 'scope': 'runtime_files_and_inactive_units_only', 'sourceCommit': args.revision,
            'nodeVersion': manifest['nodeVersion'], 'installedFiles': len(installed), 'verifiedFiles': len(FILES),
            'files': [{'path': path, 'sha256': manifest['files'][name]} for name, path in FILES.items()],
            'containersPreserved': True, 'unitsActivated': False, 'secretsConfigured': False, 'callAcceptance': 'NOT TESTED'}


def report(args):
    records = [line[len(PREFIX):] for line in Path(args.input).read_text().splitlines() if line.startswith(PREFIX)]
    try:
        if len(records) != 1:
            raise ValueError('missing_or_ambiguous_runtime_evidence')
        result = json.loads(records[0])
        if args.status != 0 and result.get('result') == 'PASS':
            raise ValueError('remote_runtime_install_failed')
    except (ValueError, TypeError):
        result = {'result': 'BLOCKED', 'code': 'remote_runtime_install_unverified'}
    Path('pbx-runtime-stage-evidence.json').write_text(json.dumps(result, indent=2))
    print(json.dumps(result))
    return 0 if result.get('result') == 'PASS' else 1


def main():
    parser = argparse.ArgumentParser()
    modes = parser.add_subparsers(dest='mode', required=True)
    build = modes.add_parser('bundle'); build.add_argument('--node-binary', required=True)
    build.add_argument('--revision', required=True); build.add_argument('--output', required=True)
    stage = modes.add_parser('install'); stage.add_argument('--archive', required=True)
    stage.add_argument('--sha256', required=True); stage.add_argument('--revision', required=True)
    read = modes.add_parser('report'); read.add_argument('--input', required=True); read.add_argument('--status', type=int, required=True)
    args = parser.parse_args()
    try:
        if args.mode == 'bundle':
            bundle(args)
        elif args.mode == 'report':
            return report(args)
        else:
            print(PREFIX + json.dumps(install(args)))
        return 0
    except Exception as error:
        code = str(error) if isinstance(error, ValueError) and re.fullmatch('[a-z_]+', str(error)) else 'runtime_stage_unavailable'
        print((PREFIX if args.mode == 'install' else '') + json.dumps({'result': 'BLOCKED', 'code': code}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
