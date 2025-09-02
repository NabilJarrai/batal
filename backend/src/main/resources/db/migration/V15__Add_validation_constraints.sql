-- V15: Add additional validation constraints to membership tables
-- Add explicit check constraint for payments to ensure paid_amount <= total_amount in memberships
ALTER TABLE memberships 
ADD CONSTRAINT chk_membership_payment_amount 
CHECK (paid_amount <= total_amount);

-- Add index for improving membership status queries
CREATE INDEX idx_membership_status ON memberships(status);
CREATE INDEX idx_membership_dates ON memberships(start_date, end_date);
