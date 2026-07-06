-- =============================================
-- DATABASE: waitless_db
-- Description: Complete database for WaitLess Queue Management System
-- Author: Shadreck Mapuranga (Based on project proposal)
-- =============================================

-- 1. Create and use the database
CREATE DATABASE IF NOT EXISTS waitless_db;
USE waitless_db;

-- =============================================
-- TABLE: staff_users
-- Description: Stores all hospital staff who will use the system.
--             They log in to capture 'assigned_to' automatically.
-- =============================================
CREATE TABLE IF NOT EXISTS staff_users (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Store BCrypt hash here
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'triage_officer', 'nurse', 'doctor', 'pharmacist', 'lab_technician') NOT NULL,
    department VARCHAR(50) NOT NULL, -- e.g., OPD, Casualty, Pharmacy
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insert a default admin user (password: 'admin123').
-- IMPORTANT: In a real deployment, use PHP's password_hash().
-- For this demo, we use a generic BCrypt hash for 'admin123'.
INSERT INTO staff_users (username, password_hash, full_name, role, department) 
VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Admin', 'admin', 'Administration'),
('triage1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Nurse Triage', 'triage_officer', 'Casualty'),
('doctor1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Smith', 'doctor', 'OPD');

-- =============================================
-- TABLE: patients
-- Description: Patient demographic and registration data.
--             NOTE: Email is REMOVED as requested.
--             Phone number is the primary contact for WhatsApp.
-- =============================================
CREATE TABLE IF NOT EXISTS patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female') NOT NULL,
    contact_number VARCHAR(15) NOT NULL, -- Primary for WhatsApp notifications
    
    -- Registration details
    registration_date_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    patient_source ENUM('Walk-in', 'Referred-Clinic', 'Referred-Hospital', 'Private-Practitioner') NOT NULL,
    referring_facility VARCHAR(100) NULL, -- Only filled if referred
    
    -- Unique ticket number for display (e.g., 'PAT-2026-0001')
    ticket_number VARCHAR(20) UNIQUE NOT NULL 
) ENGINE=InnoDB;

-- =============================================
-- TABLE: triage_records
-- Description: Captures the colour-coded assessment (Red/Yellow/Green/Black)
--             and routes the patient accordingly.
-- =============================================
CREATE TABLE IF NOT EXISTS triage_records (
    triage_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    triage_officer_id INT NOT NULL, -- Who performed the triage (FK to staff)
    
    -- Colour-coded priority (per Chinhoyi Provincial Hospital protocol)
    priority_level ENUM('RED', 'YELLOW', 'GREEN', 'BLACK') NOT NULL,
    
    -- Vital signs & clinical data
    blood_pressure VARCHAR(20) NULL, -- e.g., "120/80"
    heart_rate INT NULL, -- bpm
    respiratory_rate INT NULL, -- breaths per minute
    temperature DECIMAL(4,1) NULL, -- Celsius
    oxygen_saturation INT NULL, -- SpO2 percentage
    
    -- Clinical details
    presenting_complaint TEXT NOT NULL,
    triage_notes TEXT NULL,
    
    triage_date_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (triage_officer_id) REFERENCES staff_users(staff_id)
) ENGINE=InnoDB;

-- =============================================
-- TABLE: queue_records
-- Description: Tracks the patient's journey through each department.
--             queue_position is NOT stored here (calculated dynamically).
--             assigned_to is auto-captured via staff login session.
-- =============================================
CREATE TABLE IF NOT EXISTS queue_records (
    queue_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    
    -- Which department queue is this?
    department ENUM('OPD', 'Casualty', 'Pharmacy', 'Lab', 'Radiology', 'OI_Clinic') NOT NULL,
    
    -- Current status of the patient in this queue
    status ENUM('waiting', 'in_progress', 'completed', 'no_show') DEFAULT 'waiting',
    
    -- Staff member currently attending (auto-captured from session when 'Start' is clicked)
    assigned_to INT NULL,
    
    -- =============================================
    -- CRITICAL TIMESTAMPS (For reporting & KPI calculation)
    -- =============================================
    entered_queue_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- Auto-set when patient is routed here
    called_time DATETIME NULL, -- Set when staff clicks "Call Patient" (triggers WhatsApp)
    completed_time DATETIME NULL, -- Set when staff clicks "Finish Consultation"
    
    -- Wait time metrics (stored in MINUTES)
    estimated_wait_time INT NULL, -- Algorithmic guess (e.g., 15 mins)
    actual_wait_time INT NULL, -- Calculated: (completed_time - entered_queue_time) in minutes
    
    -- Foreign Keys
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES staff_users(staff_id)
) ENGINE=InnoDB;

