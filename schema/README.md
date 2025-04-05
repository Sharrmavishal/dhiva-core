# Dhiva Schema

This folder contains the canonical SQL schema for the DHIVA project.

## File: `dhiva_schema_FINAL_FOR_SUPABASE.sql`

- ✅ This is the final, validated schema applied to Supabase.
- 🛠️ It includes all enhancements from Manus' audit, including:
  - Foreign key integrity
  - Multilingual + multi-PDF logic
  - Self-paced WA/email delivery support
  - Conflict resolution and future AI-ready fields
- 🔐 Use this as the **source of truth** for all future schema updates.

## Usage Instructions

To apply this schema manually in Supabase:

1. Go to Supabase SQL Editor
2. Paste the contents of `dhiva_schema_FINAL_FOR_SUPABASE.sql`
3. Run the SQL to apply or reapply the schema

## Notes

- Only modify this file if schema changes are approved.
- When updating, use new versioned filenames (e.g., `dhiva_schema_v2.sql`)
