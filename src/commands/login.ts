import { Message, MessageEmbed } from 'discord.js';
import { LoginService } from '../services/login.service';

const loginService = LoginService.getInstance();

module.exports = {
  hide: true,
  name: 'login',
  description:
    'Attempt to login a sertain amount of times and return the access tokens',
  execute(message: Message, args: string[]): void {
     
    const count = Number.parseInt(args[0], 10) || 1;
    for (let index = 0; index < count; index++) {
      loginService.deviceLogin11().then(async (result) => {
        const embed = new MessageEmbed()
          .addField('DeviceKey', loginService.getDeviceKey())
          .addField('Checksum', loginService.getChecksum())
          .addField('AccessToken', loginService.getAccessToken())
          .setDescription(result);
        await message.channel.send(embed);
      });
    }
  },
};
