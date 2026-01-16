-- ====================================
-- LinguaCards Database Schema
-- PostgreSQL initialization script
-- ====================================

-- Enable UUID extension (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- TABLE: users
-- ====================================
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

-- ====================================
-- TABLE: decks
-- ====================================
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
    difficulty VARCHAR(20), -- Начальный, Средний, Продвинутый
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_decks_public ON decks(is_public);
CREATE INDEX idx_decks_system ON decks(is_system);
CREATE INDEX idx_decks_owner ON decks(owner_id);
CREATE INDEX idx_decks_category ON decks(category);

-- ====================================
-- TABLE: cards
-- ====================================
CREATE TABLE cards (
    id BIGSERIAL PRIMARY KEY,
    deck_id BIGINT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    en_text VARCHAR(500) NOT NULL,
    ru_text VARCHAR(500) NOT NULL,
    transcription VARCHAR(255),
    example_en TEXT,
    example_ru TEXT,
    audio_url VARCHAR(500),
    image_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_cards_deck ON cards(deck_id);
CREATE INDEX idx_cards_sort ON cards(sort_order);

-- ====================================
-- TABLE: user_decks (user's selected decks)
-- ====================================
CREATE TABLE user_decks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_id BIGINT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, deck_id)
);

CREATE INDEX idx_user_decks_user ON user_decks(user_id);
CREATE INDEX idx_user_decks_deck ON user_decks(deck_id);

-- ====================================
-- TABLE: user_progress (card learning progress)
-- ====================================
CREATE TABLE user_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'new', -- new, repeat, known
    streak INTEGER DEFAULT 0,
    last_seen TIMESTAMP,
    next_review TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, card_id)
);

CREATE INDEX idx_progress_user ON user_progress(user_id);
CREATE INDEX idx_progress_card ON user_progress(card_id);
CREATE INDEX idx_progress_status ON user_progress(status);

-- ====================================
-- TABLE: user_stats (daily statistics)
-- ====================================
CREATE TABLE user_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    cards_learned INTEGER DEFAULT 0,
    cards_reviewed INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_stats_user ON user_stats(user_id);
CREATE INDEX idx_stats_date ON user_stats(date);

-- ====================================
-- Trigger: Update cards_count in decks
-- ====================================
CREATE OR REPLACE FUNCTION update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE decks SET cards_count = cards_count + 1 WHERE id = NEW.deck_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE decks SET cards_count = cards_count - 1 WHERE id = OLD.deck_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_card_insert
    AFTER INSERT ON cards
    FOR EACH ROW
    EXECUTE FUNCTION update_deck_card_count();

CREATE TRIGGER trigger_card_delete
    AFTER DELETE ON cards
    FOR EACH ROW
    EXECUTE FUNCTION update_deck_card_count();

-- ====================================
-- SEED DATA: 10 Levels (osn_words_base_advens.txt)
-- ====================================

-- Level 1
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (1, 'Уровень 1', 'Самые простые слова', '1️⃣', true, true, 'levels', 'Начальный', 1);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(1, 'Hi', 'Привет', 1),
(1, 'Bye', 'Пока', 2),
(1, 'Yes', 'Да', 3),
(1, 'No', 'Нет', 4),
(1, 'OK', 'Хорошо', 5),
(1, 'Here', 'Здесь', 6),
(1, 'There', 'Там', 7),
(1, 'Now', 'Сейчас', 8),
(1, 'Later', 'Позже', 9),
(1, 'Who', 'Кто', 10),
(1, 'What', 'Что', 11),
(1, 'Where', 'Где', 12),
(1, 'When', 'Когда', 13),
(1, 'Why', 'Почему', 14),
(1, 'How', 'Как', 15),
(1, 'This', 'Это', 16),
(1, 'That', 'То', 17),
(1, 'Me', 'Меня', 18),
(1, 'My', 'Мой', 19),
(1, 'Your', 'Ваш, твой', 20);

