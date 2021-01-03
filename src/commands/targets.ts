import { Message, MessageEmbed } from 'discord.js';
import { forkJoin } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { DiscordBot } from '../bot';
import { Fleet } from '../models/fleet.model';
import { User } from '../models/user.model';
import { AllianceService } from '../services/alliance.service';
import { calcValue, arrayToMessages, sortByStarsAndTrophy } from '../utils';

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

    message.channel.startTyping();
    await allianceService
      .getFleetsForDiv(div)
      .pipe(
        tap((fleetList: Fleet[]) => {
          if (fleetList.length === 0) {
            message.channel.send('I was not able to find fleets in div ' + div);
            message.channel.send(
              'Make sure you entered a correct division (A, B, C, D) and that the tournament is currently running'
            );
            message.channel.stopTyping();
          }
        }),
        map((fleetList: Fleet[]) =>
          fleetList.map((fleet) =>
            allianceService.getUsersForFleetId(fleet.AllianceId)
          )
        ),
        switchMap((observableList) => forkJoin(observableList)),
        map((userListList: User[][]) =>
          userListList.reduce((acc, val) => acc.concat(val), [])
        )
      )
      .pipe(
        // Filter out marauders
        map((userList: User[]) =>
          userList.filter((user) => user.AllianceId !== '27763')
        ),

        // Filter by trophy limit
        map((userList: User[]) =>
          userList.filter(
            (user) => Number.parseInt(user.Trophy, 10) < trophyUpperLimit
          )
        ),
        // Sort users
        map((userList: User[]) => userList.sort(sortByStarsAndTrophy)),
        // Take the top 200
        map((userList: User[]) => userList.slice(0, 100))
      )
      // Second pipe because operator overloading :shrug:
      .pipe(
        // Turn it into something readable
        map((userList: User[]) =>
          userList.map(
            (user: User, index: number) =>
              `${index + 1 < 10 ? '0' + (index + 1) : index + 1}. **${calcValue(
                user
              )}**(${user.AllianceScore})⭐ ${user.Name} **${user.Trophy}**(${
                user.HighestTrophy
              }) *[${user.AllianceName}]* [${
                6 - Number.parseInt(user.TournamentBonusScore, 10)
              }/6]  \n`
          )
        )
      )
      .subscribe((userList) => {
        if (userList.length <= 0) {
          message.channel.send(
            'I found no targets for the inputs you provided'
          );
          message.channel.stopTyping();

          return;
        }

        const array = arrayToMessages(userList, 2048);

        array.forEach((content) =>
          message.channel.send(
            new MessageEmbed()
              .setColor('#009900')
              .setTitle('Targets for Div ' + div)
              .setDescription(content)
              .setTimestamp()
          )
        );
        message.channel.stopTyping();
      });
  },
};
