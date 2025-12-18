-- Create chat tables for persistent assistant threads
-- Migration: 002_create_chat_tables.sql

CREATE TABLE IF NOT EXISTS chat_threads (
  id VARCHAR(255) PRIMARY KEY,
  context_key VARCHAR(255) NOT NULL,
  document_id VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_context_key (context_key)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(255) PRIMARY KEY,
  thread_id VARCHAR(255) NOT NULL,
  role ENUM('system','user','assistant') NOT NULL,
  content_text MEDIUMTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_thread_created (thread_id, created_at),
  FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE
);