-- Level 2
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (2, 'Уровень 2', 'Простые существительные и прилагательные', '2️⃣', true, true, 'levels', 'Начальный', 2);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(2, 'Book', 'Книга', 1),
(2, 'Pen', 'Ручка', 2),
(2, 'Paper', 'Бумага', 3),
(2, 'Tree', 'Дерево', 4),
(2, 'Flower', 'Цветок', 5),
(2, 'Sky', 'Небо', 6),
(2, 'Star', 'Звезда', 7),
(2, 'Moon', 'Луна', 8),
(2, 'Sun', 'Солнце', 9),
(2, 'Mountain', 'Гора', 10),
(2, 'River', 'Река', 11),
(2, 'Lake', 'Озеро', 12),
(2, 'Sea', 'Море', 13),
(2, 'Ocean', 'Океан', 14),
(2, 'Island', 'Остров', 15),
(2, 'Forest', 'Лес', 16),
(2, 'Grass', 'Трава', 17),
(2, 'Sand', 'Песок', 18),
(2, 'Rock', 'Камень', 19),
(2, 'Stone', 'Камень', 20);

-- Level 3
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (3, 'Уровень 3', 'Основные глаголы и местоимения', '3️⃣', true, true, 'levels', 'Начальный', 3);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(3, 'Am', 'Есть (1 лицо ед.ч.)', 1),
(3, 'Are', 'Есть (остальные лица)', 2),
(3, 'Have', 'Имею', 3),
(3, 'Do', 'Делать', 4),
(3, 'Make', 'Создавать', 5),
(3, 'Get', 'Получить', 6),
(3, 'Put', 'Положить', 7),
(3, 'Take', 'Взять', 8),
(3, 'Give', 'Давать', 9),
(3, 'Find', 'Находить', 10),
(3, 'Ask', 'Спрашивать', 11),
(3, 'Tell', 'Рассказывать', 12),
(3, 'Show', 'Показывать', 13),
(3, 'Think', 'Думать', 14),
(3, 'Know', 'Знать', 15),
(3, 'Understand', 'Понимать', 16),
(3, 'Feel', 'Чувствовать', 17),
(3, 'Like', 'Нравиться', 18),
(3, 'Want', 'Хотеть', 19),
(3, 'Need', 'Нуждаться', 20);

-- Level 4
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (4, 'Уровень 4', 'Расширенная лексика бытовых ситуаций', '4️⃣', true, true, 'levels', 'Начальный', 4);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(4, 'House', 'Дом', 1),
(4, 'Room', 'Комната', 2),
(4, 'Door', 'Дверь', 3),
(4, 'Window', 'Окно', 4),
(4, 'Table', 'Стол', 5),
(4, 'Chair', 'Стул', 6),
(4, 'Bed', 'Кровать', 7),
(4, 'Closet', 'Шкаф', 8),
(4, 'Couch', 'Диван', 9),
(4, 'TV', 'Телевизор', 10),
(4, 'Computer', 'Компьютер', 11),
(4, 'Phone', 'Телефон', 12),
(4, 'Radio', 'Радио', 13),
(4, 'Clock', 'Часы', 14),
(4, 'Calendar', 'Календарь', 15),
(4, 'Key', 'Ключи', 16),
(4, 'Mailbox', 'Почтовый ящик', 17),
(4, 'Yard', 'Двор', 18),
(4, 'Garage', 'Гараж', 19),
(4, 'Balcony', 'Балкон', 20);

