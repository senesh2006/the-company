-- Add hierarchical task fields for LangGraph DAG
ALTER TABLE tasks ADD COLUMN parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN dependencies UUID[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN result TEXT;
ALTER TABLE tasks ADD COLUMN assignee_role TEXT;
