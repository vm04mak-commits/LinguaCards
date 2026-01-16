# Установка ngrok для локальной разработки

## Способ 1: Скачать напрямую (быстрее)

1. Открой https://ngrok.com/download

2. Скачай версию для Windows

3. Распакуй `ngrok.exe` в любую папку (например, `C:\ngrok\`)

4. Добавь в PATH или запускай из папки

5. Запусти:
   ```bash
   ngrok http 5173
   ```

6. Скопируй HTTPS URL (например: `https://abc123.ngrok-free.app`)

7. Обнови `backend/.env`:
   ```env
   MINI_APP_URL=https://abc123.ngrok-free.app
   ```

8. Перезапусти бота:
   ```bash
   cd bot
   npm start
   ```

## Способ 2: Через winget (Windows 10/11)

```bash
winget install ngrok.ngrok
```

## Способ 3: Через npm (глобально)

```bash
npm install -g ngrok
```

Затем:
```bash
ngrok http 5173
```

## Альтернатива: localtunnel (без регистрации)

Проще, но менее стабильный:

```bash
npm install -g localtunnel
lt --port 5173
```

Даст URL типа: `https://random-name.loca.lt`

## После установки

1. Запусти ngrok:
   ```bash
   ngrok http 5173
   ```

2. Скопируй Forwarding URL (HTTPS)

3. Обнови `.env`:
   ```env
   MINI_APP_URL=https://твой-ngrok-url.ngrok-free.app
   ```

4. Перезапусти бота

5. Когда запустишь frontend на порту 5173, все будет работать через HTTPS туннель
