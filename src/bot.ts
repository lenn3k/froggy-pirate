import {
  Channel,
  Client,
  Collection,
  Message,
  MessageEmbed,
  TextChannel,
} from 'discord.js';

import { LoginService } from './services/login.service';
import * as fs from 'fs';
import { Command } from './models/command.interface';
import { MessageService } from './services/message.service';
import { map, tap } from 'rxjs/operators';
import { PSSMessage } from './models/pss-message.interface';

export class DiscordBot {
  private static instance: DiscordBot;

  private client: Client = new Client();
  private commands: Collection<string, Command> = new Collection();

  private loginService: LoginService = new LoginService();
  private messageService: MessageService = new MessageService();

  private _fleetChannel: TextChannel | undefined;
  private fleetChatInterval: NodeJS.Timeout | undefined;

  private constructor() {
    this.initialiseClient();
  }

  static getInstance(): DiscordBot {
    if (!DiscordBot.instance) {
      DiscordBot.instance = new DiscordBot();
    }
    return DiscordBot.instance;
  }

  async connect() {
    await this.client
      .login(process.env.D_TOKEN)
      .then(async (_) => {
        const venomy = await this.client.users.fetch('280752268960071680');
        venomy.send(`I'm alive, master :frog:`);
        console.log('Connected to Discord');
      })
      .catch((error) =>
        console.error(`Could not connect. Error: ${error.message}`)
      );
    this.findChannelAndStartFleetchat();
  }

  /**
   * TODO: Replace this with a database
   */
  private async findChannelAndStartFleetchat() {
    const channel = await this.client.channels.fetch(
      process.env.FLEET_CHANNEL as string
    );
    if (channel) {
      DiscordBot.getInstance().fleetChannel = channel as TextChannel;
      DiscordBot.getInstance().fleetChatInterval = setInterval(
        () => this.echoFleetChat(),
        60000
      );
      this.echoFleetChat(),
        console.log(`Starting fleetchat on boot to ${channel.toString()}`);
    }
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
    this.messageService = MessageService.getInstance();
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

  public set fleetChannel(channel: TextChannel | undefined) {
    this._fleetChannel = channel;
  }

  public get fleetChannel(): TextChannel | undefined {
    return this._fleetChannel;
  }

  public setFleetChannel(channel: TextChannel) {
    this.fleetChannel = channel;
  }

  public async startFleetChat(message: Message) {
    if (this.fleetChannel) {
      if (this.fleetChatInterval) {
        message.channel.send(
          `I'm already sending fleet chat to ${this.fleetChannel.toString()}`
        );
        return;
      }
      this.fleetChatInterval = setInterval(() => this.echoFleetChat(), 60000);
      message.channel.startTyping(1);
      message.channel.send(
        `I have started sending fleet chat to ${this.fleetChannel.toString()}`
      );
      message.channel.stopTyping();
    } else {
      message.channel.startTyping(1);
      await message.channel.send(
        'You must first set a channel with: `🐸 fleet-chat set #channel-name`'
      );
      message.channel.stopTyping();
    }
  }

  public async stopFleetChat(message: Message) {
    if (!this.fleetChannel || !this.fleetChatInterval) {
      message.channel.startTyping(1);
      await message.channel.send(`I was not reading fleet chat 🤷‍♂️🐸`);
      message.channel.stopTyping();
      return;
    }

    clearInterval(this.fleetChatInterval);
    message.channel.startTyping(1);
    message.channel.send(
      `I have stopped sending fleet chat to ${this.fleetChannel.toString()}`
    );
    message.channel.stopTyping();
  }

  public async echoFleetChat() {
    if (!this.fleetChannel) {
      return;
    }

    const messagesCollection = await this.fleetChannel.messages.fetch({
      limit: 50,
    });

    await this.messageService
      .getFleetMessage('27763')
      .pipe(
        map((messages: PSSMessage[]) => {
          if (!messagesCollection || !messagesCollection.size) {
            // Channel is empty :shrug:
            return messages;
          }
          const channelMessages = messagesCollection.array();
          const messagesContent = channelMessages.map((message: Message) =>
            message.content.toLowerCase()
          );
          return messages.filter(
            (message: PSSMessage) =>
              !messagesContent.some((v) =>
                v.includes(`${message.Message.toLowerCase().trim()}`)
              )
          );
        }),
        tap((messages: PSSMessage[]) => {
          messages.forEach((message: PSSMessage) => {
            this.fleetChannel!.send(
              `**${message.UserName}**: ${message.Message}`
            );
          });
        })
      )
      .subscribe();
  }
}
