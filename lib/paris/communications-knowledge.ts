const COMMUNICATION_TERMS =
  /\b(phone|number|extension|forward|ring|voicemail|call menu|receptionist|meeting|video call|screen share|communications hub|team call|transfer call)\b/i;

export const PARIS_COMMUNICATIONS_KNOWLEDGE = `
ELEVATE COMMUNICATIONS HUB — CANONICAL USER GUIDE

Purpose
The Communications Hub combines organization-owned business numbers, cell-phone ring destinations, staff extensions, voicemail, AI reception, browser meetings, team huddles, meeting chat, and screen sharing. Each organization has an isolated workspace. Users must never see another organization's calls, numbers, meetings, or participants.

Phone-number model
1. A carrier-provisioned business number belongs to the organization's Elevate Communications workspace.
2. An externally owned number, including a TextMe number, remains with its existing service. It may be marked external_forwarding and forwarded to the carrier-provisioned receiving number. Never describe this as porting or changing ownership.
3. A business number can ring one cell phone, several cell phones in a group, a department, an AI receptionist, an automated menu, or voicemail.

Initial setup
1. Open Communications, then Setup.
2. Confirm the organization name, timezone, business hours, greeting, and after-hours message.
3. Add each team member's cell phone as a ring destination. Confirm the team member agreed to receive business calls.
4. Assign internal extensions and departments.
5. Choose Direct Forward, Call Menu, or AI Receptionist.
6. Configure voicemail and transcription. Enable recording only with an approved disclosure.
7. Connect the carrier-provisioned receiving number. If an external number is used, enable forwarding with that number's current provider.
8. Place inbound, outbound, after-hours, transfer, voicemail, and no-answer test calls before activation.

Calls and transfers
- Answer a call in the browser or on the configured cell phone.
- Warm transfer: speak to the receiving team member before joining the caller.
- Cold transfer: send the caller directly to another extension or destination.
- Team tag-in: invite another available team member into the active conversation.
- Group ring: ring configured destinations simultaneously until one answers.
- Do-not-disturb prevents new calls from ringing that extension.

Meetings
1. Select New Meeting or Start Team Huddle.
2. Add a title, participants, date/time, and meeting permissions.
3. Enter the device check and approve camera and microphone access.
4. Use Share Screen to present a browser tab, window, or screen.
5. Hosts can mute participants, admit guests, make moderators, and end the room.
6. Meeting chat and attendance remain connected to the workspace. Recording is off unless the host enables it and participants receive the required notice.

AI receptionist
The AI receptionist may answer approved FAQs, identify the caller's purpose, collect contact information, create authorized follow-up work, and transfer to a human. It must transfer when requested or uncertain. It must not invent enrollment, funding, payment, licensing, or compliance decisions.

Safety and troubleshooting
- Never request carrier API keys in chat. Secrets belong in the server secret store.
- If calls do not ring, check destination status, business hours, routing mode, carrier connection, and do-not-disturb.
- If meetings cannot use camera, microphone, or screen sharing, run the device check and confirm browser permission.
- If the carrier or meeting service is not verified, describe the workspace as setup or pending—not active.
`.trim();

export function communicationsKnowledgeFor(command: string): string | null {
  return COMMUNICATION_TERMS.test(command) ? PARIS_COMMUNICATIONS_KNOWLEDGE : null;
}
