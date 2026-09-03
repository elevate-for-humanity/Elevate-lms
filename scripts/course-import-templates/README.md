# Course Import Templates

This directory contains templates and examples for importing courses from each partner.

## File Formats Supported

### JSON Format

```json
[
  {
    "title": "Microsoft Office Specialist: Word",
    "description": "Demonstrate your expertise in Microsoft Word",
    "category": "Microsoft Office",
    "wholesalePrice": 117,
    "duration": 40,
    "certificationType": "Industry Certification",
    "externalId": "MOS-WORD-2021",
    "externalUrl": "https://certiport.com/mos-word"
  }
]
```

### CSV Format

```csv
title,description,category,wholesale_price,duration,certification_type,external_id,external_url
"Microsoft Office Specialist: Word","Demonstrate your expertise in Microsoft Word","Microsoft Office",117,40,"Industry Certification","MOS-WORD-2021","https://certiport.com/mos-word"
```

## Import Commands

### Certiport

```bash
npm run import:courses -- --provider certiport --file ./scripts/course-import-templates/certiport-courses.json
```

### HSI

```bash
npm run import:courses -- --provider hsi --file ./scripts/course-import-templates/hsi-courses.csv
```

### JRI

```bash
npm run import:courses -- --provider jri --file ./scripts/course-import-templates/jri-courses.json
```

### NRF RISE Up

```bash
npm run import:courses -- --provider nrf --file ./scripts/course-import-templates/nrf-courses.csv
```

### CareerSafe

```bash
npm run import:courses -- --provider careersafe --file ./scripts/course-import-templates/careersafe-courses.json
```

### Milady

```bash
npm run import:courses -- --provider milady --file ./scripts/course-import-templates/milady-courses.csv
```

### National Drug Screening

```bash
npm run import:courses -- --provider nds --file ./scripts/course-import-templates/nds-courses.json
```

## Markup Rates

The import script automatically applies markup rates:

| Provider                | Markup | Example        |
| ----------------------- | ------ | -------------- |
| Certiport               | 40%    | $117 → $164    |
| HSI                     | 59%    | $85 → $135     |
| JRI                     | 50%    | $150 → $225    |
| NRF RISE Up             | 30%    | $0 → $0 (Free) |
| CareerSafe              | 40%    | $25 → $35      |
| Milady                  | 60%    | $250 → $400    |
| National Drug Screening | 50%    | $75 → $113     |

## Required Fields

- `title` - Course name (required)
- `description` - Course description (required)
- `category` - Course category (required)
- `wholesalePrice` - Partner cost (required, use 0 for free)

## Optional Fields

- `retailPrice` - Override calculated retail price
- `duration` - Course duration in hours
- `prerequisites` - Course prerequisites
- `certificationType` - Type of certification
- `externalId` - Partner's course ID
- `externalUrl` - Link to partner's course page

## Verification

After import, verify with:

```sql
-- Check total courses
SELECT COUNT(*) FROM partner_courses_catalog;

-- Check by provider
SELECT
  p.provider_name,
  COUNT(c.id) as course_count,
  MIN(c.retail_price) as min_price,
  MAX(c.retail_price) as max_price,
  AVG(c.retail_price) as avg_price
FROM partner_lms_providers p
LEFT JOIN partner_courses_catalog c ON c.provider_id = p.id
GROUP BY p.provider_name
ORDER BY course_count DESC;
```

## Troubleshooting

### Error: Provider not found

Make sure database migrations have been run and provider exists in `partner_lms_providers` table.

### Error: Duplicate courses

The script doesn't check for duplicates. Clear existing courses first:

```sql
DELETE FROM partner_courses_catalog WHERE provider_id = (
  SELECT id FROM partner_lms_providers WHERE provider_type = 'certiport'
);
```

### Error: Invalid price

Ensure wholesale_price is a valid number. Use 0 for free courses.

## Partner Data Sources

### Certiport

- Website: https://certiport.pearsonvue.com
- Contact: Partner support for API access
- Expected: 150+ courses

### HSI

- Contact: Geoff Albrecht (geoff.albrecht@hsi.com)
- Request: Full course catalog export
- Expected: 50+ courses

### JRI

- Website: https://www.jrihealthed.com
- Contact: Partnership team
- Expected: 200+ courses

### NRF RISE Up

- Website: https://www.riseuptraining.org
- Many courses are free
- Expected: 100+ courses

### CareerSafe

- Website: https://www.careersafeonline.com
- OSHA safety training
- Expected: 50+ courses

### Milady

- Website: https://www.miladytraining.com
- Contact: 866-848-5143
- Expected: 400+ courses

### National Drug Screening

- Website: https://www.nationaldrugscreening.com
- Contact: Sales@nationaldrugscreening.com
- Expected: 50+ courses
