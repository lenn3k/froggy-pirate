import {
  Client,
  Collection,
  Message,

  TextChannel
} from 'discord.js';
import * as fs from 'fs';
import { map, tap } from 'rxjs/operators';
import { Command } from './models/command.interface';
import { PSSMessage } from './models/pss-message.interface';
import { FirestoreService } from './services/firestore.service';
import { LoginService } from './services/login.service';
import { MessageService } from './services/message.service';


export class DiscordBot {
  private static _instance: DiscordBot;

  private _client: Client = new Client();
  private _commands: Collection<string, Command> = new Collection();

  private _loginService: LoginService = new LoginService();
  private _messageService: MessageService = new MessageService();

  private _fleetChannel: TextChannel | undefined;
  private _fleetChatInterval: NodeJS.Timeout | undefined;

  private constructor() {
    this.initialiseClient();
  }

  static getInstance(): DiscordBot {
    if (!DiscordBot._instance) {
      DiscordBot._instance = new DiscordBot();
    }
    return DiscordBot._instance;
  }

  async connect() {
    await this._client
      .login(process.env.D_TOKEN)
      .then(async (_) => {
        this._client.user?.setActivity({
          name: `since: ${new Date().toISOString()}`,
          type: 'PLAYING',
        });

        console.log('Connected to Discord');
      })
      .catch((error) =>
        console.error(`Could not connect. Error: ${error.message}`)
      );
    //TODO make something better for this...
    this.findChannelAndStartFleetchat();
  }

  /**
   * TODO: Replace this with a database
   */
  private async findChannelAndStartFleetchat() {
    try {
      const channel = await this._client.channels.fetch(
        process.env.FLEET_CHANNEL as string
      );
      if (channel) {
        DiscordBot.getInstance().fleetChannel = channel as TextChannel;
        DiscordBot.getInstance()._fleetChatInterval = setInterval(
          () => this.echoFleetChat(),
          60000
        );
        await this.echoFleetChat(),
        console.log(`Starting fleetchat on boot to ${channel.toString()}`);
      }
    } catch (error) {
      console.error('Channel not found');
    }
  }

  private initialiseClient(): void {
    if (!this._client) return;

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
      if (command.name) {
        this._commands.set(command.name, command);
      }
    }
  }

  private setServices() {
    this._messageService = MessageService.getInstance();
    this._loginService = LoginService.getInstance();
  }

  private setReadyHandler(): void {
    this._client.on('ready', async () => {
      console.log(`Logged in as ${this._client.user!.tag}!`);
      await this._loginService.login();
    });
  }

  private setMessageHandler(): void {
    this._client.on('message', async (message: Message) => {
      // filters out requests from bots
      if (message.author.bot) return;

      // Shenanigans
      if (message.content.includes('<@!280752268960071680>')) {
        console.log(message.content);
        message.react('🐸');
        // message.reply(
        //   'You better have a good reason to ping master Venomy :frog:'
        // );
        return;
      }

      // Check for the prefix
      if (!message.content.startsWith(process.env.PREFIX || '🐸')) {
        return;
      }

      //await message.react('🐸');

      const args = message.content
        .slice((process.env.PREFIX || '🐸').length)
        .trim()
        .split(/ +/);
      const command = args.shift()?.toLowerCase()!;

      // Log commands run
      console.log(
        `command "${command}" with args: [${args}] run by "${message.author.username}" in "${message.channel.type}"`
      );

      if (!this._commands.has(command))
       {
        await message.reactions.removeAll();
        await message.react('🛑');
        return
      };

      try {
        this._commands.get(command)!.execute(message, args);
      } catch (error) {
        console.error(error);
        await message.reply('there was an error trying to execute that command!');
        await message.reactions.removeAll();
        await message.react('🛑');
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
      if (this._fleetChatInterval) {
        message.channel.send(
          `I'm already sending fleet chat to ${this.fleetChannel.toString()}`
        );
        return;
      }
      this._fleetChatInterval = setInterval(() => this.echoFleetChat(), 60000);
       
      message.channel.send(
        `I have started sending fleet chat to ${this.fleetChannel.toString()}`
      );
      
    } else {
       
      await message.channel.send(
        `You must first set a channel with: '${process.env.PREFIX} fleet-chat set #channel-name'`
      );
      
    }
  }

  public async stopFleetChat(message: Message) {
    if (!this.fleetChannel || !this._fleetChatInterval) {
       
      await message.channel.send('I was not reading fleet chat 🤷‍♂️🐸');
      
      return;
    }

    clearInterval(this._fleetChatInterval);
     
    message.channel.send(
      `I have stopped sending fleet chat to ${this.fleetChannel.toString()}`
    );
    
  }

  public async echoFleetChat() {
    if (!this.fleetChannel) {
      return;
    }

    const messagesCollection = await this.fleetChannel.messages.fetch({
      limit: 50,
    });

    await this._messageService
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
        }),
        tap((messages: PSSMessage[]) =>
          FirestoreService.getInstance().addMessages(messages)
        )
      )
      .subscribe();
  }

  public getCommands() {
    return this._commands;
  }
}
