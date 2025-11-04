-- =====================================================
-- Create Helper Functions to Bypass RLS Recursion
-- These functions run with SECURITY DEFINER to avoid RLS recursion issues
-- =====================================================

-- Function to get or create timesheet (bypasses RLS)
CREATE OR REPLACE FUNCTION get_or_create_timesheet(
  p_user_id UUID,
  p_week_start DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_timesheet_id UUID;
  v_week_end DATE;
BEGIN
  -- Calculate week end
  v_week_end := p_week_start + INTERVAL '6 days';
  
  -- Try to find existing timesheet
  SELECT id INTO v_timesheet_id
  FROM timesheets
  WHERE user_id = p_user_id
    AND week_start = p_week_start
  LIMIT 1;
  
  -- If not found, create it
  IF v_timesheet_id IS NULL THEN
    INSERT INTO timesheets (user_id, week_start, week_end, status)
    VALUES (p_user_id, p_week_start, v_week_end, 'draft')
    RETURNING id INTO v_timesheet_id;
  END IF;
  
  RETURN v_timesheet_id;
END;
$$;

-- Function to add timesheet entry (bypasses RLS)
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
  v_existing_entry_id UUID;
  v_current_hours NUMERIC;
  v_update_data JSONB;
BEGIN
  -- Check if entry already exists
  SELECT id INTO v_existing_entry_id
  FROM timesheet_entries
  WHERE timesheet_id = p_timesheet_id
    AND project = p_project
    AND task = p_task
    AND source = p_source
  LIMIT 1;
  
  IF v_existing_entry_id IS NOT NULL THEN
    -- Update existing entry
    SELECT COALESCE((entry->>p_day_column)::NUMERIC, 0) INTO v_current_hours
    FROM (
      SELECT to_jsonb(te.*) as entry
      FROM timesheet_entries te
      WHERE te.id = v_existing_entry_id
    ) sub;
    
    v_update_data := jsonb_build_object(
      p_day_column, v_current_hours + p_hours
    );
    
    UPDATE timesheet_entries
    SET 
      mon_hours = CASE WHEN p_day_column = 'mon_hours' THEN v_current_hours + p_hours ELSE mon_hours END,
      tue_hours = CASE WHEN p_day_column = 'tue_hours' THEN v_current_hours + p_hours ELSE tue_hours END,
      wed_hours = CASE WHEN p_day_column = 'wed_hours' THEN v_current_hours + p_hours ELSE wed_hours END,
      thu_hours = CASE WHEN p_day_column = 'thu_hours' THEN v_current_hours + p_hours ELSE thu_hours END,
      fri_hours = CASE WHEN p_day_column = 'fri_hours' THEN v_current_hours + p_hours ELSE fri_hours END,
      sat_hours = CASE WHEN p_day_column = 'sat_hours' THEN v_current_hours + p_hours ELSE sat_hours END,
      sun_hours = CASE WHEN p_day_column = 'sun_hours' THEN v_current_hours + p_hours ELSE sun_hours END
    WHERE id = v_existing_entry_id;
    
    RETURN v_existing_entry_id;
  ELSE
    -- Create new entry
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
    RETURNING id INTO v_entry_id;
    
    RETURN v_entry_id;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_timesheet(UUID, DATE) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION add_timesheet_entry(UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT) TO authenticated, anon;

SELECT '✅ Helper functions created! Use these to bypass RLS recursion.' as status;

