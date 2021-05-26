import { Message, MessageEmbed } from 'discord.js';
import { FirestoreService } from '../services/firestore.service';
import { LoginService } from '../services/login.service';
import { arrayToMessages } from '../utils';

const loginService = LoginService.getInstance();

module.exports = {
  name: 'pool',
  description: 'List all the crew currently in the pool',
  async execute(message: Message, args: string[]): Promise<void> {
    const donations = await FirestoreService.getInstance().getDonations();

    const valid = donations
      .filter((donation) => {
        const { expirationTime } = donation;
        const timeLeft = expirationTime - new Date().valueOf();
        return timeLeft > 0;
      })
      .sort((d1, d2) => d2.expirationTime - d1.expirationTime)
      .map((donation) => {
        const { crew, borrower, borrowTime, expirationTime, owner } = donation;

        const borrowTimeAgo = new Date().valueOf() - borrowTime;
        const timeLeft = expirationTime - new Date().valueOf();

        if (borrower) {
          return `**${crew}** from **${owner}** has been borrowed \nby **${borrower}** ${formatTime(
            borrowTimeAgo
          )} ago \n(Expiration time: ${formatTime(timeLeft)})\n\n`;
        } else {
          return `**${crew}** from **${owner}** has not been borrowed yet \n(Expiration time: ${formatTime(
            timeLeft
          )})\n\n`;
        }
      });

    const array = arrayToMessages(valid, 2048);

    array.forEach((data) => {
      const messageEmbed: MessageEmbed = new MessageEmbed()
        .setColor('#009900')
        .setTitle('Crew in the pool')
        .setDescription(data)
        .setTimestamp();
      message.channel.send(messageEmbed);
    });
  },
};

function formatTime(timeMillis: number): string {
  const secondsTotal = timeMillis / 1000;

  const hours = Math.floor(secondsTotal / 3600);
  const minutes = Math.floor((secondsTotal % 3600) / 60);
  const seconds = Math.floor((secondsTotal % 3600) % 60);

  const hoursString = hours > 0 ? `${hours} h, ` : '';
  const minutesString = hours > 0 || minutes > 0 ? `${minutes} m, ` : '';
  const secondsString = `${seconds} s`;

  return hoursString + minutesString + secondsString;
}
