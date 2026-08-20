import { permanentRedirect } from 'next/navigation';

/**
 * Retired public pseudo-contract.
 *
 * A workforce-board MOU is an executed agreement between identified parties and
 * must not be represented by a generic public template containing obligations or
 * performance targets. Historical inbound links are consolidated into the
 * government/agency information page. Executed agreements remain controlled
 * records and are not published from this marketing route.
 */
export default function WorkforceMOUPage() {
  permanentRedirect('/for-agencies');
}
