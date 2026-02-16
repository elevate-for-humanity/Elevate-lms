-- =====================================================
-- HR & PAYROLL SYSTEM - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Created: 2025-11-17
-- Purpose: Full HR, Payroll, Benefits, Time & Attendance
-- =====================================================

-- =====================================================
-- 1. EMPLOYEE MANAGEMENT
-- =====================================================

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  parent_department_id UUID REFERENCES departments(id),
  manager_id UUID REFERENCES profiles(id),
  cost_center VARCHAR(100),
  budget DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Positions/Job Titles
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  description TEXT,
  responsibilities TEXT,
  requirements TEXT,
  min_salary DECIMAL(15,2),
  max_salary DECIMAL(15,2),
  employment_type VARCHAR(50), -- Full-time, Part-time, Contract, Temporary
  level VARCHAR(50), -- Entry, Mid, Senior, Executive
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees (extends profiles table)
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  position_id UUID REFERENCES positions(id),
  manager_id UUID REFERENCES employees(id),
  
  -- Employment Details
  hire_date DATE NOT NULL,
  termination_date DATE,
  employment_status VARCHAR(50) DEFAULT 'active', -- active, terminated, on_leave, suspended
  employment_type VARCHAR(50), -- Full-time, Part-time, Contract, Temporary
  work_location VARCHAR(255),
  
  -- Compensation
  salary DECIMAL(15,2),
  salary_currency VARCHAR(3) DEFAULT 'USD',
  pay_frequency VARCHAR(50), -- weekly, bi-weekly, semi-monthly, monthly
  pay_type VARCHAR(50), -- salary, hourly
  hourly_rate DECIMAL(10,2),
  
  -- Personal Information
  date_of_birth DATE,
  ssn_last_four VARCHAR(4),
  gender VARCHAR(50),
  marital_status VARCHAR(50),
  
  -- Contact Information
  personal_email VARCHAR(255),
  work_email VARCHAR(255),
  phone VARCHAR(50),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  emergency_contact_relationship VARCHAR(100),
  
  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',
  
  -- Tax Information
  tax_filing_status VARCHAR(50), -- single, married, head_of_household
  federal_allowances INTEGER DEFAULT 0,
  state_allowances INTEGER DEFAULT 0,
  additional_withholding DECIMAL(10,2) DEFAULT 0,
  
  -- Benefits
  benefits_eligible BOOLEAN DEFAULT true,
  benefits_start_date DATE,
  
  -- Metadata
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Documents
CREATE TABLE IF NOT EXISTS employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  document_type VARCHAR(100) NOT NULL, -- resume, contract, w4, i9, offer_letter, etc.
  document_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES profiles(id),
  expiration_date DATE,
  is_confidential BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salary History
CREATE TABLE IF NOT EXISTS salary_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  effective_date DATE NOT NULL,
  previous_salary DECIMAL(15,2),
  new_salary DECIMAL(15,2) NOT NULL,
  change_reason VARCHAR(255), -- promotion, merit_increase, cost_of_living, market_adjustment
  change_percentage DECIMAL(5,2),
  approved_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. PAYROLL SYSTEM
-- =====================================================

-- Payroll Runs
CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_number VARCHAR(50) UNIQUE NOT NULL,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  pay_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, processing, approved, paid, cancelled
  total_gross DECIMAL(15,2) DEFAULT 0,
  total_net DECIMAL(15,2) DEFAULT 0,
  total_taxes DECIMAL(15,2) DEFAULT 0,
  total_deductions DECIMAL(15,2) DEFAULT 0,
  employee_count INTEGER DEFAULT 0,
  processed_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pay Stubs
