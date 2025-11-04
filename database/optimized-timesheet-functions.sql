-- =====================================================
-- OPTIMIZED Timesheet Helper Functions
-- Performance improvements: better indexing, reduced queries, atomic operations
-- =====================================================

-- Optimized function to get or create timesheet (with better error handling)
CREATE OR REPLACE FUNCTION get_or_create_timesheet(
  p_user_id UUID,
  p_week_start DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_timesheet_id UUID;
  v_week_end DATE;
BEGIN
  -- Calculate week end once
  v_week_end := p_week_start + INTERVAL '6 days';
  
  -- Single query with INSERT ... ON CONFLICT (more efficient than SELECT + INSERT)
  INSERT INTO timesheets (user_id, week_start, week_end, status)
  VALUES (p_user_id, p_week_start, v_week_end, 'draft')
  ON CONFLICT (user_id, week_start) 
  DO UPDATE SET week_end = EXCLUDED.week_end
  RETURNING id INTO v_timesheet_id;
  
  RETURN v_timesheet_id;
EXCEPTION
  WHEN OTHERS THEN
    -- If insert fails, try to get existing
    SELECT id INTO v_timesheet_id
    FROM timesheets
    WHERE user_id = p_user_id
      AND week_start = p_week_start
    LIMIT 1;
    
    IF v_timesheet_id IS NULL THEN
      RAISE EXCEPTION 'Failed to get or create timesheet: %', SQLERRM;
    END IF;
    
    RETURN v_timesheet_id;
END;
$$;

-- Optimized function to add timesheet entry (single atomic operation)
CREATE OR REPLACE FUNCTION add_timesheet_entry(
  p_timesheet_id UUID,
  p_project TEXT,
  p_task TEXT,
  p_day_column TEXT,
  p_hours NUMERIC,
  p_source TEXT DEFAULT 'time_clock'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_id UUID;
  v_column_name TEXT;
  v_update_sql TEXT;
BEGIN
  -- Validate day column
  IF p_day_column NOT IN ('mon_hours', 'tue_hours', 'wed_hours', 'thu_hours', 'fri_hours', 'sat_hours', 'sun_hours') THEN
    RAISE EXCEPTION 'Invalid day column: %', p_day_column;
  END IF;

  -- Use single INSERT ... ON CONFLICT ... DO UPDATE for atomic operation
  INSERT INTO timesheet_entries (
    timesheet_id,
    project,
    task,
    source,
    mon_hours,
    tue_hours,
    wed_hours,
    thu_hours,
    fri_hours,
    sat_hours,
    sun_hours
  ) VALUES (
    p_timesheet_id,
    p_project,
    p_task,
    p_source,
    CASE WHEN p_day_column = 'mon_hours' THEN p_hours ELSE 0 END,
    CASE WHEN p_day_column = 'tue_hours' THEN p_hours ELSE 0 END,
    CASE WHEN p_day_column = 'wed_hours' THEN p_hours ELSE 0 END,
    CASE WHEN p_day_column = 'thu_hours' THEN p_hours ELSE 0 END,
    CASE WHEN p_day_column = 'fri_hours' THEN p_hours ELSE 0 END,
    CASE WHEN p_day_column = 'sat_hours' THEN p_hours ELSE 0 END,
    CASE WHEN p_day_column = 'sun_hours' THEN p_hours ELSE 0 END
  )
  ON CONFLICT (timesheet_id, project, task, source) 
  DO UPDATE SET
    mon_hours = CASE 
      WHEN p_day_column = 'mon_hours' THEN timesheet_entries.mon_hours + EXCLUDED.mon_hours
      ELSE timesheet_entries.mon_hours
    END,
    tue_hours = CASE 
      WHEN p_day_column = 'tue_hours' THEN timesheet_entries.tue_hours + EXCLUDED.tue_hours
      ELSE timesheet_entries.tue_hours
    END,
    wed_hours = CASE 
      WHEN p_day_column = 'wed_hours' THEN timesheet_entries.wed_hours + EXCLUDED.wed_hours
      ELSE timesheet_entries.wed_hours
    END,
    thu_hours = CASE 
      WHEN p_day_column = 'thu_hours' THEN timesheet_entries.thu_hours + EXCLUDED.thu_hours
      ELSE timesheet_entries.thu_hours
    END,
    fri_hours = CASE 
      WHEN p_day_column = 'fri_hours' THEN timesheet_entries.fri_hours + EXCLUDED.fri_hours
      ELSE timesheet_entries.fri_hours
    END,
    sat_hours = CASE 
      WHEN p_day_column = 'sat_hours' THEN timesheet_entries.sat_hours + EXCLUDED.sat_hours
      ELSE timesheet_entries.sat_hours
    END,
    sun_hours = CASE 
      WHEN p_day_column = 'sun_hours' THEN timesheet_entries.sun_hours + EXCLUDED.sun_hours
      ELSE timesheet_entries.sun_hours
    END
  RETURNING id INTO v_entry_id;
  
  RETURN v_entry_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to add timesheet entry: %', SQLERRM;
END;
$$;

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_timesheets_user_week 
  ON timesheets(user_id, week_start);

CREATE INDEX IF NOT EXISTS idx_timesheet_entries_timesheet_project_task_source
  ON timesheet_entries(timesheet_id, project, task, source);

-- Add unique constraint if it doesn't exist (for ON CONFLICT to work)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'timesheets_user_week_unique'
  ) THEN
    ALTER TABLE timesheets 
    ADD CONSTRAINT timesheets_user_week_unique 
    UNIQUE (user_id, week_start);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'timesheet_entries_unique'
  ) THEN
    ALTER TABLE timesheet_entries 
    ADD CONSTRAINT timesheet_entries_unique 
    UNIQUE (timesheet_id, project, task, source);
  END IF;
END $$;

-- Update function comments for documentation
COMMENT ON FUNCTION get_or_create_timesheet(UUID, DATE) IS 
  'Optimized function to get or create timesheet atomically. Uses INSERT ON CONFLICT for better performance.';

COMMENT ON FUNCTION add_timesheet_entry(UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT) IS 
  'Optimized function to add or update timesheet entry atomically. Handles both insert and update in single operation.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_timesheet(UUID, DATE) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION add_timesheet_entry(UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT) TO authenticated, anon;

SELECT '✅ Optimized helper functions created with improved performance!' as status;

