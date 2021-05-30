import Axios from 'axios';
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
  private fleetByDivUrl =  '/AllianceService/ListAlliancesByDivision'
  private fleetUserUrl = '/AllianceService/ListUsers';
  private loginService = LoginService.getInstance();


  async getFleets(fromRank?: number, to?: number): Promise<Fleet[]> {
    const params = {
      skip: fromRank ? fromRank.toString(10) : '0',
      take: to && fromRank ? (to - fromRank).toString(10) : '100',
    };


    const {data} = await Axios
      .get(process.env.API + this.serviceUrl, {
        params,
        responseType: 'text',
      }).catch(err => {console.error(err); return {data:err};});
       
        
    const dataJson = JSON.parse(convert.xml2json(data, { compact: true }));
        
    return  drilldown<Fleet>(dataJson);
      
  }

  async getFleetsForDiv(div: string): Promise<Fleet[]> {
    const divMap: Record<string,string> = { A: '1', B: '2', C: '3', D: '4' };
    const divisionDesignId = divMap[div];

    const params = {divisionDesignId};

    const {data} = await Axios
      .get(process.env.API + this.fleetByDivUrl, {
        params,
        responseType: 'text',
      }).catch(err => {console.error(err); return {data:err};});
     
      
    const dataJson = JSON.parse(convert.xml2json(data, { compact: true }));
      
    return  drilldown<Fleet>(dataJson);

  }

  async getUsersForFleetId(fleetId: string): Promise<User[]> {
    const accessToken = this.loginService.getAccessToken();
    if (!accessToken) {
      await this.loginService.login();      
    }

    const params = {
      accessToken: accessToken,
      allianceId: fleetId,
      skip: '0',
      take: '100',
    };
    const {data} = await Axios
      .get(process.env.API + this.fleetUserUrl, {
        params,
        responseType: 'text',
      });
    const dataJson = JSON.parse(convert.xml2json(data, { compact: true }));

    return drilldown<User>(dataJson);
  }
}
