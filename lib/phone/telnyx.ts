import 'server-only';

/**
 * Retired carrier boundary. Telnyx was replaced by Twilio and the Elevate
 * PBX; this module intentionally exposes no working provider client. The
 * two entry points below throw so any resurrected call path fails loudly
 * instead of sending through a second provider. The TelnyxCallEvent type
 * remains because lib/phone/event-processing.ts still types the durable
 * historical-event records with it. Provider-neutral helpers that used to
 * live here (call-state codec, menu prompt, open hours, public number)
 * now live in lib/phone/call-helpers.ts.
 */

export type TelnyxCallEvent = {
  data: {
    id: string;
    event_type: string;
    occurred_at: string;
    payload: {
      call_control_id: string;
      call_leg_id?: string;
      call_session_id?: string;
      from?: string;
      to?: string;
      direction?: string;
      client_state?: string;
      digits?: string;
      result?: string | Record<string, unknown>;
      partial_results?: Record<string, unknown>;
      status?: string;
      hangup_cause?: string;
      hangup_source?: string;
      message_history?: Array<{ role?: string; content?: string }>;
      recording_urls?: { mp3?: string; wav?: string };
      recording_id?: string;
      transcription_text?: string;
      duration_millis?: number;
    };
  };
};

export async function telnyxClient(): Promise<never> {
  // Retain types and historical evidence, but never instantiate the retired SDK,
  // even if legacy credentials are still present in the secret store.
  throw new Error('Telnyx is retired. Use Twilio and Elevate PBX.');
}

export async function verifyTelnyxWebhook(_body: string, _headers: Headers): Promise<TelnyxCallEvent> {
  throw new Error('Retired carrier webhooks are disabled. Use Twilio and Elevate PBX.');
}
