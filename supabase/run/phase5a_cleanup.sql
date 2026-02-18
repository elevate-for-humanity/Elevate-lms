-- Delete fake donations
DELETE FROM donations
WHERE donor_email LIKE '%@example.com'
   OR donor_email LIKE '%@company.com'
   OR donor_name IN ('John Smith', 'Jane Doe', 'Corporate Sponsor', 'Monthly Supporter', 'Anonymous');

-- Delete test applications
DELETE FROM applications
WHERE email LIKE '%@test.com'
   OR email LIKE '%@example.com'
   OR email LIKE '%@elevatetest.com'
   OR first_name = 'Test'
   OR first_name = 'Debug'
   OR first_name = 'Monitor'
   OR first_name = 'Demo'
   OR (first_name = 'End' AND last_name = 'ToEnd')
   OR (first_name = 'Launch' AND last_name = 'Test')
   OR (first_name = 'Verify' AND last_name = 'Test');

-- Delete fake grant opportunities
DELETE FROM grant_opportunities
WHERE external_id IN ('wig-2026', 'hti-2026', 'sef-2026', 'cdbg-2026', 'gjt-2026');
