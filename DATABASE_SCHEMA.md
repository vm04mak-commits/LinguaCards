# Улучшенная схема базы данных LinguaCards

## Основные таблицы

### users
```sql
id                    BIGSERIAL PRIMARY KEY
telegram_id           BIGINT UNIQUE NOT NULL
username              VARCHAR(255)
first_name            VARCHAR(255)
last_name             VARCHAR(255)
language_code         VARCHAR(10) DEFAULT 'ru'
is_premium            BOOLEAN DEFAULT FALSE
premium_until         TIMESTAMP
daily_cards_limit     INTEGER DEFAULT 20
daily_translations    INTEGER DEFAULT 5
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()
```

### decks
```sql
id                    BIGSERIAL PRIMARY KEY
title                 VARCHAR(255) NOT NULL
description           TEXT
emoji                 VARCHAR(10)
is_public             BOOLEAN DEFAULT FALSE
is_system             BOOLEAN DEFAULT FALSE
price_stars           INTEGER DEFAULT 0
owner_id              BIGINT REFERENCES users(id)
cards_count           INTEGER DEFAULT 0
category              VARCHAR(100)
difficulty            VARCHAR(20) -- beginner, intermediate, advanced
sort_order            INTEGER DEFAULT 0
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()

INDEX idx_decks_public (is_public)
INDEX idx_decks_system (is_system)
INDEX idx_decks_owner (owner_id)
INDEX idx_decks_category (category)
```

### cards
```sql
id                    BIGSERIAL PRIMARY KEY
deck_id               BIGINT REFERENCES decks(id) ON DELETE CASCADE
ru_text               TEXT NOT NULL
en_text               TEXT NOT NULL
ru_audio_url          VARCHAR(500)
en_audio_url          VARCHAR(500)
image_url             VARCHAR(500)
example_ru            TEXT
example_en            TEXT
created_by            BIGINT REFERENCES users(id)
sort_order            INTEGER DEFAULT 0
deleted_at            TIMESTAMP -- для soft delete
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()

INDEX idx_cards_deck (deck_id)
INDEX idx_cards_created_by (created_by)
INDEX idx_cards_deleted (deleted_at)
```

### user_progress
```sql
id                    BIGSERIAL PRIMARY KEY
user_id               BIGINT REFERENCES users(id) ON DELETE CASCADE
card_id               BIGINT REFERENCES cards(id) ON DELETE CASCADE
status                VARCHAR(20) NOT NULL -- new, repeat, known
repetitions           INTEGER DEFAULT 0
correct_answers       INTEGER DEFAULT 0
wrong_answers         INTEGER DEFAULT 0
current_streak        INTEGER DEFAULT 0 -- текущая серия правильных ответов
best_streak           INTEGER DEFAULT 0 -- лучшая серия правильных ответов
accuracy_percentage   DECIMAL(5,2) DEFAULT 0 -- процент правильных ответов
last_studied_at       TIMESTAMP -- дата последнего изучения
next_review           TIMESTAMP
ease_factor           DECIMAL(3,2) DEFAULT 2.5
interval_days         INTEGER DEFAULT 1
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()

UNIQUE (user_id, card_id)
INDEX idx_progress_user (user_id)
INDEX idx_progress_status (user_id, status)
INDEX idx_progress_next_review (user_id, next_review)
```

### user_decks
```sql
id                    BIGSERIAL PRIMARY KEY
user_id               BIGINT REFERENCES users(id) ON DELETE CASCADE
deck_id               BIGINT REFERENCES decks(id) ON DELETE CASCADE
is_active             BOOLEAN DEFAULT TRUE
cards_studied_today   INTEGER DEFAULT 0
cards_due_today       INTEGER DEFAULT 0 -- карточек к повторению сегодня
total_cards_studied   INTEGER DEFAULT 0
progress_percentage   DECIMAL(5,2) DEFAULT 0
started_at            TIMESTAMP DEFAULT NOW()
last_studied_at       TIMESTAMP

UNIQUE (user_id, deck_id)
INDEX idx_user_decks_user (user_id)
INDEX idx_user_decks_active (user_id, is_active)
```

