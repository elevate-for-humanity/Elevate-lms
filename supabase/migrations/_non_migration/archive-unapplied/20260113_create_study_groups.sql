-- Create study_groups table
CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  max_members INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT true,
  meeting_schedule TEXT,
  meeting_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create study_group_members table
CREATE TABLE IF NOT EXISTS public.study_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(study_group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;

-- Policies for study_groups
CREATE POLICY "Anyone can view public study groups" ON public.study_groups
  FOR SELECT USING (is_public = true);

CREATE POLICY "Members can view their study groups" ON public.study_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members 
      WHERE study_group_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create study groups" ON public.study_groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Group admins can update their groups" ON public.study_groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members 
      WHERE study_group_id = id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for study_group_members
CREATE POLICY "Members can view group membership" ON public.study_group_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.study_group_members sgm
      WHERE sgm.study_group_id = study_group_id AND sgm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join public groups" ON public.study_group_members
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.study_groups 
      WHERE id = study_group_id AND is_public = true
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_study_groups_course ON public.study_groups(course_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON public.study_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON public.study_group_members(study_group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON public.study_group_members(user_id);