CREATE TABLE IF NOT EXISTS pay_stubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID REFERENCES payroll_runs(id) NOT NULL,
  employee_id UUID REFERENCES employees(id) NOT NULL,
  
  -- Earnings
  regular_hours DECIMAL(10,2) DEFAULT 0,
  overtime_hours DECIMAL(10,2) DEFAULT 0,
  regular_pay DECIMAL(15,2) DEFAULT 0,
  overtime_pay DECIMAL(15,2) DEFAULT 0,
  bonus DECIMAL(15,2) DEFAULT 0,
  commission DECIMAL(15,2) DEFAULT 0,
  other_earnings DECIMAL(15,2) DEFAULT 0,
  gross_pay DECIMAL(15,2) NOT NULL,
  
  -- Taxes
  federal_income_tax DECIMAL(15,2) DEFAULT 0,
  state_income_tax DECIMAL(15,2) DEFAULT 0,
  local_income_tax DECIMAL(15,2) DEFAULT 0,
  social_security_tax DECIMAL(15,2) DEFAULT 0,
  medicare_tax DECIMAL(15,2) DEFAULT 0,
  total_taxes DECIMAL(15,2) DEFAULT 0,
  
  -- Deductions
  health_insurance DECIMAL(15,2) DEFAULT 0,
  dental_insurance DECIMAL(15,2) DEFAULT 0,
  vision_insurance DECIMAL(15,2) DEFAULT 0,
  retirement_401k DECIMAL(15,2) DEFAULT 0,
  retirement_401k_match DECIMAL(15,2) DEFAULT 0,
  hsa_contribution DECIMAL(15,2) DEFAULT 0,
  fsa_contribution DECIMAL(15,2) DEFAULT 0,
  life_insurance DECIMAL(15,2) DEFAULT 0,
  disability_insurance DECIMAL(15,2) DEFAULT 0,
  garnishments DECIMAL(15,2) DEFAULT 0,
  other_deductions DECIMAL(15,2) DEFAULT 0,
  total_deductions DECIMAL(15,2) DEFAULT 0,
  
  -- Net Pay
  net_pay DECIMAL(15,2) NOT NULL,
  
  -- YTD Totals
  ytd_gross DECIMAL(15,2) DEFAULT 0,
  ytd_taxes DECIMAL(15,2) DEFAULT 0,
  ytd_deductions DECIMAL(15,2) DEFAULT 0,
  ytd_net DECIMAL(15,2) DEFAULT 0,
  
  -- Payment Method
  payment_method VARCHAR(50) DEFAULT 'direct_deposit', -- direct_deposit, check, cash
  bank_account_last_four VARCHAR(4),
  check_number VARCHAR(50),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, voided
  paid_at TIMESTAMPTZ,
  
  -- PDF
  pdf_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Withholdings
CREATE TABLE IF NOT EXISTS tax_withholdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  tax_year INTEGER NOT NULL,
  
  -- Federal
  federal_filing_status VARCHAR(50),
  federal_allowances INTEGER DEFAULT 0,
  federal_additional_withholding DECIMAL(10,2) DEFAULT 0,
  federal_exempt BOOLEAN DEFAULT false,
  
  -- State
  state VARCHAR(50),
  state_filing_status VARCHAR(50),
  state_allowances INTEGER DEFAULT 0,
  state_additional_withholding DECIMAL(10,2) DEFAULT 0,
  state_exempt BOOLEAN DEFAULT false,
  
  -- Local
  local_jurisdiction VARCHAR(100),
  local_additional_withholding DECIMAL(10,2) DEFAULT 0,
  
  effective_date DATE NOT NULL,
  w4_form_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, tax_year)
);

-- Direct Deposit Accounts
CREATE TABLE IF NOT EXISTS direct_deposit_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- checking, savings
  bank_name VARCHAR(255),
  routing_number VARCHAR(9) NOT NULL,
  account_number_encrypted TEXT NOT NULL, -- Store encrypted
  account_number_last_four VARCHAR(4) NOT NULL,
  allocation_type VARCHAR(50) DEFAULT 'percentage', -- percentage, fixed_amount, remainder
  allocation_value DECIMAL(10,2), -- percentage (0-100) or dollar amount
  priority INTEGER DEFAULT 1, -- Order of allocation
  is_active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. BENEFITS ADMINISTRATION
