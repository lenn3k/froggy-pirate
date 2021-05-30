import { Message, MessageEmbed } from 'discord.js';
import { User } from '../models/user.model';
import { AllianceService } from '../services/alliance.service';
import { arrayToMessages, calcValue, sortByStarsAndTrophy } from '../utils';

const allianceService = AllianceService.getInstance();

module.exports = {
  name: 'targets',
  description: 'List all targets in given division below given trophy count',
  useage:
    'targets <div> <max trophies> \nThe second trophy parameter is optional',
  example: `${process.env.PREFIX || '🐸'}targets C \n${
    process.env.PREFIX || '🐸'
  }targets C 3500`,
  async execute(message: Message, args: string[]): Promise<void> {
    const divArg = args[0];

    if (!divArg) {
      message.channel.send(
        'You must tell me which division you want targets for :frog:'
      );
      return;
    }
    const div = divArg.toUpperCase();
    let trophyUpperLimit = 20000;

    let error = undefined;

    const maxTrophies = args[1];
    if (maxTrophies) {
      const tempTrophies = Number.parseInt(maxTrophies, 10);
      if (isNaN(tempTrophies)) {
        error = `'${maxTrophies}' is not a number`;
      } else {
        trophyUpperLimit = tempTrophies;
      }
    }
    if (error) {
      await message.channel.send(error);
      return;
    }


    const fleets = await allianceService.getFleetsForDiv(div);

    if (fleets.length === 0) {
      await message.channel.send('I was not able to find fleets in div ' + div);
      await message.channel.send(
        'Make sure you entered a correct division (A, B, C, D) and that the tournament is currently running'
      );
      return;
    }

    const usersForFleets = await Promise.all(
      fleets.map((fleet) =>
        allianceService.getUsersForFleetId(fleet.AllianceId)
      )
    );

    let users = usersForFleets.reduce((acc, val) => acc.concat(val), []);

    // Filter by trophy limit
    users = users.filter(
      (user) => Number.parseInt(user.Trophy, 10) < trophyUpperLimit
    );

    if (users.length <= 0) {
      await message.channel.send(
        'I found no targets for the inputs you provided'
      );
      
      return;
    }

    // Sort users
    users = users.sort(sortByStarsAndTrophy);
    // Take the top 200
    users = users.slice(0, 100);

    const userStrings = users.map(
      (user: User, index: number) =>
        `${index + 1 < 10 ? '0' + (index + 1) : index + 1}. **${calcValue(
          user
        )}**(${user.AllianceScore})⭐ ${user.Name} **${user.Trophy}**(${
          user.HighestTrophy
        }) *[${user.AllianceName}]* [${
          6 - Number.parseInt(user.TournamentBonusScore, 10)
        }/6]  \n`
    );

    const array = arrayToMessages(userStrings, 2048);


    await Promise.all(array.map(content => message.channel.send(
      new MessageEmbed()
        .setColor('#009900')
        .setTitle('Targets for Div ' + div)
        .setDescription(content)
        .setTimestamp()
    )));
  
  },
};
