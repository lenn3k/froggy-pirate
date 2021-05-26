import Axios, { AxiosResponse } from 'axios';
import { from, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import * as convert from 'xml-js';
import { Fleet } from '../models/fleet.model';
import { User } from '../models/user.model';
import { drilldown } from '../utils';
import { LoginService } from './login.service';

export class AllianceService {
  private static instance: AllianceService;
  static getInstance(): AllianceService {
    if (!AllianceService.instance) {
      AllianceService.instance = new AllianceService();
    }
    return AllianceService.instance;
  }
  private serviceUrl = '/AllianceService/ListAlliancesByRanking';
  private fleetUserUrl = '/AllianceService/ListUsers';
  private loginService = LoginService.getInstance();

  constructor() {}

  getFleets(fromRank?: number, to?: number): Observable<any[]> {
    const params = {
      skip: fromRank ? fromRank.toString(10) : '0',
      take: to && fromRank ? (to - fromRank).toString(10) : '100',
    };


    return from(Axios
      .get(process.env.API + this.serviceUrl, {
        params,
        responseType: 'text',
      }))
      .pipe(
        map((response: AxiosResponse) => response.data),
        map((data: string) =>
          JSON.parse(convert.xml2json(data, { compact: true }))
        ),
        map((jsonObj) => drilldown<Fleet>(jsonObj))
      );
  }

  getFleetsForDiv(div: string): Observable<Fleet[]> {
    const divMap: any = { A: '1', B: '2', C: '3', D: '4' };
    const divisionDesignId = divMap[div];
    return this.getFleets().pipe(
      map((fleetList) =>
        fleetList.filter((fleet) => fleet.DivisionDesignId === divisionDesignId)
      )
    );
  }

  getUsersForFleetId(fleetId: string): Observable<User[]> {
    const accessToken = this.loginService.getAccessToken();
    if (!accessToken) {
      return this.loginService.login().pipe(
        catchError((err, caught) => {
          console.log(err, caught);
          return err;
        }),
        switchMap(() => this.getUsersForFleetId(fleetId))
      );
    }

    const params = {
      accessToken: accessToken,
      allianceId: fleetId,
      skip: '0',
      take: '100',
    };
    return from(Axios
      .get(process.env.API + this.fleetUserUrl, {
        params,
        responseType: 'text',
      }))
      .pipe(
        map((response: AxiosResponse) => response.data),
        map((response: string) =>
          JSON.parse(convert.xml2json(response, { compact: true }))
        ),
        map((jsonObj) => drilldown<User>(jsonObj))
      );
  }
}