-- Level 5
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (5, 'Уровень 5', 'Простые абстрактные понятия', '5️⃣', true, true, 'levels', 'Средний', 5);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(5, 'Life', 'Жизнь', 1),
(5, 'Death', 'Смерть', 2),
(5, 'Love', 'Любовь', 3),
(5, 'Happiness', 'Счастье', 4),
(5, 'Pain', 'Боль', 5),
(5, 'Joy', 'Радость', 6),
(5, 'Hope', 'Надежда', 7),
(5, 'Dream', 'Мечта', 8),
(5, 'Memory', 'Память', 9),
(5, 'Future', 'Будущее', 10),
(5, 'Past', 'Прошлое', 11),
(5, 'Present', 'Настоящее', 12),
(5, 'Work', 'Работа', 13),
(5, 'Rest', 'Отдых', 14),
(5, 'Study', 'Учёба', 15),
(5, 'Play', 'Игра', 16),
(5, 'Sing', 'Петь', 17),
(5, 'Draw', 'Рисовать', 18),
(5, 'Dance', 'Танцевать', 19),
(5, 'Laugh', 'Смех', 20);

-- Level 6
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (6, 'Уровень 6', 'Понятия и детали окружения', '6️⃣', true, true, 'levels', 'Средний', 6);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(6, 'Neighborhood', 'Район', 1),
(6, 'Community', 'Сообщество', 2),
(6, 'Building', 'Здание', 3),
(6, 'Park', 'Парк', 4),
(6, 'Bridge', 'Мост', 5),
(6, 'Square', 'Площадь', 6),
(6, 'Station', 'Станция', 7),
(6, 'Shop', 'Магазин', 8),
(6, 'Bank', 'Банк', 9),
(6, 'Post office', 'Почтовое отделение', 10),
(6, 'Library', 'Библиотека', 11),
(6, 'Museum', 'Музей', 12),
(6, 'Theater', 'Театр', 13),
(6, 'Restaurant', 'Ресторан', 14),
(6, 'Coffee shop', 'Кафе', 15),
(6, 'Beach', 'Пляж', 16),
(6, 'Pool', 'Бассейн', 17),
(6, 'Playground', 'Детская площадка', 18),
(6, 'Zoo', 'Зоопарк', 19),
(6, 'Monument', 'Памятник', 20);

-- Level 7
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (7, 'Уровень 7', 'Средней сложности слова и выражения', '7️⃣', true, true, 'levels', 'Средний', 7);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(7, 'Method', 'Метод', 1),
(7, 'System', 'Система', 2),
(7, 'Plan', 'План', 3),
(7, 'Program', 'Программа', 4),
(7, 'Activity', 'Деятельность', 5),
(7, 'Project', 'Проект', 6),
(7, 'Schedule', 'График', 7),
(7, 'Organization', 'Организация', 8),
(7, 'Procedure', 'Процедура', 9),
(7, 'Rule', 'Правило', 10),
(7, 'Policy', 'Политика', 11),
(7, 'Requirement', 'Требование', 12),
(7, 'Expectation', 'Ожидание', 13),
(7, 'Evaluation', 'Оценка', 14),
(7, 'Objective', 'Цель', 15),
(7, 'Purpose', 'Назначение', 16),
(7, 'Target', 'Целевое значение', 17),
(7, 'Measure', 'Мероприятие', 18),
(7, 'Function', 'Функция', 19),
(7, 'Structure', 'Структура', 20);

-- Level 8
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (8, 'Уровень 8', 'Академические и рабочие термины', '8️⃣', true, true, 'levels', 'Продвинутый', 8);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(8, 'Research', 'Исследование', 1),
(8, 'Science', 'Наука', 2),
(8, 'Technology', 'Технология', 3),
(8, 'Information', 'Информация', 4),
(8, 'Data', 'Данные', 5),
(8, 'Experiment', 'Эксперимент', 6),
(8, 'Hypothesis', 'Гипотеза', 7),
(8, 'Conclusion', 'Выводы', 8),
(8, 'Evidence', 'Доказательство', 9),
(8, 'Observation', 'Наблюдение', 10),
(8, 'Statistics', 'Статистика', 11),
(8, 'Theory', 'Теория', 12),
(8, 'Model', 'Модель', 13),
(8, 'Concept', 'Понятие', 14),
(8, 'Process', 'Процесс', 15),
(8, 'Factor', 'Фактор', 16),
(8, 'Variable', 'Переменная', 17),
(8, 'Standard', 'Стандарт', 18),
(8, 'Criteria', 'Критерии', 19),
(8, 'Principle', 'Принцип', 20);

