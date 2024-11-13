// Импортируем библиотеки
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Ваш токен, полученный от BotFather
const token = '6722240405:AAE2BH2G_r4R615I7fBOSHkWo6_QF_JI5DU';
const bot = new TelegramBot(token, { polling: false });

const app = express();
app.use(express.json());

// Установка вебхука
const URL = 'https://vercel-tgBot.up.railway.app';
;
bot.setWebHook(`${URL}/bot${token}`);

app.get("/", (req, res) => {
  res.send("Работает")
})

// Эндпоинт для обработки запросов от Telegram
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет! Я твой Telegram-бот, работающий на вебхуках.');
});

// Обработка текстовых сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text && text.toLowerCase() === 'привет') {
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
