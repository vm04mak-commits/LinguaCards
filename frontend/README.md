# LinguaCards Frontend

React + TypeScript Telegram Mini App для изучения английского языка.

## Установка

```bash
npm install
```

## Запуск

```bash
npm run dev
```

Приложение будет доступно на http://localhost:5173

## Структура проекта

```
src/
├── components/       # Переиспользуемые компоненты
│   ├── Layout.tsx   # Основной layout с навигацией
│   └── FlipCard.tsx # Компонент карточки с flip анимацией
├── pages/           # Страницы приложения
│   ├── HomePage.tsx     # Главная страница (изучение)
│   ├── DecksPage.tsx    # Страница наборов
│   └── MyCardsPage.tsx  # Статистика
├── hooks/           # Custom hooks
│   └── useTelegram.ts  # Hook для работы с Telegram WebApp SDK
├── lib/             # Библиотеки и утилиты
│   └── api.ts       # API клиент (axios)
├── App.tsx          # Главный компонент
└── main.tsx         # Entry point
```

## Технологии

- **React 18** - UI библиотека
- **TypeScript** - Типизация
- **Vite** - Сборщик
- **TailwindCSS** - Стили
- **React Router** - Роутинг
- **Axios** - HTTP клиент
- **Telegram WebApp SDK** - Интеграция с Telegram

## Особенности

### Telegram WebApp Integration

Приложение использует Telegram WebApp SDK для:
- Получения данных пользователя
- Отправки `initData` на backend для аутентификации
- Настройки UI (цвета заголовка, кнопки)
- Полноэкранного режима

### Компонент FlipCard

Карточка с 3D flip анимацией:
- Клик по карточке - переворот
- Показ кнопок "Знаю" и "Повторить" на обратной стороне
- Плавная анимация через CSS transforms

### API Integration

Все запросы к backend автоматически включают:
- `x-telegram-init-data` header для аутентификации
- Base URL из `.env`

## Разработка

### Локально (без Telegram)

Приложение покажет заглушку, если открыть напрямую в браузере.

### С Telegram Bot

1. Настройте ngrok или localtunnel для HTTPS туннеля
2. Запустите frontend: `npm run dev`
3. Запустите бота с правильным `MINI_APP_URL`
4. Откройте бота в Telegram и нажмите кнопку

## Environment Variables

Создайте `.env` файл:

```env
VITE_API_URL=http://localhost:3000/api
```

Для продакшена:
```env
VITE_API_URL=https://your-backend.com/api
```

## Build для продакшена

```bash
npm run build
```

Статические файлы будут в папке `dist/`

## Deployment

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy
```

### Cloudflare Pages

Подключите GitHub репозиторий к Cloudflare Pages.

## Следующие шаги

- [ ] Добавить создание пользовательских карточек
- [ ] Реализовать интервальное повторение
- [ ] Добавить звуковое произношение
- [ ] Анимации переходов между карточками
- [ ] Offline mode с Service Worker
