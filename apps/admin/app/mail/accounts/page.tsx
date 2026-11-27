// The mailbox directory lives at a single source (the Admin-hosted page);
// this alias keeps it inside the Elevate Mail app scope so moving between
// the inbox and Email accounts never leaves the installed app.
export { default, dynamic, metadata } from '../../phone/email/accounts/page';
