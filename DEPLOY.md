# Инструкция по деплою LinguaCards

## Обзор архитектуры

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Telegram  │────▶│   Vercel    │────▶│   Render    │
│   Mini App  │     │  (Frontend) │     │  (Backend)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │    Neon     │
                                        │ (PostgreSQL)│
                                        └─────────────┘
```

**Стек (бесплатный):**
- Frontend: **Vercel** (безлимит)
- Backend: **Render** (засыпает через 15 мин)
- Database: **Neon** (512MB)

---

## Этап 1: База данных (Neon)

### 1.1 Создание аккаунта и проекта

1. Перейди на https://neon.tech
2. Зарегистрируйся через GitHub
3. Нажми "Create Project"
4. Заполни:
   - **Project name:** `linguacards`
   - **Region:** `Europe (Frankfurt)` (или ближайший)
   - **PostgreSQL version:** `16`
5. Нажми "Create Project"

### 1.2 Получение DATABASE_URL

1. После создания проекта ты увидишь Connection Details
2. Скопируй **Connection string** (формат `postgresql://...`)
3. Сохрани его - это твой `DATABASE_URL`

Пример:
```
postgresql://linguacards_owner:password123@ep-xxx-xxx-123.eu-central-1.aws.neon.tech/linguacards?sslmode=require
```

### 1.3 Создание таблиц

**Вариант A: Через Neon Console (рекомендуется)**

1. В Neon Dashboard нажми "SQL Editor"
2. Скопируй содержимое файла `DATABASE_SCHEMA.md` (раздел SQL)
3. Выполни SQL

**Вариант B: Через psql**

```bash
# Установи psql если нет
# Windows: https://www.postgresql.org/download/windows/

# Подключись и выполни схему
psql "твой_DATABASE_URL" -f database_schema.sql
```

### 1.4 Импорт данных (если есть локальная БД)

```bash
# Экспорт из локальной БД
pg_dump -U postgres -d linguacards --data-only > data_backup.sql

# Импорт в Neon
psql "твой_DATABASE_URL" -f data_backup.sql
```

---

## Этап 2: Backend (Render)

### 2.1 Подготовка проекта

1. Убедись что проект в Git репозитории:
```bash
cd d:\LinguaCards
git init  # если еще нет
git add .
git commit -m "Initial commit"
```

2. Создай репозиторий на GitHub и запуши:
```bash
git remote add origin https://github.com/твой_username/linguacards.git
git push -u origin main
```

### 2.2 Создание сервиса на Render

1. Перейди на https://render.com
2. Зарегистрируйся через GitHub
3. Нажми "New" → "Web Service"
4. Выбери репозиторий `linguacards`
5. Заполни настройки:

| Поле | Значение |
|------|----------|
| **Name** | `linguacards-api` |
| **Region** | `Frankfurt (EU Central)` |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Instance Type** | `Free` |

### 2.3 Настройка переменных окружения

В разделе "Environment" добавь:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://...` (из Neon) |
| `TELEGRAM_BOT_TOKEN` | `123456:ABC...` (из BotFather) |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

### 2.4 Деплой

1. Нажми "Create Web Service"
2. Дождись завершения деплоя (5-10 минут)
3. Получи URL: `https://linguacards-api.onrender.com`

### 2.5 Проверка

```bash
# Проверь что API работает
curl https://linguacards-api.onrender.com/api

# Должен вернуть что-то или 404 (не ошибку сервера)
```

---

## Этап 3: Frontend (Vercel)

### 3.1 Настройка API URL

Создай файл `frontend/.env.production`:

```env
VITE_API_URL=https://linguacards-api.onrender.com
```

Закоммить изменения:
```bash
git add .
git commit -m "Add production API URL"
git push
```

### 3.2 Создание проекта на Vercel

1. Перейди на https://vercel.com
2. Зарегистрируйся через GitHub
3. Нажми "Add New" → "Project"
4. Импортируй репозиторий `linguacards`
5. Заполни настройки:

| Поле | Значение |
|------|----------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3.3 Настройка переменных окружения

