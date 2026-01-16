# Getting Started with LinguaCards

Быстрый старт для разработки LinguaCards Telegram Mini App.

## Обзор проекта

```
LinguaCards/
├── backend/              # NestJS REST API
├── frontend/             # React + TypeScript Mini App (TODO)
├── database/             # SQL схема и инициализация
├── docs/                 # Документация
├── svg/                  # UI макеты
├── DATABASE_SCHEMA.md    # Схема базы данных
├── ROADMAP.md            # Дорожная карта проекта
└── prompt.MD             # Изначальные требования
```

## Шаг 1: Настройка базы данных

### Вариант А: Локальный PostgreSQL

1. Установите PostgreSQL
2. Создайте базу данных:
   ```bash
   createdb linguacards
   ```
3. Инициализируйте схему:
   ```bash
   psql -d linguacards -f database/init.sql
   ```

### Вариант Б: Docker

```bash
# Запустите PostgreSQL в Docker
docker run --name linguacards-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=linguacards \
  -p 5432:5432 \
  -d postgres:15

# Инициализируйте схему
docker exec -i linguacards-postgres psql -U postgres -d linguacards < database/init.sql
```

### Вариант В: Облачный сервис (Supabase/Railway)

См. [database/README.md](database/README.md)

## Шаг 2: Настройка Telegram бота

1. Откройте [@BotFather](https://t.me/botfather) в Telegram
2. Создайте нового бота: `/newbot`
3. Сохраните Bot Token

Подробная инструкция: [docs/TELEGRAM_BOT_SETUP.md](docs/TELEGRAM_BOT_SETUP.md)

## Шаг 3: Backend (NestJS)

1. Перейдите в папку backend:
   ```bash
   cd backend
   ```

2. Установите зависимости:
   ```bash
   npm install
   ```

3. Создайте `.env` файл:
   ```bash
   cp .env.example .env
   ```

4. Заполните `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/linguacards
   TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
   PORT=3000
   ```

5. Запустите backend:
   ```bash
   npm run start:dev
   ```

6. Проверьте:
   - API: http://localhost:3000/api
   - Swagger: http://localhost:3000/api/docs

## Шаг 4: Frontend (React) - TODO

> Frontend будет создан на следующем этапе

```bash
cd frontend
npm install
npm run dev
```

## Шаг 5: Тестирование API

### Используя curl

```bash
# Health check
curl http://localhost:3000/api

# Get public decks (требуется Telegram auth)
curl -H "x-telegram-init-data: <your_init_data>" \
  http://localhost:3000/api/decks
```

### Используя Swagger

Откройте http://localhost:3000/api/docs

## Текущий прогресс

### ✅ Завершено (Этап 1.1)

- [x] PostgreSQL схема базы данных
- [x] SQL скрипт инициализации с seed данными
- [x] Инструкции по настройке Telegram бота
- [x] Backend на NestJS
- [x] Проверка Telegram initData подписи
- [x] Автоматическая регистрация пользователей
- [x] Rate limiting
- [x] Базовые API endpoints:
  - `GET /api/users/me`
  - `GET /api/decks`
  - `GET /api/decks/:id`
  - `GET /api/cards/deck/:deckId`
  - `GET /api/progress/stats`

### 🚧 В процессе

- [ ] Frontend (React + TypeScript)
- [ ] Система карточек (flip animation)
- [ ] Прогресс и статистика
- [ ] Монетизация через Telegram Stars

### 📋 Следующие шаги

См. полную дорожную карту в [ROADMAP.md](ROADMAP.md)

## Структура базы данных

### Основные таблицы:

- **users** - пользователи Telegram
- **decks** - наборы карточек (системные и пользовательские)
- **cards** - карточки (RU ⇄ EN)
- **user_progress** - прогресс изучения
- **user_decks** - активные наборы пользователя
- **daily_stats** - ежедневная статистика и streak
- **purchases** - покупки через Telegram Stars
- **review_history** - история попыток

### Seed данные:

В `database/init.sql` уже загружены 5 системных наборов с 100 карточками:

1. Базовые слова (20 карточек)
2. Кафе и рестораны (20 карточек)
3. Путешествия (20 карточек)
4. Работа и офис (20 карточек)
5. Повседневный английский (20 карточек)

## Полезные команды

### Backend

```bash
cd backend

# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Linting
npm run lint

# Tests
npm run test
```

### Database

```bash
# Connect to local DB
psql -d linguacards

# View tables
\dt

# View decks
SELECT id, title, cards_count FROM decks;

# View cards
SELECT id, ru_text, en_text FROM cards LIMIT 10;
```

## Troubleshooting

### Backend не запускается

- Проверьте `DATABASE_URL` в `.env`
- Убедитесь, что PostgreSQL запущен
- Проверьте, что база данных инициализирована

### Telegram auth не работает

- Убедитесь, что `TELEGRAM_BOT_TOKEN` правильный
- Проверьте формат `initData` от frontend
- В development можно временно использовать mock auth

### База данных пустая

```bash
# Переинициализируйте
psql -d linguacards -f database/init.sql
```

## Дополнительная документация

- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Подробная схема БД
- [ROADMAP.md](ROADMAP.md) - Дорожная карта проекта
- [backend/README.md](backend/README.md) - Backend документация
- [docs/TELEGRAM_BOT_SETUP.md](docs/TELEGRAM_BOT_SETUP.md) - Настройка бота

## Поддержка

Если возникли проблемы:

1. Проверьте логи backend
2. Проверьте подключение к БД
3. Убедитесь, что все `.env` переменные заполнены
4. Проверьте версии Node.js (требуется 18+) и PostgreSQL (12+)

## Следующий этап

После завершения backend переходим к:
- Frontend разработке (React + Telegram WebApp SDK)
- Интеграции с Telegram Mini App
- UI/UX реализации по макетам из `svg/`

Удачи в разработке! 🚀
