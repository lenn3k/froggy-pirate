import { DiscordBot } from './bot';

require('dotenv').config();

console.log(process.env);

const bot = DiscordBot.getInstance();

bot.connect();
