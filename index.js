// Импортируем библиотеку
const TelegramBot = require('node-telegram-bot-api');

// Вставьте свой токен, который вы получили от BotFather
const token = '6722240405:AAE2BH2G_r4R615I7fBOSHkWo6_QF_JI5DU';

// Включаем бота в режиме polling, чтобы он постоянно проверял новые сообщения
const bot = new TelegramBot(token, { polling: true });

// Реакция на команду /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет! Я твой новый Telegram-бот. Чем могу помочь?');
});

// Обработка текстовых сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text.toLowerCase() === 'привет') {
    bot.sendMessage(chatId, 'Привет! Как у тебя дела?');
  } else {
    bot.sendMessage(chatId, `Вы написали: "${text}". Я пока учусь отвечать на все сообщения!`);
  }
});

// Команда /help
bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Доступные команды:\n/start - Начало\n/help - Помощь');
  });
  
  // Отправка изображения
  bot.onText(/\/photo/, (msg) => {
    bot.sendPhoto(msg.chat.id, 'https://example.com/image.jpg', { caption: 'Вот ваше фото!' });
  });
