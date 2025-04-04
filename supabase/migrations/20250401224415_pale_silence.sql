/*
  # Insert test data for QA

  1. Test Data Creation
    - Insert test user in auth.users
    - Create test topic
    - Add test preferences
    - Create test microlearning
    - Add test consent log

  2. Data Structure
    - All records use fixed UUIDs for consistency
    - Data matches production schema
    - Includes all required fields
*/

-- Insert test user (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000'
  ) THEN
    INSERT INTO auth.users (
      id,
      email,
      created_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'test@dhiva.co',
      now()
    );
  END IF;
END $$;

-- Insert test topic
INSERT INTO topics (
  id,
  name,
  user_id,
  competency_level,
  created_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Safe Hygiene',
  '00000000-0000-0000-0000-000000000000',
  'intermediate',
  now()
);

-- Insert test preferences
INSERT INTO preferences (
  id,
  email,
  phone_number,
  delivery_modes,
  frequency,
  custom_days,
  time_of_day,
  consent_given,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'test@dhiva.co',
  '+1234567890',
  ARRAY['whatsapp'::text],
  'daily',
  ARRAY['monday'::text, 'tuesday'::text],
  'morning',
  true,
  now()
);

-- Insert test microlearning
INSERT INTO microlearnings (
  id,
  topic_id,
  day_number,
  type,
  content,
  status,
  scheduled_for,
  source_type,
  generated_by,
  confidence_score
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  1,
  'summary',
  'Sample learning content for test: Understanding proper hand hygiene is crucial for preventing the spread of infections. The WHO recommends washing hands for at least 20 seconds with soap and water, making sure to clean between fingers and under nails.',
  'pending',
  now() + interval '1 day',
  'ai_only',
  'openai',
  0.92
);

-- Insert test consent log
INSERT INTO content_flags (
  id,
  microlearning_id,
  user_id,
  type,
  reason,
  created_at
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'thumbs_up',
  'Good explanation of hand hygiene',
  now()
);