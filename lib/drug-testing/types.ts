/**
 * Drug Testing System Types
 * Integration with National Drug Screening
 */

export type DrugTestType =
  | 'pre_employment'
  | 'random'
  | 'post_accident'
  | 'reasonable_suspicion'
  | 'return_to_duty'
  | 'follow_up';

export type DrugTestStatus =
  | 'scheduled'
  | 'pending_collection'
  | 'collected'
  | 'in_lab'
  | 'completed'
  | 'positive'
  | 'negative'
  | 'cancelled'
  | 'no_show';

export type DrugTestPanel =
  | '5_panel'
  | '10_panel'
  | '12_panel'
  | 'dot_5_panel'
  | 'alcohol'
  | 'custom';

export interface DrugTest {
  id: string;
  student_id: string;
  enrollment_id: string;
  organization_id: string;

  // Test details
  test_type: DrugTestType;
  panel_type: DrugTestPanel;
  status: DrugTestStatus;

  // Scheduling
  scheduled_date: string;
  collection_site: string;
  collection_site_address?: string;

  // Results
  result?: 'positive' | 'negative' | 'dilute' | 'invalid';
  result_date?: string;
  result_details?: string;
  lab_report_url?: string;

  // National Drug Screening integration
  nds_order_id?: string;
  nds_donor_id?: string;
  nds_collection_site_id?: string;

  // Compliance
  required_by_program: boolean;
  required_by_employer: boolean;
  required_by_funding: boolean;

  // MRO (Medical Review Officer)
  mro_review_required: boolean;
  mro_reviewed: boolean;
  mro_reviewed_by?: string;
  mro_reviewed_at?: string;

  // Notifications
  student_notified: boolean;
  employer_notified: boolean;
  program_holder_notified: boolean;

  // Metadata
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface DrugTestingPolicy {
  id: string;
  organization_id: string;
  program_id?: string;

  // Policy details
  policy_name: string;
  policy_type: 'pre_employment' | 'random' | 'comprehensive';

  // Requirements
  pre_employment_required: boolean;
  random_testing_enabled: boolean;
  random_testing_percentage?: number;
  post_accident_required: boolean;
  reasonable_suspicion_enabled: boolean;

  // Test specifications
  default_panel: DrugTestPanel;
  alcohol_testing_included: boolean;

  // Compliance
  dot_regulated: boolean;
  state_requirements?: string[];

  // Document
  policy_document_url?: string;

  // Status
  active: boolean;
  effective_date: string;

  created_at: string;
  updated_at: string;
}

export interface CollectionSite {
  id: string;
  nds_site_id: string;

  // Location
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;

  // Contact
  phone: string;
  email?: string;

  // Hours
  hours_of_operation?: string;

  // Services
  services_offered: string[];
  dot_certified: boolean;

  // Coordinates (for distance calculation)
  latitude?: number;
  longitude?: number;

  active: boolean;
}

export interface DrugTestOrder {
  student_id: string;
  enrollment_id: string;
  test_type: DrugTestType;
  panel_type: DrugTestPanel;
  collection_site_id: string;
  scheduled_date: string;
  required_by_program: boolean;
  required_by_employer: boolean;
  required_by_funding: boolean;
  notes?: string;
}

export interface DrugTestResult {
  test_id: string;
  result: 'positive' | 'negative' | 'dilute' | 'invalid';
  result_date: string;
  substances_detected?: string[];
  lab_report_url?: string;
  mro_review_required: boolean;
  notes?: string;
}
