/** Read-only proof requires two authorized nonprivileged tenant sessions. */
import {verifyTenantIsolation,reportTenantIsolationFailure} from './tenant-isolation-proof.mjs';
verifyTenantIsolation().then(result=>console.log(JSON.stringify(result))).catch(reportTenantIsolationFailure);
