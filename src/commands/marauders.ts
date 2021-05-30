import { Message, MessageEmbed } from 'discord.js';
import { User } from '../models/user.model';
import { AllianceService } from '../services/alliance.service';
import { arrayToMessages } from '../utils';

module.exports = {
  name: 'marauders',
  hide:true,
  description: 'List all Hellfire Marauders with starcount and trophy count',
  async execute(message: Message): Promise<void> {

    
    
    const userList = await AllianceService.getInstance()
      .getUsersForFleetId('27763');
    
    userList.sort(
      (a: User, b: User) =>
        Number.parseInt(b.AllianceScore, 10) -
      Number.parseInt(a.AllianceScore, 10)
    );
      
    const userListString = userList.map(
      (user: User, index: number) =>
        `*${index + 1}.* **${user.AllianceScore}**⭐ ${user.Name} ${
          user.Trophy
        }*(${user.HighestTrophy})*  [Battles left: ${
          6 - Number.parseInt(user.TournamentBonusScore, 10)
        }] \n`
    );
        
    const array = arrayToMessages(userListString, 2048);
        
    await Promise.all(array.map(async (content) =>
      await message.channel.send(
        new MessageEmbed()
          .setColor('#009900')
          .setTitle('Hellfire Marauders')
          .setDescription(content)
          .setTimestamp()
      )))
      .catch(err => console.log(err));
  },
};
      