require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cleverbot = require('cleverbot-free');

// Buat instance bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {polling: true});

// Variabel untuk melacak status fitur "tanya bot"
let isAskEnabled = true;

// Fungsi untuk menampilkan menu utama
const showMainMenu = (chatId) => {
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Cuaca', callback_data: 'menu_weather' },
          { text: 'Berita', callback_data: 'menu_news' }
        ],
        [
          { text: 'Tanya Bot', callback_data: 'menu_ask' }
        ],
        [
          { text: 'Tentang Bot', callback_data: 'menu_about' }
        ],
        [
          { text: 'Nonaktifkan Tanya Bot', callback_data: 'disable_ask' },
          { text: 'Aktifkan Tanya Bot', callback_data: 'enable_ask' }
        ]
      ]
    }
  };
  bot.sendMessage(chatId, 'Pilih salah satu menu di bawah ini:', options);
};

// Fungsi untuk menangani perintah /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  showMainMenu(chatId); // Menampilkan menu utama saat menerima perintah /start
});

// Fungsi untuk menangani callback data dari inline keyboard
bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (data === 'menu_weather') {
    bot.sendMessage(chatId, 'Masukkan nama kota untuk mendapatkan informasi cuaca:');
  } else if (data === 'menu_news') {
    bot.sendMessage(chatId, 'Fitur berita belum tersedia.');
  } else if (data === 'menu_ask') {
    bot.sendMessage(chatId, 'Tanyakan apa saja kepada saya:');
  } else if (data === 'menu_about') {
    bot.sendMessage(chatId, 'Bot ini dibuat untuk memberikan informasi cuaca dan berita.');
  } else if (data === 'disable_ask') {
    isAskEnabled = false;
    bot.sendMessage(chatId, 'Fitur "tanya bot" telah dinonaktifkan.');
  } else if (data === 'enable_ask') {
    isAskEnabled = true;
    bot.sendMessage(chatId, 'Fitur "tanya bot" telah diaktifkan.');
  }
});

// Fungsi untuk menangani pesan dari pengguna
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Abaikan pesan yang adalah perintah (dimulai dengan '/')
  if (text.startsWith('/')) {
    return;
  }

  // Jika pengguna mengirim pesan "cuaca di"
  if (text.toLowerCase().startsWith('cuaca di')) {
    const city = text.split('cuaca di ')[1];
    try {
      const response = await getWeather(city);
      bot.sendMessage(chatId, response);
    } catch (error) {
      console.error('Error getting weather:', error);
      bot.sendMessage(chatId, 'Maaf, saya tidak bisa mendapatkan informasi cuaca saat ini.');
    }
  } else if (isAskEnabled) {
    // Menjawab pertanyaan apapun dari pengguna menggunakan Cleverbot jika fitur diaktifkan
    try {
      const response = await askCleverbot(text);
      bot.sendMessage(chatId, response);
    } catch (error) {
      console.error('Error getting response from Cleverbot:', error);
      bot.sendMessage(chatId, 'Maaf, saya tidak bisa menjawab pertanyaan Anda saat ini.');
    }
  } else {
    bot.sendMessage(chatId, 'Fitur "tanya bot" sedang dinonaktifkan.');
  }
});

// Fungsi untuk mendapatkan cuaca dari OpenWeatherMap
async function getWeather(city) {
  const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHERMAP_API_KEY}&units=metric`;

  try {
    const response = await axios.get(url);
    console.log('Weather API response:', response.data); // Log tambahan untuk debug
    if (response.data && response.data.weather && response.data.main) {
      const weather = response.data.weather[0].description;
      const temperature = response.data.main.temp;
      return `Cuaca di ${city} saat ini: ${weather} dengan suhu ${temperature}°C.`;
    } else {
      return 'Maaf, saya tidak bisa mendapatkan informasi cuaca untuk kota tersebut.';
    }
  } catch (error) {
    console.error('Error making request to OpenWeatherMap API:', error);
    return 'Maaf, saya tidak bisa mendapatkan informasi cuaca untuk kota tersebut.';
  }
}

// Fungsi untuk mendapatkan jawaban dari Cleverbot
async function askCleverbot(question) {
  try {
    const response = await cleverbot(question);
    return response;
  } catch (error) {
    console.error('Error making request to Cleverbot:', error);
    throw new Error('Cleverbot request failed');
  }
}

// Menangani error
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code);
});
