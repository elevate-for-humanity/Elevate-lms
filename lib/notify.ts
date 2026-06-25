export async function notifyCritical(message: string): Promise<void> {
  console.error('[notifyCritical]', message);
}

export async function notifySlack(message: string): Promise<void> {
  console.log('[notifySlack]', message);
}
