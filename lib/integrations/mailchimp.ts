
import mailchimp from '@mailchimp/mailchimp_marketing';
import * as crypto from 'crypto';

if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_SERVER_PREFIX) {
  mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX,
  });
}

export async function addToList(
  email: string,
  listId: string,
  mergeFields?: Record<string, string>
) {
  try {
    const response = await mailchimp.lists.addListMember(listId, {
      email_address: email,
      status: 'subscribed',
      merge_fields: mergeFields,
    });
    return { success: true, data: response };
  } catch (error) { /* Error handled silently */ 
    return { success: false, error: 'Operation failed' };
  }
}

export async function updateMember(
  email: string,
  listId: string,
  updates: Record<string, any>
) {
  try {
    const subscriberHash = crypto
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex');

    const response = await mailchimp.lists.updateListMember(
      listId,
      subscriberHash,
      updates
    );
    return { success: true, data: response };
  } catch (error) { /* Error handled silently */ 
    return { success: false, error: 'Operation failed' };
  }
}