-- Index for faster queue fetching (improves dashboard performance)
CREATE INDEX idx_queue_department_status ON queue_records(department, status);
CREATE INDEX idx_queue_entered_time ON queue_records(entered_queue_time);

-- =============================================
-- TABLE: notifications
-- Description: Logs all WhatsApp/WebPush messages sent to patients.
--             Tracks the 24-hour free conversation window for WhatsApp.
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    queue_id INT NOT NULL, -- Which queue event triggered this?
    
    -- Delivery channel
    channel ENUM('whatsapp', 'webpush') NOT NULL,
    
    -- Message content & metadata
    message_content TEXT NOT NULL,
    sent_date_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivery_status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending',
    
    -- IMPORTANT: For WhatsApp free window tracking (Meta's Service Conversation)
    -- The 24-hour window starts when the patient sends the FIRST message to the hospital.
    conversation_window_start DATETIME NULL, 
    
    -- Error logs if delivery fails
    error_message TEXT NULL,
    
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (queue_id) REFERENCES queue_records(queue_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- TABLE: service_logs
-- Description: Fine-grained logs for each specific service/consultation.
--             Useful for detailed reporting (e.g., "Average lab wait time").
-- =============================================
CREATE TABLE IF NOT EXISTS service_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    queue_record_id INT NOT NULL, -- Link back to the main queue entry
    
    department_visited VARCHAR(50) NOT NULL,
    service_type VARCHAR(50) NOT NULL, -- e.g., 'Consultation', 'Blood Test', 'X-Ray', 'Dispensing'
    
    -- Who provided the service?
    staff_provider_id INT NULL, 
    
    -- Time tracking for this specific service
    time_in DATETIME DEFAULT CURRENT_TIMESTAMP,
    time_out DATETIME NULL,
    duration_minutes INT NULL, -- Calculated: (time_out - time_in)
    
    notes TEXT NULL,
    
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (queue_record_id) REFERENCES queue_records(queue_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_provider_id) REFERENCES staff_users(staff_id)
) ENGINE=InnoDB;

-- =============================================
-- Trigger: Auto-calculate actual_wait_time when completed_time is set
-- =============================================
DELIMITER //
CREATE TRIGGER trg_calc_actual_wait 
BEFORE UPDATE ON queue_records
FOR EACH ROW
BEGIN
    IF NEW.completed_time IS NOT NULL AND OLD.completed_time IS NULL THEN
        -- Calculate actual wait time in minutes (rounded to nearest integer)
        SET NEW.actual_wait_time = TIMESTAMPDIFF(MINUTE, NEW.entered_queue_time, NEW.completed_time);
    END IF;
END //
DELIMITER ;

-- =============================================
-- Trigger: Auto-calculate duration in service_logs when time_out is set
-- =============================================
DELIMITER //
CREATE TRIGGER trg_calc_service_duration 
BEFORE UPDATE ON service_logs
FOR EACH ROW
BEGIN
    IF NEW.time_out IS NOT NULL AND OLD.time_out IS NULL THEN
        SET NEW.duration_minutes = TIMESTAMPDIFF(MINUTE, NEW.time_in, NEW.time_out);
    END IF;
END //
DELIMITER ;

-- =============================================
-- Display confirmation
-- =============================================
SHOW TABLES;