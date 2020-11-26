import { Message } from 'discord.js';
import { LoginService } from '../services/login.service';

const loginService = LoginService.getInstance();

module.exports = {
  name: 'login',
  description:
    'Attempt to login a sertain amount of times and return the access tokens',
  execute(message: Message, args: string[]): void {
    message.channel.startTyping(1);
    const count = Number.parseInt(args[0], 10);
    for (let index = 0; index < count; index++) {
      loginService
        .login()
        .subscribe(() => message.channel.send(loginService.getAccessToken()));
    }

    message.channel.stopTyping();
  },
};