### daily_stats
```sql
id                    BIGSERIAL PRIMARY KEY
user_id               BIGINT REFERENCES users(id) ON DELETE CASCADE
date                  DATE NOT NULL
cards_studied         INTEGER DEFAULT 0
translations_used     INTEGER DEFAULT 0
time_spent_minutes    INTEGER DEFAULT 0
correct_answers       INTEGER DEFAULT 0
wrong_answers         INTEGER DEFAULT 0
streak_days           INTEGER DEFAULT 0
created_at            TIMESTAMP DEFAULT NOW()

UNIQUE (user_id, date)
INDEX idx_daily_stats_user_date (user_id, date DESC)
```

### purchases
```sql
id                    BIGSERIAL PRIMARY KEY
user_id               BIGINT REFERENCES users(id) ON DELETE CASCADE
item_type             VARCHAR(50) NOT NULL -- deck, premium_day, premium_month, premium_lifetime
item_id               BIGINT -- NULL for premium purchases
stars_amount          INTEGER NOT NULL
telegram_payment_id   VARCHAR(255) UNIQUE
status                VARCHAR(20) DEFAULT 'pending' -- pending, completed, failed, refunded
created_at            TIMESTAMP DEFAULT NOW()
completed_at          TIMESTAMP

INDEX idx_purchases_user (user_id)
INDEX idx_purchases_status (status)
INDEX idx_purchases_payment (telegram_payment_id)
```

### review_history
```sql
id                    BIGSERIAL PRIMARY KEY
user_id               BIGINT REFERENCES users(id) ON DELETE CASCADE
card_id               BIGINT REFERENCES cards(id) ON DELETE CASCADE
was_correct           BOOLEAN NOT NULL
time_spent_seconds    INTEGER
reviewed_at           TIMESTAMP DEFAULT NOW()

INDEX idx_history_user_card (user_id, card_id, reviewed_at DESC)
INDEX idx_history_user_date (user_id, reviewed_at DESC)
```

## Таблицы для переводчика (отложено на потом)

### translations_cache
```sql
id                    BIGSERIAL PRIMARY KEY
source_text           TEXT NOT NULL
source_lang           VARCHAR(10) NOT NULL
target_lang           VARCHAR(10) NOT NULL
translated_text       TEXT NOT NULL
provider              VARCHAR(50) -- openai, deepl, google
usage_count           INTEGER DEFAULT 1
created_at            TIMESTAMP DEFAULT NOW()
last_used_at          TIMESTAMP DEFAULT NOW()

UNIQUE (source_text, source_lang, target_lang)
INDEX idx_translations_lookup (source_text, source_lang, target_lang)
```

### user_translations
```sql
id                    BIGSERIAL PRIMARY KEY
user_id               BIGINT REFERENCES users(id) ON DELETE CASCADE
translation_id        BIGINT REFERENCES translations_cache(id)
was_edited            BOOLEAN DEFAULT FALSE
final_text            TEXT
created_at            TIMESTAMP DEFAULT NOW()

INDEX idx_user_translations_user (user_id)
```

## Изменения и улучшения

### Что добавлено:
1. **user_decks** - отслеживание активных наборов пользователя и прогресса по ним
2. **daily_stats** - статистика за день (streak, лимиты, время)
3. **Расширенный user_progress** - интервальное повторение (Spaced Repetition)
4. **Дополнительные поля в cards** - примеры, аудио, изображения
5. **Категории и сложность** в decks
6. **Статусы покупок** - для корректной обработки платежей
7. **review_history** - история всех попыток изучения для детальной статистики
8. **Soft delete в cards** - сохранение прогресса при удалении карточек

### Зачем нужны изменения:
- **user_decks** - быстро понять, какие наборы изучает пользователь
- **daily_stats** - контроль лимитов и показ streak
- **Интервальное повторение** - карточки показываются не случайно, а по научному алгоритму
- **Категории** - группировка системных наборов
- **is_system** - отличить системные наборы от пользовательских
- **current_streak/best_streak** - отображение "огонька" с серией на карточках
- **accuracy_percentage** - денормализованный процент точности для быстрого отображения
- **status: repeat** - статус для карточек, требующих повторения (отображается в UI)
- **cards_due_today** - для счетчика "1/25" на главном экране
- **review_history** - детальная статистика по попыткам и времени изучения
- **soft delete** - сохранение прогресса пользователя даже при удалении карточки

### Соответствие UI требованиям:
- Три статуса карточек: **new** (Новые), **repeat** (Повторить), **known** (Знаю)
- Счетчик серии правильных ответов (иконка огня)
- Процент точности изучения карточки
- Дата последнего изучения ("Изучено: 10 янв.")
- Счетчик карточек для изучения сегодня ("1/25")
- История попыток для расчета статистики
