import { Client, Collection, Message, MessageEmbed } from 'discord.js';
import { forkJoin } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Fleet } from './models/fleet.model';
import { User } from './models/user.model';
import { AllianceService } from './services/alliance.service';
import { LoginService } from './services/login.service';
import * as fs from 'fs';
import { Command } from './models/command.interface';
import { arrayToMessages, calcValue } from './utils';

export class DiscordBot {
  private static instance: DiscordBot;

  private client: Client = new Client();
  private commands: Collection<string, Command> = new Collection();

  private loginService: LoginService = new LoginService();
  private allianceService: AllianceService = new AllianceService();

  private constructor() {
    this.initialiseClient();
  }

  static getInstance(): DiscordBot {
    if (!DiscordBot.instance) {
      DiscordBot.instance = new DiscordBot();
    }
    return DiscordBot.instance;
  }

  connect(): void {
    this.client
      .login(process.env.D_TOKEN)
      .then((_) => console.log('Connected to Discord'))
      .catch((error) =>
        console.error(`Could not connect. Error: ${error.message}`)
      );
  }

  private initialiseClient(): void {
    if (!this.client) return;

    this.loadCommands();
    this.setReadyHandler();
    this.setMessageHandler();
    this.setServices();
  }

  private loadCommands() {
    const commandFiles = fs
      .readdirSync('./dist/commands')
      .filter((file) => file.endsWith('.js'));


    for (const file of commandFiles) {
      const command = require(`./commands/${file}`) as Command;
      this.commands.set(command.name, command);
    }
  }

  private setServices() {
    this.allianceService = AllianceService.getInstance();
    this.loginService = LoginService.getInstance();
  }

  private setReadyHandler(): void {
    this.client.on('ready', () => {
      console.log(`Logged in as ${this.client.user!.tag}!`);
      this.loginService.login();
    });
  }

  private setMessageHandler(): void {
    this.client.on('message', async (message: Message) => {
      // filters out requests from bots
      if (message.author.bot) return;

      // Shenanigans
      if (message.content.includes(`<@!280752268960071680>`)) {
        message.reply(
          'You better have a good reason to ping master Venomy :frog:'
        );
        return;
      }

      // Check for the prefix
      if (!message.content.startsWith('🐸')) {
        return;
      }

      const args = message.content.slice('🐸'.length).trim().split(/ +/);
      const command = args.shift()?.toLowerCase()!;

      // Log commands run
      console.log(
        `command "${command}" with args: [${args}] run by "${message.author.username}" in "${message.channel.type}"`
      );

      if (!this.commands.has(command)) return;

      try {
        this.commands.get(command)!.execute(message, args);
      } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
      }
    });
  }
}
