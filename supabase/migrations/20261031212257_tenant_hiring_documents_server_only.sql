-- Qualification documents are accessed only through the scoped server API.
-- A restrictive policy also prevents general folder-owner policies from
-- granting direct access to this private bucket in future site configurations.
CREATE POLICY tenant_hiring_documents_server_only
ON storage.objects AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (bucket_id <> 'tenant-hiring-qualifications')
WITH CHECK (bucket_id <> 'tenant-hiring-qualifications');
