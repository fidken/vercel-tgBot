const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');
const axios = require('axios');

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
bot.onText(/\/getimg/, (msg) => {
  const chatId = msg.chat.id;
  userPage[chatId] = 0;
  sendImagesPage(chatId, 0);
});

function getImagesFromDir(dir) {
  return fs.readdirSync(dir).filter(file => !file.startsWith('.'));
}

// Функция для отправки изображений на странице
function sendImagesPage(chatId, page) {
  const start = page * ITEMS_PER_PAGE;
  const files = getImagesFromDir(COMPRESSED_IMG_DIR).slice(start, start + ITEMS_PER_PAGE);

  if (files.length === 0) {
    bot.sendMessage(chatId, "Изображений больше нет.");
    return;
  }

  const buttons = files.map((file, index) => [{
    text: (start + index + 1).toString(),
    callback_data: `img_${start + index}` // Укороченный callback_data
  }]);

  const navigationButtons = [];
  if (page > 0) {
    navigationButtons.push({ text: '⬅️ Назад', callback_data: `page_${page - 1}` });
  }
  if (getImagesFromDir(COMPRESSED_IMG_DIR).length > start + ITEMS_PER_PAGE) {
    navigationButtons.push({ text: 'Вперёд ➡️', callback_data: `page_${page + 1}` });
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

// Обработка загрузки изображения от пользователя
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (msg.photo) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;

    bot.sendMessage(chatId, "Сохранить изображение?", {
      reply_markup: {
        inline_keyboard: [[
          { text: "Да", callback_data: `save_${fileId}` },
          { text: "Нет", callback_data: "cancel" }
        ]]
      }
    });
  }
});

// Обработка нажатия кнопок
bot.on('callback_query', async (callbackQuery) => {
  const callbackData = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;

  if (callbackData.startsWith('save_')) {
    const fileId = callbackData.split('_')[1];
    try {
      const file = await bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

      await saveImageToServer(fileUrl);

      bot.sendMessage(chatId, "Изображение сохранено!");
    } catch (error) {
      bot.sendMessage(chatId, "Не удалось сохранить изображение.");
      console.error("Ошибка при сохранении изображения:", error);
    }
  } else if (callbackData.startsWith('page_')) {
    const page = parseInt(callbackData.split('_')[1]);
    sendImagesPage(chatId, page);
  } else if (callbackData === 'cancel') {
    bot.sendMessage(chatId, "Изображение не сохранено.");
  }

  bot.answerCallbackQuery(callbackQuery.id);
});

// Функция для загрузки и сохранения изображения на сервер
async function saveImageToServer(fileUrl) {
  try {
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream'
    });

    const fileName = `image_${Date.now()}.jpg`;
    const filePath = path.resolve(__dirname, IMG_DIR, fileName);
    const compressedFilePath = path.resolve(__dirname, COMPRESSED_IMG_DIR, fileName);

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    await sharp(filePath)
      .resize({ width: 800 })
      .toFile(compressedFilePath);

    console.log('Изображение успешно сохранено и сжато');
  } catch (error) {
    console.error('Ошибка при загрузке или сохранении изображения:', error);
  }
}

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});


