-- Add AI trust fields to microlearnings table
ALTER TABLE microlearnings ADD COLUMN IF NOT EXISTS
  source_type text NOT NULL DEFAULT 'ai_only'
  CHECK (source_type IN ('pdf', 'user_input', 'org_upload', 'ai_only'));

ALTER TABLE microlearnings ADD COLUMN IF NOT EXISTS
  generated_by text NOT NULL DEFAULT 'openai'
  CHECK (generated_by IN ('openai', 'claude', 'hybrid'));

ALTER TABLE microlearnings ADD COLUMN IF NOT EXISTS
  confidence_score float CHECK (confidence_score BETWEEN 0 AND 1);

-- Create content_flags table for user feedback
CREATE TABLE IF NOT EXISTS content_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  microlearning_id uuid NOT NULL REFERENCES microlearnings(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN ('thumbs_up', 'thumbs_down', 'flag')),
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE content_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_flags
CREATE POLICY "Users can flag content"
  ON content_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own flags"
  ON content_flags
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_content_flags_microlearning
  ON content_flags(microlearning_id);