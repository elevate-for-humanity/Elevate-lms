import { validTwilioSignature } from './twilio';

/**
 * Authenticate Twilio voice form callbacks against the configured canonical URL.
 * Never infer the URL from untrusted Forwarded/Host headers.
 */
export function verifyTwilioVoiceRequest(input: {
  url: string;
  canonicalUrl: string;
  form: URLSearchParams;
  signature: string | null;
  authToken: string | undefined;
  accountSid: string | undefined;
}) {
  if (input.url !== input.canonicalUrl) throw new Error('Voice callback URL does not match configured ingress');
  if (!input.authToken || !/^AC[a-f0-9]{32}$/i.test(input.accountSid || ''))
    throw new Error('Twilio voice callback authentication not configured');
  const sid = input.form.get('AccountSid');
  const callSid = input.form.get('CallSid');
  if (sid !== input.accountSid || !/^CA[a-f0-9]{32}$/i.test(callSid || ''))
    throw new Error('Twilio voice callback identity invalid');
  if (!validTwilioSignature(input.authToken, input.canonicalUrl, input.form, input.signature || ''))
    throw new Error('Twilio voice callback signature invalid');
  return {
    accountSid: sid,
    callSid: callSid!,
    from: input.form.get('From'),
    to: input.form.get('To'),
    callStatus: input.form.get('CallStatus'),
  };
}
