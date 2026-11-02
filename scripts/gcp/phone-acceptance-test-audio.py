#!/usr/bin/env python3
"""Produce only the fixed synthetic operator test audio; caller data is never read."""
import json,urllib.request

def main():
 request=urllib.request.Request('http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',headers={'Metadata-Flavor':'Google'})
 token=json.load(urllib.request.urlopen(request,timeout=5))['access_token']
 body={'input':{'text':'Operator audio test confirmed. This is an authorized automated phone system test.'},'voice':{'languageCode':'en-US','name':'en-US-Neural2-F'},'audioConfig':{'audioEncoding':'LINEAR16','sampleRateHertz':16000}}
 request=urllib.request.Request('https://texttospeech.googleapis.com/v1/text:synthesize',data=json.dumps(body).encode(),headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
 reply=json.load(urllib.request.urlopen(request,timeout=20))
 print(json.dumps({'audioContent':reply['audioContent']}))
if __name__=='__main__':
 try:main()
 except Exception:print(json.dumps({'error':'PHONE_ACCEPTANCE_SYNTHETIC_AUDIO_FAILED'}));raise SystemExit(1)
