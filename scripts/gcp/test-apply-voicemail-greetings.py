import importlib.util, unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('g', Path(__file__).with_name('apply-voicemail-greetings.py'))
g = importlib.util.module_from_spec(spec); spec.loader.exec_module(g)

SYSTEM_TEXT = {'voicemail_greeting': 'You have reached Elevate for Humanity. Please leave a message.',
               'voicemail_greeting_mode': 'text', 'voicemail_greeting_recording_path': None}
SYSTEM_RECORDED = {'voicemail_greeting': None, 'voicemail_greeting_mode': 'recording',
                   'voicemail_greeting_recording_path': 'system/0-abc.webm'}
SYSTEM_EMPTY = {'voicemail_greeting': None, 'voicemail_greeting_mode': 'text',
                'voicemail_greeting_recording_path': None}


def ext(number, greeting=None, mode='text', path=None, enabled=True):
    return {'extension': number, 'enabled': enabled, 'voicemail_greeting': greeting,
            'voicemail_greeting_mode': mode, 'voicemail_greeting_recording_path': path}


class Resolve(unittest.TestCase):
    def test_extension_text_wins_over_system(self):
        plan = g.mailbox_plan(SYSTEM_TEXT, [ext('100', 'You have reached Elizabeth Greene.')])
        self.assertEqual(plan['100'], {'source': 'extension', 'mode': 'text',
                                       'text': 'You have reached Elizabeth Greene.'})

    def test_extension_recording_wins(self):
        plan = g.mailbox_plan(SYSTEM_TEXT, [ext('105', mode='recording', path='extensions/uuid-105-a.webm')])
        self.assertEqual(plan['105'], {'source': 'extension', 'mode': 'recording',
                                       'recording_path': 'extensions/uuid-105-a.webm'})

    def test_system_default_fills_extensions_without_their_own(self):
        plan = g.mailbox_plan(SYSTEM_TEXT, [ext('102')])
        self.assertEqual(plan['102'], {'source': 'system', 'mode': 'text',
                                       'text': SYSTEM_TEXT['voicemail_greeting']})

    def test_system_recording_is_the_default(self):
        plan = g.mailbox_plan(SYSTEM_RECORDED, [ext('102')])
        self.assertEqual(plan['102'], {'source': 'system', 'mode': 'recording',
                                       'recording_path': 'system/0-abc.webm'})

    def test_nothing_configured_means_stock_prompts(self):
        plan = g.mailbox_plan(SYSTEM_EMPTY, [ext('102'), ext('100')])
        self.assertIsNone(plan['102'])
        self.assertIsNone(plan['100'])
        self.assertIsNone(plan['0'])

    def test_operator_mailbox_zero_carries_the_system_greeting(self):
        plan = g.mailbox_plan(SYSTEM_TEXT, [ext('100', 'Personal greeting that must not leak to box 0.')])
        self.assertEqual(plan['0'], {'source': 'system', 'mode': 'text',
                                     'text': SYSTEM_TEXT['voicemail_greeting']})

    def test_recording_mode_without_a_recording_does_not_shadow_the_default(self):
        plan = g.mailbox_plan(SYSTEM_TEXT, [ext('103', mode='recording', path=None)])
        self.assertEqual(plan['103']['source'], 'system')

    def test_text_mode_ignores_a_stale_recording_path(self):
        plan = g.mailbox_plan(SYSTEM_EMPTY, [ext('104', mode='text', path='extensions/uuid-104-old.webm')])
        self.assertIsNone(plan['104'])

    def test_disabled_extensions_are_left_alone(self):
        plan = g.mailbox_plan(SYSTEM_TEXT, [ext('218', 'Should not be planned.', enabled=False)])
        self.assertNotIn('218', plan)

    def test_invalid_rows_fail_closed(self):
        with self.assertRaises(ValueError):
            g.mailbox_plan(SYSTEM_TEXT, [ext('9999')])
        with self.assertRaises(ValueError):
            g.mailbox_plan(SYSTEM_TEXT, [ext('106', 'x' * (g.MAX_GREETING_CHARS + 1))])
        with self.assertRaises(ValueError):
            g.mailbox_plan(SYSTEM_TEXT, [ext('106', mode='recording', path='../escape.webm')])
        with self.assertRaises(ValueError):
            g.mailbox_plan(SYSTEM_TEXT, [ext('106', 'Bad\u0007text')])


class WavValidation(unittest.TestCase):
    def test_rejects_wrong_format(self):
        import io, wave
        buffer = io.BytesIO()
        with wave.open(buffer, 'wb') as wav:
            wav.setnchannels(2); wav.setsampwidth(2); wav.setframerate(44100)
            wav.writeframes(b'\x00\x00' * 4 * 8000)
        with self.assertRaises(ValueError):
            g.validate_wav(buffer.getvalue(), 'voicemail_greeting_tts_invalid')

    def test_accepts_8k_mono_16bit(self):
        import io, wave
        buffer = io.BytesIO()
        with wave.open(buffer, 'wb') as wav:
            wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(8000)
            wav.writeframes(b'\x00\x00' * 8000)
        self.assertEqual(g.validate_wav(buffer.getvalue(), 'x'), buffer.getvalue())


if __name__ == '__main__':
    unittest.main()
