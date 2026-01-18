-- LinguaCards Database Schema
-- Run this in Neon SQL Editor

-- Users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    language_code VARCHAR(10) DEFAULT 'ru',
    is_premium BOOLEAN DEFAULT FALSE,
    premium_until TIMESTAMP,
    daily_cards_limit INTEGER DEFAULT 20,
    daily_translations INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Decks table
CREATE TABLE decks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    emoji VARCHAR(10),
    is_public BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    price_stars INTEGER DEFAULT 0,
    owner_id BIGINT REFERENCES users(id),
    cards_count INTEGER DEFAULT 0,
    category VARCHAR(100),
    difficulty VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_decks_public ON decks(is_public);
CREATE INDEX idx_decks_system ON decks(is_system);
CREATE INDEX idx_decks_owner ON decks(owner_id);
CREATE INDEX idx_decks_category ON decks(category);

-- Cards table
CREATE TABLE cards (
    id BIGSERIAL PRIMARY KEY,
    deck_id BIGINT REFERENCES decks(id) ON DELETE CASCADE,
    ru_text TEXT NOT NULL,
    en_text TEXT NOT NULL,
    ru_audio_url VARCHAR(500),
    en_audio_url VARCHAR(500),
    image_url VARCHAR(500),
    example_ru TEXT,
    example_en TEXT,
    created_by BIGINT REFERENCES users(id),
    sort_order INTEGER DEFAULT 0,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cards_deck ON cards(deck_id);
CREATE INDEX idx_cards_created_by ON cards(created_by);
CREATE INDEX idx_cards_deleted ON cards(deleted_at);

-- User progress table
CREATE TABLE user_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    card_id BIGINT REFERENCES cards(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    repetitions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    wrong_answers INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 0,
    last_studied_at TIMESTAMP,
    next_review TIMESTAMP,
    ease_factor DECIMAL(3,2) DEFAULT 2.5,
    interval_days INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, card_id)
);

CREATE INDEX idx_progress_user ON user_progress(user_id);
CREATE INDEX idx_progress_status ON user_progress(user_id, status);
CREATE INDEX idx_progress_next_review ON user_progress(user_id, next_review);

-- User decks (subscriptions) table
CREATE TABLE user_decks (
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

CREATE INDEX idx_user_decks_user ON user_decks(user_id);
CREATE INDEX idx_user_decks_active ON user_decks(user_id, is_active);

-- Daily stats table
CREATE TABLE daily_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    cards_studied INTEGER DEFAULT 0,
    translations_used INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    wrong_answers INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, date)
);

CREATE INDEX idx_daily_stats_user_date ON daily_stats(user_id, date DESC);

-- Purchases table
CREATE TABLE purchases (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL,
    item_id BIGINT,
    stars_amount INTEGER NOT NULL,
    telegram_payment_id VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_payment ON purchases(telegram_payment_id);

-- Review history table
CREATE TABLE review_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    card_id BIGINT REFERENCES cards(id) ON DELETE CASCADE,
    was_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    reviewed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_history_user_card ON review_history(user_id, card_id, reviewed_at DESC);
CREATE INDEX idx_history_user_date ON review_history(user_id, reviewed_at DESC);
