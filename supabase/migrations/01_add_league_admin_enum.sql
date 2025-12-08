-- Part 1: Add league_admin to the user_role enum type
-- This MUST be run in a separate transaction before the rest

DO $$
BEGIN
  -- Check if the enum value already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'league_admin'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    -- Add the new enum value
    ALTER TYPE user_role ADD VALUE 'league_admin';
  END IF;
END $$;
