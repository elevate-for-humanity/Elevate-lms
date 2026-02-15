/**
 * Bulk User Import System
 * CSV/Excel upload with role assignment and validation
 */

export interface BulkImportUser {
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'instructor' | 'admin' | 'partner' | 'case-manager';
  phone?: string;
  dateOfBirth?: string;
  studentNumber?: string;
  programId?: string;
  cohort?: string;
  startDate?: string;
  fundingSource?: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  createdUsers: string[];
}

export interface ImportError {
  row: number;
  email: string;
  field: string;
  message: string;
}

/**
 * Parse CSV file
 */
export function parseCSV(csvContent: string): BulkImportUser[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  const users: BulkImportUser[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const user: any = {};

    headers.forEach((header, index) => {
      const value = values[index];

      switch (header) {
        case 'first name':
        case 'firstname':
          user.firstName = value;
          break;
        case 'last name':
        case 'lastname':
          user.lastName = value;
          break;
        case 'email':
          user.email = value;
          break;
        case 'role':
          user.role = value.toLowerCase();
          break;
        case 'phone':
          user.phone = value;
          break;
        case 'date of birth':
        case 'dob':
          user.dateOfBirth = value;
          break;
        case 'student number':
        case 'studentnumber':
          user.studentNumber = value;
          break;
        case 'program':
        case 'program id':
          user.programId = value;
          break;
        case 'cohort':
          user.cohort = value;
          break;
        case 'start date':
        case 'startdate':
          user.startDate = value;
          break;
        case 'funding':
        case 'funding source':
          user.fundingSource = value;
          break;
      }
    });

    if (user.email) {
      users.push(user as BulkImportUser);
    }
  }

  return users;
}

/**
 * Validate user data
 */
export function validateUser(user: BulkImportUser, row: number): ImportError[] {
  const errors: ImportError[] = [];

  // Required fields
  if (!user.firstName) {
    errors.push({
      row,
      email: user.email,
      field: 'firstName',
      message: 'First name is required',
    });
  }

  if (!user.lastName) {
    errors.push({
      row,
      email: user.email,
      field: 'lastName',
      message: 'Last name is required',
    });
  }

  if (!user.email) {
    errors.push({
      row,
      email: user.email || 'unknown',
      field: 'email',
      message: 'Email is required',
    });
  } else if (!isValidEmail(user.email)) {
    errors.push({
      row,
      email: user.email,
      field: 'email',
      message: 'Invalid email format',
    });
  }

  if (!user.role) {
    errors.push({
      row,
      email: user.email,
      field: 'role',
      message: 'Role is required',
    });
  } else if (
    !['student', 'instructor', 'admin', 'partner', 'case-manager'].includes(
      user.role
    )
  ) {
    errors.push({
      row,
      email: user.email,
      field: 'role',
      message:
        'Invalid role. Must be: student, instructor, admin, partner, or case-manager',
    });
  }

  // Date validation
  if (user.dateOfBirth && !isValidDate(user.dateOfBirth)) {
    errors.push({
      row,
      email: user.email,
      field: 'dateOfBirth',
      message: 'Invalid date format. Use YYYY-MM-DD',
    });
  }

  if (user.startDate && !isValidDate(user.startDate)) {
    errors.push({
      row,
      email: user.email,
      field: 'startDate',
      message: 'Invalid date format. Use YYYY-MM-DD',
    });
  }

  return errors;
}

/**
 * Import users to database
 */
export async function importUsers(
  users: BulkImportUser[]
): Promise<ImportResult> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const errors: ImportError[] = [];
  const createdUsers: string[] = [];
  let successCount = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const row = i + 2; // +2 because row 1 is headers and arrays are 0-indexed

    // Validate
    const validationErrors = validateUser(user, row);
    if (validationErrors.length > 0) {
      errors.push(...validationErrors);
      continue;
    }

    try {
      // Check if user already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .single();

      if (existing) {
        errors.push({
          row,
          email: user.email,
          field: 'email',
          message: 'User already exists',
        });
        continue;
      }

      // Create auth user
      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email: user.email,
          email_confirm: true,
          user_metadata: {
            first_name: user.firstName,
            last_name: user.lastName,
          },
        });

      if (authError) {
        errors.push({
          row,
          email: user.email,
          field: 'auth',
          message: authError.message,
        });
        continue;
      }

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authUser.user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        phone: user.phone,
        date_of_birth: user.dateOfBirth,
        student_number: user.studentNumber,
      });

      if (profileError) {
        errors.push({
          row,
          email: user.email,
          field: 'profile',
          message: profileError.message,
        });
        continue;
      }

      // Enroll in program if specified
      if (user.programId && user.role === 'student') {
        await supabase.from('enrollments').insert({
          student_id: authUser.user.id,
          program_id: user.programId,
          cohort: user.cohort,
          start_date: user.startDate,
          funding_source: user.fundingSource,
          status: 'active',
        });
      }

      createdUsers.push(user.email);
      successCount++;
    } catch (error) { /* Error handled silently */ 
      errors.push({
        row,
        email: user.email,
        field: 'system',
        message:
          ('Operation failed') ||
          'Unknown error',
      });
    }
  }

  return {
    success: errors.length === 0,
    totalRows: users.length,
    successCount,
    errorCount: errors.length,
    errors,
    createdUsers,
  };
}

/**
 * Generate CSV template
 */
export function generateCSVTemplate(): string {
  return `First Name,Last Name,Email,Role,Phone,Date of Birth,Student Number,Program ID,Cohort,Start Date,Funding Source
Marcus,Johnson,marcus.j@example.com,student,(317) 314-3757,1990-01-15,STU001,barbering,2024-Spring,2024-01-15,WIOA
Sarah,Williams,sarah.w@example.com,instructor,(317) 314-3757,,,,,
James,Davis,james.d@example.com,case-manager,(317) 314-3757,,,,,`;
}

/**
 * Export users to CSV
 */
export async function exportUsersToCSV(filters?: {
  role?: string;
  programId?: string;
  cohort?: string;
}): Promise<string> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  let query = supabase.from('profiles').select(`
      *,
      enrollments(program_id, cohort, start_date, funding_source)
    `);

  if (filters?.role) {
    query = query.eq('role', filters.role);
  }

  const { data: users } = await query;

  if (!users || users.length === 0) {
    return generateCSVTemplate();
  }

  const rows = [
    'First Name,Last Name,Email,Role,Phone,Date of Birth,Student Number,Program ID,Cohort,Start Date,Funding Source',
  ];

  for (const user of users) {
    const enrollment = user.enrollments?.[0];
    rows.push(
      [
        user.first_name || '',
        user.last_name || '',
        user.email || '',
        user.role || '',
        user.phone || '',
        user.date_of_birth || '',
        user.student_number || '',
        enrollment?.program_id || '',
        enrollment?.cohort || '',
        enrollment?.start_date || '',
        enrollment?.funding_source || '',
      ].join(',')
    );
  }

  return rows.join('\n');
}

// Helper functions
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}
