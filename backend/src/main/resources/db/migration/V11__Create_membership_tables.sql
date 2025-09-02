-- V11: Create membership and payment tables
CREATE TABLE membership_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    sessions INTEGER NOT NULL CHECK (sessions > 0),
    discount_type VARCHAR(50),
    discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create memberships table
CREATE TABLE memberships (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL,
    membership_type_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED')),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    paid_amount DECIMAL(10,2) DEFAULT 0 CHECK (paid_amount >= 0),
    remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    sessions_remaining INTEGER DEFAULT 0 CHECK (sessions_remaining >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_membership_player FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_membership_type FOREIGN KEY (membership_type_id) REFERENCES membership_types(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_membership_dates CHECK (end_date > start_date),
    CONSTRAINT chk_paid_amount CHECK (paid_amount <= total_amount)
);

-- Create payments table
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    membership_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PAID', 'PENDING', 'OVERDUE', 'CANCELLED', 'REFUNDED')),
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    erpnext_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_payment_membership FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE
);

-- Create indexes for membership tables
CREATE INDEX idx_membership_types_is_active ON membership_types(is_active);
CREATE INDEX idx_memberships_player_id ON memberships(player_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_memberships_dates ON memberships(start_date, end_date);
CREATE INDEX idx_payments_membership_id ON payments(membership_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_erpnext_id ON payments(erpnext_id);

-- Insert default membership types
INSERT INTO membership_types (name, description, price, sessions, discount_type, discount_percentage) VALUES
('Monthly Basic', 'Basic monthly membership for development level', 100.00, 8, 'NONE', 0),
('Monthly Premium', 'Premium monthly membership for advanced level', 150.00, 12, 'NONE', 0),
('Quarterly Basic', 'Quarterly membership for development level', 270.00, 24, 'EARLY_PAYMENT', 10),
('Quarterly Premium', 'Quarterly membership for advanced level', 405.00, 36, 'EARLY_PAYMENT', 10),
('Annual Basic', 'Annual membership for development level', 960.00, 96, 'FAMILY', 20),
('Annual Premium', 'Annual membership for advanced level', 1440.00, 144, 'FAMILY', 20);