-- Level 9
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (9, 'Уровень 9', 'Абстрактные и формализованные термины', '9️⃣', true, true, 'levels', 'Продвинутый', 9);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(9, 'Initiative', 'Инициатива', 1),
(9, 'Accountability', 'Ответственность', 2),
(9, 'Transparency', 'Прозрачность', 3),
(9, 'Ethics', 'Этика', 4),
(9, 'Democracy', 'Демократия', 5),
(9, 'Leadership', 'Руководство', 6),
(9, 'Management', 'Управление', 7),
(9, 'Governance', 'Государственное управление', 8),
(9, 'Society', 'Общество', 9),
(9, 'Institution', 'Институт', 10),
(9, 'Infrastructure', 'Инфраструктура', 11),
(9, 'Environment', 'Окружающая среда', 12),
(9, 'Resource', 'Ресурс', 13),
(9, 'Population', 'Население', 14),
(9, 'Development', 'Развитие', 15),
(9, 'Conflict', 'Конфликт', 16),
(9, 'Peace', 'Мир', 17),
(9, 'Integration', 'Интеграция', 18),
(9, 'Migration', 'Миграция', 19),
(9, 'Globalization', 'Глобализация', 20);

-- Level 10
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (10, 'Уровень 10', 'Специализированная лексика', '🔟', true, true, 'levels', 'Продвинутый', 10);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(10, 'Paradigm', 'Парадигма', 1),
(10, 'Ontology', 'Онтология', 2),
(10, 'Epistemology', 'Эпистемология', 3),
(10, 'Axiom', 'Аксиома', 4),
(10, 'Proposition', 'Утверждение', 5),
(10, 'Deduction', 'Дедукция', 6),
(10, 'Induction', 'Индукция', 7),
(10, 'Abstraction', 'Абстракция', 8),
(10, 'Assumption', 'Допущение', 9),
(10, 'Assertion', 'Заявление', 10),
(10, 'Convention', 'Конвенция', 11),
(10, 'Empirical', 'Эмпирический', 12),
(10, 'Rationale', 'Рационализация', 13),
(10, 'Specification', 'Спецификация', 14),
(10, 'Substantiation', 'Обоснование', 15),
(10, 'Validation', 'Проверка валидности', 16),
(10, 'Verification', 'Верификация', 17),
(10, 'Normalization', 'Нормализация', 18),
(10, 'Representation', 'Репрезентация', 19),
(10, 'Transformation', 'Трансформация', 20);

-- ====================================
-- SEED DATA: 11 Themes (word_tems.txt)
-- ====================================

-- Theme: Sport
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (11, 'Спорт', 'Спортивная лексика', '⚽', true, true, 'themes', 'Начальный', 11);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(11, 'Medal', 'Медаль', 1),
(11, 'Athlete', 'Атлет, спортсмен', 2),
(11, 'Coach', 'Тренер', 3),
(11, 'Team', 'Команда', 4),
(11, 'Game', 'Игра', 5),
(11, 'Match', 'Матч', 6),
(11, 'Competition', 'Соревнование', 7),
(11, 'Championship', 'Чемпионат', 8),
(11, 'Tournament', 'Турнир', 9),
(11, 'Field', 'Поле, площадка', 10),
(11, 'Stadium', 'Стадион', 11),
(11, 'Arena', 'Арена', 12),
(11, 'Court', 'Корт, площадка', 13),
(11, 'Goal', 'Гол, цель', 14),
(11, 'Score', 'Очки, счёт', 15),
(11, 'Referee', 'Судья', 16),
(11, 'Penalty', 'Штраф, пенальти', 17),
(11, 'Victory', 'Победа', 18),
(11, 'Defeat', 'Поражение', 19),
(11, 'Training', 'Тренировка', 20),
(11, 'Workout', 'Занятие фитнесом', 21),
(11, 'Fitness', 'Фитнес', 22),
(11, 'Exercise', 'Упражнение', 23),
(11, 'Muscle', 'Мышца', 24),
(11, 'Energy', 'Энергия', 25);

