# Data Import Guide for Licensees

## How to Bring Your Existing Data Into Elevate

When you license Elevate, you likely have existing data — students, courses, enrollments, employers — that needs to come into the platform. Here are your options:

---

## Import Options Overview

| Method | Best For | Skill Level | Speed |
|--------|----------|-------------|-------|
| **CSV Upload** | Small batches, one-time imports | Non-technical | Minutes |
| **REST API** | Ongoing sync, automation | Developer | Real-time |
| **Bulk Import API** | Large initial migrations | Developer | Fast |
| **Direct Database** | Enterprise self-hosted only | DBA | Fastest |

---

## Option 1: CSV Upload (Admin Dashboard)

**Best for:** Non-technical users, small imports (<1000 records)

### How It Works
1. Go to **Admin → Import Data**
2. Download the CSV template
3. Fill in your data
4. Upload the file
5. Review and confirm

### Supported CSV Imports
- Students/Participants
- Courses/Programs
- Enrollments
- Employers
- Staff/Instructors

### CSV Templates

#### Students CSV
```csv
email,first_name,last_name,phone,external_id
john@example.com,John,Doe,555-123-4567,EMP001
jane@example.com,Jane,Smith,555-987-6543,EMP002
```

#### Courses CSV
```csv
name,code,description,duration_weeks
CNA Training,CNA101,Certified Nursing Assistant program,8
Welding Basics,WELD101,Introduction to welding,12
```

#### Enrollments CSV
```csv
student_email,course_code,status,enrolled_at
john@example.com,CNA101,active,2024-01-15
jane@example.com,WELD101,completed,2024-02-01
```

---

## Option 2: REST API (Recommended for Automation)

**Best for:** Ongoing sync with existing systems, developers

### Authentication
All API requests require an API key:
```
x-api-key: your-api-key-here
```

Get your API key from **Admin → Settings → API Keys**

### Base URL
```
https://your-domain.com/api/v1
```

### Endpoints

#### List Users
```bash
GET /api/v1/users?page=1&limit=50
```

#### Create User
```bash
POST /api/v1/users
Content-Type: application/json

{
  "email": "student@example.com",
  "full_name": "John Doe",
  "role": "student",
  "password": "temporary123"
}
```

#### List Courses
```bash
GET /api/v1/courses
```

#### Create Enrollment
```bash
POST /api/v1/enrollments
Content-Type: application/json

{
  "user_id": "uuid-here",
  "course_id": "uuid-here",
  "status": "active"
}
```

---

## Option 3: Bulk Import API (Large Migrations)

**Best for:** Initial data migration, thousands of records

### Endpoint
```
POST /api/v1/import
```

### Import Students (Bulk)
```bash
curl -X POST https://your-domain.com/api/v1/import \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "students",
    "data": [
      {"email": "john@example.com", "first_name": "John", "last_name": "Doe"},
      {"email": "jane@example.com", "first_name": "Jane", "last_name": "Smith"}
    ],
    "options": {
      "upsert": true,
      "skip_errors": true
    }
  }'
```

### Import Courses (Bulk)
```bash
curl -X POST https://your-domain.com/api/v1/import \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "courses",
    "data": [
      {"name": "CNA Training", "code": "CNA101", "duration_weeks": 8},
      {"name": "Welding Basics", "code": "WELD101", "duration_weeks": 12}
    ]
  }'
```

### Import Enrollments (Bulk)
```bash
curl -X POST https://your-domain.com/api/v1/import \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "enrollments",
    "data": [
      {"student_email": "john@example.com", "course_code": "CNA101", "status": "active"},
      {"student_email": "jane@example.com", "course_code": "WELD101", "status": "completed"}
    ]
  }'
```

### Response
```json
{
  "success": true,
  "imported": 150,
  "failed": 3,
  "errors": [
    "john@invalid: Invalid email format",
    "missing@example.com: Course not found"
  ],
  "total_errors": 3
}
```

---

## Option 4: Direct Database (Enterprise Only)

**Best for:** Enterprise self-hosted deployments, DBAs

If you have an Enterprise license with self-hosting, you can import directly to the database.

