-- Migration: Add 'cancelled' status to borrow_records
-- This allows users to cancel pending borrow requests

ALTER TABLE borrow_records
  DROP CONSTRAINT IF EXISTS borrow_records_status_check,
  ADD CONSTRAINT borrow_records_status_check
    CHECK (status IN ('borrowed','returned','overdue','lost','pending','rejected','cancelled'));
