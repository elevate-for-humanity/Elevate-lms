CREATE UNIQUE INDEX IF NOT EXISTS ai_repo_index_repo_path_uidx
  ON public.ai_repo_index (repo_path);
