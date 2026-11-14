insert into public.platform_settings(key, value, is_secret, is_active, updated_at)
values ('AI_TRANSCRIPTION_MODEL', 'whisper-1', false, true, now())
on conflict (key) do update
set value = excluded.value,
    is_secret = false,
    is_active = true,
    updated_at = now();
