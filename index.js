const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const token = '6722240405:AAE2BH2G_r4R615I7fBOSHkWo6_QF_JI5DU';
const bot = new TelegramBot(token, { polling: true });

const app = express();
app.use(express.json());

app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  // Проверяем, является ли сообщение изображением
  if (msg.photo) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;

    // Отправляем сообщение с inline кнопками
    bot.sendMessage(chatId, "Сохранить изображение?", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Да", callback_data: `save` },
            { text: "Нет", callback_data: "cancel" }
          ]
        ]
      }
    }).catch(err => console.error("Ошибка при отправке сообщения:", err));
  }
});

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const callbackData = callbackQuery.data;

  if (callbackData === 'save') {
    try {
      const fileId = callbackQuery.message.reply_to_message.photo.pop().file_id;
      const file = await bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

      // Сохраняем изображение на сервере
      await saveImageToServer(fileUrl);
      bot.sendMessage(chatId, "Изображение сохранено!");
    } catch (error) {
      bot.sendMessage(chatId, "Не удалось сохранить изображение.");
      console.error("Ошибка при сохранении изображения:", error);
    }
  } else if (callbackData === 'cancel') {
    bot.sendMessage(chatId, "Изображение не сохранено.");
  }

  bot.answerCallbackQuery(callbackQuery.id).catch(err => console.error("Ошибка при ответе на callback:", err));
});

async function saveImageToServer(fileUrl) {
  const response = await axios({
    url: fileUrl,
    method: 'GET',
    responseType: 'stream'
  });

  const fileName = `image_${Date.now()}.jpg`;
  const filePath = path.resolve(__dirname, './public/img', fileName);
  const compressedFilePath = path.resolve(__dirname, './public/img/ziped', fileName);

  // Сохраняем оригинальное изображение
  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  // Сжатие изображения
  await sharp(filePath)
    .resize({ width: 800 })
    .toFile(compressedFilePath);
}

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
