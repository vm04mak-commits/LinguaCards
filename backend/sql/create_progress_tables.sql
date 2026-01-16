-- Создание таблиц для прогресса пользователя
-- Запустите этот скрипт в DBeaver или psql

-- Таблица user_progress (если ещё нет)
CREATE TABLE IF NOT EXISTS user_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    card_id BIGINT REFERENCES cards(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'new', -- new, repeat, known
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

-- Индексы для user_progress
CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON user_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_progress_next_review ON user_progress(user_id, next_review);

-- Таблица review_history
CREATE TABLE IF NOT EXISTS review_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    card_id BIGINT REFERENCES cards(id) ON DELETE CASCADE,
    was_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    reviewed_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для review_history
CREATE INDEX IF NOT EXISTS idx_history_user_card ON review_history(user_id, card_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_user_date ON review_history(user_id, reviewed_at DESC);

-- Таблица daily_stats
CREATE TABLE IF NOT EXISTS daily_stats (
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

-- Индексы для daily_stats
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, date DESC);

-- Таблица user_decks (связь пользователей с наборами)
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

-- Индексы для user_decks
CREATE INDEX IF NOT EXISTS idx_user_decks_user ON user_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_active ON user_decks(user_id, is_active);

-- Таблица purchases (для монетизации)
CREATE TABLE IF NOT EXISTS purchases (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- deck, premium_day, premium_month, premium_lifetime
    item_id BIGINT, -- NULL for premium purchases
    stars_amount INTEGER NOT NULL,
    telegram_payment_id VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Индексы для purchases
CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_payment ON purchases(telegram_payment_id);

-- Проверка что всё создано
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
