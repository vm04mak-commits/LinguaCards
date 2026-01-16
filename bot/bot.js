require('dotenv').config({ path: '../backend/.env' });
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.MINI_APP_URL || 'http://localhost:5173';

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    '👋 Добро пожаловать в LinguaCards!\n\n📚 Учи английский через карточки прямо в Telegram.\n\nНажми на кнопку ниже, чтобы начать:',
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🚀 Открыть LinguaCards',
            web_app: { url: webAppUrl }
          }
        ]]
      }
    }
  );
});

bot.on('web_app_data', (msg) => {
  console.log('Получены данные из Web App:', msg.web_app_data.data);
});

console.log('✅ Бот запущен успешно!');
console.log('📱 Web App URL:', webAppUrl);
console.log('💬 Отправьте /start боту в Telegram');