-- =====================================================

-- Benefits Plans
CREATE TABLE IF NOT EXISTS benefits_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name VARCHAR(255) NOT NULL,
  plan_type VARCHAR(100) NOT NULL, -- health, dental, vision, life, disability, retirement, hsa, fsa
  carrier_name VARCHAR(255),
  plan_code VARCHAR(100),
  description TEXT,
  
  -- Coverage Details
  coverage_level VARCHAR(100), -- individual, family, employee_spouse, employee_children
  
  -- Costs
  employee_cost_monthly DECIMAL(10,2) DEFAULT 0,
  employer_cost_monthly DECIMAL(10,2) DEFAULT 0,
  total_cost_monthly DECIMAL(10,2) DEFAULT 0,
  
  -- Plan Details
  deductible DECIMAL(10,2),
  out_of_pocket_max DECIMAL(10,2),
  copay DECIMAL(10,2),
  coinsurance_percentage DECIMAL(5,2),
  
  -- Eligibility
  eligibility_rules JSONB, -- Store complex eligibility rules
  waiting_period_days INTEGER DEFAULT 0,
  
  -- Plan Year
  plan_year_start DATE,
  plan_year_end DATE,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Benefits Enrollments
CREATE TABLE IF NOT EXISTS benefits_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  plan_id UUID REFERENCES benefits_plans(id) NOT NULL,
  
  -- Enrollment Details
  enrollment_type VARCHAR(50), -- new_hire, open_enrollment, life_event, termination
  coverage_level VARCHAR(100),
  effective_date DATE NOT NULL,
  termination_date DATE,
  
  -- Costs
  employee_cost_monthly DECIMAL(10,2) DEFAULT 0,
  employer_cost_monthly DECIMAL(10,2) DEFAULT 0,
  
  -- Dependents
  dependents JSONB, -- Array of dependent info
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, pending, terminated, waived
  
  -- Evidence of Insurability
  eoi_required BOOLEAN DEFAULT false,
  eoi_approved BOOLEAN DEFAULT false,
  eoi_approved_date DATE,
  
  -- Beneficiaries (for life insurance)
  beneficiaries JSONB,
  
  -- Documents
  enrollment_form_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COBRA Administration
CREATE TABLE IF NOT EXISTS cobra_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  original_enrollment_id UUID REFERENCES benefits_enrollments(id),
  
  -- COBRA Details
  qualifying_event VARCHAR(100), -- termination, reduction_hours, divorce, death
  qualifying_event_date DATE NOT NULL,
  cobra_start_date DATE NOT NULL,
  cobra_end_date DATE NOT NULL,
  
  -- Costs (employee pays full cost + admin fee)
  monthly_premium DECIMAL(10,2) NOT NULL,
  admin_fee DECIMAL(10,2) DEFAULT 0,
  total_monthly_cost DECIMAL(10,2) NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, terminated, expired
  
  -- Payments
  last_payment_date DATE,
  next_payment_due DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. TIME & ATTENDANCE
-- =====================================================

-- Time Entries
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  
  -- Time Details
  entry_date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  
  -- Hours
  regular_hours DECIMAL(10,2) DEFAULT 0,
  overtime_hours DECIMAL(10,2) DEFAULT 0,
  double_time_hours DECIMAL(10,2) DEFAULT 0,
  pto_hours DECIMAL(10,2) DEFAULT 0,
  sick_hours DECIMAL(10,2) DEFAULT 0,
  holiday_hours DECIMAL(10,2) DEFAULT 0,
  total_hours DECIMAL(10,2) DEFAULT 0,
  
  -- Break Time
  break_minutes INTEGER DEFAULT 0,
  lunch_minutes INTEGER DEFAULT 0,
  
  -- Location (for geofencing)
  clock_in_latitude DECIMAL(10,8),
  clock_in_longitude DECIMAL(11,8),
  clock_out_latitude DECIMAL(10,8),
  clock_out_longitude DECIMAL(11,8),
  
  -- Device Info
  clock_in_device VARCHAR(255),
  clock_out_device VARCHAR(255),
  clock_in_ip VARCHAR(45),
  clock_out_ip VARCHAR(45),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timesheets
