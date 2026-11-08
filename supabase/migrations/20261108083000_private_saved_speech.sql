-- Generated narration is private; only the server service role accesses it.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('speech-cache','speech-cache',false,8388608,array['audio/mpeg'])
on conflict(id) do nothing;
do $$ begin
  if not exists(select 1 from storage.buckets where id='speech-cache' and public=false and file_size_limit=8388608 and allowed_mime_types=array['audio/mpeg']) then
    raise exception 'SPEECH_CACHE_BUCKET_CONFIGURATION_MISMATCH';
  end if;
end $$;
