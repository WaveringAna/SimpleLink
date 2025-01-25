-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

-- Create links table with user_id from the start
CREATE TABLE links (
    id SERIAL PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code VARCHAR(8) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    clicks BIGINT NOT NULL DEFAULT 0,
    user_id INTEGER REFERENCES users(id)
);

-- Create clicks table for tracking
CREATE TABLE clicks (
    id SERIAL PRIMARY KEY,
    link_id INTEGER REFERENCES links(id),
    source TEXT,
    query_source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_short_code ON links(short_code);
CREATE INDEX idx_user_id ON links(user_id);
CREATE INDEX idx_link_id ON clicks(link_id);