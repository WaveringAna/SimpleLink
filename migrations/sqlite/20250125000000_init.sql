-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- Add Migration Version
CREATE TABLE IF NOT EXISTS _sqlx_migrations (
    version INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    installed_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

-- Create links table
CREATE TABLE links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_url TEXT NOT NULL,
    short_code VARCHAR(8) NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    clicks INTEGER NOT NULL DEFAULT 0,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create clicks table
CREATE TABLE clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id INTEGER,
    source TEXT,
    query_source TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (link_id) REFERENCES links(id)
);

-- Create indexes
CREATE INDEX idx_short_code ON links(short_code);
CREATE INDEX idx_user_id ON links(user_id);
CREATE INDEX idx_link_id ON clicks(link_id);