-- Theme: Food
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (12, 'Еда и Кулинария', 'Кулинарная лексика', '🍳', true, true, 'themes', 'Начальный', 12);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(12, 'Food', 'Еда', 1),
(12, 'Dish', 'Блюдо', 2),
(12, 'Recipe', 'Рецепт', 3),
(12, 'Ingredient', 'Ингредиент', 4),
(12, 'Cooking', 'Готовка', 5),
(12, 'Baking', 'Выпечка', 6),
(12, 'Kitchen', 'Кухня', 7),
(12, 'Oven', 'Духовка', 8),
(12, 'Stove', 'Плита', 9),
(12, 'Fridge', 'Холодильник', 10),
(12, 'Pantry', 'Кладовая', 11),
(12, 'Cutlery', 'Столовые приборы', 12),
(12, 'Plate', 'Тарелка', 13),
(12, 'Fork', 'Вилка', 14),
(12, 'Knife', 'Нож', 15),
(12, 'Spoon', 'Ложка', 16),
(12, 'Appetizer', 'Закуска', 17),
(12, 'Main course', 'Основное блюдо', 18),
(12, 'Dessert', 'Десерт', 19),
(12, 'Snack', 'Перекус', 20),
(12, 'Meal', 'Прием пищи', 21),
(12, 'Breakfast', 'Завтрак', 22),
(12, 'Lunch', 'Обед', 23),
(12, 'Dinner', 'Ужин', 24),
(12, 'Eating habits', 'Привычки питания', 25);

-- Theme: Travel
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (13, 'Путешествия', 'Туристическая лексика', '✈️', true, true, 'themes', 'Средний', 13);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(13, 'Travel', 'Путешествие', 1),
(13, 'Trip', 'Поездка', 2),
(13, 'Vacation', 'Отпуск', 3),
(13, 'Destination', 'Место назначения', 4),
(13, 'Tourist', 'Турист', 5),
(13, 'Guide', 'Гид', 6),
(13, 'Passport', 'Паспорт', 7),
(13, 'Visa', 'Виза', 8),
(13, 'Hotel', 'Отель', 9),
(13, 'Airport', 'Аэропорт', 10),
(13, 'Train station', 'Ж/д вокзал', 11),
(13, 'Bus stop', 'Автобусная остановка', 12),
(13, 'Suitcase', 'Чемодан', 13),
(13, 'Backpack', 'Рюкзак', 14),
(13, 'Map', 'Карта', 15),
(13, 'Itinerary', 'Маршрут', 16),
(13, 'Flight', 'Полёт', 17),
(13, 'Check-in', 'Регистрация на рейс', 18),
(13, 'Baggage claim', 'Получение багажа', 19),
(13, 'Exchange rate', 'Курс обмена валюты', 20),
(13, 'Currency', 'Валюта', 21),
(13, 'Booking', 'Бронирование', 22),
(13, 'Excursion', 'Экскурсия', 23),
(13, 'Souvenir', 'Сувенир', 24),
(13, 'Adventure', 'Приключение', 25);

