alter table public.communication_sms_messages add column media jsonb not null default '[]'::jsonb check (jsonb_typeof(media)='array' and jsonb_array_length(media)<=10);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('communication-sms-media','communication-sms-media',false,3145728,array['image/jpeg','image/png','image/gif']);
