-- Add consent tracking fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  accepted_terms_at timestamptz;

-- Create consent_logs table
CREATE TABLE IF NOT EXISTS consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN ('terms', 'privacy', 'ai', 'whatsapp')),
  timestamp timestamptz DEFAULT now(),
  details jsonb
);

-- Enable RLS
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consent_logs
CREATE POLICY "Users can read own consent logs"
  ON consent_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent logs"
  ON consent_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add creator consent fields to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS
  creator_consent boolean DEFAULT false;

ALTER TABLE courses ADD COLUMN IF NOT EXISTS
  public_optin boolean DEFAULT false;