-- Theme: Work
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (14, 'Работа', 'Рабочая лексика', '💼', true, true, 'themes', 'Средний', 14);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(14, 'Job', 'Работа', 1),
(14, 'Career', 'Карьера', 2),
(14, 'Employment', 'Трудоустройство', 3),
(14, 'Resume', 'Резюме', 4),
(14, 'Interview', 'Интервью', 5),
(14, 'Experience', 'Опыт', 6),
(14, 'Skills', 'Навыки', 7),
(14, 'Qualification', 'Квалификация', 8),
(14, 'Position', 'Должность', 9),
(14, 'Salary', 'Зарплата', 10),
(14, 'Promotion', 'Повышение', 11),
(14, 'Manager', 'Менеджер', 12),
(14, 'Employee', 'Сотрудник', 13),
(14, 'Boss', 'Начальник', 14),
(14, 'Colleague', 'Коллега', 15),
(14, 'Department', 'Отдел', 16),
(14, 'Office', 'Офис', 17),
(14, 'Business trip', 'Командировка', 18),
(14, 'Deadline', 'Дедлайн', 19),
(14, 'Project', 'Проект', 20),
(14, 'Meeting', 'Совещание', 21),
(14, 'Task', 'Задача', 22),
(14, 'Responsibility', 'Ответственность', 23),
(14, 'Achievement', 'Достижение', 24),
(14, 'Performance', 'Производительность', 25);

-- Theme: Art and Culture
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (15, 'Искусство и культура', 'Культурная лексика', '🎨', true, true, 'themes', 'Средний', 15);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(15, 'Art', 'Искусство', 1),
(15, 'Culture', 'Культура', 2),
(15, 'Painting', 'Картина, живопись', 3),
(15, 'Sculpture', 'Скульптура', 4),
(15, 'Music', 'Музыка', 5),
(15, 'Theatre', 'Театр', 6),
(15, 'Opera', 'Опера', 7),
(15, 'Concert', 'Концерт', 8),
(15, 'Exhibition', 'Выставка', 9),
(15, 'Gallery', 'Галерея', 10),
(15, 'Artist', 'Художник', 11),
(15, 'Composer', 'Композитор', 12),
(15, 'Director', 'Режиссёр', 13),
(15, 'Actor', 'Актёр', 14),
(15, 'Playwright', 'Драматург', 15),
(15, 'Literature', 'Литература', 16),
(15, 'Book', 'Книга', 17),
(15, 'Poetry', 'Поэзия', 18),
(15, 'Photography', 'Фотография', 19),
(15, 'Design', 'Дизайн', 20),
(15, 'Architecture', 'Архитектура', 21),
(15, 'Film', 'Фильм', 22),
(15, 'Costume', 'Костюм', 23),
(15, 'Stage', 'Сцена', 24),
(15, 'Masterpiece', 'Шедевр', 25);

-- Theme: IT
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (16, 'IT термины', 'IT лексика', '💻', true, true, 'themes', 'Продвинутый', 16);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(16, 'Software', 'Программное обеспечение', 1),
(16, 'Hardware', 'Аппаратное обеспечение', 2),
(16, 'Code', 'Код', 3),
(16, 'Programming language', 'Язык программирования', 4),
(16, 'Algorithm', 'Алгоритм', 5),
(16, 'Debugging', 'Отладка', 6),
(16, 'Bug', 'Баг, ошибка', 7),
(16, 'Database', 'База данных', 8),
(16, 'Server', 'Сервер', 9),
(16, 'Client', 'Клиент', 10),
(16, 'Network', 'Сеть', 11),
(16, 'Firewall', 'Межсетевой экран', 12),
(16, 'Security', 'Безопасность', 13),
(16, 'Encryption', 'Шифрование', 14),
(16, 'Cloud computing', 'Облачные вычисления', 15),
(16, 'Virtualization', 'Виртуализация', 16),
(16, 'Operating system', 'Операционная система', 17),
(16, 'User interface', 'Пользовательский интерфейс', 18),
(16, 'Backend', 'Серверная сторона', 19),
(16, 'Frontend', 'Клиентская сторона', 20),
(16, 'API', 'Программный интерфейс', 21),
(16, 'Framework', 'Фреймворк', 22),
(16, 'Version control', 'Система контроля версий', 23),
(16, 'Compiler', 'Компилятор', 24),
(16, 'Optimization', 'Оптимизация', 25);

