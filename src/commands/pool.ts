import { Message, MessageEmbed } from 'discord.js';
import { FirestoreService } from '../services/firestore.service';
import { LoginService } from '../services/login.service';

const loginService = LoginService.getInstance();

module.exports = {
  name: 'pool',
  description:
    'Shows all the crew that are currently in the pool and who has them or had them last',
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
          )} ago \n(Expiration time: ${formatTime(timeLeft)})`;
        } else {
          return `**${crew}** from **${owner}** has not been borrowed yet \n(Expiration time: ${formatTime(
            timeLeft
          )})`;
        }
      });

    const messageEmbed: MessageEmbed = new MessageEmbed()
      .setColor(`#009900`)
      .setTitle('Crew in the pool')
      .setDescription(valid.join(`\n\n`))
      .setTimestamp();

    message.channel.send(messageEmbed);
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