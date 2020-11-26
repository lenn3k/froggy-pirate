import { Message } from 'discord.js';
import { map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { AllianceService } from '../services/alliance.service';
import { arrayToMessages } from '../utils';

module.exports = {
  name: 'marauders',
  description: 'List all Hellfire Marauders with starcount and trophy count',
  async execute(message: Message, args: string[]): Promise<void> {
    message.channel.startTyping(1);

    await AllianceService.getInstance()
      .getUsersForFleetId('27763')
      .pipe(
        map((userList: User[]) =>
          userList.sort(
            (a: User, b: User) =>
              Number.parseInt(b.AllianceScore, 10) -
              Number.parseInt(a.AllianceScore, 10)
          )
        ),
        map((userList: User[]) =>
          userList.map(
            (user: User, index: number) =>
              `*${index + 1}.* **${user.AllianceScore}**⭐ ${user.Name} ${
                user.Trophy
              }*(${user.HighestTrophy})*  [Battles left: ${
                6 - Number.parseInt(user.TournamentBonusScore, 10)
              }] \n`
          )
        )
      )
      .subscribe((list: string[]) => {
        arrayToMessages(list).forEach((element: string) => {
          message.channel.send(element);
        });
        message.channel.stopTyping();
      });
  },
};
