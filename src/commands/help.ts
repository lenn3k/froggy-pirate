import { Message } from 'discord.js';

module.exports = {
  name: 'help',
  description: 'Help',
  execute(message: Message, args: string[]): void {
    message.channel.startTyping(1);
    const output = [
      `Aye ${message.author.username}, What do you wish to know?`,
      `Ask me one of the following:`,
      `:frog: marauders`,
      `:frog: targets [div] [max trophies]`,
      //`:frog: fleets [div] (WIP)`,
    ].join('\n');
    message.channel.send(output);

    message.channel.stopTyping();
  },
};
