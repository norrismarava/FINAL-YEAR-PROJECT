CREATE TABLE IF NOT EXISTS departments (
  name VARCHAR(80) PRIMARY KEY,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS system_counters (
  name VARCHAR(80) PRIMARY KEY,
  value BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  id CHAR(36) PRIMARY KEY,
  ticket_code VARCHAR(20) NOT NULL UNIQUE,
  sequence_number INT NOT NULL,
  patient_name VARCHAR(160) NOT NULL,
  national_id VARCHAR(80) NOT NULL DEFAULT '',
  dob DATE NULL,
  gender VARCHAR(40) NOT NULL DEFAULT 'unknown',
  phone VARCHAR(80) NOT NULL DEFAULT '',
  address VARCHAR(255) NOT NULL DEFAULT '',
  patient_category VARCHAR(80) NOT NULL DEFAULT 'walk-in',
  next_of_kin_name VARCHAR(160) NOT NULL DEFAULT '',
  next_of_kin_phone VARCHAR(80) NOT NULL DEFAULT '',
  notification_consent BOOLEAN NOT NULL DEFAULT FALSE,
  department VARCHAR(80) NOT NULL,
  chief_complaint TEXT NULL,
  priority VARCHAR(20) NOT NULL,
  status VARCHAR(30) NOT NULL,
  registered_at DATETIME(3) NOT NULL,
  triaged_at DATETIME(3) NULL,
  called_at DATETIME(3) NULL,
  service_started_at DATETIME(3) NULL,
  missed_at DATETIME(3) NULL,
  recalled_at DATETIME(3) NULL,
  transferred_at DATETIME(3) NULL,
  previous_department VARCHAR(80) NOT NULL DEFAULT '',
  recall_count INT NOT NULL DEFAULT 0,
  completed_at DATETIME(3) NULL,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_tickets_department_status (department, status),
  INDEX idx_tickets_priority_status (priority, status),
  INDEX idx_tickets_registered_at (registered_at),
  CONSTRAINT fk_tickets_department FOREIGN KEY (department) REFERENCES departments(name)
);

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  sequence_number BIGINT NOT NULL UNIQUE,
  ticket_id CHAR(36) NOT NULL,
  ticket_code VARCHAR(20) NOT NULL,
  patient_name VARCHAR(160) NOT NULL,
  department VARCHAR(80) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  channel VARCHAR(40) NOT NULL,
  type VARCHAR(80) NOT NULL,
  status VARCHAR(40) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  recipient VARCHAR(160) NOT NULL,
  destination VARCHAR(160) NULL,
  provider VARCHAR(80) NULL,
  provider_message_id VARCHAR(160) NULL,
  created_at DATETIME(3) NOT NULL,
  sent_at DATETIME(3) NULL,
  delivered_at DATETIME(3) NULL,
  last_attempt_at DATETIME(3) NULL,
  next_retry_at DATETIME(3) NULL,
  error_code VARCHAR(80) NULL,
  error_message TEXT NULL,
  max_attempts INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_notifications_ticket_id (ticket_id),
  INDEX idx_notifications_status (status),
  INDEX idx_notifications_channel (channel),
  INDEX idx_notifications_provider_message_id (provider_message_id),
  INDEX idx_notifications_created_at (created_at),
  CONSTRAINT fk_notifications_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

CREATE TABLE IF NOT EXISTS notification_attempts (
  notification_id CHAR(36) NOT NULL,
  sequence_number INT NOT NULL,
  status VARCHAR(40) NOT NULL,
  attempted_at DATETIME(3) NOT NULL,
  completed_at DATETIME(3) NULL,
  provider_message_id VARCHAR(160) NULL,
  error_code VARCHAR(80) NULL,
  error_message TEXT NULL,
  PRIMARY KEY (notification_id, sequence_number),
  CONSTRAINT fk_notification_attempts_notification FOREIGN KEY (notification_id)
    REFERENCES notifications(id)
    ON DELETE CASCADE
);
