import base64
import importlib.util
from pathlib import Path
import struct
import unittest

spec = importlib.util.spec_from_file_location('audit_phone', Path(__file__).with_name('audit-live-phone-configuration.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def wav(code=7, rate=8000, data=bytes(range(256)) * 5):
    fmt = struct.pack('<HHIIHH', code, 1, rate, rate, 1, 8)
    chunks = b'fmt ' + struct.pack('<I', len(fmt)) + fmt + b'data' + struct.pack('<I', len(data)) + data
    return b'RIFF' + struct.pack('<I', len(chunks) + 4) + b'WAVE' + chunks


class ConfigurationTests(unittest.TestCase):
    def test_database_active_does_not_conceal_unapplied_runtime_settings(self):
        system = {'status': 'active', 'ai_enabled': True, 'greeting': 'Approved greeting', 'ai_instructions': 'Approved instructions', 'voicemail_enabled': True, 'voicemail_transcription_enabled': True}
        extensions = [{'extension': '0', 'webrtc_provider': 'asterisk'}, {'extension': '101', 'webrtc_provider': 'asterisk'}]
        result = m.compare_configuration(system, extensions, {}, {})
        self.assertTrue(result['phoneSystemActive'])
        for key in ['savedGreetingAppliedToRunningTurnService', 'savedInstructionsAppliedToRunningTurnService', 'turnExtensionListMatchesDashboard', 'gatewayExtensionListMatchesDashboard']:
            self.assertFalse(result[key])
        env = {'PARIS_GREETING': system['greeting'], 'PARIS_SYSTEM_INSTRUCTIONS': system['ai_instructions'], 'PARIS_ALLOWED_EXTENSIONS': '101'}
        self.assertTrue(all(m.compare_configuration(system, extensions, env, env).values()))
        self.assertFalse(m.compare_configuration(system, extensions, env, {**env, 'PARIS_ALLOWED_EXTENSIONS': '999'})['gatewayExtensionListMatchesDashboard'])

    def test_extracts_actual_mulaw_and_pads_twenty_millisecond_frames(self):
        self.assertEqual(m.mulaw_payload(wav(data=b'\x01' * 161)), b'\x01' * 161 + b'\xff' * 159)
        for invalid in [b'', wav(code=1), wav(rate=16000), wav(data=b''), wav()[:-1]]:
            with self.assertRaises(ValueError):
                m.mulaw_payload(invalid)

    def test_live_probe_uses_only_synthetic_speech_and_never_dials(self):
        calls = []
        def send(url, headers, body):
            calls.append((url, body))
            if 'texttospeech.googleapis.com' in url:
                return 200, {'audioContent': base64.b64encode(wav()).decode()}
            return 200, {'replyAudioUlawBase64': base64.b64encode(bytes(range(160))).decode(), 'requestedRoute': {'type': 'operator', 'extension': '0'}}
        result = m.voice_probe('private-token', 'private-google-token', send)
        self.assertTrue(result['greetingAudioReturned'])
        self.assertTrue(result['operatorSpeechRouteVerified'])
        self.assertEqual(calls[0][1]['sequence'], 0)
        self.assertEqual(calls[2][1]['sequence'], 1)
        self.assertTrue(all(url.startswith(('http://127.0.0.1:8091/internal/paris/turn', 'https://texttospeech.googleapis.com/')) for url, _ in calls))
        self.assertNotIn('private', str(result))

    def test_unconfigured_greeting_still_tests_operator_speech_without_false_pass(self):
        sequences = []
        def send(url, headers, body):
            if body.get('event') == 'greeting':
                return 503, {}
            if 'texttospeech' in url:
                return 200, {'audioContent': base64.b64encode(wav()).decode()}
            sequences.append(body['sequence'])
            return 503, {}
        result = m.voice_probe('token', 'google-token', send)
        self.assertFalse(result['greetingAudioReturned'])
        self.assertFalse(result['operatorSpeechRouteVerified'])
        self.assertEqual(sequences, [0])

    def test_provider_error_body_and_silence_cannot_be_success(self):
        result = m.voice_probe('token', 'google-token', lambda *_: (403, {'error': 'sensitive-provider-body'}))
        self.assertFalse(result['operatorSpeechRouteVerified'])
        self.assertNotIn('sensitive', str(result))


if __name__ == '__main__':
    unittest.main()
