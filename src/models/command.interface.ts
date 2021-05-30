import { Message } from 'discord.js';

export interface Command {
  name: string;
  description: string;
  useage?: string;
  example?: string;
  hide?: boolean;
  execute(message: Message, args?: string[]): void;
}
