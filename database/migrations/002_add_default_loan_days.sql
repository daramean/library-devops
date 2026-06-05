-- Add default_loan_days column to books with a sensible default
ALTER TABLE books ADD COLUMN IF NOT EXISTS default_loan_days integer DEFAULT 14;
