import { phoneActorResponse } from '@/lib/phone/actor-response';
import { ProgramHolderPhoneReceiver } from '@/components/program-holder/ProgramHolderPhoneReceiver';

/** Activate only the signed-in owner's assigned phone; never impersonate a device. */
export async function AutomaticPhone({ admin = false }: { admin?: boolean }) {
  const { actor, response } = await phoneActorResponse();
  if (response || !actor || actor.previewing || !actor.extension?.enabled || actor.system?.status !== 'active') return null;
  const holder = actor.roles.some(role => ['program_holder', 'site_coordinator', 'provider_admin'].includes(role));
  const host = actor.roles.some(role => ['host_shop', 'host_shop_admin', 'partner'].includes(role));
  // Phone access is independent of the training/onboarding portal gates.
  const phoneHref = admin ? '/phone/dial-pad' : '/communications/phone';
  return <ProgramHolderPhoneReceiver key={actor.user.id} phoneHref={phoneHref} includeVideoCalls={!admin && (holder || host)} />;
}
