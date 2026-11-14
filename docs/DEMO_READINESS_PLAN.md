# DEMO READINESS PLAN
**Audit Date:** July 16, 2026  

---

## RECOMMENDED DEMO FLOW (8-12 minutes)

### Part 1: Marketing & Lead Capture (3 min)
1. Show public website homepage
2. Navigate to Phlebotomy program page
3. Click "Get Started" 
4. Show lead form submission
5. Switch to admin CRM
6. Show new lead in queue

### Part 2: AI Course Builder (4 min)
1. Navigate to Admin > Education Workflow
2. Enter prompt: "Build a 120-hour hybrid Phlebotomy Technician program"
3. Show curriculum generation
4. Show approval packet preview
5. Click "Generate Package"
6. Show instructor guide, syllabus, rubrics

### Part 3: Student Learning (3 min)
1. Login as test student
2. Show enrolled program
3. Complete one lesson
4. Take quiz
5. Show progress bar
6. Show certificate (if complete)

### Part 4: Admin & Reporting (2 min)
1. Show admin dashboard
2. Show student analytics
3. Show compliance status

---

## BLOCKERS

| Demo Part | Blocker | Fix |
|-----------|---------|-----|
| Part 1 | Lead form works | None |
| Part 2 | AI not wired | Wire course builder API |
| Part 2 | Export untested | Test export |
| Part 3 | Test data missing | Seed demo data |
| Part 3 | Progress untested | E2E test |

---

## SETUP REQUIRED

1. Fix route collisions (P0)
2. Seed 1 realistic program (Phlebotomy)
3. Create 3 test accounts (student, instructor, admin)
4. Complete 1 E2E test
5. Wire AI course builder to API
