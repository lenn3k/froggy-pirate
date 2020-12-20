import { Message } from 'discord.js';
import { DiscordBot } from '../bot';
import { MessageService } from '../services/message.service';

const bot = DiscordBot.getInstance();

module.exports = {
  name: 'fleetchat',
  description: 'Set a channel to echo fleet chat',
  execute(message: Message, args: string[]): void {

    const channel = message.mentions.channels.first();
    switch (args[0]) {
      case 'set':
        if (channel) {
          bot.setFleetChannel(channel);
          message.channel.send(
            `Fleet chat will be sent to ${channel.toString()}`
          );
        } else {
          message.channel.send('You must tell me which channel to write in...');
        }

        break;
      case 'start':
        if (channel) {
          bot.setFleetChannel(channel);
        }
        bot.startFleetChat(message);
        break;
      case 'stop':
        bot.stopFleetChat(message);
        break;

      case 'get':
        MessageService.getInstance()
          .getFleetMessage('27763')
          .subscribe((data) => message.channel.send(JSON.stringify(data[0])));
        break;

      default:
        break;
    }
  },
};
