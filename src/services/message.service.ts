import { AxiosResponse } from 'axios';
import * as convert from 'xml-js';
import { $Axios } from '../axios-observable';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { LoginService } from './login.service';
import { drilldown } from '../utils';
import { PSSMessage } from '../models/pss-message.interface';

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
    return $Axios
      .get(process.env.API + this.messagePath, {
        params,
        responseType: 'text',
      })
      .pipe(
        map((response: AxiosResponse) => response.data),
        map((response: string) =>
          JSON.parse(convert.xml2json(response, { compact: true }))
        ),
        map((jsonObj) => drilldown<PSSMessage>(jsonObj))
      );
  }
}
