-- Add priority column to tasks
ALTER TABLE tasks ADD COLUMN priority INTEGER DEFAULT 0;

-- Function to atomically claim the highest priority task for an agent
CREATE OR REPLACE FUNCTION claim_next_task(p_business_id UUID, p_agent_id UUID)
RETURNS SETOF tasks AS $$
DECLARE
    claimed_task tasks%ROWTYPE;
BEGIN
    SELECT * INTO claimed_task
    FROM tasks
    WHERE business_id = p_business_id
      AND status IN ('queued', 'pending')
    ORDER BY priority DESC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    IF FOUND THEN
        UPDATE tasks
        SET status = 'running',
            agent_id = p_agent_id,
            updated_at = NOW()
        WHERE id = claimed_task.id
        RETURNING * INTO claimed_task;
        
        RETURN NEXT claimed_task;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;
