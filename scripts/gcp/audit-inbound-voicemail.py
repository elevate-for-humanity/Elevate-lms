#!/usr/bin/env python3
"""Read-only PBX ingress and voicemail-worker evidence; no caller data or audio."""
import json
import re
import subprocess
from pathlib import Path

def run(args):
    result=subprocess.run(args,capture_output=True,text=True,timeout=20)
    return result.stdout if result.returncode==0 else ''
def context_from_endpoint(text):
    match=re.search(r'^\s*context\s*:\s*([A-Za-z0-9_-]+)\s*$',text,re.M|re.I)
    return match[1] if match else None
def dialplan_evidence(text):
    present=bool(text and not re.search(r'no such|not exist|no dialplan',text,re.I))
    return {'present':present,'invokesParis':present and 'Stasis(elevate-paris' in text,
            'hasAnswer':present and 'Answer(' in text,'hasVoicemail':present and 'VoiceMail(' in text,
            'routesToOperator':present and bool(re.search(r'(Goto|Gosub)\((internal,0|elevate-operator)',text))}
def main():
    cli=lambda text:run(['docker','exec','pbx_asterisk_1','asterisk','-rx',text])
    context=context_from_endpoint(cli('pjsip show endpoint twilio'))
    evidence={'carrierContextVerified':context is not None,'carrierIngress':dialplan_evidence(cli('dialplan show '+context)) if context else None,
              'voicemailWorkerActive':run(['systemctl','is-active','elevate-voicemail-worker.service']).strip()=='active',
              'callsPlaced':0,'messagesDelivered':0,'configurationChanged':False}
    journal=run(['journalctl','-u','elevate-voicemail-worker.service','--since','30 minutes ago','--no-pager','-o','cat'])
    evidence['recentIngestRetryStatuses']=sorted(set(re.findall(r'OWNED_VOICEMAIL_INGEST_REQUIRES_RETRY_(\d{3})',journal)))
    evidence['recentMessageRetryCount']=journal.count('OWNED_VOICEMAIL_MESSAGE_REQUIRES_RETRY')
    evidence['recentScanRetryCount']=journal.count('OWNED_VOICEMAIL_SCAN_REQUIRES_RETRY')
    try:
        mounts=json.loads(run(['docker','inspect','pbx_asterisk_1','--format','{{json .Mounts}}']))
        spool=next(m for m in mounts if m.get('Destination')=='/var/spool/asterisk')
        base=(Path(spool['Source'])/'voicemail/elevate').resolve(strict=True)
        evidence['spoolAudioCount']=sum(1 for p in base.glob('*/INBOX/msg*.wav') if p.is_file() and not p.is_symlink())
        ledger=Path('/var/lib/elevate-pbx/voicemail')
        evidence['ingestedReceiptCount']=sum(1 for p in ledger.iterdir() if re.fullmatch(r'[a-f0-9-]{36}',p.name) and p.is_file() and not p.is_symlink())
    except Exception:
        evidence['spoolInspectionVerified']=False
    print(json.dumps(evidence))
if __name__=='__main__':main()
