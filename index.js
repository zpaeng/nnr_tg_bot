const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const SqliteDB = require('./sqlite.js').SqliteDB;
const file = "./nnr.db";
const sqliteDB = new SqliteDB(file);

const token = '6455433215:AAE7yRoXk_O3T3XcEvfWfjiQULKi3rsWGXo';
const api = 'https://nnr.moe';

/// create table.
  var createTileTableSql = "create table if not exists tg_user(tg_id INTEGER, is_admin CHAR(1), traffic_num REAL, crte_time TIMESTAMP);";
  var createLabelTableSql = "create table if not exists labels(level INTEGER, longitude REAL, latitude REAL, content BLOB);";
  sqliteDB.createTable(createTileTableSql);
  sqliteDB.createTable(createLabelTableSql);

const bot = new TelegramBot(token, {
  polling: true
});

// Request interceptors for API calls
axios.interceptors.request.use(
    config => {
      config.headers['content-type'] = 'application/json';
      config.headers['token'] = '9a5a2388-c9c3-4d11-bf8d-637cf521dcab';
          return config;
      },
      error => {
          return Promise.reject(error);
      }
  );


  
bot.onText(/\/start/, function onLoveText(msg) {
  bot.sendMessage(msg.chat.id, 'Hello');
});

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1];
  bot.sendMessage(chatId, resp);
});