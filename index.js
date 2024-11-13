// Импортируем библиотеку
const TelegramBot = require('node-telegram-bot-api');

// Вставьте свой токен, который вы получили от BotFather

const express = require('express');


const token = '6722240405:AAE2BH2G_r4R615I7fBOSHkWo6_QF_JI5DU';
const bot = new TelegramBot(token, { polling: false });

const app = express();
app.use(express.json());

// Установка вебхука
const URL = 'https://hirata.vercel.app/';
bot.setWebHook(`${URL}/bot${token}`);

// Эндпоинт для обработки запросов от Telegram
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Пример обработки команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет! Я твой Telegram-бот, работающий на вебхуках.');
});

// Пример обработки текстовых сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text.toLowerCase() === 'привет') {
    bot.sendMessage(chatId, 'Привет! Как дела?');
  } else {
    bot.sendMessage(chatId, `Вы написали: "${text}". Я пока учусь отвечать на сообщения!`);
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
