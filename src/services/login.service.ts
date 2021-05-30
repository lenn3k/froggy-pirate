import Axios from 'axios';
import { interval } from 'rxjs';
import { Md5 } from 'ts-md5';

export class LoginService {
  private static instance: LoginService;
  static getInstance(): LoginService {
    if (!LoginService.instance) {
      LoginService.instance = new LoginService();
    }
    return LoginService.instance;
  }
  private loginPath = '/UserService/DeviceLogin8';
  private deviceLogin11Path = '/UserService/DeviceLogin11';
  private deviceKey: string | undefined;
  private checksum: string | undefined;
  private accessToken: string | undefined; //=
  // 'AF974255-FFED-4A81-9626-93EFF87D4012';

  constructor() {
    //Every 30 minutes
    interval(30*60*1000).subscribe(()=> this.login());
    this.login();
  }

  async login(): Promise<string|undefined> {
    const params = {
      deviceKey: this.getDeviceKey(),
      isJailBroken: 'false',
      checksum: this.getChecksum(),
      deviceType: 'DeviceTypeMac',
      languageKey: 'en',
      advertisingkey: '""',
    };

    Axios
      .post(
        process.env.API + this.loginPath,
        {},
        { params, responseType: 'text' }
      ).then((response)=>{this.accessToken = response.data.match(/accessToken="(.*?)"/)[1];}).catch(err=>console.error(err));

    return this.accessToken;
  }

  async deviceLogin11(): Promise<string> {
    this.deviceKey = undefined;
    this.checksum = undefined;
    const params = {
      ...this.getChecksum11(this.getDeviceKey()),
      isJailBroken: 'false',
      deviceType: 'DeviceTypeAndroid',
      languageKey: 'en',
      advertisingKey: '""',
    };
    console.log(JSON.stringify(params));

    return await Axios
      .post<string>(
        process.env.API + this.deviceLogin11Path,
        {},
        { params, responseType: 'text' }
      ).then(response => response.data).catch(err => {console.error(err.response.data); return err;});
  }

  getChecksum(): string {
    if (!this.checksum) {
      this.checksum = Md5.hashStr(
        `${this.getDeviceKey()}DeviceTypeMacsavysoda`
      ) as string;
    }

    return this.checksum;
  }

  getDeviceKey(): string {
    if (!this.deviceKey) {
      const h = '0123456789abcdef';

      const random = (ar: string) => ar[Math.floor(Math.random() * ar.length)];

      this.deviceKey = [
        random(h),
        random('26ae'),
        random(h),
        random(h),
        random(h),
        random(h),
        random(h),
        random(h),
        random(h),
        random(h),
        random(h),
        random(h),
      ].join('');
    }
    return this.deviceKey;
  }

  getAccessToken(): string {
    if (!this.hasAccessToken) {
      throw new Error('No access token, check first');
    }
    return this.accessToken as string;
  }

  hasAccessToken(): boolean {
    return this.accessToken != null;
  }

  getChecksum11(deviceKey:string): {checksum:string,clientDateTime:string, deviceKey:string} {
    const checksumKey = '5343';
    const clientDateTime = new Date().toISOString().slice(0, 19);

    const checksum = Md5.hashStr(
      `${deviceKey}${clientDateTime}DeviceTypeAndroid${checksumKey}savysoda`
    ) as string;

    return { checksum, clientDateTime, deviceKey };
  }
}
