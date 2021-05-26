import Axios, { AxiosResponse } from 'axios';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as convert from 'xml-js';
import { PSSMessage } from '../models/pss-message.interface';
import { drilldown } from '../utils';
import { LoginService } from './login.service';

export class MessageService {
  private static instance: MessageService;
  static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }
  private messagePath = '/MessageService/ListMessagesForChannelKey';
  private loginService = LoginService.getInstance();

  constructor() {}

  getFleetMessage(fleetId: string): Observable<PSSMessage[]> {
    const accessToken = this.loginService.getAccessToken();

    const params = {
      accessToken: accessToken,
      ChannelKey: `alliance-${fleetId}`,
    };
    return from(Axios
      .get(process.env.API + this.messagePath, {
        params,
        responseType: 'text',
      }))
      .pipe(
        map((response: AxiosResponse) => response.data),
        map((response: string) =>
          JSON.parse(convert.xml2json(response, { compact: true }))
        ),
        map((jsonObj) => drilldown<PSSMessage>(jsonObj))
      );
  }
}
