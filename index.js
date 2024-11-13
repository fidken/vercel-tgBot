const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const token = '6722240405:AAE2BH2G_r4R615I7fBOSHkWo6_QF_JI5DU';
const bot = new TelegramBot(token, { polling: false });

const app = express();
app.use(express.json());

const URL = 'https://vercel-tgBot.up.railway.app';
bot.setWebHook(`${URL}/bot${token}`);

app.get("/", (req, res) => {
  res.send("Работаем!");
});

// Эндпоинт для обработки запросов от Telegram
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

const IMG_DIR = './public/img';
const COMPRESSED_IMG_DIR = './public/img/ziped';
const ITEMS_PER_PAGE = 10;

let userPage = {}; // Хранение текущей страницы для каждого пользователя

// Обработка команды /getImg для выдачи изображений
bot.onText(/\/getImg/, (msg) => {
  const chatId = msg.chat.id;
  userPage[chatId] = 0;
  sendImagesPage(chatId, 0);
});

// Функция для отправки страницы изображений
function sendImagesPage(chatId, page) {
  const start = page * ITEMS_PER_PAGE;
  const files = fs.readdirSync(COMPRESSED_IMG_DIR).slice(start, start + ITEMS_PER_PAGE);
  if (files.length === 0) {
    bot.sendMessage(chatId, "Изображений больше нет.");
    return;
  }

  const buttons = files.map((file, index) => [{
    text: (start + index + 1).toString(),
    callback_data: `showImage:${start + index}:${chatId}`
  }]);

  const navigationButtons = [];
  if (page > 0) {
    navigationButtons.push({ text: '⬅️ Назад', callback_data: `page:${page - 1}:${chatId}` });
  }
  if (fs.readdirSync(COMPRESSED_IMG_DIR).length > start + ITEMS_PER_PAGE) {
    navigationButtons.push({ text: 'Вперёд ➡️', callback_data: `page:${page + 1}:${chatId}` });
  }
  buttons.push(navigationButtons);

  bot.sendMessage(chatId, "Выберите изображение:", {
    reply_markup: { inline_keyboard: buttons }
  }).then(sentMsg => {
    if (userPage[chatId]) {
      bot.deleteMessage(chatId, userPage[chatId]);
    }
    userPage[chatId] = sentMsg.message_id;
  });
}

// Обработка нажатия кнопок для просмотра страницы или изображения
bot.on('callback_query', (callbackQuery) => {
  const [action, index, chatId] = callbackQuery.data.split(':');
  if (action === 'page') {
    sendImagesPage(callbackQuery.message.chat.id, parseInt(index));
  } else if (action === 'showImage') {
    const originalFiles = fs.readdirSync(IMG_DIR);
    const filePath = path.join(IMG_DIR, originalFiles[parseInt(index)]);
    bot.sendPhoto(chatId, filePath);
  }
  bot.answerCallbackQuery(callbackQuery.id);
});

// Обработка загрузки изображения от пользователя
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const fileId = msg.photo[msg.photo.length - 1].file_id;
  const filePath = await bot.getFileLink(fileId);

  bot.sendMessage(chatId, "Сохранить изображение?", {
    reply_markup: {
      inline_keyboard: [[
        { text: "Да", callback_data: `saveImage:${fileId}:${chatId}` },
        { text: "Нет", callback_data: "cancel" }
      ]]
    }
  });
});

// Обработка нажатия кнопки для сохранения изображения
bot.on('callback_query', async (callbackQuery) => {
  const [action, fileId, chatId] = callbackQuery.data.split(':');
  if (action === 'saveImage') {
    saveImage(fileId, chatId);
    bot.answerCallbackQuery(callbackQuery.id, { text: "Изображение сохранено!" });
  } else if (action === 'cancel') {
    bot.answerCallbackQuery(callbackQuery.id, { text: "Сохранение отменено." });
  }
});

// Функция для сохранения и сжатия изображения
async function saveImage(fileId, chatId) {
  const file = await bot.getFile(fileId);
  const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  const filePath = path.join(IMG_DIR, path.basename(file.file_path));
  const compressedFilePath = path.join(COMPRESSED_IMG_DIR, path.basename(file.file_path));

  // Скачивание и сохранение не сжатого изображения
  const response = await fetch(fileUrl);
  const buffer = await response.buffer();
  fs.writeFileSync(filePath, buffer);

  // Сжатие и сохранение сжатой версии изображения
  sharp(buffer).resize(500).toFile(compressedFilePath);
}

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
