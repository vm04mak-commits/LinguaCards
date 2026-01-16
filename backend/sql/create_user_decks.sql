-- Create user_decks table for tracking user's subscribed decks
CREATE TABLE IF NOT EXISTS user_decks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    deck_id BIGINT REFERENCES decks(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    cards_studied_today INTEGER DEFAULT 0,
    cards_due_today INTEGER DEFAULT 0,
    total_cards_studied INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    last_studied_at TIMESTAMP,
    UNIQUE (user_id, deck_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_decks_user ON user_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_active ON user_decks(user_id, is_active);
