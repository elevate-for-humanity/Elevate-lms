/**
 * Form module contract.
 *
 * Every federal and state form is implemented as a FormModule.
 * This contract ensures all form packs expose the same interface
 * regardless of jurisdiction or tax year.
 *
 * Form packs live at:
 *   lib/tax/forms/{taxYear}/federal/{formCode}/index.ts
 *   lib/tax/forms/{taxYear}/state/{stateCode}/{formCode}/index.ts
 *
 * Example:
 *   lib/tax/forms/2024/federal/1040/index.ts
 *   lib/tax/forms/2024/state/in/it40/index.ts
 */

export interface FormModule<TInput = unknown, TOutput = Record<string, unknown>> {
  /** Unique form identifier, e.g. '1040', 'schedule-c', 'in-it40' */
  id: string;

  /** Tax year this module applies to */
  taxYear: number;

  /** 'federal' or ISO 3166-2 state code, e.g. 'in', 'oh', 'il' */
  jurisdiction: 'federal' | string;

  /** IRS or state form code, e.g. '1040', 'W-2', 'Schedule C' */
  formCode: string;

  /** Human-readable form name */
  displayName: string;

  /**
   * Validate input data against form rules.
   * Returns an array of error messages. Empty array = valid.
   */
  validate(input: TInput): Promise<string[]>;

  /**
   * Compute all derived fields from input.
   * Returns a flat map of line numbers/field names to computed values.
   */
  compute(input: TInput): Promise<TOutput>;

  /**
   * Serialize to print-ready PDF buffer.
   * Used for client copies and filing records.
   */
  serializeToPrint(input: TInput): Promise<Buffer>;

  /**
   * Serialize to IRS MeF XML string.
   * Only required for forms that are part of the MeF submission package.
   * State forms that use their own e-file system may omit this.
   */
  serializeToXml?(input: TInput): Promise<string>;

  /**
   * Returns the XSD schema path for this form/year.
   * Used by the validation layer to locate the correct IRS schema.
   */
  schemaPath?(): string;
}

/**
 * Registry entry for a form pack.
 * Used by the form registry to look up available forms by year and jurisdiction.
 */
export type FormRegistryEntry = {
  id: string;
  taxYear: number;
  jurisdiction: 'federal' | string;
  formCode: string;
  displayName: string;
  // Lazy loader — avoids importing all form modules at startup
  load: () => Promise<FormModule>;
};

/**
 * Form registry — maps (taxYear, jurisdiction, formCode) to a FormModule loader.
 * Populated by each form pack's index file.
 */
export class FormRegistry {
  private entries: FormRegistryEntry[] = [];

  register(entry: FormRegistryEntry): void {
    this.entries.push(entry);
  }

  find(taxYear: number, jurisdiction: string, formCode: string): FormRegistryEntry | undefined {
    return this.entries.find(
      e => e.taxYear === taxYear &&
           e.jurisdiction === jurisdiction &&
           e.formCode === formCode
    );
  }

  listByYear(taxYear: number): FormRegistryEntry[] {
    return this.entries.filter(e => e.taxYear === taxYear);
  }

  listFederal(taxYear: number): FormRegistryEntry[] {
    return this.entries.filter(e => e.taxYear === taxYear && e.jurisdiction === 'federal');
  }

  listState(taxYear: number, stateCode: string): FormRegistryEntry[] {
    return this.entries.filter(e => e.taxYear === taxYear && e.jurisdiction === stateCode);
  }
}

// Singleton registry — import this in form pack index files to register
export const formRegistry = new FormRegistry();