### Database Schema (Key Tables)

```sql
-- Users/Students
profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT, -- 'student', 'instructor', 'admin'
  tenant_id UUID,
  external_id TEXT,
  created_at TIMESTAMP
)

-- Courses
courses (
  id UUID PRIMARY KEY,
  course_name TEXT,
  course_code TEXT,
  description TEXT,
  duration_weeks INTEGER,
  tenant_id UUID,
  is_active BOOLEAN,
  created_at TIMESTAMP
)

-- Enrollments
enrollments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  course_id UUID REFERENCES courses(id),
  status TEXT, -- 'pending', 'active', 'completed'
  progress INTEGER,
  enrolled_at TIMESTAMP,
  completed_at TIMESTAMP
)
```

### Direct Import Example (PostgreSQL)
```sql
-- Import students from CSV
COPY profiles (email, full_name, phone, role, tenant_id, created_at)
FROM '/path/to/students.csv'
WITH (FORMAT csv, HEADER true);

-- Import courses
COPY courses (course_name, course_code, description, duration_weeks, tenant_id, is_active, created_at)
FROM '/path/to/courses.csv'
WITH (FORMAT csv, HEADER true);
```

---

## Integration Options

### Zapier / Make.com
Connect Elevate to 5000+ apps:
- Import from Google Sheets
- Sync with Salesforce
- Connect to your CRM
- Automate from form submissions

### Webhooks (Outbound)
Elevate can notify your systems when events happen:
- New enrollment
- Course completion
- Certificate issued

Configure at **Admin → Settings → Webhooks**

### Common Integrations

| System | Integration Method |
|--------|-------------------|
| **Salesforce** | REST API sync |
| **HubSpot** | REST API or Zapier |
| **Google Sheets** | Zapier or CSV export/import |
| **Workday** | REST API |
| **ADP** | REST API |
| **Custom CRM** | REST API |
| **State Systems** | Custom API integration (Enterprise) |

---

## Migration Checklist

### Before You Start
- [ ] Export data from your current system
- [ ] Clean up duplicates and invalid emails
- [ ] Map your fields to Elevate fields
- [ ] Get your API key (if using API)
- [ ] Test with a small batch first

### Import Order (Important!)
1. **Courses/Programs first** — These must exist before enrollments
2. **Students/Users second** — Create all user accounts
3. **Enrollments last** — Link students to courses

### After Import
- [ ] Verify record counts match
- [ ] Spot-check a few records
- [ ] Test student login
- [ ] Check enrollment status

---

## Field Mapping Reference

### Student Fields
| Your Field | Elevate Field | Required |
|------------|---------------|----------|
| Email | `email` | ✅ Yes |
| Name | `full_name` or `first_name` + `last_name` | ✅ Yes |
| Phone | `phone` | No |
| Your ID | `external_id` | No |

### Course Fields
| Your Field | Elevate Field | Required |
|------------|---------------|----------|
| Course Name | `name` | ✅ Yes |
| Course Code | `code` | No (auto-generated) |
| Description | `description` | No |
| Duration | `duration_weeks` | No |

### Enrollment Fields
| Your Field | Elevate Field | Required |
|------------|---------------|----------|
| Student Email | `student_email` | ✅ Yes |
| Course Code | `course_code` | ✅ Yes |
| Status | `status` | No (default: active) |
| Start Date | `enrolled_at` | No |
| Progress % | `progress` | No |

---

## Troubleshooting

### "Email already exists"
- Use `upsert: true` option to update existing records
- Or clean duplicates before import

### "Course not found"
- Import courses BEFORE enrollments
- Check course code matches exactly

### "Invalid API key"
- Regenerate key in Admin → Settings → API Keys
- Check key hasn't expired

### Import is slow
- Use bulk import API instead of individual calls
- Import in batches of 500-1000 records
- For very large imports (10K+), contact support

---

## Getting Help

- **Self-Serve Plans:** Email support@elevateforhumanity.org
- **Professional Plans:** Priority support via dashboard
- **Enterprise:** Dedicated support channel

For complex migrations, we offer **Data Migration Services** as an add-on.
