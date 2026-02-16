-- Autopilot Phase 5: Performance Profiling and Query Analysis
-- Track slow queries, analyze performance bottlenecks, and provide optimization suggestions

-- Query performance log
CREATE TABLE IF NOT EXISTS automation.query_performance (
  id BIGSERIAL PRIMARY KEY,
  query_hash TEXT NOT NULL,
  query_text TEXT NOT NULL,
  execution_time_ms NUMERIC NOT NULL,
  rows_returned INTEGER,
  rows_affected INTEGER,
  
  -- Query metadata
  query_type TEXT CHECK (query_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'OTHER')),
  table_name TEXT,
  index_used BOOLEAN,
  
  -- Performance metrics
  planning_time_ms NUMERIC,
  execution_plan JSONB,
  buffer_hits INTEGER,
  buffer_misses INTEGER,
  
  -- Context
  source TEXT, -- 'migration', 'api', 'function', 'manual'
  user_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance recommendations
CREATE TABLE IF NOT EXISTS automation.performance_recommendations (
  id BIGSERIAL PRIMARY KEY,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
    'add_index',
    'optimize_query',
    'partition_table',
    'vacuum_table',
    'update_statistics',
    'increase_cache',
    'refactor_query'
  )),
  
  -- Target
  table_name TEXT,
  column_names TEXT[],
  query_hash TEXT,
  
  -- Recommendation details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT CHECK (impact IN ('low', 'medium', 'high', 'critical')),
  estimated_improvement_pct NUMERIC,
  
  -- Implementation
  sql_command TEXT,
  implemented BOOLEAN DEFAULT false,
  implemented_at TIMESTAMPTZ,
  implemented_by UUID REFERENCES auth.users(id),
  
  -- Validation
  before_avg_time_ms NUMERIC,
  after_avg_time_ms NUMERIC,
  actual_improvement_pct NUMERIC,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table statistics
