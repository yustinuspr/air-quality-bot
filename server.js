require('dotenv').config();
const express = require('express');
const { Bot, webhookCallback } = require('grammy');

const index = require('./controller');

const { TELEGRAM_TOKEN, IS_LOCAL  } = process.env;

const bot = new Bot(TELEGRAM_TOKEN);

bot.on('message:text', index);

// If local, start the bot from local code instead of vercel
if (IS_LOCAL === 'true') {
  try {
    bot.start();
  } catch (error) {
    console.error(error);
  }
} else {
  const app = express();

  // Parse JSON payloads
  app.use(express.json());

  // Webhook endpoint consumed by Telegram
  app.post('/api/bot', webhookCallback(bot, 'express'));

  // Health-check route
  app.get('/api/bot', (req, res) => res.send('Bot is running via webhook.'));

  // Vercel expects the Express app to be the default export
  module.exports = app;
}