-- Theme: Business
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (17, 'Бизнес английский', 'Деловая лексика', '📊', true, true, 'themes', 'Продвинутый', 17);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(17, 'Business', 'Бизнес', 1),
(17, 'Company', 'Компания', 2),
(17, 'Corporation', 'Корпорация', 3),
(17, 'Entrepreneur', 'Предприниматель', 4),
(17, 'Market', 'Рынок', 5),
(17, 'Product', 'Продукт', 6),
(17, 'Service', 'Услуга', 7),
(17, 'Sales', 'Продажи', 8),
(17, 'Revenue', 'Доход', 9),
(17, 'Profit', 'Прибыль', 10),
(17, 'Loss', 'Убыток', 11),
(17, 'Investment', 'Инвестиция', 12),
(17, 'Stocks', 'Акции', 13),
(17, 'Shareholder', 'Акционер', 14),
(17, 'Customer', 'Клиент', 15),
(17, 'Supplier', 'Поставщик', 16),
(17, 'Distribution', 'Распределение', 17),
(17, 'Brand', 'Бренд', 18),
(17, 'Marketing', 'Маркетинг', 19),
(17, 'Advertising', 'Реклама', 20),
(17, 'Strategy', 'Стратегия', 21),
(17, 'Budget', 'Бюджет', 22),
(17, 'Negotiations', 'Переговоры', 23),
(17, 'Agreement', 'Соглашение', 24),
(17, 'Contract', 'Контракт', 25);

-- Theme: Ecology
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (18, 'Экология', 'Экологическая лексика', '🌍', true, true, 'themes', 'Продвинутый', 18);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(18, 'Environment', 'Окружающая среда', 1),
(18, 'Ecology', 'Экология', 2),
(18, 'Nature', 'Природа', 3),
(18, 'Pollution', 'Загрязнение', 4),
(18, 'Climate change', 'Изменение климата', 5),
(18, 'Global warming', 'Глобальное потепление', 6),
(18, 'Carbon footprint', 'Углеродный след', 7),
(18, 'Greenhouse effect', 'Парниковый эффект', 8),
(18, 'Recycling', 'Переработка', 9),
(18, 'Waste management', 'Управление отходами', 10),
(18, 'Deforestation', 'Вырубка лесов', 11),
(18, 'Renewable energy', 'Возобновляемая энергия', 12),
(18, 'Sustainability', 'Устойчивое развитие', 13),
(18, 'Biodegradable', 'Биоразлагаемый', 14),
(18, 'Conservation', 'Охрана природы', 15),
(18, 'Wildlife', 'Дикая природа', 16),
(18, 'Habitat', 'Местообитание', 17),
(18, 'Ecosystem', 'Экосистема', 18),
(18, 'Biodiversity', 'Биоразнообразие', 19),
(18, 'Natural resources', 'Природные ресурсы', 20),
(18, 'Water conservation', 'Экономия воды', 21),
(18, 'Air quality', 'Качество воздуха', 22),
(18, 'Soil erosion', 'Эрозия почвы', 23),
(18, 'Preservation', 'Сохранение', 24),
(18, 'Organic farming', 'Органическое земледелие', 25);

-- Theme: Transport
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (19, 'Транспорт', 'Транспортная лексика', '🚗', true, true, 'themes', 'Средний', 19);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(19, 'Transportation', 'Транспорт', 1),
(19, 'Logistics', 'Логистика', 2),
(19, 'Vehicle', 'Транспортное средство', 3),
(19, 'Car', 'Автомобиль', 4),
(19, 'Truck', 'Грузовик', 5),
(19, 'Ship', 'Корабль', 6),
(19, 'Plane', 'Самолет', 7),
(19, 'Railway', 'Ж/д дорога', 8),
(19, 'Road', 'Дорога', 9),
(19, 'Traffic', 'Движение', 10),
(19, 'Route', 'Маршрут', 11),
(19, 'Journey', 'Путешествие', 12),
(19, 'Delivery', 'Доставка', 13),
(19, 'Shipping', 'Морские перевозки', 14),
(19, 'Forwarder', 'Экспедитор', 15),
(19, 'Warehouse', 'Склад', 16),
(19, 'Storage', 'Хранение', 17),
(19, 'Container', 'Контейнер', 18),
(19, 'Fleet', 'Автопарк', 19),
(19, 'Freight', 'Груз', 20),
(19, 'Fuel', 'Топливо', 21),
(19, 'Transit', 'Транзит', 22),
(19, 'Navigation', 'Навигация', 23),
(19, 'Port', 'Порт', 24),
(19, 'Terminal', 'Терминал', 25);