CREATE TABLE IF NOT EXISTS timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Hours Summary
  total_regular_hours DECIMAL(10,2) DEFAULT 0,
  total_overtime_hours DECIMAL(10,2) DEFAULT 0,
  total_pto_hours DECIMAL(10,2) DEFAULT 0,
  total_sick_hours DECIMAL(10,2) DEFAULT 0,
  total_hours DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, approved, rejected
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, period_start, period_end)
);

-- Shift Schedules
CREATE TABLE IF NOT EXISTS shift_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  
  -- Schedule Details
  schedule_date DATE NOT NULL,
  shift_start TIMESTAMPTZ NOT NULL,
  shift_end TIMESTAMPTZ NOT NULL,
  
  -- Break Times
  break_minutes INTEGER DEFAULT 0,
  lunch_minutes INTEGER DEFAULT 0,
  
  -- Location
  work_location VARCHAR(255),
  
  -- Status
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, no_show, cancelled
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. LEAVE MANAGEMENT
-- =====================================================

-- Leave Policies
CREATE TABLE IF NOT EXISTS leave_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name VARCHAR(255) NOT NULL,
  leave_type VARCHAR(100) NOT NULL, -- pto, sick, vacation, personal, bereavement, jury_duty, military, fmla
  description TEXT,
  
  -- Accrual Rules
  accrual_method VARCHAR(50), -- per_pay_period, per_month, per_year, anniversary, none
  accrual_rate DECIMAL(10,2), -- Hours accrued per period
  accrual_start_date VARCHAR(50), -- hire_date, first_of_year, anniversary
  
  -- Limits
  max_accrual_hours DECIMAL(10,2), -- Max hours that can be accrued
  max_carryover_hours DECIMAL(10,2), -- Max hours that can carry over to next year
  
  -- Usage Rules
  min_request_hours DECIMAL(10,2) DEFAULT 0,
  max_request_hours DECIMAL(10,2),
  requires_approval BOOLEAN DEFAULT true,
  advance_notice_days INTEGER DEFAULT 0,
  
  -- Eligibility
  eligibility_rules JSONB,
  waiting_period_days INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave Balances
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  policy_id UUID REFERENCES leave_policies(id) NOT NULL,
  
  -- Balance
  accrued_hours DECIMAL(10,2) DEFAULT 0,
  used_hours DECIMAL(10,2) DEFAULT 0,
  pending_hours DECIMAL(10,2) DEFAULT 0,
  available_hours DECIMAL(10,2) DEFAULT 0,
  
  -- Year
  balance_year INTEGER NOT NULL,
  
  -- Last Accrual
  last_accrual_date DATE,
  next_accrual_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, policy_id, balance_year)
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  policy_id UUID REFERENCES leave_policies(id) NOT NULL,
  
  -- Request Details
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_hours DECIMAL(10,2) NOT NULL,
  
  -- Reason
  reason TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, cancelled
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Notifications
  employee_notified BOOLEAN DEFAULT false,
  manager_notified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Holiday Calendar
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_name VARCHAR(255) NOT NULL,
  holiday_date DATE NOT NULL,
  is_observed BOOLEAN DEFAULT true,
  is_paid BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. PERFORMANCE MANAGEMENT
-- =====================================================

