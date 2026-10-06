-- =============================================
-- MIGRATION: Sessions and Password Reset Tokens
-- Description: Replace in-memory Map storage with persistent MySQL tables
-- =============================================

USE waitless;

-- =============================================
-- TABLE: staff_sessions
-- Description: Persistent staff session tokens with expiry and revocation
-- =============================================
CREATE TABLE IF NOT EXISTS staff_sessions (
    id VARCHAR(36) PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    staff_id VARCHAR(36) NOT NULL,
    user_data JSON NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME NULL,
    INDEX idx_token (token),
    INDEX idx_staff_id (staff_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_revoked_at (revoked_at)
) ENGINE=InnoDB;

-- =============================================
-- TABLE: patient_sessions
-- Description: Persistent patient session tokens with expiry and revocation
-- =============================================
CREATE TABLE IF NOT EXISTS patient_sessions (
    id VARCHAR(36) PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    user_data JSON NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME NULL,
    INDEX idx_token (token),
    INDEX idx_patient_id (patient_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_revoked_at (revoked_at)
) ENGINE=InnoDB;

-- =============================================
-- TABLE: password_reset_tokens
-- Description: Single-use password reset tokens with expiry
-- =============================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(36) PRIMARY KEY,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(120) NOT NULL,
    staff_id VARCHAR(36) NULL,
    used_at DATETIME NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token_hash (token_hash),
    INDEX idx_email (email),
    INDEX idx_staff_id (staff_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
SELECT 'Sessions and password reset tables created successfully!' AS message;
