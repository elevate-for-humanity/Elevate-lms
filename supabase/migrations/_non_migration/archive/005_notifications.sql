-- Notifications table for user notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  message text not null,
  type text not null default 'info', -- info, success, warning, error
  read boolean default false,
  link text,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_created_at on notifications(created_at desc);

-- Enable RLS
alter table notifications enable row level security;

-- Users can only see their own notifications
create policy "notifications by owner" on notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notification preferences table
create table if not exists notification_preferences (
  user_id uuid primary key,
  email_notifications boolean default true,
  push_notifications boolean default true,
  sms_notifications boolean default false,
  course_updates boolean default true,
  grade_updates boolean default true,
  payment_updates boolean default true,
  marketing_emails boolean default false,
  updated_at timestamptz default now()
);

-- Enable RLS
alter table notification_preferences enable row level security;

-- Users can only manage their own preferences
create policy "preferences by owner" on notification_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Insert sample notifications
insert into notifications (user_id, title, message, type, link) values
  ('00000000-0000-0000-0000-000000000000', 'Welcome to Elevate for Humanity!', 'Start your learning journey today.', 'success', '/lms'),
  ('00000000-0000-0000-0000-000000000000', 'New Course Available', 'Check out our latest CNA/HHA program.', 'info', '/programs/cna-hha')
on conflict do nothing;