-- Performance Reviews
CREATE TABLE IF NOT EXISTS performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Review Details
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  review_type VARCHAR(100), -- annual, quarterly, probationary, project
  
  -- Ratings
  overall_rating DECIMAL(3,2), -- 1.00 to 5.00
  performance_rating DECIMAL(3,2),
  attendance_rating DECIMAL(3,2),
  teamwork_rating DECIMAL(3,2),
  communication_rating DECIMAL(3,2),
  
  -- Feedback
  strengths TEXT,
  areas_for_improvement TEXT,
  goals_achieved TEXT,
  goals_for_next_period TEXT,
  reviewer_comments TEXT,
  employee_comments TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, acknowledged, completed
  submitted_at TIMESTAMPTZ,
  acknowledged_by_employee BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  
  -- Salary Impact
  salary_increase_recommended BOOLEAN DEFAULT false,
  recommended_increase_percentage DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals
CREATE TABLE IF NOT EXISTS employee_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  
  -- Goal Details
  goal_title VARCHAR(255) NOT NULL,
  goal_description TEXT,
  goal_type VARCHAR(100), -- performance, development, project
  
  -- Timeline
  start_date DATE,
  target_date DATE,
  completion_date DATE,
  
  -- Progress
  status VARCHAR(50) DEFAULT 'in_progress', -- not_started, in_progress, completed, cancelled
  progress_percentage INTEGER DEFAULT 0,
  
  -- Measurement
  success_criteria TEXT,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_employees_profile_id ON employees(profile_id);
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(employment_status);
CREATE INDEX idx_employees_hire_date ON employees(hire_date);

CREATE INDEX idx_pay_stubs_payroll_run ON pay_stubs(payroll_run_id);
CREATE INDEX idx_pay_stubs_employee ON pay_stubs(employee_id);

CREATE INDEX idx_time_entries_employee ON time_entries(employee_id);
CREATE INDEX idx_time_entries_date ON time_entries(entry_date);
CREATE INDEX idx_time_entries_status ON time_entries(status);

CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

CREATE INDEX idx_benefits_enrollments_employee ON benefits_enrollments(employee_id);
CREATE INDEX idx_benefits_enrollments_plan ON benefits_enrollments(plan_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_stubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_withholdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_deposit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_goals ENABLE ROW LEVEL SECURITY;

-- HR Admin can see everything
CREATE POLICY hr_admin_all ON employees FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'hr_admin')
  )
);

-- Employees can see their own data
CREATE POLICY employees_own_data ON employees FOR SELECT USING (
  profile_id = auth.uid()
);

-- Managers can see their direct reports
CREATE POLICY managers_see_reports ON employees FOR SELECT USING (
  manager_id IN (
    SELECT id FROM employees WHERE profile_id = auth.uid()
  )
);

-- Similar policies for other tables...
-- (Add more RLS policies as needed)

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_runs_updated_at BEFORE UPDATE ON payroll_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pay_stubs_updated_at BEFORE UPDATE ON pay_stubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default leave policies
INSERT INTO leave_policies (policy_name, leave_type, accrual_method, accrual_rate, max_accrual_hours, max_carryover_hours)
VALUES 
  ('Standard PTO', 'pto', 'per_pay_period', 4.0, 160, 40),
  ('Sick Leave', 'sick', 'per_pay_period', 2.0, 80, 40),
  ('Bereavement Leave', 'bereavement', 'none', 0, 24, 0),
  ('Jury Duty', 'jury_duty', 'none', 0, 0, 0);

-- Insert default holidays for 2025
INSERT INTO holidays (holiday_name, holiday_date, is_observed, is_paid)
VALUES
  ('New Year''s Day', '2025-01-01', true, true),
  ('Martin Luther King Jr. Day', '2025-01-20', true, true),
  ('Presidents Day', '2025-02-17', true, true),
  ('Memorial Day', '2025-05-26', true, true),
  ('Independence Day', '2025-07-04', true, true),
  ('Labor Day', '2025-09-01', true, true),
  ('Thanksgiving', '2025-11-27', true, true),
  ('Christmas', '2025-12-25', true, true);

-- =====================================================
-- COMPLETE
-- =====================================================