-- Theme: Health
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (20, 'Здоровье', 'Медицинская лексика', '🏥', true, true, 'themes', 'Средний', 20);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(20, 'Health', 'Здоровье', 1),
(20, 'Medicine', 'Медицина', 2),
(20, 'Doctor', 'Врач', 3),
(20, 'Patient', 'Пациент', 4),
(20, 'Hospital', 'Больница', 5),
(20, 'Clinic', 'Клиника', 6),
(20, 'Pharmacy', 'Аптека', 7),
(20, 'Treatment', 'Лечение', 8),
(20, 'Diagnosis', 'Диагноз', 9),
(20, 'Symptom', 'Симптом', 10),
(20, 'Illness', 'Болезнь', 11),
(20, 'Surgery', 'Хирургия', 12),
(20, 'Therapy', 'Терапия', 13),
(20, 'Vaccination', 'Вакцинация', 14),
(20, 'Prevention', 'Профилактика', 15),
(20, 'Rehabilitation', 'Реабилитация', 16),
(20, 'First aid', 'Первая помощь', 17),
(20, 'Emergency', 'Экстренная помощь', 18),
(20, 'Nurse', 'Медсестра', 19),
(20, 'Medical equipment', 'Медоборудование', 20),
(20, 'Disease', 'Заболевание', 21),
(20, 'Immunity', 'Иммунитет', 22),
(20, 'Hygiene', 'Гигиена', 23),
(20, 'Well-being', 'Благополучие', 24),
(20, 'Nutrition', 'Питание', 25);

-- Theme: Family
INSERT INTO decks (id, title, description, emoji, is_public, is_system, category, difficulty, sort_order)
VALUES (21, 'Семья', 'Семейная лексика', '👨‍👩‍👧‍👦', true, true, 'themes', 'Начальный', 21);

INSERT INTO cards (deck_id, en_text, ru_text, sort_order) VALUES
(21, 'Family', 'Семья', 1),
(21, 'Parents', 'Родители', 2),
(21, 'Mother', 'Мать', 3),
(21, 'Father', 'Отец', 4),
(21, 'Children', 'Дети', 5),
(21, 'Son', 'Сын', 6),
(21, 'Daughter', 'Дочь', 7),
(21, 'Brother', 'Брат', 8),
(21, 'Sister', 'Сестра', 9),
(21, 'Grandparents', 'Бабушка и дедушка', 10),
(21, 'Husband', 'Муж', 11),
(21, 'Wife', 'Жена', 12),
(21, 'Couple', 'Пара', 13),
(21, 'Relationship', 'Отношения', 14),
(21, 'Friendship', 'Дружба', 15),
(21, 'Love', 'Любовь', 16),
(21, 'Trust', 'Доверие', 17),
(21, 'Support', 'Поддержка', 18),
(21, 'Care', 'Забота', 19),
(21, 'Bond', 'Связь', 20),
(21, 'Kinship', 'Родство', 21),
(21, 'Ancestors', 'Предки', 22),
(21, 'Descendant', 'Потомок', 23),
(21, 'Heir', 'Наследник', 24),
(21, 'Inheritance', 'Наследство', 25);

-- Reset sequence for future inserts
SELECT setval('decks_id_seq', 21);
SELECT setval('cards_id_seq', (SELECT MAX(id) FROM cards));
