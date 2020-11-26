import { Message } from 'discord.js';
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
  async execute(message: Message, args: string[]): Promise<void> {
    const div = args[0].toUpperCase();
    const trophyUpperLimit = Number.parseInt(args[1] || '20000', 10);
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

        // Filter out all ships below 2 stars
        map((userList: User[]) =>
          userList.filter((user) => calcValue(user) >= 1)
        ),

        // Sort users
        map((userList: User[]) => userList.sort(sortByStarsAndTrophy)),
        // Take the top 200
        map((userList: User[]) => userList.slice(0, 300))
      )
      // Second pipe because operator overloading :shrug:
      .pipe(
        // Turn it into something readable
        map((userList: User[]) =>
          userList.map(
            (user: User, index: number) =>
              `${index + 1 < 10 ? '0' + (index + 1) : index + 1}. **${calcValue(
                user
              )}**(${user.AllianceScore})⭐ ${user.Name} ${user.Trophy}*(${
                user.HighestTrophy
              })* [Battles left: ${
                6 - Number.parseInt(user.TournamentBonusScore, 10)
              }]  \n`
          )
        )
      )
      .subscribe((userList) => {
        arrayToMessages(userList).forEach((element) => {
          message.channel.send(element);
        });
        message.channel.stopTyping();
      });
  },
};
