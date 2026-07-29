-- Add new columns to cost_records
ALTER TABLE cost_records ADD COLUMN input_tokens INTEGER DEFAULT 0;
ALTER TABLE cost_records ADD COLUMN output_tokens INTEGER DEFAULT 0;
ALTER TABLE cost_records ADD COLUMN record_type TEXT NOT NULL DEFAULT 'unknown';
