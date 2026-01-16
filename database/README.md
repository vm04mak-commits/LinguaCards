# Database Setup

## Инициализация базы данных

### Локальная установка PostgreSQL

1. Установите PostgreSQL:
   ```bash
   # Windows (через Chocolatey)
   choco install postgresql

   # macOS
   brew install postgresql

   # Linux
   sudo apt-get install postgresql
   ```

2. Создайте базу данных:
   ```bash
   createdb linguacards
   ```

3. Выполните SQL скрипт:
   ```bash
   psql -d linguacards -f init.sql
   ```

### Использование Docker

1. Запустите PostgreSQL в Docker:
   ```bash
   docker run --name linguacards-postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=linguacards \
     -p 5432:5432 \
     -d postgres:15
   ```

2. Выполните SQL скрипт:
   ```bash
   docker exec -i linguacards-postgres psql -U postgres -d linguacards < init.sql
   ```

### Использование облачных сервисов

#### Supabase
1. Создайте проект на [supabase.com](https://supabase.com)
2. Перейдите в SQL Editor
3. Скопируйте содержимое `init.sql` и выполните

#### Railway
1. Создайте проект на [railway.app](https://railway.app)
2. Добавьте PostgreSQL сервис
3. Подключитесь к базе через предоставленные credentials
4. Выполните `init.sql` через SQL клиент

## Структура базы данных

Полная документация схемы находится в [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)

### Основные таблицы:
- `users` - пользователи
- `decks` - наборы карточек
- `cards` - карточки
- `user_progress` - прогресс пользователя
- `user_decks` - активные наборы пользователя
- `daily_stats` - ежедневная статистика
- `purchases` - покупки через Telegram Stars
- `review_history` - история попыток

### Seed данные

В `init.sql` уже включены:
- 5 системных наборов:
  - Базовые слова (20 карточек)
  - Кафе и рестораны (20 карточек)
  - Путешествия (20 карточек)
  - Работа и офис (20 карточек)
  - Повседневный английский (20 карточек)

Всего: **100 карточек** для старта

## Переменные окружения

Создайте `.env` файл в корне проекта:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/linguacards

# или для Supabase/Railway
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[HOST]:[PORT]/linguacards
```

## Миграции (Будущее)

Для продакшена рекомендуется использовать миграции через:
- [Prisma](https://www.prisma.io/)
- [TypeORM](https://typeorm.io/)
- [Sequelize](https://sequelize.org/)
- [Alembic](https://alembic.sqlalchemy.org/) (для Python)
