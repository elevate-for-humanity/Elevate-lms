/**
 * JotForm API Integration
 * Connects client intake forms to SupersonicFastCash
 */

export interface JotFormSubmission {
  id: string;
  form_id: string;
  ip: string;
  created_at: string;
  status: string;
  answers: {
    [key: string]: {
      name: string;
      order: string;
      text: string;
      type: string;
      answer: any;
    };
  };
}

export interface ClientIntakeData {
  // Personal Information
  firstName: string;
  lastName: string;
  middleName?: string;
  ssn: string;
  dateOfBirth: string;

  // Contact Information
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };

  // Spouse Information (if married)
  spouse?: {
    firstName: string;
    lastName: string;
    ssn: string;
    dateOfBirth: string;
  };

  // Filing Information
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household';
  dependents: Array<{
    firstName: string;
    lastName: string;
    ssn: string;
    dateOfBirth: string;
    relationship: string;
  }>;

  // Income Information
  hasW2: boolean;
  has1099: boolean;
  hasSelfEmployment: boolean;
  hasRentalIncome: boolean;

  // Preferences
  refundMethod: 'direct_deposit' | 'check';
  bankAccount?: {
    routingNumber: string;
    accountNumber: string;
    accountType: 'checking' | 'savings';
  };

  // Refund Advance
  wantsRefundAdvance: boolean;
  refundAdvanceAmount?: number;
}

class JotFormIntegration {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.JOTFORM_API_KEY || '';
    this.apiUrl = 'https://api.jotform.com';
  }

  /**
   * Get form submissions
   */
  async getFormSubmissions(formId: string, limit: number = 20): Promise<JotFormSubmission[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/form/${formId}/submissions?apiKey=${this.apiKey}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`JotForm API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content || [];
    } catch (error) {
      console.error('JotForm get submissions error:', error);
      throw error;
    }
  }

  /**
   * Get a specific submission
   */
  async getSubmission(submissionId: string): Promise<JotFormSubmission> {
    try {
      const response = await fetch(
        `${this.apiUrl}/submission/${submissionId}?apiKey=${this.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`JotForm API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('JotForm get submission error:', error);
      throw error;
    }
  }

  /**
   * Parse JotForm submission into structured client data
   */
  parseSubmission(submission: JotFormSubmission): ClientIntakeData {
    const answers = submission.answers;

    // Map JotForm field IDs to data structure
    // Note: Field IDs will vary based on your actual JotForm setup
    const clientData: ClientIntakeData = {
      firstName: this.getAnswer(answers, 'firstName', 'first_name', 'name_first'),
      lastName: this.getAnswer(answers, 'lastName', 'last_name', 'name_last'),
      middleName: this.getAnswer(answers, 'middleName', 'middle_name'),
      ssn: this.getAnswer(answers, 'ssn', 'socialSecurity', 'social_security_number'),
      dateOfBirth: this.getAnswer(answers, 'dateOfBirth', 'dob', 'birth_date'),

      email: this.getAnswer(answers, 'email', 'emailAddress'),
      phone: this.getAnswer(answers, 'phone', 'phoneNumber', 'phone_number'),
      address: {
        street: this.getAnswer(answers, 'address', 'street', 'address_line1'),
        city: this.getAnswer(answers, 'city'),
        state: this.getAnswer(answers, 'state'),
        zip: this.getAnswer(answers, 'zip', 'zipCode', 'postal_code'),
      },

      filingStatus: this.getAnswer(answers, 'filingStatus', 'filing_status') as any || 'single',
      dependents: this.parseDependents(answers),

      hasW2: this.getBooleanAnswer(answers, 'hasW2', 'w2'),
      has1099: this.getBooleanAnswer(answers, 'has1099', '1099'),
      hasSelfEmployment: this.getBooleanAnswer(answers, 'selfEmployment', 'self_employed'),
      hasRentalIncome: this.getBooleanAnswer(answers, 'rentalIncome', 'rental'),

      refundMethod: this.getAnswer(answers, 'refundMethod', 'refund_method') as any || 'direct_deposit',
      wantsRefundAdvance: this.getBooleanAnswer(answers, 'refundAdvance', 'advance'),
    };

    // Parse spouse if married
    if (clientData.filingStatus === 'married_joint') {
      clientData.spouse = {
        firstName: this.getAnswer(answers, 'spouseFirstName', 'spouse_first_name'),
        lastName: this.getAnswer(answers, 'spouseLastName', 'spouse_last_name'),
        ssn: this.getAnswer(answers, 'spouseSSN', 'spouse_ssn'),
        dateOfBirth: this.getAnswer(answers, 'spouseDOB', 'spouse_dob'),
      };
    }

    // Parse bank account if direct deposit
    if (clientData.refundMethod === 'direct_deposit') {
      clientData.bankAccount = {
        routingNumber: this.getAnswer(answers, 'routingNumber', 'routing'),
        accountNumber: this.getAnswer(answers, 'accountNumber', 'account'),
        accountType: this.getAnswer(answers, 'accountType', 'account_type') as any || 'checking',
      };
    }

    return clientData;
  }

  /**
   * Helper to get answer by multiple possible field names
   */
  private getAnswer(answers: any, ...fieldNames: string[]): string {
    for (const fieldName of fieldNames) {
      for (const key in answers) {
        const answer = answers[key];
        if (
          answer.name?.toLowerCase().includes(fieldName.toLowerCase()) ||
          answer.text?.toLowerCase().includes(fieldName.toLowerCase())
        ) {
          if (typeof answer.answer === 'object') {
            // Handle complex answers (name fields, address fields, etc.)
            return Object.values(answer.answer).join(' ');
          }
          return answer.answer?.toString() || '';
        }
      }
    }
    return '';
  }

  /**
   * Helper to get boolean answer
   */
  private getBooleanAnswer(answers: any, ...fieldNames: string[]): boolean {
    const value = this.getAnswer(answers, ...fieldNames).toLowerCase();
    return value === 'yes' || value === 'true' || value === '1';
  }

  /**
   * Parse dependents from form
   */
  private parseDependents(answers: any): Array<any> {
    const dependents: Array<any> = [];

    // Look for dependent fields (usually numbered or in a table)
    for (const key in answers) {
      const answer = answers[key];
      if (answer.name?.toLowerCase().includes('dependent')) {
        // Parse dependent data
        // This will vary based on your form structure
        dependents.push({
          firstName: '',
          lastName: '',
          ssn: '',
          dateOfBirth: '',
          relationship: '',
        });
      }
    }

    return dependents;
  }

  /**
   * Create webhook for real-time submissions
   */
  async createWebhook(formId: string, webhookUrl: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.apiUrl}/form/${formId}/webhooks?apiKey=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            webhookURL: webhookUrl,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`JotForm webhook creation error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('JotForm create webhook error:', error);
      throw error;
    }
  }
}

export const jotFormIntegration = new JotFormIntegration();
