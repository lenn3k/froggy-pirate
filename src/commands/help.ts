import { Message } from 'discord.js';
import { DiscordBot } from '../bot';

const bot = DiscordBot.getInstance();
const commands = bot.getCommands();

module.exports = {
  name: 'help',
  description: 'Help',
  execute(message: Message, args: string[]): void {
    if (args[0]) {
      if (commands.has(args[0])) {
        const cmd = commands.get(args[0]);
        if (!cmd?.useage) {
          message.channel.send(
            '```No additional help available for this command```'
          );
          return;
        }
        const output = [
          '```',
          cmd?.name,
          ``,
          cmd?.description,
          ``,
          cmd?.useage,
          ``,
          `Examples:`,
          cmd?.example,
          '```',
        ];
        message.channel.send(output);

        return;
      }
    }

    const commandLength = commands.reduce(
      (acc, value) => Math.max(value.name.length, acc),
      0
    );

    const commandMessages = commands
      .filter((v) => !v.hide)
      .map((command) => {
        return (command.name + '          ')
          .slice(0, commandLength + 3)
          .concat(command.description);
      });

    const output = [
      `Aye ${message.author.username}, What do you wish to know?`,
      '```Ask me one of the following:\n',
      commandMessages.join('\n'),
      ``,
      `Type /help command for more info on a command.`,
      '```',
    ].join('\n');
    message.channel.send(output);
  },
};