В разделе "Environment Variables" добавь:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://linguacards-api.onrender.com` |

### 3.4 Деплой

1. Нажми "Deploy"
2. Дождись завершения (2-3 минуты)
3. Получи URL: `https://linguacards.vercel.app`

### 3.5 Настройка домена (опционально)

Vercel даёт бесплатный поддомен. Если хочешь свой домен:

1. В настройках проекта → "Domains"
2. Добавь свой домен
3. Настрой DNS записи

---

## Этап 4: Telegram Bot и Mini App

### 4.1 Создание бота (если еще нет)

1. Открой @BotFather в Telegram
2. Отправь `/newbot`
3. Введи имя бота: `LinguaCards`
4. Введи username: `linguacards_bot` (должен быть уникальным)
5. Сохрани токен: `123456:ABC-DEF...`

### 4.2 Настройка Mini App

1. Отправь BotFather команду `/mybots`
2. Выбери своего бота
3. Нажми "Bot Settings" → "Menu Button"
4. Нажми "Configure Menu Button"
5. Введи:
   - **URL:** `https://linguacards.vercel.app`
   - **Title:** `Открыть`

### 4.3 Настройка Web App URL

1. В BotFather: "Bot Settings" → "Menu Button" → "Edit Menu Button URL"
2. Введи URL фронтенда: `https://linguacards.vercel.app`

### 4.4 Альтернатива: Inline кнопка

Если хочешь открывать через кнопку в сообщении, добавь в бота обработчик команды `/start`:

```
Привет! Нажми кнопку ниже, чтобы начать изучение английского.

[Открыть LinguaCards] → web_app: https://linguacards.vercel.app
```

---

## Этап 5: Финальная проверка

### 5.1 Чеклист

- [ ] Neon: БД создана, таблицы созданы
- [ ] Render: Backend запущен, API отвечает
- [ ] Vercel: Frontend доступен
- [ ] Telegram: Bot создан, Mini App привязан
- [ ] Открой Mini App через бота - должно работать!

### 5.2 Тестирование

1. Открой бота в Telegram
2. Нажми кнопку меню или отправь `/start`
3. Проверь:
   - [ ] Приложение открывается
   - [ ] Карточки загружаются
   - [ ] Кнопки "Знаю/Не знаю" работают
   - [ ] Переключение между страницами работает

### 5.3 Типичные проблемы

**Проблема: API не отвечает**
- Render засыпает через 15 мин. Первый запрос после паузы ~30 сек.
- Проверь логи в Render Dashboard

**Проблема: CORS ошибки**
- Убедись что в backend настроен CORS для домена Vercel
- Проверь `main.ts`:
```typescript
app.enableCors({
  origin: ['https://linguacards.vercel.app', 'https://web.telegram.org'],
  credentials: true,
});
```

**Проблема: Mini App не открывается**
- URL должен быть HTTPS
- Домен должен быть доступен публично

---

## Обновление после изменений

### Backend

```bash
git add .
git commit -m "Update backend"
git push
# Render автоматически задеплоит
```

### Frontend

```bash
git add .
git commit -m "Update frontend"
git push
# Vercel автоматически задеплоит
```

---

## Мониторинг

### Render
- Dashboard → Logs (смотреть ошибки)
- Dashboard → Metrics (CPU, Memory)

### Vercel
- Dashboard → Deployments (история деплоев)
- Dashboard → Analytics (посещения)

### Neon
- Dashboard → Monitoring (размер БД, запросы)

---

## Стоимость

| Сервис | План | Стоимость |
|--------|------|-----------|
| Neon | Free | $0 (512MB) |
| Render | Free | $0 (засыпает) |
| Vercel | Hobby | $0 (безлимит) |
| **Итого** | | **$0/мес** |

### Когда нужно платить?

- **Render Starter ($7/мес)** - если надоело ждать cold start
- **Neon Pro ($19/мес)** - если БД > 512MB
- **Vercel Pro ($20/мес)** - если нужна аналитика и команда
