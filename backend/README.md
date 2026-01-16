# LinguaCards Backend

Backend API для Telegram Mini App LinguaCards, построенный на NestJS.

## Установка

### 1. Установите зависимости
```bash
npm install
```

### 2. Настройте переменные окружения
Скопируйте `.env.example` в `.env` и заполните значения:
```bash
cp .env.example .env
```

Обязательные переменные:
- `DATABASE_URL` - строка подключения к PostgreSQL
- `TELEGRAM_BOT_TOKEN` - токен бота от BotFather

### 3. Инициализируйте базу данных
```bash
# Если используете локальный PostgreSQL
psql -d linguacards -f ../database/init.sql

# Или через Docker
docker exec -i linguacards-postgres psql -U postgres -d linguacards < ../database/init.sql
```

## Запуск

### Development
```bash
npm run start:dev
```

API будет доступен на `http://localhost:3000`

Swagger документация: `http://localhost:3000/api/docs`

### Production
```bash
npm run build
npm run start:prod
```

## Структура проекта

```
src/
├── auth/                 # Аутентификация Telegram
│   ├── guards/          # Guards для защиты роутов
│   ├── decorators/      # Декораторы для получения пользователя
│   ├── auth.service.ts  # Валидация Telegram initData
│   └── auth.module.ts
├── database/            # Модуль базы данных
│   ├── database.service.ts  # PostgreSQL client
│   └── database.module.ts
├── users/               # Управление пользователями
│   ├── users.service.ts
│   ├── users.controller.ts
│   └── users.module.ts
├── decks/               # Наборы карточек
├── cards/               # Карточки
├── progress/            # Прогресс пользователя
├── app.module.ts        # Корневой модуль
└── main.ts              # Entry point
```

## API Endpoints

### Authentication
Все endpoints требуют Telegram аутентификации через заголовок:
```
x-telegram-init-data: <initData from Telegram WebApp>
```

### Users
- `GET /api/users/me` - Получить текущего пользователя

### Decks (В разработке)
- `GET /api/decks` - Получить список наборов
- `GET /api/decks/:id` - Получить набор по ID
- `POST /api/decks` - Создать набор (Pro)

### Cards (В разработке)
- `GET /api/cards/:deckId` - Получить карточки набора
- `POST /api/cards` - Создать карточку

### Progress (В разработке)
- `GET /api/progress/stats` - Статистика пользователя
- `POST /api/progress/review` - Отправить результат повторения

## Безопасность

### Telegram WebApp Validation
Backend проверяет подпись `initData` от Telegram для каждого запроса:

1. Извлекает `hash` из `initData`
2. Создает `data-check-string` из остальных параметров
3. Вычисляет HMAC-SHA-256 с секретным ключом
4. Сравнивает с полученным hash
5. Проверяет, что данные не старше 24 часов

### Rate Limiting
Настроено через `@nestjs/throttler`:
- 100 запросов в минуту по умолчанию
- Настраивается через `.env`

### CORS
Настроен для работы с frontend:
- Origin: `CORS_ORIGIN` из `.env`
- Credentials: enabled

## Deployment

### Railway
```bash
# Установите Railway CLI
npm install -g @railway/cli

# Войдите
railway login

# Инициализируйте проект
railway init

# Добавьте PostgreSQL
railway add postgres

# Установите переменные окружения
railway variables set TELEGRAM_BOT_TOKEN=your_token

# Деплой
railway up
```

### Render
1. Создайте Web Service на [render.com](https://render.com)
2. Подключите GitHub репозиторий
3. Настройте:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
4. Добавьте переменные окружения
5. Создайте PostgreSQL database
6. Деплой автоматически

### Docker
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

```bash
docker build -t linguacards-backend .
docker run -p 3000:3000 --env-file .env linguacards-backend
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Troubleshooting

### Database connection errors
- Проверьте `DATABASE_URL` в `.env`
- Убедитесь, что PostgreSQL запущен
- Проверьте firewall/security groups

### Telegram auth errors
- Убедитесь, что `TELEGRAM_BOT_TOKEN` правильный
- Проверьте формат `initData` от frontend
- В dev можно использовать mock auth (только development!)

### CORS errors
- Установите правильный `CORS_ORIGIN` в `.env`
- Убедитесь, что frontend использует правильный API URL

## Следующие шаги

- [ ] Завершить модули Decks, Cards, Progress
- [ ] Добавить Telegram Stars payment integration
- [ ] Реализовать интервальное повторение (SM-2)
- [ ] Добавить тесты
- [ ] Настроить CI/CD