CREATE TABLE IF NOT EXISTS automation.table_statistics (
  id BIGSERIAL PRIMARY KEY,
  schema_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  
  -- Size metrics
  total_size_bytes BIGINT,
  table_size_bytes BIGINT,
  indexes_size_bytes BIGINT,
  row_count BIGINT,
  
  -- Performance metrics
  seq_scan_count BIGINT,
  seq_tup_read BIGINT,
  idx_scan_count BIGINT,
  idx_tup_fetch BIGINT,
  
  -- Bloat metrics
  bloat_pct NUMERIC,
  dead_tuples BIGINT,
  
  -- Last maintenance
  last_vacuum TIMESTAMPTZ,
  last_analyze TIMESTAMPTZ,
  last_autovacuum TIMESTAMPTZ,
  last_autoanalyze TIMESTAMPTZ,
  
  -- Snapshot timestamp
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(schema_name, table_name, snapshot_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_query_performance_hash ON automation.query_performance(query_hash);
CREATE INDEX IF NOT EXISTS idx_query_performance_time ON automation.query_performance(execution_time_ms DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_executed ON automation.query_performance(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_implemented ON automation.performance_recommendations(implemented) WHERE implemented = false;
CREATE INDEX IF NOT EXISTS idx_table_stats_snapshot ON automation.table_statistics(snapshot_at DESC);

-- Function to log query performance
CREATE OR REPLACE FUNCTION automation.log_query_performance(
  p_query_text TEXT,
  p_execution_time_ms NUMERIC,
  p_rows_returned INTEGER DEFAULT NULL,
  p_source TEXT DEFAULT 'manual',
  p_execution_plan JSONB DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_query_hash TEXT;
  v_query_type TEXT;
  v_table_name TEXT;
  v_log_id BIGINT;
BEGIN
  -- Generate query hash
  v_query_hash := md5(p_query_text);
  
  -- Determine query type
  v_query_type := CASE
    WHEN p_query_text ILIKE 'SELECT%' THEN 'SELECT'
    WHEN p_query_text ILIKE 'INSERT%' THEN 'INSERT'
    WHEN p_query_text ILIKE 'UPDATE%' THEN 'UPDATE'
    WHEN p_query_text ILIKE 'DELETE%' THEN 'DELETE'
    ELSE 'OTHER'
  END;
  
  -- Extract table name (simple regex)
  v_table_name := (regexp_matches(p_query_text, 'FROM\s+([a-zA-Z0-9_.]+)', 'i'))[1];
  
  -- Insert log entry
  INSERT INTO automation.query_performance (
    query_hash,
    query_text,
    execution_time_ms,
    rows_returned,
    query_type,
    table_name,
    source,
    execution_plan
  ) VALUES (
    v_query_hash,
    p_query_text,
    p_execution_time_ms,
    p_rows_returned,
    v_query_type,
    v_table_name,
    p_source,
    p_execution_plan
  )
  RETURNING id INTO v_log_id;
  
  -- Check if this is a slow query (> 1 second)
  IF p_execution_time_ms > 1000 THEN
    -- Log as health event
    INSERT INTO automation.health_log (
      source,
      kind,
      status,
      response_time_ms,
      detail,
      metadata
    ) VALUES (
      'profiling',
      'db',
      'warn',
      p_execution_time_ms::INTEGER,
      format('Slow query detected: %s ms', p_execution_time_ms),
      jsonb_build_object(
        'query_hash', v_query_hash,
        'query_type', v_query_type,
        'table_name', v_table_name,
        'log_id', v_log_id
      )
    );
  END IF;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to analyze slow queries and generate recommendations
CREATE OR REPLACE FUNCTION automation.analyze_slow_queries()
RETURNS TABLE(
  query_hash TEXT,
  avg_time_ms NUMERIC,
  execution_count BIGINT,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH slow_queries AS (
    SELECT 
      qp.query_hash,
      qp.query_text,
      qp.table_name,
      AVG(qp.execution_time_ms) as avg_time,
      COUNT(*) as exec_count,
      MAX(qp.execution_time_ms) as max_time,
      BOOL_OR(qp.index_used) as has_index
    FROM automation.query_performance qp
    WHERE qp.executed_at > NOW() - INTERVAL '24 hours'
    AND qp.execution_time_ms > 100 -- Only queries > 100ms
    GROUP BY qp.query_hash, qp.query_text, qp.table_name
    HAVING COUNT(*) > 5 -- Only frequently executed queries
  )
  SELECT 
    sq.query_hash,
    sq.avg_time,
    sq.exec_count,
    CASE
      WHEN sq.has_index = false AND sq.table_name IS NOT NULL THEN
        format('Consider adding an index on table %s', sq.table_name)
      WHEN sq.avg_time > 1000 THEN
        'Query is very slow - consider refactoring or caching'
      WHEN sq.avg_time > 500 THEN
        'Query could be optimized - review execution plan'
      ELSE
        'Monitor query performance'
    END as recommendation
  FROM slow_queries sq
  ORDER BY sq.avg_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to collect table statistics
CREATE OR REPLACE FUNCTION automation.collect_table_statistics()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_table RECORD;
BEGIN
  -- Collect statistics for all tables in lms schema
  FOR v_table IN
    SELECT 
      schemaname,
      tablename
    FROM pg_tables
    WHERE schemaname IN ('lms', 'automation', 'public')
  LOOP
    INSERT INTO automation.table_statistics (
      schema_name,
      table_name,
      total_size_bytes,
      table_size_bytes,
      indexes_size_bytes,
      row_count,
      seq_scan_count,
      seq_tup_read,
      idx_scan_count,
      idx_tup_fetch,
      last_vacuum,
      last_analyze,
      last_autovacuum,
      last_autoanalyze
    )
    SELECT
      v_table.schemaname,
      v_table.tablename,
      pg_total_relation_size(quote_ident(v_table.schemaname) || '.' || quote_ident(v_table.tablename)),
      pg_relation_size(quote_ident(v_table.schemaname) || '.' || quote_ident(v_table.tablename)),
      pg_indexes_size(quote_ident(v_table.schemaname) || '.' || quote_ident(v_table.tablename)),
      (SELECT reltuples::BIGINT FROM pg_class WHERE oid = (quote_ident(v_table.schemaname) || '.' || quote_ident(v_table.tablename))::regclass),
      COALESCE(s.seq_scan, 0),
      COALESCE(s.seq_tup_read, 0),
      COALESCE(s.idx_scan, 0),
      COALESCE(s.idx_tup_fetch, 0),
      s.last_vacuum,
      s.last_analyze,
      s.last_autovacuum,
      s.last_autoanalyze
    FROM pg_stat_user_tables s
    WHERE s.schemaname = v_table.schemaname
    AND s.relname = v_table.tablename;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate performance recommendations
CREATE OR REPLACE FUNCTION automation.generate_recommendations()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_stat RECORD;
BEGIN
  -- Recommendation 1: Tables with high sequential scans and no indexes
  FOR v_stat IN
    SELECT 
      schema_name,
      table_name,
      seq_scan_count,
      idx_scan_count,
      row_count
    FROM automation.table_statistics
    WHERE snapshot_at > NOW() - INTERVAL '1 hour'
    AND seq_scan_count > 100
    AND (idx_scan_count = 0 OR seq_scan_count > idx_scan_count * 10)
    AND row_count > 1000
  LOOP
    INSERT INTO automation.performance_recommendations (
      recommendation_type,
      table_name,
      title,
      description,
      impact,
      estimated_improvement_pct
    ) VALUES (
      'add_index',
      v_stat.table_name,
      format('Add index to %s', v_stat.table_name),
      format('Table has %s sequential scans but only %s index scans. Consider adding indexes on frequently queried columns.',
        v_stat.seq_scan_count, v_stat.idx_scan_count),
      'high',
      50
    )
    ON CONFLICT DO NOTHING;
    
    v_count := v_count + 1;
  END LOOP;
  
  -- Recommendation 2: Tables needing VACUUM
  FOR v_stat IN
    SELECT 
      schema_name,
      table_name,
      last_vacuum,
      last_autovacuum,
      row_count
    FROM automation.table_statistics
    WHERE snapshot_at > NOW() - INTERVAL '1 hour'
    AND row_count > 10000
    AND (last_vacuum IS NULL OR last_vacuum < NOW() - INTERVAL '7 days')
    AND (last_autovacuum IS NULL OR last_autovacuum < NOW() - INTERVAL '7 days')
  LOOP
    INSERT INTO automation.performance_recommendations (
      recommendation_type,
      table_name,
      title,
      description,
      impact,
      sql_command
    ) VALUES (
      'vacuum_table',
      v_stat.table_name,
      format('VACUUM %s', v_stat.table_name),
      format('Table has not been vacuumed in over 7 days. Last vacuum: %s',
        COALESCE(v_stat.last_vacuum::TEXT, 'never')),
      'medium',
      format('VACUUM ANALYZE %s.%s;', v_stat.schema_name, v_stat.table_name)
    )
    ON CONFLICT DO NOTHING;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for slow query summary
CREATE OR REPLACE VIEW automation.slow_queries_summary AS
SELECT 
  query_hash,
  query_type,
  table_name,
  COUNT(*) as execution_count,
  AVG(execution_time_ms) as avg_time_ms,
  MIN(execution_time_ms) as min_time_ms,
  MAX(execution_time_ms) as max_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_time_ms,
  MAX(executed_at) as last_executed
FROM automation.query_performance
WHERE executed_at > NOW() - INTERVAL '24 hours'
GROUP BY query_hash, query_type, table_name
HAVING AVG(execution_time_ms) > 100
ORDER BY avg_time_ms DESC;

-- View for table health
CREATE OR REPLACE VIEW automation.table_health AS
WITH latest_stats AS (
  SELECT DISTINCT ON (schema_name, table_name)
    *
  FROM automation.table_statistics
  ORDER BY schema_name, table_name, snapshot_at DESC
)
SELECT 
  schema_name,
  table_name,
  pg_size_pretty(total_size_bytes) as total_size,
  row_count,
  CASE
    WHEN seq_scan_count > 0 AND idx_scan_count = 0 THEN 'No indexes used'
    WHEN seq_scan_count > idx_scan_count * 10 THEN 'Mostly sequential scans'
    ELSE 'Good index usage'
  END as index_health,
  CASE
    WHEN last_vacuum < NOW() - INTERVAL '7 days' OR last_vacuum IS NULL THEN 'Needs VACUUM'
    WHEN last_vacuum < NOW() - INTERVAL '3 days' THEN 'VACUUM soon'
    ELSE 'Recently vacuumed'
  END as vacuum_health,
  last_vacuum,
  last_analyze
FROM latest_stats
ORDER BY total_size_bytes DESC;

-- Grant permissions
GRANT SELECT ON automation.query_performance TO authenticated;
GRANT SELECT ON automation.performance_recommendations TO authenticated;
GRANT SELECT ON automation.table_statistics TO authenticated;
GRANT SELECT ON automation.slow_queries_summary TO authenticated;
GRANT SELECT ON automation.table_health TO authenticated;
GRANT EXECUTE ON FUNCTION automation.log_query_performance TO service_role;
GRANT EXECUTE ON FUNCTION automation.analyze_slow_queries TO service_role;
GRANT EXECUTE ON FUNCTION automation.collect_table_statistics TO service_role;
GRANT EXECUTE ON FUNCTION automation.generate_recommendations TO service_role;

-- Comments
COMMENT ON TABLE automation.query_performance IS 'Detailed query performance metrics';
COMMENT ON TABLE automation.performance_recommendations IS 'AI-generated performance optimization recommendations';
COMMENT ON TABLE automation.table_statistics IS 'Historical table statistics for trend analysis';
COMMENT ON FUNCTION automation.log_query_performance IS 'Log query execution metrics';
COMMENT ON FUNCTION automation.analyze_slow_queries IS 'Analyze slow queries and generate recommendations';
COMMENT ON FUNCTION automation.collect_table_statistics IS 'Collect current statistics for all tables';
COMMENT ON FUNCTION automation.generate_recommendations IS 'Generate performance recommendations based on statistics';
