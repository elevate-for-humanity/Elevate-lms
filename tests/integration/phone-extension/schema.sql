-- Disposable PostgreSQL contract fixture, never production data.
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE TABLE profiles (id uuid PRIMARY KEY, full_name text, email text, role text, tenant_id uuid, organization_id uuid);
CREATE TABLE phone_systems (id uuid PRIMARY KEY, default_destination_id uuid);
CREATE TABLE communication_workspaces (id uuid PRIMARY KEY, tenant_id uuid, phone_system_id uuid REFERENCES phone_systems);
CREATE TABLE communication_extensions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),workspace_id uuid REFERENCES communication_workspaces,profile_id uuid REFERENCES profiles,extension text,display_name text,department text,enabled boolean DEFAULT true,webrtc_provider text,destination_id uuid,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now(),UNIQUE(workspace_id,profile_id),UNIQUE(workspace_id,extension));
CREATE TABLE phone_destinations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),phone_system_id uuid REFERENCES phone_systems,extension_id uuid REFERENCES communication_extensions,name text,department text,destination_type text,destination text,ring_seconds integer DEFAULT 25,fallback_to_voicemail boolean DEFAULT true,enabled boolean DEFAULT true,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
ALTER TABLE phone_systems ADD FOREIGN KEY(default_destination_id) REFERENCES phone_destinations;
ALTER TABLE communication_extensions ADD FOREIGN KEY(destination_id) REFERENCES phone_destinations;
CREATE TABLE phone_menu_options (phone_system_id uuid REFERENCES phone_systems,destination_id uuid REFERENCES phone_destinations,enabled boolean);
CREATE TABLE phone_calls (destination_id uuid REFERENCES phone_destinations);
INSERT INTO profiles VALUES ('00000000-0000-0000-0000-000000000001','Owner','owner@example.test','admin',NULL,NULL),('00000000-0000-0000-0000-000000000002','Other','other@example.test','program_holder','00000000-0000-0000-0000-000000000099',NULL);
INSERT INTO phone_systems VALUES ('00000000-0000-0000-0000-000000000003',NULL);
INSERT INTO communication_workspaces VALUES ('00000000-0000-0000-0000-000000000004',NULL,'00000000-0000-0000-0000-000000000003');
INSERT INTO communication_extensions(id,workspace_id,profile_id,extension,display_name,department) VALUES ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','0','Owner','Original');
-- Old paused A, current default B, and duplicate live C all retain their IDs.
INSERT INTO phone_destinations(id,phone_system_id,extension_id,name,destination_type,enabled,created_at) VALUES
 ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000005','Old','webrtc',false,'2020-01-01'),
 ('00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000005','Current','webrtc',true,'2022-01-01'),
 ('00000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000005','Duplicate','webrtc',true,'2021-01-01');
UPDATE phone_systems SET default_destination_id='00000000-0000-0000-0000-000000000007';
UPDATE communication_extensions SET destination_id='00000000-0000-0000-0000-000000000006';
INSERT INTO phone_menu_options VALUES ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000008',true);
INSERT INTO phone_calls VALUES ('00000000-0000-0000-0000-000000000008');
